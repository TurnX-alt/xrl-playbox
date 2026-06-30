<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useDealStore } from "@/stores/useDealStore";
import { useExitConfirm } from "@/composables/useExitConfirm";
import ExitConfirmDialog from "@/components/ExitConfirmDialog.vue";
import { getEliminationCountForRound } from "@/games/deal/DealBanker";
import { DEAL_AMOUNTS } from "@/games/deal/DealEngine";
import type { DealBriefcase } from "@/types";

const router = useRouter();
const { t } = useI18n();
const store = useDealStore();
const { open, requestExit, confirm, cancel } = useExitConfirm();

const showFinished = ref(false);
const boardRef = ref<HTMLDivElement | null>(null);
const gridStyle = ref<Record<string, string>>({});

const BOARD_PADDING = 12;
let resizeObserver: ResizeObserver | null = null;

function updateGridSize() {
  const board = boardRef.value;
  if (!board) return;

  const rect = board.getBoundingClientRect();
  const minDim = Math.min(rect.width, rect.height);
  const gap = Math.min(Math.max(3, minDim * 0.012), 8);

  const availW = rect.width - BOARD_PADDING * 2 - gap * 4;
  const availH = rect.height - BOARD_PADDING * 2 - gap * 5;

  const cellW = availW / 5;
  const cellH = availH / 6;
  const cellSize = Math.max(0, Math.min(cellW, cellH));

  const gridW = cellSize * 5 + gap * 4;
  const gridH = cellSize * 6 + gap * 5;

  gridStyle.value = {
    width: `${gridW}px`,
    height: `${gridH}px`,
    gap: `${gap}px`,
  };
}

const state = computed(() => store.state);
const phase = computed(() => state.value?.phase ?? "select-own");
const isFinished = computed(() => phase.value === "finished" || phase.value === "reveal");

watch(isFinished, (finished) => {
  showFinished.value = finished;
});

onMounted(() => {
  store.startGame();
  updateGridSize();
  resizeObserver = new ResizeObserver(() => {
    updateGridSize();
  });
  if (boardRef.value) {
    resizeObserver.observe(boardRef.value);
  }
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
});

function handleCaseClick(id: number) {
  if (!store.engine) return;
  if (phase.value === "select-own") {
    store.selectOwn(id);
  } else if (phase.value === "eliminate") {
    store.eliminate(id);
  }
}

function acceptDeal() {
  store.acceptDeal();
}

function rejectDeal() {
  store.rejectDeal();
}

function proceedToDecide() {
  store.proceedToDecide();
}

function backHome() {
  if (store.isGameActive) {
    requestExit("/", store.resetGame);
  } else {
    router.push("/");
  }
}

function newGame() {
  showFinished.value = false;
  store.startGame();
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: amount < 1 ? 2 : 0,
  }).format(amount);
}

function isOwnCase(bc: DealBriefcase): boolean {
  return state.value ? state.value.ownBriefcaseId === bc.id : false;
}

const eliminationNeeded = computed(() => {
  if (!state.value) return 0;
  return getEliminationCountForRound(state.value.round);
});

const remainingToEliminate = computed(() => {
  if (!state.value) return 0;
  return eliminationNeeded.value - state.value.eliminatedThisRound;
});

const amountBoard = computed(() => {
  if (!state.value) return { low: [], high: [] };
  const eliminated = new Set(state.value.briefcases.filter((b) => b.eliminated).map((b) => b.amount));
  const sorted = [...DEAL_AMOUNTS].sort((a, b) => a - b);
  const mid = Math.ceil(sorted.length / 2);
  const low = sorted.slice(0, mid).map((amount) => ({ amount, eliminated: eliminated.has(amount) }));
  const high = sorted.slice(mid).map((amount) => ({ amount, eliminated: eliminated.has(amount) }));
  return { low, high };
});
</script>

