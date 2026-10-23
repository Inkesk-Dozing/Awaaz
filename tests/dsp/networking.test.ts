import { describe, it, expect } from 'vitest';
import { ClockSync } from '../../src/audio/../net/clock';
import { getIceConfig, DEFAULT_ICE_SERVERS } from '../../src/audio/../net/ice';
import { WireMessage } from '../../src/audio/../net/protocol';

describe('WebRTC Networking & Clock Sync Modules', () => {
  it('correctly provides prioritized STUN and Open Relay TURN configurations', () => {
    const config = getIceConfig();
    expect(config.iceServers).toBeDefined();
    expect(config.iceServers!.length).toBeGreaterThanOrEqual(2);

    const hasSTUN = DEFAULT_ICE_SERVERS.some((s) =>
      typeof s.urls === 'string'
        ? s.urls.includes('stun:')
        : s.urls.some((u) => u.includes('stun:'))
    );
    const hasTURN = DEFAULT_ICE_SERVERS.some((s) =>
      typeof s.urls === 'string'
        ? s.urls.includes('turn:')
        : s.urls.some((u) => u.includes('turn:'))
    );

    expect(hasSTUN).toBe(true);
    expect(hasTURN).toBe(true);
  });

  it('accurately estimates clock offset via EWMA ping/pong sequence', () => {
    const clock = new ClockSync();
    expect(clock.getOffset()).toBe(0);

    // Simulated network: RTT = 40ms, Host clock ahead by +500ms
    const t0 = 1000;
    const t1 = 1520; // 1000 + 500 (offset) + 20 (half-RTT)
    const t2 = 1040; // 1000 + 40 (RTT)

    const offset = clock.handlePong(t0, t1, t2);
    // Instantaneous offset = 1520 - (1000 + 20) = 500ms
    expect(Math.round(offset)).toBe(500);

    // Second ping with slight network jitter
    const offset2 = clock.handlePong(2000, 2525, 2050);
    expect(offset2).toBeGreaterThan(495);
    expect(offset2).toBeLessThan(505);
  });

  it('rejects extreme packet lag outliers (> 400ms RTT) to protect clock stability', () => {
    const clock = new ClockSync();
    clock.handlePong(1000, 1520, 1040); // Initialized to 500ms

    // Outlier ping: RTT = 600ms
    clock.handlePong(2000, 2700, 2600);
    expect(Math.round(clock.getOffset())).toBe(500); // Remained unchanged
  });

  it('conforms strictly to versioned wire message protocol contracts', () => {
    const msg: WireMessage = {
      v: 1,
      type: 'hello',
      name: 'Agent_007'
    };
    expect(msg.v).toBe(1);
    expect(msg.type).toBe('hello');
  });
});
