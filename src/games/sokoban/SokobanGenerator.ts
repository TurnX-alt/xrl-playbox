import type { Position, SokobanGrid } from "@/types";
import { SokobanEngine, type SokobanLevel } from "./SokobanEngine";

interface GenState {
  grid: SokobanGrid;
  player: Position;
  boxes: Position[];
}

const DIRECTIONS: Position[] = [
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
];

export function calculateDifficulty(level: number): {
  size: number;
  boxCount: number;
  reverseDepth: number;
  stepLimit: number;
} {
  const size = Math.min(8 + Math.floor(level / 3), 16);
  const boxCount = Math.min(1 + Math.floor(level / 2), 8);
  const reverseDepth = 30 + level * 8;
  const baseSteps = 40 + boxCount * 16;
  const stepLimit = Math.max(baseSteps - level * 2, boxCount * 10 + 30);
  return { size, boxCount, reverseDepth, stepLimit };
}

function cloneGrid(grid: SokobanGrid): SokobanGrid {
  return grid.map((row) => row.map((cell) => ({ ...cell })));
}

function inBounds(pos: Position, size: number): boolean {
  return pos.x >= 0 && pos.y >= 0 && pos.x < size && pos.y < size;
}

function posKey(pos: Position): string {
  return `${pos.x},${pos.y}`;
}

function stateKey(state: GenState): string {
  const boxes = [...state.boxes]
    .sort((a, b) => (a.y - b.y) * 100 + (a.x - b.x))
    .map(posKey)
    .join(";");
  return `${posKey(state.player)}|${boxes}`;
}

function createEmptyGrid(size: number): SokobanGrid {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({
      wall: false,
      target: false,
      box: false,
      player: false,
    }))
  );
}

function addBorderWalls(grid: SokobanGrid, size: number) {
  for (let x = 0; x < size; x++) {
    grid[0][x].wall = true;
    grid[size - 1][x].wall = true;
  }
  for (let y = 0; y < size; y++) {
    grid[y][0].wall = true;
    grid[y][size - 1].wall = true;
  }
}

function openNeighbors(grid: SokobanGrid, pos: Position, size: number): Position[] {
  const neighbors: Position[] = [];
  for (const dir of DIRECTIONS) {
    const n = { x: pos.x + dir.x, y: pos.y + dir.y };
    if (inBounds(n, size) && !grid[n.y][n.x].wall) neighbors.push(n);
  }
  return neighbors;
}

function addInternalWalls(grid: SokobanGrid, size: number, level: number) {
  const center = Math.floor(size / 2);
  const protectedRadius = 3;

  // Number of wall blocks scales with level
  const wallCount = Math.min(4 + Math.floor(level / 2), Math.floor((size - 2) * (size - 2) * 0.18));

  let placed = 0;
  let attempts = 0;
  while (placed < wallCount && attempts < 200) {
    attempts++;
    const x = 1 + Math.floor(Math.random() * (size - 2));
    const y = 1 + Math.floor(Math.random() * (size - 2));

    // Protect central area for initial box placement
    if (Math.abs(x - center) < protectedRadius && Math.abs(y - center) < protectedRadius) continue;

    if (grid[y][x].wall) continue;

    // Try placing a small wall block (1x1 or 2x1 or 1x2)
    const blockType = Math.random();
    const cells: Position[] = [{ x, y }];
    if (blockType > 0.6 && x + 1 < size - 1) cells.push({ x: x + 1, y });
    else if (blockType > 0.3 && y + 1 < size - 1) cells.push({ x, y: y + 1 });

    // Don't block protected center
    if (cells.some((c) => Math.abs(c.x - center) < protectedRadius && Math.abs(c.y - center) < protectedRadius)) continue;

    // Temporarily place and check connectivity
    for (const c of cells) grid[c.y][c.x].wall = true;
    const connected = isFullyConnected(grid, size, { x: center, y: center });
    if (connected) {
      placed++;
    } else {
      for (const c of cells) grid[c.y][c.x].wall = false;
    }
  }
}

