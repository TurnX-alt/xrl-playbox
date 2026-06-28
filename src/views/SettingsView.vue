<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useAchievementStore, ALL_ACHIEVEMENTS } from "@/stores/useAchievementStore";
import { useAchievement } from "@/composables/useAchievement";
import { storageClear } from "@/composables/useStorage";

import type { Settings } from "@/types";

const { t, locale } = useI18n();
const settingsStore = useSettingsStore();
const achievementStore = useAchievementStore();
const { checkAndUnlock } = useAchievement();

const resetDialogOpen = ref(false);
const redeemCode = ref("");
const redeemStatus = ref("");
const redeemError = ref(false);

watch(
  () => settingsStore.settings.locale,
  (newLocale) => {
    locale.value = newLocale;
  }
);

function onLocaleChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value as Settings["locale"];
  settingsStore.setLocale(value);
}

function onSoundChange(event: Event) {
  const selected = (event.target as unknown as { selected: boolean }).selected;
  settingsStore.setSoundEnabled(selected);
}

async function confirmReset() {
  resetDialogOpen.value = false;
  await storageClear();
  settingsStore.reset();
  achievementStore.reset();
  locale.value = settingsStore.settings.locale;
}

function parseBool(value: string): boolean | null {
  const lowered = value.toLowerCase();
  if (lowered === "true" || lowered === "1") return true;
  if (lowered === "false" || lowered === "0") return false;
  return null;
}

function handleRedeem() {
  redeemStatus.value = "";
  redeemError.value = false;

  const parts = redeemCode.value.trim().split(/\s+/);
  if (parts.length < 4 || parts[0].toLowerCase() !== "set" || parts[1].toLowerCase() !== "achievement") {
    redeemStatus.value = t("settings.redeemInvalid");
    redeemError.value = true;
    return;
  }

  const index = parseInt(parts[2], 10);
  const boolValue = parseBool(parts[3]);

  if (!Number.isFinite(index) || index < 1 || index > ALL_ACHIEVEMENTS.length || boolValue === null) {
    redeemStatus.value = t("settings.redeemInvalid");
    redeemError.value = true;
    return;
  }

  const ach = ALL_ACHIEVEMENTS[index - 1];

  if (boolValue) {
    checkAndUnlock(ach.id, true);
  } else {
    achievementStore.setUnlocked(ach.id, false);
  }

  redeemStatus.value = t("settings.redeemSuccess");
  redeemError.value = false;
  redeemCode.value = "";
}
</script>

<template>
  <div class="settings"
    >
    <h1 class="page-title">{{ t("settings.title") }}</h1>

    <div class="setting-card"
      >
      <div class="setting-row"
        >
        <label>{{ t("settings.language") }}</label>
        <md-outlined-select :value="settingsStore.settings.locale" @change="onLocaleChange"
          >
          <md-select-option value="zh-CN">中文</md-select-option>
          <md-select-option value="en">English</md-select-option>
        </md-outlined-select>
      </div>

      <div class="setting-row"
        >
        <label>{{ t("settings.sound") }}</label>
        <md-switch
          :selected="settingsStore.settings.soundEnabled"
          @change="onSoundChange"
        >
        </md-switch>
      </div>
    </div>

    <div class="setting-card"
      >
      <div class="setting-row"
        >
        <label>{{ t("settings.redeemCode") }}</label>
      </div>
      <div class="redeem-row"
        >
        <md-outlined-text-field
          v-model="redeemCode"
          class="redeem-input"
          @keydown.enter="handleRedeem"
        >
        </md-outlined-text-field>
        <md-outlined-button @click="handleRedeem"
          >{{ t("settings.redeemSubmit") }}</md-outlined-button>
      </div>
      <div v-if="redeemStatus" class="redeem-status" :class="{ error: redeemError }"
        >{{ redeemStatus }}</div>
    </div>

    <div class="danger-zone"
      >
      <md-outlined-button @click="resetDialogOpen = true"
        >{{ t("settings.resetData") }}</md-outlined-button>
    </div>

    <div v-if="resetDialogOpen" class="modal-backdrop" @click.self="resetDialogOpen = false"
      >
      <div class="modal"
        >
        <div class="modal-title">{{ t("settings.resetData") }}</div>
        <div class="modal-content">{{ t("settings.resetConfirm") }}</div>
        <div class="modal-actions"
          >
          <button class="modal-btn secondary" @click="resetDialogOpen = false"
            >{{ t("common.cancel") }}</button>
          <button class="modal-btn primary" @click="confirmReset"
            >{{ t("common.confirm") }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings {
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

.setting-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-radius: 16px;
  background: var(--md-sys-color-surface-variant);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.setting-row label {
  font-weight: 500;
}

.redeem-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.redeem-input {
  flex: 1;
}

.redeem-status {
  font-size: 0.875rem;
  color: var(--md-sys-color-primary);
}

.redeem-status.error {
  color: var(--md-sys-color-error);
}

.danger-zone {
  margin-top: 32px;
  display: flex;
  justify-content: center;
}

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
  max-width: 400px;
  width: 100%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--md-sys-color-on-surface);
}

.modal-content {
  margin-bottom: 24px;
  color: var(--md-sys-color-on-surface-variant);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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

.modal-btn.primary {
  background: var(--md-sys-color-error);
  color: var(--md-sys-color-on-error);
}

.modal-btn.secondary {
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}
</style>
