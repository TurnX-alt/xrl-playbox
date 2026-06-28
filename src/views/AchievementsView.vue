<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useAchievementStore } from "@/stores/useAchievementStore";
import type { GameId } from "@/types";

const { t } = useI18n();
const store = useAchievementStore();

const filter = ref<GameId | "all">("all");

const filters: { key: GameId | "all"; labelKey: string }[] = [
  { key: "all", labelKey: "achievements.filterAll" },
  { key: "sokoban", labelKey: "achievements.filterSokoban" },
  { key: "deal", labelKey: "achievements.filterDeal" },
];

const achievements = computed(() => store.byGame(filter.value));

function formatDate(ts: number | null): string {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString();
}
</script>

<template>
  <div class="achievements"
    >
    <h1 class="page-title">{{ t("achievements.title") }}</h1>
    <div class="points-card"
      >
      <span class="points-label">{{ t("achievements.totalPoints", { points: store.totalPoints }) }}</span>
    </div>

    <div class="filter-tabs"
      >
      <md-primary-tab
        v-for="f in filters"
        :key="f.key"
        :active="filter === f.key"
        @click="filter = f.key"
        >
        {{ t(f.labelKey) }}
      </md-primary-tab>
    </div>

    <div class="achievement-grid"
      >
      <div
        v-for="ach in achievements"
        :key="ach.id"
        class="achievement-card"
        :class="{ unlocked: ach.unlockedAt }"
      >
        <div class="card-header"
          >
          <span class="card-icon">{{ ach.unlockedAt ? "🏆" : "🔒" }}</span>
          <span class="card-points">+{{ ach.points }}</span>
        </div>
        <div class="card-title">{{ t(ach.nameKey) }}</div>
        <div v-if="ach.unlockedAt" class="card-desc">{{ t(ach.descKey) }}</div>
        <div v-else class="card-desc locked">{{ t("achievements.locked") }}</div>
        <div v-if="ach.unlockedAt" class="card-date"
          >
          {{ formatDate(ach.unlockedAt) }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.achievements {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 24px;
}

.page-title {
  margin: 0;
  font-size: 2rem;
}

.points-card {
  padding: 16px 20px;
  border-radius: 16px;
  background: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
  margin-bottom: 16px;
}

.points-label {
  font-size: 1.25rem;
  font-weight: 600;
}

.filter-tabs {
  margin-bottom: 16px;
}

.achievement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.achievement-card {
  padding: 16px;
  opacity: 0.6;
  border-radius: 16px;
  background: var(--md-sys-color-surface-variant);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.achievement-card.unlocked {
  opacity: 1;
  background: var(--md-sys-color-primary-container);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-icon {
  font-size: 24px;
}

.card-points {
  font-weight: 700;
  color: var(--md-sys-color-primary);
}

.card-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.card-desc {
  font-size: 0.875rem;
  color: var(--md-sys-color-on-surface-variant);
}

.card-desc.locked {
  font-style: italic;
  opacity: 0.7;
}

.card-date {
  font-size: 0.75rem;
  margin-top: 8px;
  opacity: 0.8;
}
</style>
