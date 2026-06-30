import type { GameId } from "@/types";

export interface GameMeta {
  id: GameId;
  titleKey: string;
  emoji: string;
}

export const GAMES = ([
  { id: "sokoban", titleKey: "sokoban.title", emoji: "📦" },
  { id: "deal", titleKey: "deal.title", emoji: "💼" },
  { id: "typing", titleKey: "typing.title", emoji: "⌨️" },
  { id: "selftest", titleKey: "selftest.title", emoji: "🧠" },
  { id: "wordsearch", titleKey: "wordsearch.title", emoji: "🔤" },
  { id: "minimonopoly", titleKey: "minimonopoly.title", emoji: "🎲" },
] satisfies GameMeta[]);
