# 06 — Multiplayer & Networking

## Topology

- **Data (game state):** star — all clients talk to the host. Host is authoritative.
- **Audio:** full mesh — every client `peer.call()`s every other client with its disguised `MediaStream`.
- **Telemetry:** clients → host at 15 Hz; host re-broadcasts hot-seat telemetry to others at 10 Hz.

At 6 players: 5 Opus streams ≈ **~150 kbps upstream** + ~3 KB/s telemetry. Fine for typical broadband.

## Signaling & room codes

- **PeerJS Cloud** (free) for signaling. Host peer id = `awaaz-{CODE}` where CODE is a 4-letter alphanumeric (regenerate on collision; avoid PeerJS reserved patterns).
- Join flow:
  1. Joiner opens `peer.connect('awaaz-' + CODE)` → control DataChannel.
  2. Host assigns a slot, sends `{type:'snapshot', state, t}`.
  3. Audio mesh: host tells existing clients the joiner's peer id; everyone exchanges `peer.call()` offers via the host relay (or direct calls keyed by slot id).

## ICE configuration

```js
iceServers: [
  { urls: ['stun:stun.l.google.com:19302', 'stun:global.stun.twilio.com:3478'] },
  { urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443',
           'turns:openrelay.metered.ca:443?transport=tcp'],
    username: OPENRELAY_USER, credential: OPENRELAY_PASS }
]
```
- Open Relay: free ~20 GB/mo TURN (ports 80/443, `turns:` on 443 for strict firewalls).
- When any pair falls back to relay, show the **RELAY badge** (higher latency expected).

## Protocol (`protocol.ts`)

All messages JSON over DataChannel, versioned `{ v: 1, type, ... }`.

| Type | Dir | Payload | Notes |
|------|-----|---------|-------|
| `snapshot` | H→C | full `GameState`, `t` | On join / rejoin |
| `hello` | C→H | name, capabilities | First message |
| `phase` | H→C | phase, payload | FSM transitions |
| `question` | H→C | qid, text, `t` (host time) | Starts an interrogation beat |
| `onset` | C→H | `t` | Hot-seat: mic onset detected |
| `tel` | C→H | StressTelemetry + z-scores | 15 Hz, skip if `bufferedAmount` high |
| `score` | C→H | composite 0–100, confidence | Hot-seat, 10 Hz |
| `vote` | C→H | target slot | Anonymous tally at host |
| `mask` | C→H | maskId | Disguise lock-in |
| `bye` | C→H / H→C | reason | Graceful leave |

Ordering: reliable ordered channels are fine at these sizes; throttle by time, not by reliability.

## Clock sync (`clock.ts`)

- Client sends `{type:'ping', t0}`; host replies `{type:'pong', t0, t1}`.
- Offset estimate `θ ≈ t1 − (t0 + RTT/2)`; smooth with EWMA; re-measure every 5 s.
- Accuracy ±50 ms — enough for response-latency gameplay.

## Reconnect

- Joiner keeps CODE; on drop, recreate peer, reconnect, request snapshot.
- Host keeps roster by `slot`; marks disconnected players `connected:false` for 60 s, then frees slot (configurable).
- Host disconnect = room ends (v1 accepted limitation; host migration post-v1).

## Failure UX

| Failure | UX |
|---------|----|
| Code not found | "Room doesn't exist" + retry |
| Room full (6) | "Room is full" |
| ICE failed all pairs | "Connection blocked — trying relay…" then RELAY badge or "Couldn't connect" |
| Host left | "Host closed the room" + rematch/new-room CTA |
| Mic denied | Blocking gate with per-browser instructions |
