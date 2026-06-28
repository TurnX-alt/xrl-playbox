import type { DealBriefcase, DealMode, DealPhase, DealRoundHistory } from "@/types";
import { calculateOffer, getEliminationCountForRound, getTotalRounds } from "./DealBanker";

export const DEAL_AMOUNTS = [
  0.01, 1, 5, 10, 25, 50, 75, 100, 200, 300, 400, 500, 750,
  1000, 5000, 10000, 25000, 50000, 75000, 100000,
  200000, 300000, 400000, 500000, 750000, 1000000,
];

export interface DealEngineState {
  mode: DealMode;
  phase: DealPhase;
  round: number;
  briefcases: DealBriefcase[];
  ownBriefcaseId: number | null;
  currentPlayer: 1;
  lastOffer: number | null;
  acceptedOffer: number | null;
  acceptedAtRound: number | null;
  eliminatedThisRound: number;
  consecutiveHighEliminations: number;
  history: DealRoundHistory[];
  finalAmounts: { player1: number; player2: number };
}

export class DealEngine {
  state: DealEngineState;

  constructor(_mode: DealMode = "single") {
    this.state = this.createInitialState();
  }

  createInitialState(): DealEngineState {
    const amounts = this.shuffle([...DEAL_AMOUNTS]);
    const briefcases: DealBriefcase[] = amounts.map((amount, index) => ({
      id: index + 1,
      amount,
      eliminated: false,
      opened: false,
      owner: null,
    }));

    return {
      mode: "single",
      phase: "select-own",
      round: 1,
      briefcases,
      ownBriefcaseId: null,
      currentPlayer: 1,
      lastOffer: null,
      acceptedOffer: null,
      acceptedAtRound: null,
      eliminatedThisRound: 0,
      consecutiveHighEliminations: 0,
      history: [],
      finalAmounts: { player1: 0, player2: 0 },
    };
  }

  shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  selectOwnBriefcase(id: number): boolean {
    if (this.state.phase !== "select-own") return false;
    const briefcase = this.state.briefcases.find((b) => b.id === id);
    if (!briefcase || briefcase.owner) return false;

    briefcase.owner = "player1";
    this.state.ownBriefcaseId = id;
    this.state.phase = "eliminate";
    this.state.eliminatedThisRound = 0;
    return true;
  }

  eliminate(id: number): boolean {
    if (this.state.phase !== "eliminate") return false;
    const briefcase = this.state.briefcases.find((b) => b.id === id);
    if (!briefcase || briefcase.eliminated || briefcase.owner) return false;

    briefcase.eliminated = true;
    briefcase.opened = true;
    this.state.eliminatedThisRound++;

    if (briefcase.amount > 100_000) {
      this.state.consecutiveHighEliminations++;
    } else {
      this.state.consecutiveHighEliminations = 0;
    }

    const needed = getEliminationCountForRound(this.state.round);
    if (this.state.eliminatedThisRound >= needed) {
      this.state.phase = "banker-offer";
      this.state.lastOffer = calculateOffer(this.state.round, this.state.briefcases);
    }

    return true;
  }

  acceptDeal(): boolean {
    if (this.state.phase !== "decide") return false;
    this.state.acceptedOffer = this.state.lastOffer;
    this.state.acceptedAtRound = this.state.round;
    this.state.finalAmounts = {
      player1: this.state.lastOffer!,
      player2: this.state.lastOffer!,
    };
    this.state.phase = "finished";
    return true;
  }

  rejectDeal(): boolean {
    if (this.state.phase !== "decide") return false;
    this.state.history.push({
      round: this.state.round,
      eliminatedIds: this.getEliminatedThisRoundIds(),
      offer: this.state.lastOffer,
      decision: "no-deal",
    });

    if (this.isFinalRound()) {
      this.state.phase = "reveal";
      this.revealFinal();
    } else {
      this.state.round++;
      this.state.phase = "eliminate";
      this.state.eliminatedThisRound = 0;
      this.state.lastOffer = null;
    }
    return true;
  }

  getEliminatedThisRoundIds(): number[] {
    return this.state.briefcases
      .filter((b) => b.eliminated && !this.state.history.some((h) => h.eliminatedIds.includes(b.id)))
      .map((b) => b.id);
  }

  isFinalRound(): boolean {
    return this.state.round >= getTotalRounds();
  }

  revealFinal() {
    const ownBriefcase = this.state.briefcases.find((b) => b.id === this.state.ownBriefcaseId);
    const amount = ownBriefcase?.amount ?? 0;
    this.state.finalAmounts = { player1: amount, player2: amount };
    this.state.phase = "finished";
  }

  getOwnAmount(): number {
    const own = this.state.briefcases.find((b) => b.id === this.state.ownBriefcaseId);
    return own?.amount ?? 0;
  }

  getRemainingBriefcases(): DealBriefcase[] {
    return this.state.briefcases.filter((b) => !b.eliminated && !b.owner);
  }

  getRemainingAmounts(): number[] {
    return this.getRemainingBriefcases().map((b) => b.amount);
  }

  proceedToDecide() {
    if (this.state.phase === "banker-offer") {
      this.state.phase = "decide";
    }
  }

  startNewGame() {
    this.state = this.createInitialState();
  }
}
