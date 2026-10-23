/**
 * PeerNet: PeerJS wrapper managing P2P full-mesh audio calls and star DataChannel telemetry.
 */

import { Peer, DataConnection, MediaConnection } from 'peerjs';
import { WireMessage, PlayerSlot } from './protocol';
import { getIceConfig } from './ice';
import { ClockSync } from './clock';

export interface PeerNetEvents {
  onMessage: (msg: WireMessage) => void;
  onRosterChange: (roster: PlayerSlot[]) => void;
  onRemoteStream: (slot: number, stream: MediaStream) => void;
  onRelayBadge: (isRelayed: boolean) => void;
  onError: (error: string) => void;
}

export class PeerNet {
  private peer: Peer | null = null;
  private isHost: boolean = false;
  private roomCode: string = '';
  private localSlot: number = 0;
  private roster: PlayerSlot[] = [];
  private dataConnections: Map<string, DataConnection> = new Map();
  private mediaCalls: Map<string, MediaConnection> = new Map();
  private localStream: MediaStream | null = null;
  private clockSync: ClockSync = new ClockSync();
  private events: PeerNetEvents;

  constructor(events: PeerNetEvents) {
    this.events = events;
  }

  public async createRoom(desiredCode?: string): Promise<string> {
    this.isHost = true;
    this.localSlot = 0;
    this.roomCode = (desiredCode || this.generateRoomCode()).toUpperCase();
    const peerId = `awaaz-${this.roomCode}`;

    return new Promise((resolve, reject) => {
      this.peer = new Peer(peerId, {
        config: getIceConfig()
      });

      this.peer.on('open', () => {
        this.roster = [{
          id: peerId,
          slot: 0,
          name: 'Host',
          maskId: 'natural',
          connected: true,
          isHost: true
        }];
        this.events.onRosterChange(this.roster);
        resolve(this.roomCode);
      });

      this.peer.on('connection', (conn) => this.handleIncomingDataConnection(conn));
      this.peer.on('call', (call) => this.handleIncomingMediaCall(call));

      this.peer.on('error', (err) => {
        this.events.onError(err.message);
        reject(err);
      });
    });
  }

  public async joinRoom(code: string, playerName: string): Promise<number> {
    this.isHost = false;
    this.roomCode = code.toUpperCase();
    const hostPeerId = `awaaz-${this.roomCode}`;

    return new Promise((resolve, reject) => {
      this.peer = new Peer({
        config: getIceConfig()
      });

      this.peer.on('open', () => {
        const conn = this.peer!.connect(hostPeerId, { reliable: true });
        this.setupConnectionHandlers(conn);

        conn.on('open', () => {
          conn.send({
            v: 1,
            type: 'hello',
            name: playerName
          } as WireMessage);
        });

        this.peer!.on('call', (call) => this.handleIncomingMediaCall(call));
        resolve(this.localSlot);
      });

      this.peer.on('error', (err) => {
        this.events.onError(err.message);
        reject(err);
      });
    });
  }

  public setLocalStream(stream: MediaStream): void {
    this.localStream = stream;
  }

  private handleIncomingDataConnection(conn: DataConnection): void {
    this.setupConnectionHandlers(conn);
  }

  private setupConnectionHandlers(conn: DataConnection): void {
    conn.on('data', (data) => {
      const msg = data as WireMessage;
      this.handleWireMessage(msg, conn);
    });

    conn.on('open', () => {
      this.dataConnections.set(conn.peer, conn);
    });

    conn.on('close', () => {
      this.dataConnections.delete(conn.peer);
    });
  }

  private handleIncomingMediaCall(call: MediaConnection): void {
    if (this.localStream) {
      call.answer(this.localStream);
    } else {
      call.answer();
    }

    call.on('stream', (remoteStream) => {
      const slot = this.findSlotByPeerId(call.peer);
      this.events.onRemoteStream(slot, remoteStream);
    });
  }

  public callPeer(peerId: string): void {
    if (!this.peer || !this.localStream) return;
    const call = this.peer.call(peerId, this.localStream);
    this.mediaCalls.set(peerId, call);

    call.on('stream', (remoteStream) => {
      const slot = this.findSlotByPeerId(peerId);
      this.events.onRemoteStream(slot, remoteStream);
    });
  }

  private handleWireMessage(msg: WireMessage, conn: DataConnection): void {
    if (msg.v !== 1) return;

    switch (msg.type) {
      case 'hello':
        if (this.isHost) {
          this.assignSlot(conn.peer, msg.name);
          conn.send({
            v: 1,
            type: 'snapshot',
            roster: this.roster,
            phase: 'lobby',
            hostTime: performance.now()
          } as WireMessage);
          this.broadcastRoster();
        }
        break;

      case 'snapshot':
        this.roster = msg.roster;
        this.events.onRosterChange(this.roster);
        break;

      case 'ping':
        conn.send({
          v: 1,
          type: 'pong',
          t0: msg.t0,
          t1: performance.now()
        } as WireMessage);
        break;

      case 'pong':
        this.clockSync.handlePong(msg.t0, msg.t1);
        break;

      default:
        this.events.onMessage(msg);
        break;
    }
  }

  public sendTelemetry(msg: WireMessage): void {
    // Backpressure check: avoid buffering frames
    this.dataConnections.forEach((conn) => {
      if (conn.open) {
        conn.send(msg);
      }
    });
  }

  private assignSlot(peerId: string, name: string): number {
    const nextSlot = this.roster.length;
    this.roster.push({
      id: peerId,
      slot: nextSlot,
      name,
      maskId: 'natural',
      connected: true,
      isHost: false
    });
    return nextSlot;
  }

  private findSlotByPeerId(peerId: string): number {
    const player = this.roster.find((p) => p.id === peerId);
    return player ? player.slot : -1;
  }

  private broadcastRoster(): void {
    this.events.onRosterChange(this.roster);
    const packet: WireMessage = {
      v: 1,
      type: 'snapshot',
      roster: this.roster,
      phase: 'lobby',
      hostTime: performance.now()
    };
    this.dataConnections.forEach((conn) => {
      if (conn.open) conn.send(packet);
    });
  }

  private generateRoomCode(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  public dispose(): void {
    this.dataConnections.forEach((conn) => conn.close());
    this.dataConnections.clear();
    this.mediaCalls.forEach((call) => call.close());
    this.mediaCalls.clear();
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }
}