<template>
  <div class="deal"
    >
    <div class="game-header"
      >
      <md-outlined-button class="back-btn" @click="backHome"
        >{{ t("nav.back") }}
      </md-outlined-button>
      <h1 class="game-title"
        >{{ t("deal.title") }}
      </h1>
      <div class="game-state"
        >
        <span v-if="state"
          >{{ t("deal.round", { round: state.round }) }}
        </span>
      </div>
    </div>

    <div class="game-layout"
      >
      <aside class="amount-side"
        >
        <div class="amount-title"
          >{{ t("deal.amountBoard") }}</div>
        <div class="amount-list"
          >
          <div
            v-for="item in amountBoard.low"
            :key="item.amount"
            class="amount-item"
            :class="{ eliminated: item.eliminated }"
          >
            {{ formatMoney(item.amount) }}
          </div>
        </div>
      </aside>

      <div class="game-board" ref="boardRef"
        >
        <div v-if="state" class="case-grid" :style="gridStyle"
          >
          <button
            v-for="bc in state.briefcases"
            :key="bc.id"
            class="case"
            :class="{
              eliminated: bc.eliminated,
              own: isOwnCase(bc),
            }"
            :disabled="bc.eliminated || isOwnCase(bc)"
            @click="handleCaseClick(bc.id)"
          >
            <span v-if="bc.eliminated" class="case-amount"
              >{{ formatMoney(bc.amount) }}</span>
            <span v-else class="case-number">{{ bc.id }}</span>
            <span v-if="isOwnCase(bc)" class="case-badge"
              >★</span>
          </button>
        </div>
        <div v-else class="empty-board"
          >{{ t("deal.title") }}</div>
      </div>

      <aside class="amount-side"
        >
        <div class="amount-title"
          >{{ t("deal.amountBoard") }}</div>
        <div class="amount-list"
          >
          <div
            v-for="item in amountBoard.high"
            :key="item.amount"
            class="amount-item"
            :class="{ eliminated: item.eliminated }"
          >
            {{ formatMoney(item.amount) }}
          </div>
        </div>
      </aside>

      <aside class="game-panel"
        >
        <div class="panel-card"
          >
          <div v-if="state" class="status"
            >
            <div v-if="phase === 'select-own'" class="phase-text"
              >{{ t("deal.selectOwn") }}</div>
            <div v-else-if="phase === 'eliminate'" class="phase-text"
              >
              {{ t("deal.eliminate", { count: remainingToEliminate, round: state.round }) }}
            </div>
            <div v-else-if="phase === 'banker-offer'" class="phase-text"
              >{{ t("deal.bankerOffer") }}: {{ formatMoney(state.lastOffer ?? 0) }}</div>
            <div v-else-if="phase === 'decide'" class="phase-text"
              >{{ t("deal.bankerOffer") }}: {{ formatMoney(state.lastOffer ?? 0) }}</div>
            <div v-else-if="phase === 'finished'" class="phase-text"
              >{{ t("deal.result") }}: {{ formatMoney(state.finalAmounts.player1) }}</div>
          </div>

          <div v-if="phase === 'banker-offer'" class="actions"
            >
            <md-filled-button @click="proceedToDecide"
              >{{ t("common.continue") }}</md-filled-button>
          </div>

          <div v-if="phase === 'decide'" class="actions"
            >
            <md-filled-button @click="acceptDeal"
              >{{ t("deal.deal") }}</md-filled-button>
            <md-outlined-button @click="rejectDeal"
              >{{ t("deal.noDeal") }}</md-outlined-button>
          </div>

          <div v-if="state && state.history.length > 0" class="history"
            >
            <div class="history-title"
              >{{ t("deal.history") }}</div>
            <div v-for="h in state.history" :key="h.round" class="history-item"
              >
              <span>{{ t("deal.round", { round: h.round }) }}</span>
              <span>{{ formatMoney(h.offer ?? 0) }}</span>
              <span>{{ h.decision === 'no-deal' ? 'NO DEAL' : '' }}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <div v-if="showFinished" class="modal-backdrop" @click.self="showFinished = false"
      >
      <div class="modal"
        >
        <div class="modal-title">{{ t("deal.finalReveal") }}</div>
        <div class="modal-content result-dialog"
          >
          <div class="result-amount"
            >{{ formatMoney(state?.finalAmounts.player1 ?? 0) }}</div>
        </div>
        <div class="modal-actions"
          >
          <button class="modal-btn secondary" @click="backHome"
            >{{ t("nav.back") }}</button>
          <button class="modal-btn primary" @click="newGame"
            >{{ t("games.play") }}</button>
        </div>
      </div>
    </div>

    <ExitConfirmDialog
      :open="open"
      :message="t('deal.forfeitConfirm')"
      @confirm="confirm"
      @cancel="cancel"
    />
  </div>
