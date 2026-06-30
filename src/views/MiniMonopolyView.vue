<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAchievement } from "@/composables/useAchievement";
import { useExitConfirm } from "@/composables/useExitConfirm";
import ExitConfirmDialog from "@/components/ExitConfirmDialog.vue";
import {
  createMiniMonopolyState,
  startGame,
  restartGame,
  rollDice,
  buyProperty,
  upgradeProperty,
  skipPropertyAction,
  endTurn,
  aiTurn,
} from "@/games/minimonopoly/MiniMonopolyEngine";
import type {
  MiniMonopolyPlayer,
  MiniMonopolyState,
  MiniMonopolyTile,
} from "@/games/minimonopoly/types";

const router = useRouter();
const { t } = useI18n();
const { checkAndUnlock } = useAchievement();
const { open, requestExit, confirm, cancel } = useExitConfirm();

const state = ref<MiniMonopolyState | null>(null);
const playerCount = ref(2);
const setups = ref([
  { name: "", isAi: false },
  { name: "", isAi: false },
  { name: "", isAi: true },
  { name: "", isAi: true },
]);

const boardWrapper = ref<HTMLDivElement | null>(null);
let boardObserver: ResizeObserver | null = null;

const GRID_SIZE = 7;

function fitBoard() {
  const wrapper = boardWrapper.value;
  const board = wrapper?.querySelector(".board") as HTMLElement | null;
  if (!wrapper || !board) return;
  const size = Math.floor(Math.min(520, wrapper.clientWidth, wrapper.clientHeight));
  board.style.width = `${size}px`;
  board.style.height = `${size}px`;
}

function startBoardObserver() {
  stopBoardObserver();
  boardObserver = new ResizeObserver(() => fitBoard());
  if (boardWrapper.value) {
    boardObserver.observe(boardWrapper.value);
  }
}

function stopBoardObserver() {
  boardObserver?.disconnect();
  boardObserver = null;
}

function tilePosition(index: number) {
  if (index < 7) {
    return { gridRow: 1, gridColumn: index + 1 };
  }
  if (index < 12) {
    return { gridRow: index - 5, gridColumn: GRID_SIZE };
  }
  if (index < 19) {
    return { gridRow: GRID_SIZE, gridColumn: 19 - index };
  }
  return { gridRow: 25 - index, gridColumn: 1 };
}

function tileClass(tile: MiniMonopolyTile): string {
  const classes = ["tile", `tile-${tile.type}`];
  if (tile.property?.ownerId) classes.push("owned");
  return classes.join(" ");
}

function areaColor(tile: MiniMonopolyTile): string | undefined {
  if (tile.type === "property" && tile.property) {
    const areaIndex = ["areaRed", "areaBlue", "areaGreen", "areaYellow"].findIndex((a) =>
      tile.property!.area.endsWith(a)
    );
    return ["#ef5350", "#42a5f5", "#66bb6a", "#ffca28"][areaIndex] ?? undefined;
  }
  return undefined;
}

function currentPlayer(): MiniMonopolyPlayer | null {
  return state.value?.players[state.value.currentPlayerIndex] ?? null;
}

function playersOnTile(tileIndex: number): MiniMonopolyPlayer[] {
  return state.value?.players.filter((p) => !p.bankrupt && p.position === tileIndex) ?? [];
}

function start() {
  const selected = setups.value.slice(0, playerCount.value);
  state.value = createMiniMonopolyState(selected, 30);
  startGame(state.value);
  processAiTurns();
}

