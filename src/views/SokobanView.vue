<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useSokobanStore } from "@/stores/useSokobanStore";
import { useExitConfirm } from "@/composables/useExitConfirm";
import ExitConfirmDialog from "@/components/ExitConfirmDialog.vue";
import type { Direction, Position, SokobanCell } from "@/types";

const router = useRouter();
const { t } = useI18n();
const store = useSokobanStore();
const { open, requestExit, confirm, cancel } = useExitConfirm();

const victoryDialogOpen = ref(false);
const defeatDialogOpen = ref(false);
const animatingPos = ref<Position | null>(null);
const boardRef = ref<HTMLDivElement | null>(null);
const gridStyle = ref<Record<string, string>>({});

const BOARD_PADDING = 16;
const GAP = 1;
let resizeObserver: ResizeObserver | null = null;

const GAME_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "w",
  "a",
  "s",
  "d",
  "W",
  "A",
  "S",
  "D",
]);
const MOVE_COOLDOWN_MS = 80;
const pressedKeys = new Set<string>();
let lastMoveAt = 0;

const rows = computed(() => grid.value.length);

function updateGridSize() {
  const board = boardRef.value;
  if (!board || cols.value === 0 || rows.value === 0) return;

  const rect = board.getBoundingClientRect();
  const availW = rect.width - BOARD_PADDING * 2 - GAP * (cols.value - 1);
  const availH = rect.height - BOARD_PADDING * 2 - GAP * (rows.value - 1);

  const cellW = availW / cols.value;
  const cellH = availH / rows.value;
  const cellSize = Math.max(0, Math.floor(Math.min(cellW, cellH)));

  const gridW = cellSize * cols.value + GAP * (cols.value - 1);
  const gridH = cellSize * rows.value + GAP * (rows.value - 1);

  gridStyle.value = {
    gridTemplateColumns: `repeat(${cols.value}, 1fr)`,
    gridTemplateRows: `repeat(${rows.value}, 1fr)`,
    width: `${gridW}px`,
    height: `${gridH}px`,
  };
}

const isWon = computed(() => store.status === "won");
const isLost = computed(() => store.status === "lost");
const isGameActive = computed(() =>
  store.engine !== null && store.status === "playing"
);

watch(isWon, (won) => { victoryDialogOpen.value = won; });
watch(isLost, (lost) => { defeatDialogOpen.value = lost; });

const grid = computed(() => store.engine?.grid ?? []);

const flatCells = computed(() => {
  const cells: { x: number; y: number; cell: SokobanCell }[] = [];
  for (let y = 0; y < grid.value.length; y++) {
    for (let x = 0; x < grid.value[y].length; x++) {
      cells.push({ x, y, cell: grid.value[y][x] });
    }
  }
  return cells;
});

const cols = computed(() => grid.value[0]?.length ?? 0);

// Recompute grid size whenever the level (and therefore grid dimensions) changes.
watch([cols, rows], updateGridSize, { flush: "post" });

// Clear box animation state when advancing to a new level.
watch(() => store.currentLevel, () => {
  animatingPos.value = null;
});

function cellClasses(cell: SokobanCell, x: number, y: number): string[] {
  const classes = ["cell"];
  if (cell.wall) classes.push("wall");
  if (cell.target) classes.push("target");
  if (cell.box) classes.push("box");
  if (cell.player) classes.push("player");
  if (cell.box && cell.target) classes.push("box-on-target");
  if (animatingPos.value && animatingPos.value.x === x && animatingPos.value.y === y) {
    classes.push("just-pushed");
  }
  return classes;
}

function handleKeyDown(event: KeyboardEvent) {
  if (!store.engine) return;

  if (GAME_KEYS.has(event.key)) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (event.repeat) return;

  const keyMap: Record<string, Direction> = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    s: "down",
    a: "left",
    d: "right",
    W: "up",
    S: "down",
    A: "left",
    D: "right",
  };

  const dir = keyMap[event.key];
  if (!dir) return;

  // Only process when no other game key is held. This prevents accidental
  // diagonal / double moves when keys are pressed simultaneously or roll over.
  const hasOtherGameKey = Array.from(pressedKeys).some((k) => GAME_KEYS.has(k));
  if (hasOtherGameKey) return;

  const now = Date.now();
  if (now - lastMoveAt < MOVE_COOLDOWN_MS) return;
  lastMoveAt = now;

  pressedKeys.add(event.key);

  const result = store.move(dir);
  if (result.pushedTo) {
    animatingPos.value = result.pushedTo;
    if (result.won) {
      setTimeout(() => {
        animatingPos.value = null;
        store.completeLevel();
      }, 700);
    } else {
      setTimeout(() => {
        animatingPos.value = null;
      }, 500);
    }
  }
}

