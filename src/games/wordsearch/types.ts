export interface WordSearchCell {
  letter: string;
  row: number;
  col: number;
  found: boolean;
  highlight: boolean;
}

export interface WordSearchWord {
  id: string;
  text: string;
  positions: { row: number; col: number }[];
  found: boolean;
}

export interface WordSearchState {
  grid: WordSearchCell[][];
  words: WordSearchWord[];
  startedAt: number;
  finishedAt: number | null;
}

export type WordSearchDirection = "horizontal" | "vertical";
