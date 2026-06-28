import { ref } from "vue";
import { useAchievementStore, type Achievement } from "@/stores/useAchievementStore";

export interface ToastAchievement {
  id: string;
  name: string;
  points: number;
}

const toasts = ref<ToastAchievement[]>([]);

export function useAchievement() {
  const store = useAchievementStore();

  function checkAndUnlock(id: string, condition: boolean): boolean {
    const newlyUnlocked = store.checkUnlock(id, condition);
    if (newlyUnlocked) {
      const ach = store.achievements.find((a) => a.id === id);
      if (ach) {
        pushToast(ach);
      }
    }
    return newlyUnlocked;
  }

  function checkMultiple(conditions: Record<string, boolean>): string[] {
    const newlyUnlocked = store.checkUnlocks(conditions);
    for (const id of newlyUnlocked) {
      const ach = store.achievements.find((a) => a.id === id);
      if (ach) pushToast(ach);
    }
    return newlyUnlocked;
  }

  function pushToast(ach: Achievement) {
    // Avoid duplicate toasts
    if (toasts.value.some((t) => t.id === ach.id)) return;
    toasts.value.push({
      id: ach.id,
      name: ach.nameKey,
      points: ach.points,
    });
  }

  function removeToast(id: string) {
    const idx = toasts.value.findIndex((t) => t.id === id);
    if (idx >= 0) toasts.value.splice(idx, 1);
  }

  return {
    toasts,
    checkAndUnlock,
    checkMultiple,
    removeToast,
  };
}
