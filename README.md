# XRL Playbox

[![Deploy to GitHub Pages](https://github.com/wpy030414/xrl-playbox/actions/workflows/pages.yml/badge.svg)](https://github.com/wpy030414/xrl-playbox/actions/workflows/pages.yml)
[![Release](https://github.com/wpy030414/xrl-playbox/actions/workflows/release.yml/badge.svg)](https://github.com/wpy030414/xrl-playbox/actions/workflows/release.yml)

**XRL Playbox** 是一款基于 **Tauri v2 + Vue 3 + TypeScript + Material Web Components** 的桌面小游戏合集。

## 项目简介

XRL Playbox 把经典的推箱子原型扩展成一个支持多款小游戏的合集应用。整体采用 Material Design 3 设计美学，拥有简洁的游戏选择页面，所有游戏共享统一的成就与积分系统，并通过 `tauri-plugin-store` 在本地持久化保存进度。

## 已包含游戏

### 🧱 推箱子（Sokoban）
- 从 8×8 开始自动生成随机地图，最大可达 16×16
- 无限闯关，地图大小、箱子数量与步数限制随关卡提升
- 进入游戏即可直接开始游玩
- 内置成就：吊死在一棵树上、过五关、斩六将

### 💼 交易大师（Deal or No Deal）
- 26 个箱子，金额从 $0.01 到 $1,000,000
- 纯单人模式：选箱、排除、银行家报价、Deal / No Deal
- 动态响应的 5×6 箱子布局，始终完整显示在窗口内
- 内置成就：百万富翁、百万负翁、急不可耐、反选别墅靠大海、预言家

### ⌨️ 打字竞速（Typing Race）
- 多档难度可选，从简单到大师逐级提升
- 实时统计 WPM、准确率、生命值与用时
- 支持专注模式，隐藏导航栏沉浸输入
- 内置成就：人形打印机、印度人、初音未来的消失

### 🧠 自测（Self Test）
- MBTI、SBTI、8Values 三套趣味测试
- 选择答案后自动进入下一题
- 结果页展示性格/坐标解读

### 🔤 猜字谜（Word Search）
- 在 10×10 的字母矩阵中隐藏 8 个英文单词
- 单词只沿水平或垂直方向连续排列
- 拖拽或点击起始/结束字母即可选中并提交
- 内置成就：火眼金睛、眼疾手快、长词猎人

### 🎲 小富翁（Mini Monopoly）
- 每局生成随机的循环地图，含地块、机会、税收、监狱、公园等区域
- 支持 2–4 名玩家，可自由切换人类/电脑玩家
- 掷骰子移动、购买地块、升级建筑、收取租金
- 内置成就：地产大亨、收租专家、摩天大楼

## 技术栈

- **Tauri v2**：跨平台桌面应用壳
- **Vue 3 + Composition API + TypeScript**：前端框架
- **Material Web Components（@material/web）**：MD3 UI 组件
- **Pinia**：状态管理
- **Vue I18n**：国际化（默认中文，支持英文、日文、西班牙文）
- **Vue Router**：路由（hash 模式，兼容 Tauri）
- **tauri-plugin-store**：本地数据持久化

## 开发

```bash
# 安装依赖
pnpm install

# 启动 Tauri 开发窗口
pnpm tauri:dev

# 仅启动前端 Vite 开发服务器
pnpm dev

# 构建生产版本（前端）
pnpm build

# 构建桌面可执行文件
pnpm tauri:build
```

## 自动化构建

- **GitHub Pages**：每次推送 `main` 分支时自动部署静态预览页面到 `https://wpy030414.github.io/xrl-playbox/`。
- **跨平台发行版**：每次推送 `main` 分支时自动构建 macOS / Linux / Windows 安装包，并创建 GitHub Release 草稿。

## 项目结构

```
src/
├── components/     # 共享 UI 组件
├── views/          # 页面视图
├── stores/         # Pinia 状态
├── composables/    # 组合式函数
├── games/          # 游戏引擎
│   ├── sokoban/
│   ├── deal/
│   ├── typing/
│   ├── selftest/
│   ├── wordsearch/
│   └── minimonopoly/
├── assets/i18n/    # 国际化文件
└── types/          # TypeScript 类型
```

## 成就系统

成就数据通过 `tauri-plugin-store` 持久化到本地；在浏览器预览时自动降级到 `localStorage`，解锁成就会弹出右上角提醒。
