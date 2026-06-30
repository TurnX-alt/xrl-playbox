<script setup lang="ts">
import { ref, computed, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useExitConfirm } from "@/composables/useExitConfirm";
import ExitConfirmDialog from "@/components/ExitConfirmDialog.vue";
import {
  TESTS,
  scoreTest,
} from "@/games/selftest/tests";
import type {
  TestType,
  TestDefinition,
  MBTIResult,
  SBTIResult,
  EightValuesResult,
  TestResult,
} from "@/games/selftest/types";

const router = useRouter();
const { t } = useI18n();
const { open, requestExit, confirm, cancel } = useExitConfirm();

const selectedTest = ref<TestType | null>(null);
const answers = ref<number[]>([]);
const currentIndex = ref(0);
const result = ref<TestResult | null>(null);
let autoAdvanceTimer: number | null = null;

const test = computed<TestDefinition | null>(() =>
  selectedTest.value ? TESTS[selectedTest.value] : null
);

const progress = computed(() => {
  if (!test.value) return 0;
  return Math.round((currentIndex.value / test.value.questions.length) * 100);
});

const currentQuestion = computed(() => test.value?.questions[currentIndex.value]
);

function clearAutoAdvance() {
  if (autoAdvanceTimer !== null) {
    window.clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }
}

function selectTest(type: TestType) {
  clearAutoAdvance();
  selectedTest.value = type;
  answers.value = new Array(TESTS[type].questions.length).fill(0);
  currentIndex.value = 0;
  result.value = null;
}

function setAnswer(value: number) {
  clearAutoAdvance();
  answers.value[currentIndex.value] = value;
  autoAdvanceTimer = window.setTimeout(() => {
    autoAdvanceTimer = null;
    next();
  }, 250);
}

function next() {
  clearAutoAdvance();
  if (!test.value) return;
  if (currentIndex.value < test.value.questions.length - 1) {
    currentIndex.value++;
  } else {
    finish();
  }
}

function prev() {
  clearAutoAdvance();
  if (currentIndex.value > 0) {
    currentIndex.value--;
  }
}

function finish() {
  clearAutoAdvance();
  if (!selectedTest.value) return;
  result.value = scoreTest(selectedTest.value, answers.value);
}

function resetTest() {
  clearAutoAdvance();
  selectedTest.value = null;
  answers.value = [];
  currentIndex.value = 0;
  result.value = null;
}

function backHome() {
  if (selectedTest.value && !result.value) {
    requestExit("/", resetTest);
  } else {
    router.push("/");
  }
}

onUnmounted(() => {
  if (autoAdvanceTimer !== null) {
    window.clearTimeout(autoAdvanceTimer);
  }
});

function isMBTIResult(r: TestResult): r is MBTIResult {
  return "code" in r && selectedTest.value === "mbti";
}

function isSBTIResult(r: TestResult): r is SBTIResult {
  return "code" in r && selectedTest.value === "sbti";
}

function is8ValuesResult(r: TestResult): r is EightValuesResult {
  return "equality" in r;
}

const testCards: { type: TestType; icon: string }[] = [
  { type: "mbti", icon: "psychology" },
  { type: "sbti", icon: "mood" },
  { type: "8values", icon: "balance" },
];
</script>

