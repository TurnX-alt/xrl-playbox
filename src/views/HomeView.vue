<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import type { GameId } from "@/types";

const router = useRouter();
const { t } = useI18n();

type SortMode = "name" | "launch";

const sortMode = ref<SortMode>("launch");

interface GameMeta {
  id: GameId;
  titleKey: string;
  emoji: string;
}

const games: GameMeta[] = [
  { id: "sokoban", titleKey: "sokoban.title", emoji: "📦" },
  { id: "deal", titleKey: "deal.title", emoji: "💼" },
];

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
  if (sortMode.value === "launch") return games;
  return [...games].sort((a, b) => t(a.titleKey).localeCompare(t(b.titleKey)));
});

function play(id: GameId) {
  if (id === "sokoban") router.push("/sokoban");
  else router.push("/deal-or-no-deal");
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