function isFullyConnected(grid: SokobanGrid, size: number, start: Position): boolean {
  const openCount = grid.flat().filter((c) => !c.wall).length;
  const visited = new Set<string>();
  const queue: Position[] = [start];
  if (grid[start.y][start.x].wall) return false;
  visited.add(posKey(start));

  while (queue.length > 0) {
    const pos = queue.shift()!;
    for (const dir of DIRECTIONS) {
      const next = { x: pos.x + dir.x, y: pos.y + dir.y };
      if (!inBounds(next, size)) continue;
      if (grid[next.y][next.x].wall) continue;
      const key = posKey(next);
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push(next);
    }
  }

  return visited.size === openCount;
}

function findDeadEnds(grid: SokobanGrid, size: number): Position[] {
  const deadEnds: Position[] = [];
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      if (grid[y][x].wall) continue;
      const neighbors = openNeighbors(grid, { x, y }, size);
      if (neighbors.length === 1) deadEnds.push({ x, y });
    }
  }
  return deadEnds;
}

function findOpenCells(grid: SokobanGrid, size: number): Position[] {
  const cells: Position[] = [];
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      if (!grid[y][x].wall) cells.push({ x, y });
    }
  }
  return cells;
}

function selectTargets(grid: SokobanGrid, size: number, boxCount: number): Position[] | null {
  const deadEnds = findDeadEnds(grid, size);
  // Prefer dead ends, but fall back to open cells
  const candidates = deadEnds.length >= boxCount ? deadEnds : findOpenCells(grid, size);
  if (candidates.length < boxCount) return null;

  // Shuffle candidates
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  const targets: Position[] = [];

  for (const pos of shuffled) {
    // Ensure targets aren't too close to each other
    const tooClose = targets.some((t) => Math.abs(t.x - pos.x) + Math.abs(t.y - pos.y) < 2);
    if (tooClose) continue;
    targets.push(pos);
    if (targets.length === boxCount) break;
  }

  if (targets.length < boxCount) {
    // Fill remaining with any candidates
    for (const pos of shuffled) {
      if (!targets.some((t) => t.x === pos.x && t.y === pos.y)) {
        targets.push(pos);
        if (targets.length === boxCount) break;
      }
    }
  }

  return targets.length === boxCount ? targets : null;
}

function placePlayerForSolved(grid: SokobanGrid, boxes: Position[], size: number): Position | null {
  // Player should be adjacent to first box, in a valid pull position
  const firstBox = boxes[0];
  for (const dir of DIRECTIONS) {
    const playerPos = { x: firstBox.x - dir.x, y: firstBox.y - dir.y };
    if (inBounds(playerPos, size) && !grid[playerPos.y][playerPos.x].wall && !grid[playerPos.y][playerPos.x].box) {
      return playerPos;
    }
  }
  return null;
}

function getReverseMoves(state: GenState, size: number): GenState[] {
  const moves: GenState[] = [];

  // Walk moves (no pull)
  for (const dir of DIRECTIONS) {
    const next = { x: state.player.x + dir.x, y: state.player.y + dir.y };
    if (!inBounds(next, size)) continue;
    const nextCell = state.grid[next.y][next.x];
    if (nextCell.wall || nextCell.box) continue;

    const newGrid = cloneGrid(state.grid);
    newGrid[state.player.y][state.player.x].player = false;
    newGrid[next.y][next.x].player = true;
    moves.push({ grid: newGrid, player: next, boxes: state.boxes });
  }

  // Pull moves (reverse push)
  for (const dir of DIRECTIONS) {
    const boxPos = { x: state.player.x + dir.x, y: state.player.y + dir.y };
    if (!inBounds(boxPos, size)) continue;
    const boxCell = state.grid[boxPos.y][boxPos.x];
    if (!boxCell.box) continue;

    const pullDest = { x: state.player.x - dir.x, y: state.player.y - dir.y };
    if (!inBounds(pullDest, size)) continue;
    const destCell = state.grid[pullDest.y][pullDest.x];
    if (destCell.wall || destCell.box) continue;

    const newGrid = cloneGrid(state.grid);
    newGrid[boxPos.y][boxPos.x].box = false;
    newGrid[state.player.y][state.player.x].box = true;
    newGrid[state.player.y][state.player.x].player = false;
    newGrid[pullDest.y][pullDest.x].player = true;

    const newBoxes = state.boxes
      .filter((b) => b.x !== boxPos.x || b.y !== boxPos.y)
      .concat({ x: state.player.x, y: state.player.y });

    moves.push({ grid: newGrid, player: pullDest, boxes: newBoxes });
  }

  return moves;
}

