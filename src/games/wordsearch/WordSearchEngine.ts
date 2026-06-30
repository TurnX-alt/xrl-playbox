import type { WordSearchCell, WordSearchState, WordSearchWord } from "./types";
import { WORD_SEARCH_WORDS } from "./words";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randomLetter(): string {
  return ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
}

function canPlace(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  direction: "horizontal" | "vertical"
): boolean {
  for (let i = 0; i < word.length; i++) {
    const r = direction === "horizontal" ? row : row + i;
    const c = direction === "horizontal" ? col + i : col;
    if (r >= grid.length || c >= grid[0].length) return false;
    const existing = grid[r][c];
    if (existing !== "" && existing !== word[i]) return false;
  }
  return true;
}

function placeWord(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  direction: "horizontal" | "vertical"
): { row: number; col: number }[] {
  const positions: { row: number; col: number }[] = [];
  for (let i = 0; i < word.length; i++) {
    const r = direction === "horizontal" ? row : row + i;
    const c = direction === "horizontal" ? col + i : col;
    grid[r][c] = word[i];
    positions.push({ row: r, col: c });
  }
  return positions;
}

export interface GenerateOptions {
  size?: number;
  targetCount?: number;
}

export function generateWordSearch(options: GenerateOptions = {}): WordSearchState {
  const size = options.size ?? 10;
  const targetCount = options.targetCount ?? 8;

  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(""));
  const placed: WordSearchWord[] = [];

  const candidates = shuffle(WORD_SEARCH_WORDS.filter((w) => w.length >= 3 && w.length <= size));

  for (const word of candidates) {
    if (placed.length >= targetCount) break;

    let placedPositions: { row: number; col: number }[] | null = null;
    const positions = shuffle(
      Array.from({ length: size * size }, (_, i) => ({
        row: Math.floor(i / size),
        col: i % size,
      }))
    );
    const directions = shuffle(["horizontal", "vertical"] as const);

    for (const pos of positions) {
      for (const direction of directions) {
        if (canPlace(grid, word, pos.row, pos.col, direction)) {
          placedPositions = placeWord(grid, word, pos.row, pos.col, direction);
          break;
        }
      }
      if (placedPositions) break;
    }

    if (placedPositions) {
      placed.push({
        id: word.toLowerCase(),
        text: word,
        positions: placedPositions,
        found: false,
      });
    }
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === "") {
        grid[r][c] = randomLetter();
      }
    }
  }

  const cells: WordSearchCell[][] = grid.map((row, r) =>
    row.map((letter, c) => ({
      letter,
      row: r,
      col: c,
      found: false,
      highlight: false,
    }))
  );

  return {
    grid: cells,
    words: placed,
    startedAt: Date.now(),
    finishedAt: null,
  };
}

export function getLineCells(
  start: { row: number; col: number },
  end: { row: number; col: number },
  grid: WordSearchCell[][]
): WordSearchCell[] | null {
  if (start.row === end.row) {
    const row = start.row;
    const min = Math.min(start.col, end.col);
    const max = Math.max(start.col, end.col);
    return Array.from({ length: max - min + 1 }, (_, i) => grid[row][min + i]);
  }
  if (start.col === end.col) {
    const col = start.col;
    const min = Math.min(start.row, end.row);
    const max = Math.max(start.row, end.row);
    return Array.from({ length: max - min + 1 }, (_, i) => grid[min + i][col]);
  }
  return null;
}

export function findWordByCells(
  cells: WordSearchCell[],
  words: WordSearchWord[]
): WordSearchWord | null {
  const text = cells.map((c) => c.letter).join("");
  const reversed = cells.map((c) => c.letter).reverse().join("");
  return (
    words.find((w) => !w.found && (w.text === text || w.text === reversed)) || null
  );
}

export function allWordsFound(state: WordSearchState): boolean {
  return state.words.length > 0 && state.words.every((w) => w.found);
}

export function elapsedSeconds(state: WordSearchState): number {
  const end = state.finishedAt ?? Date.now();
  return Math.floor((end - state.startedAt) / 1000);
}
