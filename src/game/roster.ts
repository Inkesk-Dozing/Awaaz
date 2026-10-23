/**
 * Host Roster & Disguise Lock-In Manager.
 * Tracks connected players, mask choices, ready states, and lock-in transitions.
 */

export interface PlayerRosterEntry {
  slot: number;
  peerId: string;
  name: string;
  maskId: string | null;
  isLocked: boolean;
  isHost: boolean;
}

export class RosterManager {
  private players: Map<number, PlayerRosterEntry> = new Map();
  private onRosterUpdate?: (players: PlayerRosterEntry[]) => void;

  constructor(onRosterUpdate?: (players: PlayerRosterEntry[]) => void) {
    this.onRosterUpdate = onRosterUpdate;
  }

  public registerPlayer(slot: number, peerId: string, name: string, isHost: boolean = false): void {
    this.players.set(slot, {
      slot,
      peerId,
      name,
      maskId: null,
      isLocked: false,
      isHost,
    });
    this.notify();
  }

  public removePlayer(slot: number): void {
    this.players.delete(slot);
    this.notify();
  }

  public setPlayerMask(slot: number, maskId: string): void {
    const player = this.players.get(slot);
    if (player && !player.isLocked) {
      player.maskId = maskId;
      this.notify();
    }
  }

  public lockInMask(slot: number): void {
    const player = this.players.get(slot);
    if (player && player.maskId) {
      player.isLocked = true;
      this.notify();
    }
  }

  public areAllMasksLocked(): boolean {
    if (this.players.size === 0) return false;
    for (const player of this.players.values()) {
      if (!player.isLocked || !player.maskId) {
        return false;
      }
    }
    return true;
  }

  public getPlayerList(): PlayerRosterEntry[] {
    return Array.from(this.players.values());
  }

  public getPlayer(slot: number): PlayerRosterEntry | undefined {
    return this.players.get(slot);
  }

  public resetLocks(): void {
    for (const player of this.players.values()) {
      player.isLocked = false;
    }
    this.notify();
  }

  private notify(): void {
    if (this.onRosterUpdate) {
      this.onRosterUpdate(this.getPlayerList());
    }
  }
}
