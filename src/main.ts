import { createApp } from "vue";
import { createPinia } from "pinia";
import { createI18n } from "vue-i18n";
import "@/components/Md3Components.ts";
import App from "@/App.vue";
import router from "@/router";
import { useAchievementStore } from "@/stores/useAchievementStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import zhCN from "@/assets/i18n/zh-CN.json";
import en from "@/assets/i18n/en.json";

const i18n = createI18n({
  legacy: false,
  locale: "zh-CN",
  fallbackLocale: "zh-CN",
  messages: {
    "zh-CN": zhCN,
    en,
  },
});

const app = createApp(App);
app.use(createPinia());
app.use(i18n);
app.use(router);

// Load persisted data before mounting
const settingsStore = useSettingsStore();
const achievementStore = useAchievementStore();
Promise.all([settingsStore.load(), achievementStore.load()]).then(() => {
  i18n.global.locale.value = settingsStore.settings.locale;
  app.mount("#app");
});