</template>

<style scoped>
.deal {
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
  grid-template-columns: auto 1fr auto 320px;
  grid-template-rows: 1fr;
  gap: 16px;
}

.game-board,
.amount-side,
.game-panel {
  min-height: 0;
}

.game-board {
  height: 100%;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  background: var(--md-sys-color-surface-variant);
  border: 1px solid var(--md-sys-color-outline-variant);
  display: grid;
  place-items: center;
  padding: 12px;
}

.case-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: repeat(6, 1fr);
  gap: var(--grid-gap, 4px);
  width: var(--grid-width, 100%);
  height: var(--grid-height, 100%);
  justify-self: center;
  align-self: center;
}

.case {
  border: none;
  border-radius: 12px;
  background: #7d5260;
  color: #ffffff;
  display: grid;
  place-items: center;
  position: relative;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.case:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.03);
}

.case:disabled {
  cursor: default;
}

.case.eliminated {
  background: var(--md-sys-color-surface-variant);
  color: var(--md-sys-color-on-surface-variant);
}

.case.own {
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  box-shadow: inset 0 0 0 3px #ffd700;
}

.case-number {
  font-size: clamp(14px, 3.5vmin, 28px);
  font-weight: 700;
}

.case-amount {
  font-size: clamp(9px, 1.8vmin, 14px);
  font-weight: 700;
  text-align: center;
  padding: 2px;
  word-break: break-all;
}

.case-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 14px;
  color: #ffd700;
}

.empty-board {
  color: var(--md-sys-color-on-surface-variant);
  font-size: 1rem;
}

.amount-side {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  overflow-y: auto;
  width: 86px;
  padding: 12px;
  border-radius: 16px;
  background: var(--md-sys-color-surface-variant);
}

.amount-title {
  font-weight: 600;
  font-size: 0.75rem;
  color: var(--md-sys-color-on-surface-variant);
  text-align: center;
}

.amount-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.amount-item {
  padding: 3px 4px;
  border-radius: 6px;
  background: var(--md-sys-color-surface);
  font-size: 0.7rem;
  font-weight: 600;
  text-align: center;
  color: var(--md-sys-color-on-surface);
  white-space: nowrap;
}

.amount-item.eliminated {
  opacity: 0.35;
  text-decoration: line-through;
  background: transparent;
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

.status {
  font-size: 1rem;
}

.phase-text {
  font-weight: 500;
  color: var(--md-sys-color-on-surface);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history {
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-title {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--md-sys-color-on-surface-variant);
}

.history-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.result-dialog {
  text-align: center;
  min-width: 240px;
}

.result-amount {
  font-size: 2rem;
  font-weight: 700;
  color: var(--md-sys-color-primary);
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
    grid-template-rows: auto 1fr auto;
  }

  .game-board {
    padding: 8px;
  }

  .amount-side {
    flex-direction: row;
    width: 100%;
    overflow-x: hidden;
    overflow-y: hidden;
  }

  .amount-list {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .amount-item {
    flex: 1 1 auto;
    min-width: 72px;
  }

  .game-panel {
    max-height: 35vh;
  }
}
</style>
