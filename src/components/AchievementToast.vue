<script setup lang="ts">
import { computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useAchievement } from "@/composables/useAchievement";

const { t } = useI18n();
const { toasts, removeToast } = useAchievement();

const visibleToasts = computed(() => toasts.value.slice(0, 3));

watch(
  toasts,
  () => {
    for (const toast of visibleToasts.value) {
      setTimeout(() => removeToast(toast.id), 4000);
    }
  },
  { deep: true }
);
</script>

<template>
  <div class="toast-stack">
    <transition-group name="toast"
      >
      <div
        v-for="toast in visibleToasts"
        :key="toast.id"
        class="toast"
        role="status"
        aria-live="polite"
      >
        <div class="toast-icon">🏆</div>
        <div class="toast-body"
          >
          <div class="toast-title">{{ t("achievements.newUnlock") }}</div>
          <div class="toast-name">{{ t(toast.name) }}</div>
          <div class="toast-points">+{{ toast.points }} pt</div>
        </div>
        <button class="toast-close" @click="removeToast(toast.id)">×</button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-stack {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}

.toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 280px;
  max-width: 360px;
  padding: 12px 16px;
  border-radius: 16px;
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast-icon {
  font-size: 28px;
}

.toast-body {
  flex: 1;
}

.toast-title {
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  opacity: 0.8;
}

.toast-name {
  font-size: 1rem;
  font-weight: 600;
}

.toast-points {
  font-size: 0.875rem;
  font-weight: 500;
}

.toast-close {
  background: transparent;
  border: none;
  color: inherit;
  font-size: 1.25rem;
  cursor: pointer;
  line-height: 1;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