function boxSetsEqual(a: Position[], b: Position[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((a, b) => (a.y - b.y) * 100 + (a.x - b.x));
  const sb = [...b].sort((a, b) => (a.y - b.y) * 100 + (a.x - b.x));
  return sa.every((p, i) => p.x === sb[i].x && p.y === sb[i].y);
}

function reversePlay(initial: GenState, size: number, depth: number, boxCount: number): GenState | null {
  const history = new Set<string>([stateKey(initial)]);
  let current = initial;
  let pullCount = 0;

  for (let i = 0; i < depth; i++) {
    const moves = getReverseMoves(current, size);
    if (moves.length === 0) break;
    const validMoves = moves.filter((m) => !history.has(stateKey(m)));
    const candidates = validMoves.length > 0 ? validMoves : moves;

    // Prefer pull moves, especially until every box has been moved at least once
    const pullMoves = candidates.filter((m) => !boxSetsEqual(m.boxes, current.boxes));
    const choosePull = pullCount < boxCount && pullMoves.length > 0;
    const pool = choosePull ? pullMoves : candidates;
    const previousBoxes = current.boxes;
    current = pool[Math.floor(Math.random() * pool.length)];

    if (!boxSetsEqual(current.boxes, previousBoxes)) {
      pullCount++;
    }

    history.add(stateKey(current));
  }

  // Reject levels where any box is still sitting on a target
  for (const box of current.boxes) {
    if (current.grid[box.y][box.x].target) return null;
  }

  return current;
}

export function generateLevel(level: number): SokobanLevel {
  const { size, boxCount, reverseDepth, stepLimit } = calculateDifficulty(level);

  for (let attempt = 0; attempt < 80; attempt++) {
    const grid = createEmptyGrid(size);
    addBorderWalls(grid, size);
    addInternalWalls(grid, size, level);

    const targets = selectTargets(grid, size, boxCount);
    if (!targets) continue;

    // Place boxes on targets for initial solved state
    for (const t of targets) {
      grid[t.y][t.x].box = true;
      grid[t.y][t.x].target = true;
    }

    const player = placePlayerForSolved(grid, targets, size);
    if (!player) continue;
    grid[player.y][player.x].player = true;

    const initialState: GenState = {
      grid: cloneGrid(grid),
      player,
      boxes: targets.map((t) => ({ ...t })),
    };

    const scrambled = reversePlay(initialState, size, reverseDepth, boxCount);
    if (!scrambled) continue;

    // Build final level
    const finalGrid = createEmptyGrid(size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const src = scrambled.grid[y][x];
        finalGrid[y][x] = {
          wall: src.wall,
          target: src.target,
          box: src.box,
          player: false,
        };
      }
    }

    // Ensure player cell is clear of box/target
    const playerCell = finalGrid[scrambled.player.y][scrambled.player.x];
    playerCell.player = true;
    playerCell.box = false;
    playerCell.target = false;

    const boxes: Position[] = [];
    const finalTargets: Position[] = [];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const cell = finalGrid[y][x];
        if (cell.box) boxes.push({ x, y });
        if (cell.target) finalTargets.push({ x, y });
      }
    }

    const levelData: SokobanLevel = {
      grid: finalGrid,
      player: { ...scrambled.player },
      boxes,
      targets: finalTargets,
      size,
      stepLimit,
    };

    if (isSolvable(levelData)) {
      return levelData;
    }
  }

  return createFallbackLevel(size, boxCount, stepLimit);
}

