/**
 * Anonymous Voting & Round Resolution Engine.
 * Manages sealed private ballots, tallying with deterministic tie-breaking,
 * and post-game detector accuracy analytics.
 */

export type BallotChoice = 'EJECT' | 'ACQUIT';

export interface RoundVoteRecord {
  voterSlot: number;
  choice: BallotChoice;
  timestamp: number;
}

export interface RoundOutcome {
  hotSeatSlot: number;
  wasSaboteur: boolean;
  ejectVotes: number;
  acquitVotes: number;
  totalVoters: number;
  verdict: 'EJECTED' | 'ACQUITTED';
  detectorVerdict: 'TRUTH' | 'UNSTABLE' | 'DECEPTION';
  isDetectorCorrect: boolean;
  wasCorrectEjection: boolean;
  pointsAwarded: Record<number, number>; // slot -> points earned
}

export interface MatchRoundHistory {
  roundNumber: number;
  hotSeatSlot: number;
  wasSaboteur: boolean;
  detectorVerdict: 'TRUTH' | 'UNSTABLE' | 'DECEPTION';
  compositeScore: number;
  ejectVotes: number;
  acquitVotes: number;
  wasEjected: boolean;
}

export interface PostGameAnalytics {
  totalRounds: number;
  detectorAccuracyPct: number;    // % rounds detector verdict correctly matched ground truth
  fooledDetectorCount: number;    // rounds Saboteur got TRUTH verdict
  crewAccuracyPct: number;        // % player votes that accurately targeted the saboteur
  composureScores: Record<number, number>; // slot -> Composure Index (100 - mean(stress))
  matchWinner: 'CREW' | 'SABOTEUR';
}

export class VotingEngine {
  private activeVotes: Map<number, BallotChoice> = new Map();
  private matchHistory: MatchRoundHistory[] = [];

  public clearVotes(): void {
    this.activeVotes.clear();
  }

  public castVote(voterSlot: number, choice: BallotChoice): void {
    this.activeVotes.set(voterSlot, choice);
  }

  public getVoteCount(): number {
    return this.activeVotes.size;
  }

  public resolveRound(
    hotSeatSlot: number,
    saboteurSlot: number,
    detectorVerdict: 'TRUTH' | 'UNSTABLE' | 'DECEPTION',
    compositeScore: number,
    roundNumber: number
  ): RoundOutcome {
    let ejectVotes = 0;
    let acquitVotes = 0;

    for (const choice of this.activeVotes.values()) {
      if (choice === 'EJECT') {
        ejectVotes++;
      } else {
        acquitVotes++;
      }
    }

    const totalVoters = ejectVotes + acquitVotes;
    // Deterministic tie-breaking: ties default to ACQUITTED (presumption of innocence)
    const wasEjected = ejectVotes > acquitVotes;
    const wasSaboteur = hotSeatSlot === saboteurSlot;

    // Detector truth calculation
    const isDetectorCorrect =
      (wasSaboteur && detectorVerdict === 'DECEPTION') ||
      (!wasSaboteur && detectorVerdict === 'TRUTH');

    const wasCorrectEjection = wasEjected && wasSaboteur;

    // Scoring calculation:
    // Saboteur earns 100 points if they escape acquittal.
    // Interrogators earn 50 points each if they voted correctly to Eject a Saboteur or Acquit Crew.
    const pointsAwarded: Record<number, number> = {};

    if (!wasEjected && wasSaboteur) {
      pointsAwarded[hotSeatSlot] = 100; // Saboteur successfully bluffed the room
    }

    for (const [voterSlot, choice] of this.activeVotes.entries()) {
      if (wasSaboteur && choice === 'EJECT') {
        pointsAwarded[voterSlot] = (pointsAwarded[voterSlot] || 0) + 50;
      } else if (!wasSaboteur && choice === 'ACQUIT') {
        pointsAwarded[voterSlot] = (pointsAwarded[voterSlot] || 0) + 50;
      }
    }

    // Save history for post-game analytics
    this.matchHistory.push({
      roundNumber,
      hotSeatSlot,
      wasSaboteur,
      detectorVerdict,
      compositeScore,
      ejectVotes,
      acquitVotes,
      wasEjected,
    });

    return {
      hotSeatSlot,
      wasSaboteur,
      ejectVotes,
      acquitVotes,
      totalVoters,
      verdict: wasEjected ? 'EJECTED' : 'ACQUITTED',
      detectorVerdict,
      isDetectorCorrect,
      wasCorrectEjection,
      pointsAwarded,
    };
  }

  public computePostGameAnalytics(
    allPlayerScores: Record<number, number> = {}
  ): PostGameAnalytics {
    const totalRounds = this.matchHistory.length;
    if (totalRounds === 0) {
      return {
        totalRounds: 0,
        detectorAccuracyPct: 100,
        fooledDetectorCount: 0,
        crewAccuracyPct: 100,
        composureScores: {},
        matchWinner: 'CREW',
      };
    }

    let detectorCorrectCount = 0;
    let fooledDetectorCount = 0;
    let totalVotesCast = 0;
    let correctVotesCast = 0;

    const stressPerSlot: Record<number, number[]> = {};

    for (const r of this.matchHistory) {
      // Detector accuracy check
      if (
        (r.wasSaboteur && r.detectorVerdict === 'DECEPTION') ||
        (!r.wasSaboteur && r.detectorVerdict === 'TRUTH')
      ) {
        detectorCorrectCount++;
      }

      // Fooled detector check
      if (r.wasSaboteur && r.detectorVerdict === 'TRUTH') {
        fooledDetectorCount++;
      }

      // Votes accuracy check
      totalVotesCast += r.ejectVotes + r.acquitVotes;
      if (r.wasSaboteur) {
        correctVotesCast += r.ejectVotes;
      } else {
        correctVotesCast += r.acquitVotes;
      }

      // Stress aggregation
      if (!stressPerSlot[r.hotSeatSlot]) {
        stressPerSlot[r.hotSeatSlot] = [];
      }
      stressPerSlot[r.hotSeatSlot].push(r.compositeScore);
    }

    const composureScores: Record<number, number> = {};
    for (const [slotStr, scores] of Object.entries(stressPerSlot)) {
      const slot = Number(slotStr);
      const meanStress = scores.reduce((a, b) => a + b, 0) / scores.length;
      composureScores[slot] = Math.max(0, Math.min(100, Math.round(100 - meanStress)));
    }

    const detectorAccuracyPct = Math.round((detectorCorrectCount / totalRounds) * 100);
    const crewAccuracyPct =
      totalVotesCast > 0 ? Math.round((correctVotesCast / totalVotesCast) * 100) : 50;

    // Match winner determination
    let highestScore = -1;
    let winningSlot = 0;
    for (const [slotStr, pts] of Object.entries(allPlayerScores)) {
      if (pts > highestScore) {
        highestScore = pts;
        winningSlot = Number(slotStr);
      }
    }

    const matchWinner = winningSlot > 0 ? 'CREW' : 'SABOTEUR';

    return {
      totalRounds,
      detectorAccuracyPct,
      fooledDetectorCount,
      crewAccuracyPct,
      composureScores,
      matchWinner,
    };
  }

  public resetMatchHistory(): void {
    this.matchHistory = [];
    this.activeVotes.clear();
  }
}