function handleKeyUp(event: KeyboardEvent) {
  pressedKeys.delete(event.key);
}

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  store.startAdventure(1);
  updateGridSize();
  resizeObserver = new ResizeObserver(() => {
    updateGridSize();
  });
  if (boardRef.value) {
    resizeObserver.observe(boardRef.value);
  }
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
  resizeObserver?.disconnect();
  resizeObserver = null;
  pressedKeys.clear();
  store.resetGame();
});

function reset() {
  store.resetLevel();
}

function backHome() {
  if (isGameActive.value) {
    requestExit("/", store.resetGame);
  } else {
    router.push("/");
  }
}

function nextLevel() {
  store.nextLevel();
}
</script>

<template>
  <div class="sokoban"
    >
    <div class="game-header"
      >
      <md-outlined-button class="back-btn" @click="backHome">{{ t("nav.back") }}</md-outlined-button>
      <h1 class="game-title">{{ t("sokoban.title") }}</h1>
      <div class="game-state"
        >
        <span>{{ t("sokoban.level", { level: store.currentLevel }) }}</span>
      </div>
    </div>

    <div class="game-layout"
      >
      <div class="game-board" ref="boardRef"
        >
        <div
          v-if="grid.length > 0"
          class="grid"
          :style="gridStyle"
        >
          <div
            v-for="{ x, y, cell } in flatCells"
            :key="`${x},${y}`"
            :class="cellClasses(cell, x, y)"
          >
            <span v-if="cell.box" class="box-emoji">📦</span>
            <span v-if="cell.player" class="player-emoji">😋</span>
          </div>
        </div>
        <div v-else class="empty-board"
          >{{ t("sokoban.title") }}</div>
      </div>

      <aside class="game-panel"
        >
        <div class="panel-card"
          >
          <div class="stats"
            >
            <div class="stat">{{ t("sokoban.steps", { used: store.stepsUsed, limit: store.stepLimit }) }}</div>
            <div class="stat">{{ t("sokoban.resets", { count: store.resetCountForLevel }) }}</div>
            <div class="stat">{{ t("sokoban.boxesOnTarget", { current: store.boxesOnTarget, total: store.totalTargets }) }}</div>
          </div>

          <div class="guide"
            >
            <div class="guide-title">{{ t("sokoban.controls") }}</div>
            <div class="guide-row"
              >
              <span class="key">↑/W</span>
              <span class="key">↓/S</span>
              <span class="key">←/A</span>
              <span class="key">→/D</span>
            </div>
            <div class="guide-hint">{{ t("sokoban.controlHint") }}</div>
          </div>

          <div class="legend"
            >
            <div class="legend-title">{{ t("sokoban.legend") }}</div>
            <div class="legend-items"
              >
              <div class="legend-item"
                >
                  <span class="legend-box wall"></span>
                  <span>{{ t("sokoban.wall") }}</span>
                </div>
              <div class="legend-item"
                >
                  <span class="legend-box target">X</span>
                  <span>{{ t("sokoban.target") }}</span>
                </div>
              <div class="legend-item"
                >
                  <span class="legend-box box">📦</span>
                  <span>{{ t("sokoban.box") }}</span>
                </div>
              <div class="legend-item"
                >
                  <span class="legend-box player">😋</span>
                  <span>{{ t("sokoban.player") }}</span>
                </div>
            </div>
          </div>

          <div class="actions"
            >
            <md-outlined-button @click="reset"
              >{{ t("sokoban.reset") }}</md-outlined-button>
          </div>
        </div>
      </aside>
    </div>

    <div v-if="victoryDialogOpen" class="modal-backdrop" @click.self="victoryDialogOpen = false"
      >
      <div class="modal"
        >
        <div class="modal-title">{{ t("sokoban.victory") }} 🎉</div>
        <div class="modal-content"
          >{{ t("sokoban.level", { level: store.currentLevel }) }}</div>
        <div class="modal-actions"
          >
          <button class="modal-btn secondary" @click="backHome">{{ t("nav.back") }}</button>
          <button class="modal-btn primary" @click="nextLevel">{{ t("sokoban.nextLevel") }}</button>
        </div>
      </div>
    </div>

    <div v-if="defeatDialogOpen" class="modal-backdrop" @click.self="defeatDialogOpen = false"
      >
      <div class="modal"
        >
        <div class="modal-title">{{ t("sokoban.defeat") }}</div>
        <div class="modal-content"
          >{{ t("sokoban.steps", { used: store.stepsUsed, limit: store.stepLimit }) }}</div>
        <div class="modal-actions"
          >
          <button class="modal-btn secondary" @click="backHome">{{ t("nav.back") }}</button>
          <button class="modal-btn primary" @click="reset">{{ t("sokoban.reset") }}</button>
        </div>
      </div>
    </div>

    <ExitConfirmDialog
      :open="open"
      :message="t('sokoban.forfeitConfirm')"
      @confirm="confirm"
      @cancel="cancel"
    />
  </div>
