<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAchievement } from "@/composables/useAchievement";
import { useExitConfirm } from "@/composables/useExitConfirm";
import ExitConfirmDialog from "@/components/ExitConfirmDialog.vue";
import {
  TypingEngine,
  DIFFICULTY_BASELINE_WPM,
  type TypingDifficulty,
} from "@/games/typing/TypingEngine";
import { extractRandomExcerpt } from "@/games/typing/passages";

const router = useRouter();
const { t } = useI18n();
const { checkAndUnlock } = useAchievement();
const { open, requestExit, confirm, cancel } = useExitConfirm();

const difficulties: TypingDifficulty[] = ["easy", "normal", "hard", "expert", "master"];

const engine = ref<TypingEngine | null>(null);
const now = ref(Date.now());
const selectedDifficulty = ref<TypingDifficulty | null>(null);
const cursorEl = ref<HTMLElement | null>(null);
let timerId: number | null = null;

const status = computed(() => engine.value?.status ?? "ready");
const stats = computed(() => engine.value?.getStats(now.value) ?? null);
const isFinished = computed(() => status.value === "finished");
const isDead = computed(() => status.value === "dead");
const isGameOver = computed(() => isFinished.value || isDead.value);

function startGame(difficulty: TypingDifficulty) {
  selectedDifficulty.value = difficulty;
  const passage = extractRandomExcerpt(200, 250, Math.random);
  const baseline = DIFFICULTY_BASELINE_WPM[difficulty];
  engine.value = new TypingEngine(passage, baseline);
  engine.value.start(Date.now());
  now.value = Date.now();
  startTimer();
  scrollToCursor();
}

function startTimer() {
  stopTimer();
  timerId = window.setInterval(() => {
    now.value = Date.now();
    engine.value?.tick(now.value);
    checkAchievements();
  }, 200);
}

function stopTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

function scrollToCursor() {
  nextTick(() => {
    cursorEl.value?.scrollIntoView({ block: "center", inline: "nearest" });
  });
}

watch(() => engine.value?.cursor, scrollToCursor);

function checkAchievements() {
  if (!engine.value) return;
  if (engine.value.status === "playing") {
    checkAndUnlock(
      "hatsune-disappearance",
      engine.value.hasTwentyCorrectWordsInTenSeconds()
    );
  } else if (engine.value.status === "finished") {
    checkAndUnlock("human-printer", !engine.value.everBelowBaseline);
    checkAndUnlock("indian-typist", engine.value.errorRate() > 0.5);
    checkAndUnlock(
      "hatsune-disappearance",
      engine.value.hasTwentyCorrectWordsInTenSeconds()
    );
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    if (engine.value?.status === "playing") {
      event.preventDefault();
      requestExit("/", forfeit);
    }
    return;
  }

  if (!engine.value) return;
  const e = engine.value;

  if (e.status !== "playing") return;

  if (event.key === "Backspace") {
    event.preventDefault();
    e.backspace();
    return;
  }

  if (event.key === " ") {
    event.preventDefault();
    e.input(" ", now.value);
    checkAchievements();
    return;
  }

  if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
    e.input(event.key, now.value);
    checkAchievements();
  }
}

function backHome() {
  if (engine.value?.status === "playing") {
    requestExit("/", forfeit);
  } else {
    router.push("/");
  }
}

function forfeit() {
  stopTimer();
  engine.value = null;
  selectedDifficulty.value = null;
}

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
  stopTimer();
});
</script>

