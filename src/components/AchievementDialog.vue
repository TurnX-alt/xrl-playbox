<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useAchievementStore } from "@/stores/useAchievementStore";
import type { GameId } from "@/types";

const props = defineProps<{
  open: boolean;
  filter?: GameId | "all";
}>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
}>();

const { t } = useI18n();
const store = useAchievementStore();

const achievements = computed(() => store.byGame(props.filter ?? "all"));

function close() {
  emit("update:open", false);
}
</script>

<template>
  <div v-if="open" class="modal-backdrop" @click.self="close"
    >
    <div class="modal"
      >
      <div class="modal-title">{{ t("achievements.title") }}</div>
      <div class="modal-content"
        >
        <div class="points">{{ t("achievements.totalPoints", { points: store.totalPoints }) }}</div>
        <div class="achievement-list"
          >
          <div
            v-for="ach in achievements"
            :key="ach.id"
            class="achievement-item"
            :class="{ unlocked: ach.unlockedAt }"
          >
            <div class="ach-icon">{{ ach.unlockedAt ? "🏆" : "🔒" }}</div>
            <div class="ach-info"
              >
              <div class="ach-name">{{ t(ach.nameKey) }}</div>
              <div v-if="ach.unlockedAt" class="ach-desc">{{ t(ach.descKey) }}</div>
              <div v-else class="ach-desc locked">{{ t("achievements.locked") }}</div>
            </div>
            <div class="ach-points">+{{ ach.points }}</div>
          </div>
        </div>
      </div>
      <div class="modal-actions"
        >
        <button class="modal-btn secondary" @click="close">{{ t("common.close") }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: grid;
  place-items: center;
  z-index: 100;
  padding: 24px;
}

.modal {
  background: var(--md-sys-color-surface);
  border-radius: 24px;
  padding: 24px;
  min-width: 320px;
  max-width: 480px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--md-sys-color-on-surface);
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  color: var(--md-sys-color-on-surface-variant);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.modal-btn {
  padding: 10px 20px;
  border-radius: 20px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.875rem;
  transition: opacity 0.2s;
}

.modal-btn:hover {
  opacity: 0.9;
}

.modal-btn.secondary {
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}

.points {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--md-sys-color-primary);
}

.achievement-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: var(--md-sys-color-surface-variant);
  opacity: 0.6;
}

.achievement-item.unlocked {
  opacity: 1;
  background: var(--md-sys-color-primary-container);
}

.ach-icon {
  font-size: 24px;
}

.ach-info {
  flex: 1;
  min-width: 0;
}

.ach-name {
  font-weight: 600;
}

.ach-desc {
  font-size: 0.875rem;
  color: var(--md-sys-color-on-surface-variant);
}

.ach-desc.locked {
  font-style: italic;
  opacity: 0.7;
}

.ach-points {
  font-weight: 700;
  color: var(--md-sys-color-primary);
}
</style>
