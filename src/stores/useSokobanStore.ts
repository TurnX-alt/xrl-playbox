import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { SokobanEngine } from "@/games/sokoban/SokobanEngine";
import { generateLevel } from "@/games/sokoban/SokobanGenerator";
import { useAchievement } from "@/composables/useAchievement";
import type { Direction, SokobanMoveResult } from "@/types";

export const useSokobanStore = defineStore("sokoban", () => {
  const { checkAndUnlock } = useAchievement();

  const currentLevel = ref(1);
  const engine = ref<SokobanEngine | null>(null);
  const status = ref<"playing" | "won" | "lost">("playing");
  const resetCountForLevel = ref(0);
  const consecutiveResets = ref(0);
  const maxBoxesOnTargetInRun = ref(0);
  const firstTimeLevel5 = ref(true);

  const levelData = computed(() => engine.value?.toLevel() ?? null);
  const stepsUsed = computed(() => engine.value?.steps ?? 0);
  const stepLimit = computed(() => engine.value?.stepLimit ?? 0);
  const boxesOnTarget = computed(() => engine.value?.countBoxesOnTarget() ?? 0);
  const totalTargets = computed(() => engine.value?.totalTargets() ?? 0);

  function createEngine(level: number): SokobanEngine {
    const levelData = generateLevel(level);
    return SokobanEngine.fromLevel(levelData);
  }

  function startAdventure(level = 1) {
    currentLevel.value = level;
    resetCountForLevel.value = 0;
    consecutiveResets.value = 0;
    maxBoxesOnTargetInRun.value = 0;
    status.value = "playing";
    engine.value = createEngine(level);
  }

  function resetGame() {
    engine.value = null;
    status.value = "playing";
    resetCountForLevel.value = 0;
    consecutiveResets.value = 0;
    maxBoxesOnTargetInRun.value = 0;
  }

  function nextLevel() {
    if (status.value !== "won") return;
    currentLevel.value++;
    resetCountForLevel.value = 0;
    consecutiveResets.value = 0;
    maxBoxesOnTargetInRun.value = 0;
    status.value = "playing";
    engine.value = createEngine(currentLevel.value);
  }

  function resetLevel() {
    if (!engine.value) return;
    engine.value.reset();
    status.value = "playing";
    resetCountForLevel.value++;
    consecutiveResets.value++;
    maxBoxesOnTargetInRun.value = 0;

    checkAndUnlock("hang-on-tree", consecutiveResets.value >= 3);
  }

  function move(dir: Direction): SokobanMoveResult {
    if (!engine.value || status.value !== "playing") return { moved: false, pushed: false, won: false };
    if (engine.value.isOutOfSteps()) return { moved: false, pushed: false, won: false };

    const result = engine.value.move(dir);
    if (!result.moved) return result;

    consecutiveResets.value = 0;
    const onTarget = engine.value.countBoxesOnTarget();
    if (onTarget > maxBoxesOnTargetInRun.value) {
      maxBoxesOnTargetInRun.value = onTarget;
    }

    if (engine.value.isOutOfSteps() && !result.won) {
      status.value = "lost";
    }

    return result;
  }

  function completeLevel() {
    if (status.value !== "playing") return;
    status.value = "won";
    checkAchievementsAfterWin();
  }

  function checkAchievementsAfterWin() {
    checkAndUnlock("pass-five", currentLevel.value >= 5 && firstTimeLevel5.value);
    if (currentLevel.value >= 5) firstTimeLevel5.value = false;
    checkAndUnlock("cut-six", maxBoxesOnTargetInRun.value >= 6);
  }

  return {
    currentLevel,
    engine,
    status,
    resetCountForLevel,
    consecutiveResets,
    maxBoxesOnTargetInRun,
    firstTimeLevel5,
    levelData,
    stepsUsed,
    stepLimit,
    boxesOnTarget,
    totalTargets,
    startAdventure,
    resetGame,
    nextLevel,
    resetLevel,
    move,
    completeLevel,
    checkAchievementsAfterWin,
  };
});
