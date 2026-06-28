import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { DealEngine } from "@/games/deal/DealEngine";
import { useAchievement } from "@/composables/useAchievement";

export const useDealStore = defineStore("deal", () => {
  const { checkMultiple } = useAchievement();

  const engine = ref<DealEngine | null>(null);

  const state = computed(() => engine.value?.state ?? null);
  const ownAmount = computed(() => engine.value?.getOwnAmount() ?? 0);
  const remainingAmounts = computed(() => engine.value?.getRemainingAmounts() ?? []);
  const canEliminate = computed(() => state.value?.phase === "eliminate");
  const isGameActive = computed(() => {
    if (!engine.value) return false;
    return engine.value.state.phase !== "finished";
  });

  function startGame() {
    engine.value = new DealEngine();
  }

  function resetGame() {
    engine.value = null;
  }

  function selectOwn(id: number) {
    engine.value?.selectOwnBriefcase(id);
  }

  function eliminate(id: number) {
    engine.value?.eliminate(id);
  }

  function acceptDeal() {
    if (!engine.value) return;
    engine.value.acceptDeal();
    checkDealAchievements();
  }

  function rejectDeal() {
    if (!engine.value) return;
    engine.value.rejectDeal();
    checkDealAchievements();
  }

  function proceedToDecide() {
    engine.value?.proceedToDecide();
  }

  function checkDealAchievements() {
    if (!engine.value || engine.value.state.phase !== "finished") return;
    const s = engine.value.state;
    const final = s.finalAmounts.player1;
    const accepted = s.acceptedOffer;
    const own = engine.value.getOwnAmount();

    checkMultiple({
      millionaire: final >= 1_000_000,
      "million-poor": final <= 0.01,
      impatient: s.acceptedAtRound === 1,
      "reverse-villa": s.consecutiveHighEliminations >= 3,
      prophet:
        accepted !== null && own > 0
          ? Math.abs(accepted - own) / own <= 0.01
          : false,
    });
  }

  return {
    engine,
    state,
    ownAmount,
    remainingAmounts,
    canEliminate,
    isGameActive,
    startGame,
    resetGame,
    selectOwn,
    eliminate,
    acceptDeal,
    rejectDeal,
    proceedToDecide,
    checkDealAchievements,
  };
});