</template>

<style scoped>
.sokoban {
  flex: 1;
  min-height: 0;
  height: 0;
  display: flex;
  flex-direction: column;
}

.game-layout {
  flex: 1;
  min-height: 0;
  height: 0;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 16px;
}

.game-board {
  min-height: 0;
  height: 100%;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  background: var(--md-sys-color-surface-variant);
  border: 1px solid var(--md-sys-color-outline-variant);
  display: grid;
  place-items: center;
  padding: 16px;
}

.grid {
  display: grid;
  width: var(--grid-width, 100%);
  height: var(--grid-height, 100%);
  gap: 1px;
  background: #b0aead;
  border: 1px solid #b0aead;
  border-radius: 8px;
  overflow: hidden;
}

.cell {
  background: #fff8e7;
  display: grid;
  place-items: center;
  position: relative;
  user-select: none;
}

.cell.wall {
  background: #4a4a4a;
  box-shadow: inset 2px 2px 0 rgba(255, 255, 255, 0.15), inset -2px -2px 0 rgba(0, 0, 0, 0.3);
}

.cell.target::before {
  content: "";
  position: absolute;
  width: 60%;
  height: 60%;
  border-radius: 50%;
  border: 3px solid #00c853;
}

.cell.target::after {
  content: "X";
  position: absolute;
  color: #00c853;
  font-weight: 700;
  font-size: 0.875rem;
}

.box-emoji {
  font-size: clamp(16px, 5vmin, 48px);
  z-index: 1;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.player-emoji {
  font-size: clamp(18px, 5.5vmin, 52px);
  z-index: 2;
  filter: drop-shadow(0 0 8px rgba(41, 98, 255, 0.5));
}

.cell.box {
  background: #ffe0b2;
}

.cell.box-on-target {
  background: #b2dfdb;
}

.cell.just-pushed .box-emoji {
  display: inline-block;
  animation: box-pop 0.6s ease;
}

@keyframes box-pop {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.35);
    filter: drop-shadow(0 0 12px #00bfa5);
  }
  100% {
    transform: scale(1);
  }
}

.empty-board {
  color: var(--md-sys-color-on-surface-variant);
  font-size: 1rem;
}

.game-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  overflow-y: auto;
}

.panel-card {
  padding: 16px;
  border-radius: 16px;
  background: var(--md-sys-color-surface-variant);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat {
  font-size: 1rem;
  color: var(--md-sys-color-on-surface-variant);
}

.guide {
  padding: 12px;
  border-radius: 12px;
  background: var(--md-sys-color-surface);
}

.guide-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.guide-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  padding: 4px 8px;
  border-radius: 6px;
  background: var(--md-sys-color-surface-variant);
  border: 1px solid var(--md-sys-color-outline);
  font-size: 0.875rem;
  font-weight: 600;
}

.guide-hint {
  font-size: 0.875rem;
  color: var(--md-sys-color-on-surface-variant);
}

.legend {
  padding: 12px;
  border-radius: 12px;
  background: var(--md-sys-color-surface);
}

.legend-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.legend-items {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
}

.legend-box {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 4px;
  font-size: 14px;
}

.legend-box.wall {
  background: #4a4a4a;
}

.legend-box.target {
  border: 2px solid var(--md-sys-color-primary);
  color: var(--md-sys-color-primary);
  font-weight: 700;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: grid;
  place-items: center;
  z-index: 100;
  padding: 24px;
}

.modal {
  background: var(--md-sys-color-surface);
  border-radius: 24px;
  padding: 24px;
  min-width: 320px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--md-sys-color-on-surface);
}

.modal-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
  color: var(--md-sys-color-on-surface-variant);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.modal-btn {
  padding: 10px 20px;
  border-radius: 20px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.875rem;
  transition: opacity 0.2s;
}

.modal-btn:hover {
  opacity: 0.9;
}

.modal-btn.primary {
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
}

.modal-btn.secondary {
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}

@media (max-width: 900px) {
  .game-layout {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
  }
}
</style>
