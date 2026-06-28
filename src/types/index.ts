export type GameId = "sokoban" | "deal";

export interface Achievement {
  id: string;
  game: GameId;
  nameKey: string;
  descKey: string;
  points: number;
  unlockedAt: number | null;
}

export interface StoredAchievementData {
  unlockedIds: string[];
  timestamps: Record<string, number>;
}

export type Direction = "up" | "down" | "left" | "right";

export interface Position {
  x: number;
  y: number;
}

export interface SokobanCell {
  wall: boolean;
  target: boolean;
  box: boolean;
  player: boolean;
}

export type SokobanGrid = SokobanCell[][];

export interface SokobanMoveResult {
  moved: boolean;
  pushed: boolean;
  pushedTo?: Position;
  won: boolean;
}

export interface DealBriefcase {
  id: number;
  amount: number;
  eliminated: boolean;
  opened: boolean;
  owner: "bank" | "player1" | "player2" | null;
}

export type DealPhase =
  | "select-own"
  | "eliminate"
  | "banker-offer"
  | "decide"
  | "reveal"
  | "finished";

export type DealMode = "single";

export interface DealRoundHistory {
  round: number;
  eliminatedIds: number[];
  offer: number | null;
  decision: "deal" | "no-deal" | null;
}

export interface Settings {
  locale: "zh-CN" | "en";
  soundEnabled: boolean;
}
