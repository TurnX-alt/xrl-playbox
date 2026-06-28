import type { DealBriefcase } from "@/types";

const ROUND_MULTIPLIERS = [0.38, 0.55, 0.68, 0.76, 0.84, 0.9, 0.94, 0.97, 1.0];

export function calculateOffer(round: number, briefcases: DealBriefcase[]): number {
  const remaining = briefcases.filter((b) => !b.eliminated && b.owner !== "player1" && b.owner !== "player2");
  if (remaining.length === 0) return 0;

  const amounts = remaining.map((b) => b.amount);
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;

  const multiplier = ROUND_MULTIPLIERS[Math.min(round - 1, ROUND_MULTIPLIERS.length - 1)];
  const randomness = 0.95 + Math.random() * 0.1;

  return Math.round(mean * multiplier * randomness);
}

export function getEliminationCountForRound(round: number): number {
  const counts = [6, 5, 4, 3, 2, 1, 1, 1];
  return counts[Math.min(round - 1, counts.length - 1)] ?? 1;
}

export function getTotalRounds(): number {
  return 9;
}