function createFallbackLevel(size: number, boxCount: number, stepLimit: number): SokobanLevel {
  const grid = createEmptyGrid(size);
  addBorderWalls(grid, size);
  const boxes: Position[] = [];
  const targets: Position[] = [];
  const startX = 2;
  const startY = 2;

  for (let i = 0; i < boxCount; i++) {
    const x = startX + i * 2;
    const y = startY;
    grid[y][x].box = true;
    grid[y][x + 1].target = true;
    boxes.push({ x, y });
    targets.push({ x: x + 1, y });
  }

  const player = { x: startX, y: startY + 1 };
  grid[player.y][player.x].player = true;

  return { grid, player, boxes, targets, size, stepLimit };
}

// Bounded BFS solver that searches push sequences
export function isSolvable(level: SokobanLevel, maxPushes = 120): boolean {
  const engine = SokobanEngine.fromLevel(level);
  const initialBoxes = engine.grid
    .flatMap((row, y) => row.map((cell, x) => (cell.box ? { x, y } : null)))
    .filter(Boolean) as Position[];
  const targets = new Set(
    engine.grid
      .flatMap((row, y) => row.map((cell, x) => (cell.target ? `${x},${y}` : null)))
      .filter(Boolean) as string[]
  );

  const initialKey = `${posKey(engine.player)}|${initialBoxes.map(posKey).sort().join(";")}`;
  const visited = new Set<string>([initialKey]);
  const queue: { player: Position; boxes: Position[]; pushes: number }[] = [
    { player: engine.player, boxes: initialBoxes, pushes: 0 },
  ];

  while (queue.length > 0) {
    const { player, boxes, pushes } = queue.shift()!;

    if (boxes.every((b) => targets.has(posKey(b)))) return true;
    if (pushes >= maxPushes) continue;

    const reachable = computeReachable(player, boxes, level);

    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      for (const dir of DIRECTIONS) {
        const playerSide = { x: box.x - dir.x, y: box.y - dir.y };
        const boxDest = { x: box.x + dir.x, y: box.y + dir.y };

        if (!reachable.has(posKey(playerSide))) continue;
        if (!inBounds(boxDest, level.size)) continue;
        if (level.grid[boxDest.y][boxDest.x].wall) continue;
        if (boxes.some((b, idx) => idx !== i && b.x === boxDest.x && b.y === boxDest.y)) continue;

        const newBoxes = boxes.map((b, idx) => (idx === i ? boxDest : b));
        const newPlayer = { x: box.x, y: box.y };
        const newKey = `${posKey(newPlayer)}|${newBoxes.map(posKey).sort().join(";")}`;

        if (visited.has(newKey)) continue;
        visited.add(newKey);
        queue.push({ player: newPlayer, boxes: newBoxes, pushes: pushes + 1 });
      }
    }
  }

  return false;
}

function computeReachable(
  player: Position,
  boxes: Position[],
  level: SokobanLevel
): Set<string> {
  const boxSet = new Set(boxes.map(posKey));
  const reachable = new Set<string>([posKey(player)]);
  const queue: Position[] = [player];

  while (queue.length > 0) {
    const pos = queue.shift()!;
    for (const dir of DIRECTIONS) {
      const next = { x: pos.x + dir.x, y: pos.y + dir.y };
      if (!inBounds(next, level.size)) continue;
      if (level.grid[next.y][next.x].wall) continue;
      if (boxSet.has(posKey(next))) continue;
      const key = posKey(next);
      if (reachable.has(key)) continue;
      reachable.add(key);
      queue.push(next);
    }
  }

  return reachable;
}
