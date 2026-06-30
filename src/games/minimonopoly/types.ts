export type MiniMonopolyTileType =
  | "start"
  | "property"
  | "chance"
  | "tax"
  | "jail"
  | "park";

export interface MiniMonopolyProperty {
  name: string;
  area: string;
  price: number;
  baseRent: number;
  upgradeCost: number;
  level: number;
  ownerId: string | null;
}

export interface MiniMonopolyTile {
  id: number;
  type: MiniMonopolyTileType;
  property: MiniMonopolyProperty | null;
}

export interface MiniMonopolyPlayer {
  id: string;
  name: string;
  color: string;
  money: number;
  position: number;
  bankrupt: boolean;
  inJail: boolean;
  jailTurns: number;
  isAi: boolean;
}

export interface MiniMonopolyLogEntry {
  id: number;
  key: string;
  params: Record<string, string | number | undefined>;
}

export type MiniMonopolyStatus = "setup" | "playing" | "finished";

export interface MiniMonopolyState {
  tiles: MiniMonopolyTile[];
  players: MiniMonopolyPlayer[];
  currentPlayerIndex: number;
  round: number;
  maxRounds: number;
  status: MiniMonopolyStatus;
  dice: number;
  lastCard: { key: string; params: Record<string, string | number | undefined> } | null;
  logs: MiniMonopolyLogEntry[];
  pendingBuy: MiniMonopolyTile | null;
  pendingUpgrade: MiniMonopolyTile | null;
}

export interface MiniMonopolySetupPlayer {
  name: string;
  isAi: boolean;
}
