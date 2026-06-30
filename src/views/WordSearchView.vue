<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAchievement } from "@/composables/useAchievement";
import { useExitConfirm } from "@/composables/useExitConfirm";
import ExitConfirmDialog from "@/components/ExitConfirmDialog.vue";
import {
  generateWordSearch,
  getLineCells,
  findWordByCells,
  allWordsFound,
  elapsedSeconds,
} from "@/games/wordsearch/WordSearchEngine";
import type { WordSearchCell, WordSearchState } from "@/games/wordsearch/types";

const router = useRouter();
const { t } = useI18n();
const { checkAndUnlock } = useAchievement();
const { open, requestExit, confirm, cancel } = useExitConfirm();

const state = ref<WordSearchState | null>(null);
const isDragging = ref(false);
const startCell = ref<WordSearchCell | null>(null);
const endCell = ref<WordSearchCell | null>(null);
const now = ref(Date.now());
const gridWrapper = ref<HTMLDivElement | null>(null);
let gridObserver: ResizeObserver | null = null;

let timer: ReturnType<typeof setInterval> | null = null;

function startTimer() {
  stopTimer();
  timer = setInterval(() => {
    now.value = Date.now();
    if (state.value && allWordsFound(state.value)) {
      stopTimer();
    }
  }, 1000);
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function newGame() {
  state.value = generateWordSearch({ size: 10, targetCount: 8 });
  startTimer();
}

function fitGrid() {
  const wrapper = gridWrapper.value;
  const grid = wrapper?.querySelector(".grid") as HTMLElement | null;
  if (!wrapper || !grid) return;
  const size = Math.floor(Math.min(420, wrapper.clientWidth, wrapper.clientHeight));
  grid.style.setProperty("--grid-size", `${size}px`);
}

function startGridObserver() {
  stopGridObserver();
  gridObserver = new ResizeObserver(() => fitGrid());
  if (gridWrapper.value) {
    gridObserver.observe(gridWrapper.value);
  }
}

function stopGridObserver() {
  gridObserver?.disconnect();
  gridObserver = null;
}

const selectedCells = computed(() => {
  if (!state.value || !startCell.value || !endCell.value) return [];
  const cells = getLineCells(startCell.value, endCell.value, state.value.grid);
  return cells ?? [];
});

const formattedTime = computed(() => {
  if (!state.value) return "0:00";
  const s = elapsedSeconds(state.value);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
});

function onPointerDown(cell: WordSearchCell) {
  if (!state.value) return;
  isDragging.value = true;
  startCell.value = cell;
  endCell.value = cell;
}

function onPointerEnter(cell: WordSearchCell) {
  if (!isDragging.value || !state.value) return;
  endCell.value = cell;
}

function onPointerUp() {
  if (!state.value || !startCell.value || !endCell.value) {
    isDragging.value = false;
    startCell.value = null;
    endCell.value = null;
    return;
  }

  const cells = getLineCells(startCell.value, endCell.value, state.value.grid);
  if (cells && cells.length >= 3) {
    const word = findWordByCells(cells, state.value.words);
    if (word) {
      word.found = true;
      for (const pos of word.positions) {
        state.value.grid[pos.row][pos.col].found = true;
      }

      if (allWordsFound(state.value)) {
        state.value.finishedAt = Date.now();
        stopTimer();
        const seconds = elapsedSeconds(state.value);
        checkAndUnlock("wordsearch-all-found", true);
        checkAndUnlock("wordsearch-speedy", seconds <= 60);
      }

      checkAndUnlock("wordsearch-long-word", word.text.length >= 6);
    }
  }

  isDragging.value = false;
  startCell.value = null;
  endCell.value = null;
}

function cellClass(cell: WordSearchCell): string {
  const base = "cell";
  const classes = [base];
  if (cell.found) classes.push("found");
  else if (selectedCells.value.some((c) => c.row === cell.row && c.col === cell.col)) {
    classes.push("selected");
  }
  return classes.join(" ");
}

function backHome() {
  if (state.value && !allWordsFound(state.value)) {
    requestExit("/", stopTimer);
  } else {
    stopTimer();
    router.push("/");
  }
}

onMounted(async () => {
  newGame();
  await nextTick();
  fitGrid();
  startGridObserver();
});

onUnmounted(() => {
  stopTimer();
  stopGridObserver();
});
</script>

<template>
  <div class="wordsearch" @pointerup="onPointerUp" @pointerleave="onPointerUp"
    >
    <div class="game-header"
      >
      <md-outlined-button class="back-btn" @click="backHome"
        >{{ t("nav.back") }}</md-outlined-button
      >
      <h1 class="game-title">{{ t("wordsearch.title") }}</h1>
      <div class="game-state"
        >
        <span v-if="state"
          >{{ state.words.filter((w) => w.found).length }} / {{ state.words.length }}</span
        >
      </div>
    </div>

    <div v-if="state" class="stats"
      >
      <div class="stat"
        >
        <span class="stat-label">{{ t("wordsearch.found") }}</span>
        <span class="stat-value"
          >{{ state.words.filter((w) => w.found).length }} / {{ state.words.length }}</span
        >
      </div>
      <div class="stat"
        >
        <span class="stat-label">{{ t("wordsearch.time") }}</span>
        <span class="stat-value">{{ formattedTime }}</span>
      </div>
    </div>

    <div v-if="state" class="word-list"
      >
      <span
        v-for="word in state.words"
        :key="word.id"
        class="word-chip"
        :class="{ found: word.found }"
        >{{ word.text }}</span
      >
    </div>

    <div v-if="state" ref="gridWrapper" class="grid-wrapper"
      >
      <div
        class="grid"
        :style="{ gridTemplateColumns: `repeat(${state.grid.length}, 1fr)` }"
        @pointerup.self="onPointerUp"
      >
        <div
          v-for="cell in state.grid.flat()"
          :key="`${cell.row}-${cell.col}`"
          :class="cellClass(cell)"
          @pointerdown.prevent="onPointerDown(cell)"
          @pointerenter="onPointerEnter(cell)"
        >
          {{ cell.letter }}
        </div>
      </div>
    </div>

    <div v-if="state" class="wordsearch-actions"
      >
      <md-text-button @click="newGame"
        >{{ t("wordsearch.newGame") }}</md-text-button
      >
    </div>

    <div v-if="state && allWordsFound(state)" class="victory"
      >
      <div class="victory-title">{{ t("wordsearch.victory") }}</div>
      <div class="victory-subtitle"
        >{{ t("wordsearch.victoryTime", { time: formattedTime }) }}</div
      >
    </div>

    <ExitConfirmDialog
      :open="open"
      :message="t('wordsearch.forfeitConfirm')"
      @confirm="confirm"
      @cancel="cancel"
    />
  </div>
</template>

<style scoped>
.wordsearch {
  flex: 1;
  min-height: 0;
  height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.wordsearch-actions {
  display: flex;
  justify-content: center;
}

.stats {
  display: flex;
  justify-content: center;
  gap: 24px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--md-sys-color-on-surface-variant);
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
}

.word-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.word-chip {
  padding: 6px 12px;
  border-radius: 16px;
  background: var(--md-sys-color-surface-variant);
  color: var(--md-sys-color-on-surface-variant);
  font-size: 0.875rem;
  font-weight: 500;
  transition: opacity 0.2s;
  user-select: none;
}

.word-chip.found {
  opacity: 0.5;
  text-decoration: line-through;
}

.grid-wrapper {
  flex: 1;
  min-height: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.grid {
  display: grid;
  gap: 4px;
  width: var(--grid-size, 420px);
  aspect-ratio: 1 / 1;
  user-select: none;
  touch-action: none;
}

.cell {
  display: grid;
  place-items: center;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  background: var(--md-sys-color-surface-variant);
  color: var(--md-sys-color-on-surface);
  font-weight: 600;
  font-size: clamp(0.875rem, 3.5vw, 1.25rem);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.cell.selected {
  background: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
}

.cell.found {
  background: var(--md-sys-color-tertiary-container);
  color: var(--md-sys-color-on-tertiary-container);
}

.victory {
  text-align: center;
  padding: 16px;
  border-radius: 16px;
  background: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
}

.victory-title {
  font-size: 1.25rem;
  font-weight: 700;
}

.victory-subtitle {
  font-size: 0.875rem;
  margin-top: 4px;
}
</style>