async function processAiTurns() {
  while (
    state.value?.status === "playing" &&
    currentPlayer()?.isAi &&
    !currentPlayer()?.bankrupt
  ) {
    await wait(800);
    state.value = aiTurn(state.value);
    checkAchievements();
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function onRoll() {
  if (!state.value) return;
  state.value = rollDice(state.value);
  checkAchievements();
  if (currentPlayer()?.isAi) processAiTurns();
}

function onBuy() {
  if (!state.value) return;
  state.value = buyProperty(state.value);
}

function onUpgrade() {
  if (!state.value) return;
  state.value = upgradeProperty(state.value);
  const upgraded = state.value.pendingUpgrade === null && state.value.logs[0]?.key === "minimonopoly.logUpgrade";
  if (upgraded) {
    const level = Number(state.value.logs[0]?.params.level ?? 0);
    checkAndUnlock("minimonopoly-max-level", level >= 3);
  }
}

function onSkip() {
  if (!state.value) return;
  state.value = skipPropertyAction(state.value);
}

async function onEndTurn() {
  if (!state.value) return;
  state.value = endTurn(state.value);
  checkAchievements();
  await nextTick();
  processAiTurns();
}

function checkAchievements() {
  if (!state.value) return;
  const player = currentPlayer();
  if (!player) return;
  const owned = state.value.tiles.filter(
    (t) => t.property?.ownerId === player.id
  ).length;
  checkAndUnlock("minimonopoly-landlord", owned >= 5);
  if (state.value.status === "finished") {
    const winner = state.value.players.reduce((a, b) => (a.money > b.money ? a : b));
    checkAndUnlock("minimonopoly-tycoon", winner.id === player.id);
  }
}

function onRestart() {
  if (!state.value) return;
  state.value = restartGame(state.value);
  startGame(state.value);
  processAiTurns();
}

function backHome() {
  if (state.value?.status === "playing") {
    requestExit("/");
  } else {
    router.push("/");
  }
}

onMounted(() => {
  state.value = createMiniMonopolyState(
    [
      { name: "", isAi: false },
      { name: "", isAi: false },
    ],
    30
  );
});

watch(
  () => state.value?.status,
  async (status) => {
    if (status && status !== "setup") {
      await nextTick();
      fitBoard();
      startBoardObserver();
    } else {
      stopBoardObserver();
    }
    if (status === "finished") {
      const winner = state.value!.players.reduce((a, b) => (a.money > b.money ? a : b));
      if (winner) checkAndUnlock("minimonopoly-tycoon", true);
    }
  }
);

onUnmounted(() => {
  stopBoardObserver();
});
</script>

<template>
  <div class="minimonopoly"
    >
    <div class="game-header"
      >
      <md-outlined-button class="back-btn" @click="backHome"
        >{{ t("nav.back") }}</md-outlined-button
      >
      <h1 class="game-title">{{ t("minimonopoly.title") }}</h1>
      <div class="game-state"
        >
        <span v-if="state?.status !== 'setup'" class="round-badge"
          >{{ t("minimonopoly.round", { round: state?.round, max: state?.maxRounds }) }}</span
        >
      </div>
    </div>

    <!-- Setup screen -->
    <div v-if="!state || state.status === 'setup'" class="setup"
      >
      <div class="setup-section"
        >
        <label>{{ t("minimonopoly.playerCount") }}</label>
        <div class="segmented"
          >
          <button
            v-for="n in [2, 3, 4]"
            :key="n"
            class="segment"
            :class="{ active: playerCount === n }"
            @click="playerCount = n"
            >{{ n }}</button
          >
        </div>
      </div>

      <div v-for="i in playerCount" :key="i" class="setup-section"
        >
        <md-outlined-text-field
          v-model="setups[i - 1].name"
          :label="t('minimonopoly.playerName', { n: i })"
        >
        </md-outlined-text-field>
        <div class="ai-toggle"
          >
          <span>{{ t("minimonopoly.ai") }}</span>
          <button
            class="switch"
            :class="{ on: setups[i - 1].isAi }"
            @click="setups[i - 1].isAi = !setups[i - 1].isAi"
          >
            <span class="thumb"></span>
          </button>
        </div>
      </div>

      <md-filled-button @click="start"
        >{{ t("minimonopoly.start") }}</md-filled-button
      >
    </div>

    <!-- Game board -->
    <div v-else class="game"
      >
      <div ref="boardWrapper" class="board-wrapper"
        >
        <div class="board"
          >
          <div
            v-for="tile in state.tiles"
            :key="tile.id"
            class="tile"
            :class="tileClass(tile)"
            :style="tilePosition(tile.id)"
          >
          <div v-if="tile.type === 'property'" class="tile-strip"
            :style="{ background: areaColor(tile) }"
          ></div>
          <div class="tile-content"
            >
              <span class="tile-icon">
                {{ tile.type === 'start' ? '⭐' : tile.type === 'jail' ? '🔒' : tile.type === 'tax' ? '💸' : tile.type === 'chance' ? '❓' : tile.type === 'park' ? '🅿️' : '' }}
              </span
            >
              <span class="tile-name"
                >
                  {{ tile.property ? t(tile.property.name) : t(`minimonopoly.tile${tile.type.charAt(0).toUpperCase() + tile.type.slice(1)}`) }}
                </span
              >
              <span v-if="tile.property" class="tile-price"
                >${{ tile.property.price }}</span
              >
          </div>
          <div class="tile-tokens"
            >
            <div
              v-for="p in playersOnTile(tile.id)"
              :key="p.id"
              class="token"
              :class="{ current: p.id === currentPlayer()?.id }"
              :style="{ background: p.color }"
              :title="p.name"
            ></div>
          </div>
        </div>

        <div class="center-panel"
          >
          <div v-if="state.status === 'finished'" class="winner"
            >
            <div class="winner-title">{{ t("minimonopoly.winner") }}</div>
            <div class="winner-name"
              >{{ state.players.reduce((a, b) => (a.money > b.money ? a : b)).name }}</div
            >
            <md-outlined-button @click="onRestart"
              >{{ t("minimonopoly.restart") }}</md-outlined-button
            >
          </div>

          <div v-else class="controls"
            >
            <div class="current-player"
              >
              <div
                class="player-dot"
                :style="{ background: currentPlayer()?.color }"
              ></div>
              <div class="player-info"
                >
                  <div class="player-name">{{ currentPlayer()?.name }}</div>
                  <div class="player-money">${{ currentPlayer()?.money }}</div
                >
              </div>
            </div>

            <div class="dice"
              >
              <span v-if="state.dice">{{ t("minimonopoly.dice", { n: state.dice }) }}</span>
              <span v-else>{{ t("minimonopoly.rollHint") }}</span>
            </div>

            <div v-if="state.lastCard" class="last-card"
              >{{ t(state.lastCard.key, state.lastCard.params) }}</div
            >

            <div class="actions"
              >
              <md-filled-button
                v-if="!currentPlayer()?.isAi && !currentPlayer()?.inJail"
                @click="onRoll"
                >{{ t("minimonopoly.roll") }}</md-filled-button
              >
              <md-outlined-button
                v-if="state.pendingBuy && !currentPlayer()?.isAi"
                @click="onBuy"
                >{{ t("minimonopoly.buy", { price: state.pendingBuy.property!.price }) }}</md-outlined-button
              >
              <md-outlined-button
                v-if="state.pendingUpgrade && !currentPlayer()?.isAi"
                @click="onUpgrade"
                >{{ t("minimonopoly.upgrade", { cost: state.pendingUpgrade.property!.upgradeCost }) }}</md-outlined-button
              >
              <md-text-button
                v-if="(state.pendingBuy || state.pendingUpgrade) && !currentPlayer()?.isAi"
                @click="onSkip"
                >{{ t("minimonopoly.skip") }}</md-text-button
              >
              <md-outlined-button
                v-if="!currentPlayer()?.isAi"
                @click="onEndTurn"
                >{{ t("minimonopoly.endTurn") }}</md-outlined-button
              >
            </div>
          </div>
        </div>
      </div>
      </div>

      <div class="side-panel"
        >
        <div class="players-list"
          >
          <div
            v-for="p in state.players"
            :key="p.id"
            class="player-row"
            :class="{ active: p.id === currentPlayer()?.id, bankrupt: p.bankrupt }"
          >
            <div class="row-dot" :style="{ background: p.color }"></div>
            <div class="row-name">{{ p.name }}</div>
            <div class="row-money">${{ p.money }}</div>
          </div>
        </div>

        <div class="logs"
          >
          <div
            v-for="entry in state.logs.slice(0, 8)"
            :key="entry.id"
            class="log-entry"
            >{{ t(entry.key, entry.params) }}</div
          >
        </div>
      </div>
    </div>

    <ExitConfirmDialog
      :open="open"
      :message="t('minimonopoly.forfeitConfirm')"
      @confirm="confirm"
      @cancel="cancel"
    />
  </div>
</template>

<style scoped>
.minimonopoly {
  flex: 1;
  min-height: 0;
  height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.round-badge {
  padding: 6px 12px;
  border-radius: 16px;
  background: var(--md-sys-color-surface-variant);
  font-weight: 600;
}

.setup {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 480px;
  margin: 0 auto;
  width: 100%;
}

.setup-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.segmented {
  display: flex;
  gap: 8px;
}

.segment {
  flex: 1;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid var(--md-sys-color-outline);
  background: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  cursor: pointer;
}

.segment.active {
  background: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
  border-color: var(--md-sys-color-primary);
}

.ai-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
}

.switch {
  width: 48px;
  height: 28px;
  border-radius: 14px;
  border: none;
  background: var(--md-sys-color-surface-variant);
  position: relative;
  cursor: pointer;
}

.switch.on {
  background: var(--md-sys-color-primary);
}

.thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--md-sys-color-on-primary);
  transition: transform 0.2s;
}

