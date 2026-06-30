<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { storageGet, storageSet } from "@/composables/useStorage";
import { useGames } from "@/composables/useGames";
import type { GameId } from "@/types";

const router = useRouter();
const { t, locale } = useI18n();
const { games } = useGames();

const LAST_LAUNCH_KEY = "lastLaunchTimes";

type SortMode = "name" | "launch";
type LaunchTimes = Partial<Record<GameId, number>>;

const sortMode = ref<SortMode>("launch");
const lastLaunchTimes = ref<LaunchTimes>({});

onMounted(async () => {
  lastLaunchTimes.value = (await storageGet<LaunchTimes>(LAST_LAUNCH_KEY)) ?? {};
});

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function hueFromString(str: string): number {
  return hash(str) % 360;
}

function gradientForTitle(title: string): string {
  const base = hueFromString(title);
  const second = (base + 35 + (hash(title + "g") % 55)) % 360;
  return `linear-gradient(135deg, hsl(${base} 55% 45%) 0%, hsl(${second} 55% 40%) 100%)`;
}

const sortedGames = computed(() => {
  if (sortMode.value === "name") {
    return games.value;
  }
  return [...games.value].sort((a, b) => {
    const aTime = lastLaunchTimes.value[a.id] ?? 0;
    const bTime = lastLaunchTimes.value[b.id] ?? 0;
    if (bTime !== aTime) return bTime - aTime;
    return t(a.titleKey).localeCompare(t(b.titleKey));
  });
});

function formatLastLaunch(timestamp: number | undefined): string {
  if (!timestamp) return t("games.lastLaunchNever");
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return t("games.justNow");
  if (hours < 1) return t("games.minutesAgo", { n: minutes });
  if (days < 1) return t("games.hoursAgo", { n: hours });
  if (days < 30) return t("games.daysAgo", { n: days });
  return new Date(timestamp).toLocaleDateString(locale.value);
}

async function play(id: GameId) {
  const next: LaunchTimes = { ...lastLaunchTimes.value, [id]: Date.now() };
  lastLaunchTimes.value = next;
  await storageSet(LAST_LAUNCH_KEY, next);

  if (id === "sokoban") router.push("/sokoban");
  else if (id === "deal") router.push("/deal-or-no-deal");
  else if (id === "typing") router.push("/typing");
  else if (id === "wordsearch") router.push("/wordsearch");
  else if (id === "minimonopoly") router.push("/minimonopoly");
  else router.push("/selftest");
}

function toggleSort() {
  sortMode.value = sortMode.value === "launch" ? "name" : "launch";
}
</script>

<template>
  <div class="games"
    >
    <div class="header"
      >
      <h1 class="title">{{ t("games.title") }}</h1>
      <md-text-button @click="toggleSort"
        >
        <md-icon slot="icon">sort</md-icon>
        {{ sortMode === "name" ? t("games.sortByName") : t("games.sortByLaunch") }}
      </md-text-button>
    </div>

    <div class="grid"
      >
      <button
        v-for="game in sortedGames"
        :key="game.id"
        class="card"
        :style="{ background: gradientForTitle(t(game.titleKey)) }"
        @click="play(game.id)"
      >
        <div class="emoji">{{ game.emoji }}</div>
        <div class="card-title">{{ t(game.titleKey) }}</div>
        <div v-if="sortMode === 'launch'" class="launch-time"
          >{{ formatLastLaunch(lastLaunchTimes[game.id]) }}</div
        >
        <div class="shine"></div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.games {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 24px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.title {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--md-sys-color-on-surface);
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  align-content: start;
}

@media (min-width: 700px) {
  .grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.card {
  position: relative;
  aspect-ratio: 4 / 3;
  border: none;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  color: #ffffff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.card:hover,
.card:focus-visible {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.18);
}

.card:active {
  transform: translateY(-2px) scale(0.99);
}

.emoji {
  font-size: 48px;
  line-height: 1;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.2));
  z-index: 1;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  z-index: 1;
  text-align: center;
}

.launch-time {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.35);
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 500;
  z-index: 1;
  backdrop-filter: blur(2px);
}

.shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    120deg,
    rgba(255, 255, 255, 0) 30%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0) 70%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.card:hover .shine {
  opacity: 1;
}
</style>