<template>
  <div class="selftest"
    >
    <div class="game-header"
      >
      <md-outlined-button class="back-btn" @click="backHome"
        >{{ t("nav.back") }}</md-outlined-button
      >
      <h1 class="game-title">{{ t("selftest.title") }}</h1>
      <div class="game-state"
        >
        <span v-if="selectedTest">{{ progress }}%</span>
      </div>
    </div>

    <!-- Test selection -->
    <div v-if="!selectedTest" class="select-card"
      >
      <div class="select-title">{{ t("selftest.chooseTest") }}</div>
      <div class="test-grid"
        >
        <button
          v-for="card in testCards"
          :key="card.type"
          class="test-card"
          @click="selectTest(card.type)"
        >
          <div class="test-icon"
          >
            <md-icon>{{ card.icon }}</md-icon>
          </div>
          <div class="test-name">{{ t(`selftest.${card.type}.title`) }}</div>
          <div class="test-desc"
            >{{ t(`selftest.${card.type}.description`) }}</div
          >
        </button>
      </div>
    </div>

    <!-- Question -->
    <div v-else-if="!result" class="quiz-card"
      >
      <div class="progress"
        >
        <div class="progress-track"
          >
            <div class="progress-fill" :style="{ width: `${progress}%` }"
            ></div>
          </div>
        <div class="progress-text"
          >{{ currentIndex + 1 }} / {{ test!.questions.length }}</div
        >
      </div>

      <div v-if="currentQuestion" class="question"
        >
        <div class="question-text">{{ t(currentQuestion.textKey) }}</div>
        <div class="options"
          >
          <button
            v-for="option in currentQuestion.options"
            :key="option.value"
            class="option-btn"
            :class="{ selected: answers[currentIndex] === option.value }"
            @click="setAnswer(option.value)"
          >
            {{ t(option.labelKey) }}
          </button>
        </div>
      </div>

      <div class="quiz-actions"
        >
        <md-text-button @click="resetTest"
          >{{ t("selftest.quit") }}</md-text-button
        >
        <div class="nav-actions"
          >
          <md-outlined-button
            :disabled="currentIndex === 0"
            @click="prev"
            >{{ t("selftest.prev") }}</md-outlined-button
          >
          <md-filled-button @click="next"
            >{{ currentIndex < test!.questions.length - 1 ? t("selftest.next") : t("selftest.finish") }}</md-filled-button
          >
        </div>
      </div>
    </div>

    <!-- Result -->
    <div v-else class="result-card"
      >
      <div class="result-label">{{ t("selftest.result") }}</div>

      <div v-if="isMBTIResult(result)" class="result-body"
        >
        <div class="result-code">{{ result.code }}</div>
        <div class="result-title">{{ t(result.titleKey) }}</div>
        <div class="result-desc">{{ t(result.descKey) }}</div>
      </div>

      <div v-else-if="isSBTIResult(result)" class="result-body"
        >
        <div class="result-code">{{ result.code }}</div>
        <div class="result-title">{{ t(result.titleKey) }}</div>
        <div class="result-desc">{{ t(result.descKey) }}</div>
      </div>

      <div v-else-if="is8ValuesResult(result)" class="result-body"
        >
        <div class="result-title">{{ t(result.labelKey) }}</div>
        <div class="result-desc">{{ t(result.descKey) }}</div>
        <div class="axis-list"
          >
          <div class="axis"
            >
              <div class="axis-label"
                >
                  <span>{{ t("selftest.8values.equality") }}</span>
                  <span>{{ t("selftest.8values.markets") }}</span>
                </div>
              <div class="axis-bar"
                >
                  <div
                    class="axis-fill"
                    :style="{ width: `${result.equality}%`, marginLeft: 0 }"
                  ></div>
                </div>
              <div class="axis-value"
                >{{ result.equality }}%
              </div>
            </div>
            <div class="axis"
              >
                <div class="axis-label"
                  >
                    <span>{{ t("selftest.8values.nation") }}</span>
                    <span>{{ t("selftest.8values.globe") }}</span>
                  </div>
                <div class="axis-bar"
                  >
                    <div
                      class="axis-fill"
                      :style="{ width: `${result.nation}%`, marginLeft: 0 }"
                    ></div>
                </div>
                <div class="axis-value"
                  >{{ result.nation }}%
                </div>
              </div>
              <div class="axis"
                >
                  <div class="axis-label"
                    >
                      <span>{{ t("selftest.8values.liberty") }}</span>
                      <span>{{ t("selftest.8values.authority") }}</span>
                    </div>
                  <div class="axis-bar"
                    >
                      <div
                        class="axis-fill"
                        :style="{ width: `${result.liberty}%`, marginLeft: 0 }"
                      ></div>
                  </div>
                  <div class="axis-value"
                    >{{ result.liberty }}%
                  </div>
                </div>
                <div class="axis"
                  >
                    <div class="axis-label"
                      >
                        <span>{{ t("selftest.8values.tradition") }}</span>
                        <span>{{ t("selftest.8values.progress") }}</span>
                      </div>
                    <div class="axis-bar"
                      >
                        <div
                          class="axis-fill"
                          :style="{ width: `${result.tradition}%`, marginLeft: 0 }"
                        ></div>
                    </div>
                    <div class="axis-value"
                      >{{ result.tradition }}%
                    </div>
                  </div>
                </div>
              </div>

      <div class="result-actions"
        >
        <md-outlined-button @click="resetTest"
          >{{ t("selftest.restart") }}</md-outlined-button
        >
        <md-filled-button @click="router.push('/')"
          >{{ t("nav.back") }}</md-filled-button
        >
      </div>
    </div>
    <ExitConfirmDialog
      :open="open"
      :message="t('selftest.forfeitConfirm')"
      @confirm="confirm"
      @cancel="cancel"
    />
  </div>
</template>

<style scoped>
.selftest {
  flex: 1;
  min-height: 0;
  height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.select-card,
.quiz-card,
.result-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--md-sys-color-surface-variant);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid var(--md-sys-color-outline-variant);
}

.select-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
  text-align: center;
}

.test-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 12px;
}

@media (min-width: 600px) {
  .test-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.test-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 12px;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 16px;
  background: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
}

.test-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  background: var(--md-sys-color-primary-container);
}

.test-icon {
  font-size: 1.5rem;
  color: var(--md-sys-color-primary);
}

.test-name {
  font-size: 1rem;
  font-weight: 600;
}

.test-desc {
  font-size: 0.75rem;
  color: var(--md-sys-color-on-surface-variant);
  text-align: center;
}

.progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-track {
  flex: 1;
  height: 8px;
  background: var(--md-sys-color-surface);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--md-sys-color-primary);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.875rem;
  color: var(--md-sys-color-on-surface-variant);
  min-width: 48px;
  text-align: right;
}

.quiz-card {
  justify-content: space-between;
}

.question {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  justify-content: center;
}

.question-text {
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--md-sys-color-on-surface);
  text-align: center;
  line-height: 1.4;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 560px;
  width: 100%;
  margin: 0 auto;
}

.option-btn {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  font-size: 0.875rem;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.option-btn:hover {
  background: var(--md-sys-color-primary-container);
}

.option-btn.selected {
  border-color: var(--md-sys-color-primary);
  background: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
  font-weight: 600;
}

.quiz-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.nav-actions {
  display: flex;
  gap: 8px;
}

.result-label {
  font-size: 0.875rem;
  color: var(--md-sys-color-on-surface-variant);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  text-align: center;
}

.result-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.result-code {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--md-sys-color-primary);
  letter-spacing: 0.05em;
}

.result-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--md-sys-color-on-surface);
}

.result-desc {
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--md-sys-color-on-surface-variant);
  max-width: 640px;
}

.axis-list {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.axis {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 4px 12px;
  align-items: center;
}

.axis-label {
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--md-sys-color-on-surface-variant);
}

.axis-bar {
  height: 8px;
  background: var(--md-sys-color-surface);
  border-radius: 4px;
  overflow: hidden;
}

.axis-fill {
  height: 100%;
  background: var(--md-sys-color-primary);
  border-radius: 4px;
  transition: width 0.4s ease;
}

.axis-value {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
  min-width: 44px;
  text-align: right;
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