.switch.on .thumb {
  transform: translateX(20px);
}

.game {
  display: grid;
  grid-template-columns: 1fr 280px;
  grid-template-rows: 1fr;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

.board-wrapper {
  min-width: 0;
  min-height: 0;
  display: grid;
  place-items: center;
}

.board {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(7, 1fr);
  gap: 4px;
  max-width: 100%;
  max-height: 100%;
  flex-shrink: 0;
}

.tile {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--md-sys-color-surface-variant);
  overflow: hidden;
  min-width: 0;
  min-height: 0;
  padding: 2px;
}

.tile-start {
  background: var(--md-sys-color-primary-container);
}

.tile-jail {
  background: var(--md-sys-color-error-container);
}

.tile-park {
  background: var(--md-sys-color-secondary-container);
}

.tile-strip {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
}

.tile-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  text-align: center;
  z-index: 1;
}

.tile-icon {
  font-size: 1rem;
}

.tile-name {
  font-size: 0.625rem;
  font-weight: 600;
  line-height: 1.1;
  color: var(--md-sys-color-on-surface);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.tile-price {
  font-size: 0.625rem;
  color: var(--md-sys-color-on-surface-variant);
}

.tile-tokens {
  position: absolute;
  bottom: 2px;
  left: 2px;
  display: flex;
  gap: 2px;
  z-index: 2;
}

.token {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid var(--md-sys-color-outline);
}

.token.current {
  box-shadow: 0 0 0 2px var(--md-sys-color-primary);
}

.center-panel {
  grid-row: 3 / span 3;
  grid-column: 3 / span 3;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  overflow: auto;
}

.controls,
.winner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
  width: 100%;
}

