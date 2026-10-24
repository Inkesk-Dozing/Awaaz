import { describe, it, expect } from 'vitest';
import { VotingEngine } from '../../src/game/voting';

describe('Anonymous Voting & Post-Game Analytics (Issue #14)', () => {
  it('tallies anonymous ballots and breaks ties in favor of acquittal', () => {
    const engine = new VotingEngine();

    // 4 players voting: 2 Eject, 2 Acquit (Tie)
    engine.castVote(1, 'EJECT');
    engine.castVote(2, 'EJECT');
    engine.castVote(3, 'ACQUIT');
    engine.castVote(4, 'ACQUIT');

    expect(engine.getVoteCount()).toBe(4);

    const outcome = engine.resolveRound(
      0, // hot-seat player
      1, // saboteur slot
      'UNSTABLE',
      55,
      1
    );

    // Tie defaults to acquittal
    expect(outcome.verdict).toBe('ACQUITTED');
    expect(outcome.ejectVotes).toBe(2);
    expect(outcome.acquitVotes).toBe(2);
    expect(outcome.totalVoters).toBe(4);
  });

  it('correctly resolves round when saboteur is caught', () => {
    const engine = new VotingEngine();

    // Player 0 is Saboteur. Room votes: 3 Eject, 1 Acquit.
    engine.castVote(1, 'EJECT');
    engine.castVote(2, 'EJECT');
    engine.castVote(3, 'EJECT');
    engine.castVote(4, 'ACQUIT');

    const outcome = engine.resolveRound(
      0,
      0, // Player 0 is Saboteur!
      'DECEPTION',
      88,
      2
    );

    expect(outcome.verdict).toBe('EJECTED');
    expect(outcome.wasSaboteur).toBe(true);
    expect(outcome.wasCorrectEjection).toBe(true);
    expect(outcome.isDetectorCorrect).toBe(true);

    // Ejecting voters get +50 points
    expect(outcome.pointsAwarded[1]).toBe(50);
    expect(outcome.pointsAwarded[2]).toBe(50);
    expect(outcome.pointsAwarded[3]).toBe(50);
    expect(outcome.pointsAwarded[4]).toBeUndefined();
  });

  it('computes accurate post-game analytics across multi-round match', () => {
    const engine = new VotingEngine();

    // Round 1: Saboteur bluff succeeds (Detector guessed TRUTH)
    engine.castVote(1, 'ACQUIT');
    engine.castVote(2, 'ACQUIT');
    engine.resolveRound(0, 0, 'TRUTH', 35, 1);

    // Round 2: Innocent Crew grilled (Detector said TRUTH, Crew acquits)
    engine.clearVotes();
    engine.castVote(0, 'ACQUIT');
    engine.castVote(2, 'ACQUIT');
    engine.resolveRound(1, 0, 'TRUTH', 32, 2);

    // Round 3: Saboteur caught! (Detector said DECEPTION, Crew ejects)
    engine.clearVotes();
    engine.castVote(1, 'EJECT');
    engine.castVote(2, 'EJECT');
    engine.resolveRound(0, 0, 'DECEPTION', 82, 3);

    const analytics = engine.computePostGameAnalytics({ 0: 100, 1: 100, 2: 100 });

    expect(analytics.totalRounds).toBe(3);
    // Rounds 2 & 3 detector was correct (Round 1 was fooled) -> 2/3 = 67%
    expect(analytics.detectorAccuracyPct).toBe(67);
    expect(analytics.fooledDetectorCount).toBe(1);
    expect(analytics.composureScores[0]).toBeDefined();
  });
});
