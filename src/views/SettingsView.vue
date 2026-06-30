<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useAchievementStore, ALL_ACHIEVEMENTS } from "@/stores/useAchievementStore";
import { useAchievement } from "@/composables/useAchievement";
import { storageClear } from "@/composables/useStorage";
import { openUrl } from "@tauri-apps/plugin-opener";

import type { Settings, ThemeColor } from "@/types";

const GITHUB_URL = "https://github.com/wpy030414/xrl-playbox";

const { t, locale } = useI18n();
const settingsStore = useSettingsStore();
const achievementStore = useAchievementStore();
const { checkAndUnlock } = useAchievement();

const resetDialogOpen = ref(false);
const redeemCode = ref("");
const redeemStatus = ref("");
const redeemError = ref(false);

const themeColors: ThemeColor[] = ["purple", "blue", "green", "red", "orange", "pink", "teal"];

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

function onThemeChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value as Settings["theme"];
  settingsStore.setTheme(value);
}

function onThemeColorChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value as Settings["themeColor"];
  settingsStore.setThemeColor(value);
}

function openGitHub() {
  openUrl(GITHUB_URL).catch(() => {
    window.open(GITHUB_URL, "_blank");
  });
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

  if (import.meta.env.DEV) {
    const parts = redeemCode.value.trim().split(/\s+/);
    if (parts.length >= 4 && parts[0].toLowerCase() === "set" && parts[1].toLowerCase() === "achievement") {
      const index = parseInt(parts[2], 10);
      const boolValue = parseBool(parts[3]);

      if (Number.isFinite(index) && index >= 1 && index <= ALL_ACHIEVEMENTS.length && boolValue !== null) {
        const ach = ALL_ACHIEVEMENTS[index - 1];
        if (boolValue) {
          checkAndUnlock(ach.id, true);
        } else {
          achievementStore.setUnlocked(ach.id, false);
        }
        redeemStatus.value = t("settings.redeemSuccess");
        redeemCode.value = "";
        return;
      }
    }

    redeemStatus.value = t("settings.redeemInvalid");
    redeemError.value = true;
    return;
  }

  redeemStatus.value = t("settings.redeemCodeInvalid");
  redeemError.value = true;
}
</script>

<template>
  <div class="settings">
    <h1 class="page-title">{{ t("settings.title") }}</h1>

    <div class="setting-card about-card">
      <div class="about-row">
        <md-icon-button @click="openGitHub" :aria-label="t('settings.github')">
          <svg class="github-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor"
              d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
        </md-icon-button>
        <span class="copyright">{{ t("settings.copyright") }}</span>
      </div>
    </div>

    <div class="setting-card">
      <div class="setting-row">
        <label>{{ t("settings.language") }}</label>
        <md-outlined-select :value="settingsStore.settings.locale" @change="onLocaleChange">
          <md-select-option value="zh-CN">中文</md-select-option>
          <md-select-option value="en">English</md-select-option>
          <md-select-option value="ja">日本語</md-select-option>
          <md-select-option value="es">Español</md-select-option>
        </md-outlined-select>
      </div>

      <div class="setting-row">
        <label>{{ t("settings.theme") }}</label>
        <md-outlined-select :value="settingsStore.settings.theme" @change="onThemeChange">
          <md-select-option value="light">{{ t("settings.themeLight") }}</md-select-option>
          <md-select-option value="dark">{{ t("settings.themeDark") }}</md-select-option>
          <md-select-option value="system">{{ t("settings.themeSystem") }}</md-select-option>
        </md-outlined-select>
      </div>

      <div class="setting-row">
        <label>{{ t("settings.themeColor") }}</label>
        <md-outlined-select :value="settingsStore.settings.themeColor" @change="onThemeColorChange">
          <md-select-option v-for="color in themeColors" :key="color" :value="color">{{
            t(`settings.color${color.charAt(0).toUpperCase() + color.slice(1)}`) }}</md-select-option>
        </md-outlined-select>
      </div>
    </div>

    <div class="setting-card">
      <div class="setting-row">
        <label>{{ t("settings.redeemCode") }}</label>
      </div>
      <div class="redeem-row">
        <md-outlined-text-field v-model="redeemCode" class="redeem-input" @keydown.enter="handleRedeem">
        </md-outlined-text-field>
        <md-outlined-button @click="handleRedeem">{{ t("settings.redeemSubmit") }}</md-outlined-button>
      </div>
      <div v-if="redeemStatus" class="redeem-status" :class="{ error: redeemError }">{{ redeemStatus }}</div>
    </div>

    <div class="danger-zone">
      <md-outlined-button @click="resetDialogOpen = true">{{ t("settings.resetData") }}</md-outlined-button>
    </div>

    <div v-if="resetDialogOpen" class="modal-backdrop" @click.self="resetDialogOpen = false">
      <div class="modal">
        <div class="modal-title">{{ t("settings.resetData") }}</div>
        <div class="modal-content">{{ t("settings.resetConfirm") }}</div>
        <div class="modal-actions">
          <button class="modal-btn secondary" @click="resetDialogOpen = false">{{ t("common.cancel") }}</button>
          <button class="modal-btn primary" @click="confirmReset">{{ t("common.confirm") }}</button>
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

.about-card {
  padding: 12px 16px;
}

.about-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.copyright {
  font-size: 0.875rem;
  color: var(--md-sys-color-on-surface-variant);
}

.github-icon {
  width: 20px;
  height: 20px;
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
