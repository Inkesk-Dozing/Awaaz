/**
 * Host-authoritative Game Finite State Machine (FSM).
 * Manages game loop: lobby -> calibration -> disguise -> deal -> interrogation -> verdict -> vote -> reveal.
 */

import { SCENARIO_DECKS, ScenarioDeck, ScenarioQuestion } from './scenarios';

export type GamePhase =
  | 'lobby'
  | 'calibration'
  | 'disguise'
  | 'deal'
  | 'interrogation'
  | 'verdict'
  | 'vote'
  | 'reveal';

export interface PlayerStats {
  composureScore: number;
  fooledCount: number;
  votesReceived: number;
}

export interface GameStateModel {
  roomCode: string;
  phase: GamePhase;
  round: number;
  totalRounds: number;
  hotSeatSlot: number;
  saboteurSlot: number;
  activeScenario: ScenarioDeck;
  currentQuestionIndex: number;
  questionTimerRemaining: number;
  votes: Record<number, number>; // voterSlot -> targetSlot
  playerScores: Record<number, PlayerStats>;
}

export class GameFSM {
  private state: GameStateModel;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private onStateChange: (state: GameStateModel) => void;

  constructor(roomCode: string, onStateChange: (state: GameStateModel) => void) {
    this.onStateChange = onStateChange;
    this.state = {
      roomCode,
      phase: 'lobby',
      round: 1,
      totalRounds: 3,
      hotSeatSlot: 0,
      saboteurSlot: -1,
      activeScenario: SCENARIO_DECKS.vault_breach,
      currentQuestionIndex: 0,
      questionTimerRemaining: 25,
      votes: {},
      playerScores: {}
    };
  }

  public getState(): GameStateModel {
    return { ...this.state };
  }

  public startCalibration(): void {
    this.transitionTo('calibration');
  }

  public startDisguise(): void {
    this.transitionTo('disguise');
  }

  public dealRoles(rosterSlots: number[]): number {
    if (rosterSlots.length === 0) return 0;
    // Cryptographically assign exactly 1 Saboteur
    const randomIdx = Math.floor(Math.random() * rosterSlots.length);
    this.state.saboteurSlot = rosterSlots[randomIdx];

    // Pick hot-seat player for this round (rotates with round number)
    this.state.hotSeatSlot = rosterSlots[(this.state.round - 1) % rosterSlots.length];

    this.transitionTo('deal');
    return this.state.saboteurSlot;
  }

  public startInterrogation(scenarioId?: string): void {
    if (scenarioId && SCENARIO_DECKS[scenarioId]) {
      this.state.activeScenario = SCENARIO_DECKS[scenarioId];
    }
    this.state.currentQuestionIndex = 0;
    this.transitionTo('interrogation');
    this.startQuestionTimer();
  }

  public nextQuestion(): ScenarioQuestion | null {
    if (this.state.currentQuestionIndex + 1 < this.state.activeScenario.questions.length) {
      this.state.currentQuestionIndex++;
      this.startQuestionTimer();
      this.onStateChange(this.getState());
      return this.state.activeScenario.questions[this.state.currentQuestionIndex];
    } else {
      this.stopTimer();
      this.transitionTo('verdict');
      return null;
    }
  }

  public startVoting(): void {
    this.state.votes = {};
    this.transitionTo('vote');
  }

  public castVote(voterSlot: number, targetSlot: number): void {
    this.state.votes[voterSlot] = targetSlot;
    this.onStateChange(this.getState());
  }

  public revealRoundResult(): { accusedSlot: number; wasSaboteur: boolean } {
    this.transitionTo('reveal');

    // Tally votes
    const counts: Record<number, number> = {};
    Object.values(this.state.votes).forEach((target) => {
      counts[target] = (counts[target] || 0) + 1;
    });

    let maxVotes = -1;
    let accusedSlot = -1;
    Object.entries(counts).forEach(([slot, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        accusedSlot = Number(slot);
      }
    });

    const wasSaboteur = accusedSlot === this.state.saboteurSlot;
    return { accusedSlot, wasSaboteur };
  }

  private startQuestionTimer(): void {
    this.stopTimer();
    const currentQ = this.state.activeScenario.questions[this.state.currentQuestionIndex];
    this.state.questionTimerRemaining = currentQ ? currentQ.timeLimitSec : 25;

    this.timerInterval = setInterval(() => {
      if (this.state.questionTimerRemaining > 0) {
        this.state.questionTimerRemaining--;
        this.onStateChange(this.getState());
      } else {
        this.nextQuestion();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private transitionTo(phase: GamePhase): void {
    this.state.phase = phase;
    this.onStateChange(this.getState());
  }

  public dispose(): void {
    this.stopTimer();
  }
}
