import { describe, it, expect } from 'vitest';
import { RosterManager } from '../../src/game/roster';
import { MASK_PRESETS } from '../../src/audio/morph/masks';

describe('Disguise Selection & Roster Lock-in (Issue #13)', () => {
  it('manages player registration, mask assignment, and lock-in verification', () => {
    const roster = new RosterManager();

    roster.registerPlayer(0, 'peer-host', 'Alice (Host)', true);
    roster.registerPlayer(1, 'peer-bob', 'Bob');
    roster.registerPlayer(2, 'peer-charlie', 'Charlie');

    expect(roster.getPlayerList().length).toBe(3);
    expect(roster.areAllMasksLocked()).toBe(false);

    // Player 0 picks Robot
    roster.setPlayerMask(0, 'robot_cyborg');
    roster.lockInMask(0);
    expect(roster.areAllMasksLocked()).toBe(false);

    // Player 1 picks Radio
    roster.setPlayerMask(1, 'radio_operator');
    roster.lockInMask(1);
    expect(roster.areAllMasksLocked()).toBe(false);

    // Player 2 picks Demon
    roster.setPlayerMask(2, 'demon');
    roster.lockInMask(2);

    // All players now locked
    expect(roster.areAllMasksLocked()).toBe(true);

    const player0 = roster.getPlayer(0);
    expect(player0?.maskId).toBe('robot_cyborg');
    expect(player0?.isLocked).toBe(true);
  });

  it('rejects mask changes after a player has locked in', () => {
    const roster = new RosterManager();
    roster.registerPlayer(0, 'peer-1', 'Dan');
    roster.setPlayerMask(0, 'posh_royal');
    roster.lockInMask(0);

    // Try modifying after lock
    roster.setPlayerMask(0, 'female_morph');
    expect(roster.getPlayer(0)?.maskId).toBe('posh_royal');
  });

  it('validates that mask presets exist for all carousel options', () => {
    const presetIds = Object.keys(MASK_PRESETS);
    expect(presetIds.length).toBeGreaterThanOrEqual(7);
    expect(presetIds).toContain('female_morph');
    expect(presetIds).toContain('robot_cyborg');
    expect(presetIds).toContain('radio_operator');
  });
});
