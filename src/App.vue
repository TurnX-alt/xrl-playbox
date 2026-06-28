<script setup lang="ts">
import { RouterView } from "vue-router";
import AppShell from "@/components/AppShell.vue";
import AchievementToast from "@/components/AchievementToast.vue";
import { useWindowAspectRatio } from "@/composables/useWindowAspectRatio";

useWindowAspectRatio(16 / 9);
</script>

<template>
  <AppShell>
    <RouterView />
  </AppShell>
  <AchievementToast />
</template>

<style>
:root {
  --md-sys-color-primary: #6750a4;
  --md-sys-color-on-primary: #ffffff;
  --md-sys-color-primary-container: #eaddff;
  --md-sys-color-on-primary-container: #21005d;
  --md-sys-color-secondary: #625b71;
  --md-sys-color-on-secondary: #ffffff;
  --md-sys-color-secondary-container: #e8def8;
  --md-sys-color-on-secondary-container: #1d192b;
  --md-sys-color-surface: #fef7ff;
  --md-sys-color-surface-variant: #e7e0ec;
  --md-sys-color-on-surface: #1c1b1f;
  --md-sys-color-on-surface-variant: #49454f;
  --md-sys-color-outline: #79747e;
  --md-sys-color-error: #b3261e;

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

@media (prefers-color-scheme: dark) {
  :root {
    --md-sys-color-primary: #d0bcff;
    --md-sys-color-on-primary: #381e72;
    --md-sys-color-primary-container: #4f378b;
    --md-sys-color-on-primary-container: #eaddff;
    --md-sys-color-secondary: #ccc2dc;
    --md-sys-color-on-secondary: #332d41;
    --md-sys-color-secondary-container: #4a4458;
    --md-sys-color-on-secondary-container: #e8def8;
    --md-sys-color-surface: #141218;
    --md-sys-color-surface-variant: #49454f;
    --md-sys-color-on-surface: #e6e1e5;
    --md-sys-color-on-surface-variant: #cac4d0;
    --md-sys-color-outline: #938f99;
    --md-sys-color-error: #f2b8b5;
  }
}
</style>
