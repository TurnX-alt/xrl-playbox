import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { Achievement, GameId, StoredAchievementData } from "@/types";
import { storageGet, storageSet } from "@/composables/useStorage";

export type { Achievement };

const STORAGE_KEY = "achievements";

export const ALL_ACHIEVEMENTS: Achievement[] = [
  {
    id: "hang-on-tree",
    game: "sokoban",
    nameKey: "ach.hangOnTree.name",
    descKey: "ach.hangOnTree.desc",
    points: 100,
    unlockedAt: null,
  },
  {
    id: "pass-five",
    game: "sokoban",
    nameKey: "ach.passFive.name",
    descKey: "ach.passFive.desc",
    points: 50,
    unlockedAt: null,
  },
  {
    id: "cut-six",
    game: "sokoban",
    nameKey: "ach.cutSix.name",
    descKey: "ach.cutSix.desc",
    points: 50,
    unlockedAt: null,
  },
  {
    id: "millionaire",
    game: "deal",
    nameKey: "ach.millionaire.name",
    descKey: "ach.millionaire.desc",
    points: 100,
    unlockedAt: null,
  },
  {
    id: "million-poor",
    game: "deal",
    nameKey: "ach.millionPoor.name",
    descKey: "ach.millionPoor.desc",
    points: 50,
    unlockedAt: null,
  },
  {
    id: "impatient",
    game: "deal",
    nameKey: "ach.impatient.name",
    descKey: "ach.impatient.desc",
    points: 50,
    unlockedAt: null,
  },
  {
    id: "reverse-villa",
    game: "deal",
    nameKey: "ach.reverseVilla.name",
    descKey: "ach.reverseVilla.desc",
    points: 50,
    unlockedAt: null,
  },
  {
    id: "prophet",
    game: "deal",
    nameKey: "ach.prophet.name",
    descKey: "ach.prophet.desc",
    points: 50,
    unlockedAt: null,
  },
  {
    id: "human-printer",
    game: "typing",
    nameKey: "ach.humanPrinter.name",
    descKey: "ach.humanPrinter.desc",
    points: 100,
    unlockedAt: null,
  },
  {
    id: "indian-typist",
    game: "typing",
    nameKey: "ach.indianTypist.name",
    descKey: "ach.indianTypist.desc",
    points: 50,
    unlockedAt: null,
  },
  {
    id: "hatsune-disappearance",
    game: "typing",
    nameKey: "ach.hatsuneDisappearance.name",
    descKey: "ach.hatsuneDisappearance.desc",
    points: 50,
    unlockedAt: null,
  },
  {
    id: "wordsearch-all-found",
    game: "wordsearch",
    nameKey: "ach.wordsearchAllFound.name",
    descKey: "ach.wordsearchAllFound.desc",
    points: 100,
    unlockedAt: null,
  },
  {
    id: "wordsearch-speedy",
    game: "wordsearch",
    nameKey: "ach.wordsearchSpeedy.name",
    descKey: "ach.wordsearchSpeedy.desc",
    points: 50,
    unlockedAt: null,
  },
  {
    id: "wordsearch-long-word",
    game: "wordsearch",
    nameKey: "ach.wordsearchLongWord.name",
    descKey: "ach.wordsearchLongWord.desc",
    points: 50,
    unlockedAt: null,
  },
  {
    id: "minimonopoly-tycoon",
    game: "minimonopoly",
    nameKey: "ach.minimonopolyTycoon.name",
    descKey: "ach.minimonopolyTycoon.desc",
    points: 100,
    unlockedAt: null,
  },
  {
    id: "minimonopoly-landlord",
    game: "minimonopoly",
    nameKey: "ach.minimonopolyLandlord.name",
    descKey: "ach.minimonopolyLandlord.desc",
    points: 50,
    unlockedAt: null,
  },
  {
    id: "minimonopoly-max-level",
    game: "minimonopoly",
    nameKey: "ach.minimonopolyMaxLevel.name",
    descKey: "ach.minimonopolyMaxLevel.desc",
    points: 50,
    unlockedAt: null,
  },
];

export const useAchievementStore = defineStore("achievements", () => {
  const achievements = ref<Achievement[]>(
    ALL_ACHIEVEMENTS.map((a) => ({ ...a }))
  );
  const loaded = ref(false);

  const totalPoints = computed(() =>
    achievements.value
      .filter((a) => a.unlockedAt !== null)
      .reduce((sum, a) => sum + a.points, 0)
  );

  const unlockedIds = computed(() =>
    achievements.value.filter((a) => a.unlockedAt !== null).map((a) => a.id)
  );

  async function load() {
    if (loaded.value) return;
    const data = await storageGet<StoredAchievementData>(STORAGE_KEY);
    if (data) {
      for (const ach of achievements.value) {
        if (data.unlockedIds.includes(ach.id)) {
          ach.unlockedAt = data.timestamps[ach.id] ?? Date.now();
        }
      }
    }
    loaded.value = true;
  }

  async function save() {
    const data: StoredAchievementData = {
      unlockedIds: unlockedIds.value,
      timestamps: Object.fromEntries(
        achievements.value
          .filter((a) => a.unlockedAt !== null)
          .map((a) => [a.id, a.unlockedAt as number])
      ),
    };
    await storageSet(STORAGE_KEY, data);
  }

  function isUnlocked(id: string): boolean {
    return achievements.value.some((a) => a.id === id && a.unlockedAt !== null);
  }

  function setUnlocked(id: string, unlocked: boolean): boolean {
    const ach = achievements.value.find((a) => a.id === id);
    if (!ach) return false;
    if (unlocked) {
      if (ach.unlockedAt !== null) return false;
      ach.unlockedAt = Date.now();
    } else {
      if (ach.unlockedAt === null) return false;
      ach.unlockedAt = null;
    }
    save();
    return true;
  }

  function checkUnlock(id: string, condition: boolean): boolean {
    if (!condition) return false;
    return setUnlocked(id, true);
  }

  function checkUnlocks(conditions: Record<string, boolean>): string[] {
    const newlyUnlocked: string[] = [];
    for (const [id, condition] of Object.entries(conditions)) {
      if (checkUnlock(id, condition)) {
        newlyUnlocked.push(id);
      }
    }
    return newlyUnlocked;
  }

  function byGame(game: GameId | "all"): Achievement[] {
    if (game === "all") return achievements.value;
    return achievements.value.filter((a) => a.game === game);
  }

  function reset() {
    for (const ach of achievements.value) {
      ach.unlockedAt = null;
    }
    save();
  }

  return {
    achievements,
    totalPoints,
    unlockedIds,
    load,
    save,
    isUnlocked,
    setUnlocked,
    checkUnlock,
    checkUnlocks,
    byGame,
    reset,
  };
});