<template>
  <div class="typing"
    >
    <div class="game-header"
      >
      <md-outlined-button class="back-btn" @click="backHome"
        >{{ t("nav.back") }}</md-outlined-button
      >
      <h1 class="game-title">{{ t("typing.title") }}</h1>
      <div class="game-state"
        >
        <span v-if="stats">{{ stats.wpm }} WPM</span>
      </div>
    </div>

    <div class="health-bar"
      >
      <div class="health-fill" :style="{ width: `${stats?.health ?? 100}%` }"
        ></div>
    </div>

    <div v-if="!engine" class="difficulty-card"
      >
      <div class="difficulty-title">{{ t("typing.chooseDifficulty") }}</div>
      <div class="difficulty-grid"
        >
        <button
          v-for="diff in difficulties"
          :key="diff"
          class="difficulty-btn"
          @click="startGame(diff)"
        >
          <span class="difficulty-name">{{ t(`typing.difficulty.${diff}`) }}</span>
          <span class="difficulty-wpm"
            >{{ DIFFICULTY_BASELINE_WPM[diff] }} WPM</span
          >
        </button>
      </div>
    </div>

    <template v-else
      >
      <div class="passage-card"
        >
        <div class="passage-title" v-if="engine.passage.title"
          >{{ engine.passage.title }}</div
        >
        <div class="passage-mask"
          >
          <div class="passage"
            >
            <span
              v-for="(c, i) in engine.chars"
              :key="i"
              :ref="(el) => { if (i === engine!.cursor) cursorEl = el as HTMLElement; }"
              :class="[
                'char',
                c.status,
                { cursor: i === engine.cursor },
              ]"
              >{{ c.char }}</span
            >
          </div>
        </div>
      </div>

      <div class="panel"
        >
        <div class="panel-stat" v-if="stats"
          >
          <span class="panel-label">{{ t("typing.accuracy") }}</span>
          <span class="panel-value">{{ stats.accuracy }}%</span>
        </div>
        <div class="panel-stat" v-if="stats"
          >
          <span class="panel-label">{{ t("typing.words") }}</span>
          <span class="panel-value"
            >{{ stats.correctWords }} / {{ stats.correctWords + stats.wrongWords }}</span
          >
        </div>
        <div class="panel-stat" v-if="stats"
          >
          <span class="panel-label">{{ t("typing.baseline") }}</span>
          <span class="panel-value"
            >{{ engine.baselineWpm }} WPM</span
          >
        </div>
      </div>
    </template>

    <div v-if="isGameOver" class="modal-backdrop"
      >
      <div class="modal"
        >
        <div class="modal-title"
          >{{ isFinished ? t("typing.victory") : t("typing.defeat") }}</div
        >
        <div class="modal-content"
          >
          <div v-if="stats"
            >
            <div>{{ t("typing.finalWpm", { wpm: stats.averageWpm }) }}</div>
            <div>{{ t("typing.finalAccuracy", { accuracy: stats.accuracy }) }}</div>
            <div>{{ t("typing.finalWords", { words: stats.correctWords + stats.wrongWords }) }}</div>
          </div>
        </div>
        <div class="modal-actions"
          >
          <button class="modal-btn secondary" @click="router.push('/')"
            >{{ t("nav.back") }}</button
          >
          <button class="modal-btn primary" @click="engine = null"
            >{{ t("typing.restart") }}</button
          >
        </div>
      </div>
    </div>

    <ExitConfirmDialog
      :open="open"
      :message="t('typing.forfeitConfirm')"
      @confirm="confirm"
      @cancel="cancel"
    />
  </div>
</template>

<style scoped>
.typing {
  flex: 1;
  min-height: 0;
  height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.health-bar {
  height: 8px;
  background: var(--md-sys-color-surface-variant);
  border-radius: 4px;
  overflow: hidden;
}

.health-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff5252, #ffab40, #69f0ae);
  transition: width 0.2s linear;
}

.difficulty-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: var(--md-sys-color-surface-variant);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid var(--md-sys-color-outline-variant);
}

.difficulty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
}

.difficulty-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  width: 100%;
  max-width: 480px;
}

@media (min-width: 600px) {
  .difficulty-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

.difficulty-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 12px;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 16px;
  background: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
}

.difficulty-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  background: var(--md-sys-color-primary-container);
}

.difficulty-name {
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
}

.difficulty-wpm {
  font-size: 0.75rem;
  color: var(--md-sys-color-on-surface-variant);
}

.passage-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: var(--md-sys-color-surface-variant);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid var(--md-sys-color-outline-variant);
}

.passage-title {
  font-size: 0.75rem;
  color: var(--md-sys-color-on-surface-variant);
  margin-bottom: 8px;
  font-style: italic;
  text-align: center;
}

.passage-mask {
  position: relative;
  height: calc(3 * 2.5rem);
  overflow: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 20%,
    black 80%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 20%,
    black 80%,
    transparent 100%
  );
}

.passage-mask::-webkit-scrollbar {
  display: none;
}

.passage {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 1.25rem;
  line-height: 2.5rem;
  color: var(--md-sys-color-on-surface);
  white-space: pre-wrap;
  word-break: break-word;
}

.char {
  position: relative;
  border-radius: 2px;
  transition: color 0.1s ease, background-color 0.1s ease;
}

.char.pending {
  color: var(--md-sys-color-on-surface-variant);
}

.char.correct {
  color: #2e7d32;
}

.char.incorrect {
  color: #c62828;
  background: rgba(198, 40, 40, 0.12);
}

.char.cursor::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2px;
  height: 3px;
  background: var(--md-sys-color-primary);
  border-radius: 2px;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

.panel {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.panel-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.panel-label {
  font-size: 0.75rem;
  color: var(--md-sys-color-on-surface-variant);
}

.panel-value {
  font-size: 1.25rem;
  font-weight: 600;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: grid;
  place-items: center;
  z-index: 100;
}

.modal {
  background: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  border-radius: 20px;
  padding: 24px;
  min-width: 320px;
  max-width: 90vw;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 12px;
}

.modal-content {
  margin-bottom: 20px;
  line-height: 1.6;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-btn {
  padding: 10px 20px;
  border-radius: 20px;
  border: none;
  font-weight: 600;
  cursor: pointer;
}

.modal-btn.primary {
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
}

.modal-btn.secondary {
  background: var(--md-sys-color-surface-variant);
  color: var(--md-sys-color-on-surface-variant);
}
</style>
