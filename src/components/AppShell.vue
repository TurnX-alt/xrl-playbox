<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const hideNav = computed(() =>
  route.path === "/sokoban" || route.path === "/deal-or-no-deal"
);

const navItems = [
  { path: "/", label: t("nav.games"), icon: "sports_esports" },
  { path: "/achievements", label: t("nav.achievements"), icon: "emoji_events" },
  { path: "/settings", label: t("nav.settings"), icon: "settings" },
];

function isActive(path: string) {
  return route.path === path;
}
</script>

<template>
  <div class="shell"
    >
    <main class="content"
      >
      <slot />
    </main>

    <footer v-if="!hideNav" class="bottom-nav"
      >
      <button
        v-for="item in navItems"
        :key="item.path"
        class="nav-item"
        :class="{ active: isActive(item.path) }"
        @click="router.push(item.path)"
      >
        <md-icon>{{ item.icon }}</md-icon>
        <span class="nav-label">{{ item.label }}</span>
      </button>
    </footer>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.content {
  flex: 1;
  overflow: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.bottom-nav {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 8px 0;
  background: var(--md-sys-color-surface);
  border-top: 1px solid var(--md-sys-color-outline-variant);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 24px;
  border: none;
  background: transparent;
  color: var(--md-sys-color-on-surface-variant);
  cursor: pointer;
  border-radius: 16px;
  transition: background 0.2s, color 0.2s;
}

.nav-item.active {
  color: var(--md-sys-color-on-secondary-container);
  background: var(--md-sys-color-secondary-container);
}

.nav-label {
  font-size: 0.75rem;
  font-weight: 500;
}
</style>
