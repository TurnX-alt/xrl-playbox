<script setup lang="ts">
import { RouterView } from "vue-router";
import AppShell from "@/components/AppShell.vue";
import AchievementToast from "@/components/AchievementToast.vue";
import { useWindowAspectRatio } from "@/composables/useWindowAspectRatio";
import { useTheme } from "@/composables/useTheme";

useWindowAspectRatio(16 / 9);
useTheme();
</script>

<template>
  <AppShell>
    <RouterView />
  </AppShell>
  <AchievementToast />
</template>

<style>
:root,
:root[data-theme="light"] {
  color-scheme: light;
  --md-sys-color-primary: #6750a4;
  --md-sys-color-on-primary: #ffffff;
  --md-sys-color-primary-container: #eaddff;
  --md-sys-color-on-primary-container: #21005d;
  --md-sys-color-secondary: #5f5f5f;
  --md-sys-color-on-secondary: #ffffff;
  --md-sys-color-secondary-container: #e0e0e0;
  --md-sys-color-on-secondary-container: #1b1b1b;
  --md-sys-color-surface: #ffffff;
  --md-sys-color-surface-variant: #e3e3e3;
  --md-sys-color-surface-container: #f0f0f0;
  --md-sys-color-surface-container-high: #e4e4e4;
  --md-sys-color-on-surface: #1b1b1b;
  --md-sys-color-on-surface-variant: #444746;
  --md-sys-color-outline: #747474;
  --md-sys-color-outline-variant: #c4c4c4;
  --md-sys-color-error: #b3261e;
  --md-sys-color-on-error: #ffffff;
  --md-sys-color-error-container: #f9dedc;
  --md-sys-color-on-error-container: #410e0b;

  --md-menu-container-color: var(--md-sys-color-surface-container);
  --md-list-item-container-color: var(--md-sys-color-surface-container);
  --md-list-item-label-text-color: var(--md-sys-color-on-surface);
  --md-list-item-supporting-text-color: var(--md-sys-color-on-surface-variant);

  font-family: "Roboto", "Noto Sans SC", system-ui, sans-serif;
  color: var(--md-sys-color-on-surface);
  background: var(--md-sys-color-surface);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
}

md-icon {
  font-family: "Material Symbols Outlined", "Material Icons", sans-serif;
  font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24;
  font-style: normal;
  letter-spacing: normal;
  text-transform: none;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-feature-settings: "liga";
  -webkit-font-smoothing: antialiased;
}

.back-btn {
  --md-outlined-button-container-height: 28px;
  --md-outlined-button-leading-space: 8px;
  --md-outlined-button-trailing-space: 8px;
  --md-outlined-button-label-text-size: 0.75rem;
}

.game-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  min-height: 64px;
  flex-shrink: 0;
}

.game-header .back-btn {
  justify-self: start;
}

.game-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
}

.game-state {
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--md-sys-color-on-surface-variant);
}

@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
    --md-sys-color-primary: #d0bcff;
    --md-sys-color-on-primary: #381e72;
    --md-sys-color-primary-container: #4f378b;
    --md-sys-color-on-primary-container: #eaddff;
    --md-sys-color-secondary: #c7c7c7;
    --md-sys-color-on-secondary: #000000;
    --md-sys-color-secondary-container: #444746;
    --md-sys-color-on-secondary-container: #e3e3e3;
    --md-sys-color-surface: #121212;
    --md-sys-color-surface-variant: #2c2c2c;
    --md-sys-color-surface-container: #1f1f1f;
    --md-sys-color-surface-container-high: #2a2a2a;
    --md-sys-color-on-surface: #e3e3e3;
    --md-sys-color-on-surface-variant: #c4c7c5;
    --md-sys-color-outline: #8e8e8e;
    --md-sys-color-outline-variant: #444746;
    --md-sys-color-error: #f2b8b5;
    --md-sys-color-on-error: #601410;
    --md-sys-color-error-container: #8c1d18;
    --md-sys-color-on-error-container: #f9dedc;
  }
}

:root[data-theme="dark"] {
  color-scheme: dark;
  --md-sys-color-primary: #d0bcff;
  --md-sys-color-on-primary: #381e72;
  --md-sys-color-primary-container: #4f378b;
  --md-sys-color-on-primary-container: #eaddff;
  --md-sys-color-secondary: #c7c7c7;
  --md-sys-color-on-secondary: #000000;
  --md-sys-color-secondary-container: #444746;
  --md-sys-color-on-secondary-container: #e3e3e3;
  --md-sys-color-surface: #121212;
  --md-sys-color-surface-variant: #2c2c2c;
  --md-sys-color-surface-container: #1f1f1f;
  --md-sys-color-surface-container-high: #2a2a2a;
  --md-sys-color-on-surface: #e3e3e3;
  --md-sys-color-on-surface-variant: #c4c7c5;
  --md-sys-color-outline: #8e8e8e;
  --md-sys-color-outline-variant: #444746;
  --md-sys-color-error: #f2b8b5;
  --md-sys-color-on-error: #601410;
  --md-sys-color-error-container: #8c1d18;
  --md-sys-color-on-error-container: #f9dedc;
}
</style>
