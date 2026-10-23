import { describe, it, expect, vi } from 'vitest';
import { GameFSM } from '../../src/game/fsm';
import { SCENARIO_DECKS } from '../../src/game/scenarios';

describe('Game FSM & Scenario Loop', () => {
  it('initializes cleanly in lobby state with default scenario', () => {
    const callback = vi.fn();
    const fsm = new GameFSM('WXYZ', callback);
    const state = fsm.getState();

    expect(state.phase).toBe('lobby');
    expect(state.roomCode).toBe('WXYZ');
    expect(state.activeScenario.id).toBe('vault_breach');
  });

  it('cycles through calibration and disguise phases', () => {
    const callback = vi.fn();
    const fsm = new GameFSM('WXYZ', callback);

    fsm.startCalibration();
    expect(fsm.getState().phase).toBe('calibration');

    fsm.startDisguise();
    expect(fsm.getState().phase).toBe('disguise');
  });

  it('deals roles with exactly 1 saboteur and rotates hot seat slot', () => {
    const callback = vi.fn();
    const fsm = new GameFSM('WXYZ', callback);
    const rosterSlots = [0, 1, 2];

    const saboteurSlot = fsm.dealRoles(rosterSlots);
    const state = fsm.getState();

    expect(state.phase).toBe('deal');
    expect(rosterSlots.includes(saboteurSlot)).toBe(true);
    expect(state.hotSeatSlot).toBe(0);
  });

  it('advances through all scenario interrogation questions and reaches verdict', () => {
    const callback = vi.fn();
    const fsm = new GameFSM('WXYZ', callback);
    fsm.startInterrogation('the_leak');

    expect(fsm.getState().phase).toBe('interrogation');
    expect(fsm.getState().activeScenario.id).toBe('the_leak');

    // Step through questions
    for (let i = 0; i < 4; i++) {
      const q = fsm.nextQuestion();
      expect(q).not.toBeNull();
    }

    // Final question step transitions to verdict
    const end = fsm.nextQuestion();
    expect(end).toBeNull();
    expect(fsm.getState().phase).toBe('verdict');
    fsm.dispose();
  });

  it('collects anonymous votes and tallies consensus in reveal phase', () => {
    const callback = vi.fn();
    const fsm = new GameFSM('WXYZ', callback);
    fsm.dealRoles([0, 1, 2]);
    const saboteur = fsm.getState().saboteurSlot;

    fsm.startVoting();
    expect(fsm.getState().phase).toBe('vote');

    // All players vote for the actual saboteur
    fsm.castVote(0, saboteur);
    fsm.castVote(1, saboteur);
    fsm.castVote(2, saboteur);

    const result = fsm.revealRoundResult();
    expect(fsm.getState().phase).toBe('reveal');
    expect(result.accusedSlot).toBe(saboteur);
    expect(result.wasSaboteur).toBe(true);
    fsm.dispose();
  });
});