.current-player {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-radius: 16px;
  background: var(--md-sys-color-surface-container);
}

.player-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.player-name {
  font-weight: 600;
}

.player-money {
  font-size: 0.875rem;
  color: var(--md-sys-color-on-surface-variant);
}

.dice {
  font-size: 1.25rem;
  font-weight: 700;
}

.last-card {
  padding: 8px 12px;
  border-radius: 12px;
  background: var(--md-sys-color-tertiary-container);
  color: var(--md-sys-color-on-tertiary-container);
  font-size: 0.875rem;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.winner-title {
  font-size: 1.5rem;
  font-weight: 700;
}

.winner-name {
  font-size: 1.25rem;
  color: var(--md-sys-color-primary);
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: auto;
  padding: 16px;
  border-radius: 16px;
  background: var(--md-sys-color-surface-variant);
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.player-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 12px;
  background: var(--md-sys-color-surface-variant);
}

.player-row.active {
  outline: 2px solid var(--md-sys-color-primary);
}

.player-row.bankrupt {
  opacity: 0.5;
}

.row-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.row-name {
  flex: 1;
  font-weight: 500;
}

.row-money {
  font-weight: 600;
}

.logs {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--md-sys-color-on-surface-variant);
}

.log-entry {
  padding: 4px 8px;
  border-radius: 8px;
  background: var(--md-sys-color-surface-container);
}

@media (max-width: 860px) {
  .game {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
  }

  .board {
    max-width: 100%;
  }
}
</style>
