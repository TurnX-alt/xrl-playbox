import type { Direction, Position, SokobanCell, SokobanGrid, SokobanMoveResult } from "@/types";

const DIRECTIONS: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export interface SokobanLevel {
  grid: SokobanGrid;
  player: Position;
  boxes: Position[];
  targets: Position[];
  size: number;
  stepLimit: number;
}

export class SokobanEngine {
  grid: SokobanGrid;
  player: Position;
  steps: number;
  stepLimit: number;
  level: number;
  initial: SokobanLevel;

  constructor(level: SokobanLevel) {
    this.initial = level;
    this.grid = this.cloneGrid(level.grid);
    this.player = { ...level.player };
    this.steps = 0;
    this.stepLimit = level.stepLimit;
    this.level = 1;
  }

  static fromLevel(level: SokobanLevel): SokobanEngine {
    return new SokobanEngine(level);
  }

  static emptyEditor(size: number): SokobanEngine {
    const grid: SokobanGrid = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => ({
        wall: false,
        target: false,
        box: false,
        player: false,
      }))
    );
    return new SokobanEngine({
      grid,
      player: { x: Math.floor(size / 2), y: Math.floor(size / 2) },
      boxes: [],
      targets: [],
      size,
      stepLimit: 0,
    });
  }

  cloneGrid(grid: SokobanGrid): SokobanGrid {
    return grid.map((row) => row.map((cell) => ({ ...cell })));
  }

  reset() {
    this.grid = this.cloneGrid(this.initial.grid);
    this.player = { ...this.initial.player };
    this.steps = 0;
  }

  loadLevel(level: SokobanLevel) {
    this.initial = level;
    this.reset();
    this.stepLimit = level.stepLimit;
  }

  inBounds(pos: Position): boolean {
    return pos.x >= 0 && pos.y >= 0 && pos.y < this.grid.length && pos.x < this.grid[0].length;
  }

  cellAt(pos: Position): SokobanCell | undefined {
    if (!this.inBounds(pos)) return undefined;
    return this.grid[pos.y][pos.x];
  }

  move(dir: Direction): SokobanMoveResult {
    const delta = DIRECTIONS[dir];
    const next: Position = { x: this.player.x + delta.x, y: this.player.y + delta.y };
    const nextCell = this.cellAt(next);
    const result: SokobanMoveResult = { moved: false, pushed: false, won: false };

    if (!nextCell || nextCell.wall) return result;

    if (nextCell.box) {
      const beyond: Position = { x: next.x + delta.x, y: next.y + delta.y };
      const beyondCell = this.cellAt(beyond);
      if (!beyondCell || beyondCell.wall || beyondCell.box) return result;

      // Move box
      nextCell.box = false;
      beyondCell.box = true;
      result.pushed = true;
      result.pushedTo = beyond;
    }

    // Move player
    this.grid[this.player.y][this.player.x].player = false;
    nextCell.player = true;
    this.player = next;
    this.steps++;
    result.moved = true;
    result.won = this.checkWin();

    return result;
  }

  checkWin(): boolean {
    for (const row of this.grid) {
      for (const cell of row) {
        if (cell.target && !cell.box) return false;
      }
    }
    return true;
  }

  countBoxesOnTarget(): number {
    let count = 0;
    for (const row of this.grid) {
      for (const cell of row) {
        if (cell.target && cell.box) count++;
      }
    }
    return count;
  }

  totalTargets(): number {
    let count = 0;
    for (const row of this.grid) {
      for (const cell of row) {
        if (cell.target) count++;
      }
    }
    return count;
  }

  hasStepLimit(): boolean {
    return this.stepLimit > 0;
  }

  isOutOfSteps(): boolean {
    return this.hasStepLimit() && this.steps >= this.stepLimit;
  }

  // Editor helpers
  cycleCell(pos: Position) {
    const cell = this.cellAt(pos);
    if (!cell) return;
    if (cell.player) {
      cell.player = false;
      return;
    }
    if (cell.box) {
      cell.box = false;
      cell.target = true;
      return;
    }
    if (cell.target) {
      cell.target = false;
      cell.wall = true;
      return;
    }
    if (cell.wall) {
      cell.wall = false;
      return;
    }
    cell.box = true;
  }

  setPlayer(pos: Position) {
    // Remove existing player
    for (const row of this.grid) {
      for (const cell of row) {
        cell.player = false;
      }
    }
    const cell = this.cellAt(pos);
    if (cell) {
      cell.player = true;
      cell.wall = false;
      cell.box = false;
      this.player = { ...pos };
    }
  }

  toLevel(): SokobanLevel {
    const boxes: Position[] = [];
    const targets: Position[] = [];
    for (let y = 0; y < this.grid.length; y++) {
      for (let x = 0; x < this.grid[y].length; x++) {
        const cell = this.grid[y][x];
        if (cell.box) boxes.push({ x, y });
        if (cell.target) targets.push({ x, y });
      }
    }
    return {
      grid: this.cloneGrid(this.grid),
      player: { ...this.player },
      boxes,
      targets,
      size: this.grid.length,
      stepLimit: this.stepLimit,
    };
  }
}

export function isValidSokobanLevel(level: SokobanLevel): boolean {
  if (level.boxes.length === 0 || level.targets.length === 0) return false;
  if (level.boxes.length !== level.targets.length) return false;
  const playerCell = level.grid[level.player.y]?.[level.player.x];
  if (!playerCell || playerCell.wall) return false;
  return true;
}
