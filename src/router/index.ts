import { createRouter, createWebHashHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import SokobanView from "@/views/SokobanView.vue";
import DealOrNoDealView from "@/views/DealOrNoDealView.vue";
import TypingView from "@/views/TypingView.vue";
import SelfTestView from "@/views/SelfTestView.vue";
import WordSearchView from "@/views/WordSearchView.vue";
import MiniMonopolyView from "@/views/MiniMonopolyView.vue";
import AchievementsView from "@/views/AchievementsView.vue";
import SettingsView from "@/views/SettingsView.vue";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", name: "games", component: HomeView },
    { path: "/sokoban", name: "sokoban", component: SokobanView },
    { path: "/deal-or-no-deal", name: "deal", component: DealOrNoDealView },
    { path: "/typing", name: "typing", component: TypingView },
    { path: "/selftest", name: "selftest", component: SelfTestView },
    { path: "/wordsearch", name: "wordsearch", component: WordSearchView },
    { path: "/minimonopoly", name: "minimonopoly", component: MiniMonopolyView },
    { path: "/achievements", name: "achievements", component: AchievementsView },
    { path: "/settings", name: "settings", component: SettingsView },
  ],
});

export default router;
