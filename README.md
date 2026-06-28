# XRL Playbox

[![Deploy to GitHub Pages](https://github.com/wpy030414/pushing-box/actions/workflows/pages.yml/badge.svg)](https://github.com/wpy030414/pushing-box/actions/workflows/pages.yml)
[![Build Tauri Executables](https://github.com/wpy030414/pushing-box/actions/workflows/build.yml/badge.svg)](https://github.com/wpy030414/pushing-box/actions/workflows/build.yml)

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

## 技术栈

- **Tauri v2**：跨平台桌面应用壳
- **Vue 3 + Composition API + TypeScript**：前端框架
- **Material Web Components（@material/web）**：MD3 UI 组件
- **Pinia**：状态管理
- **Vue I18n**：国际化（默认中文，支持英文）
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

- **GitHub Pages**：每次推送 `main` 分支时自动部署静态预览页面。
- **跨平台构建**：每次推送 `main` 分支时自动构建 macOS / Linux / Windows 可执行文件并上传为 Actions artifact。

## 项目结构

```
src/
├── components/     # 共享 UI 组件
├── views/          # 页面视图
├── stores/         # Pinia 状态
├── composables/    # 组合式函数
├── games/          # 游戏引擎
│   ├── sokoban/
│   └── deal/
├── assets/i18n/    # 国际化文件
└── types/          # TypeScript 类型
```

## 成就系统

成就数据通过 `tauri-plugin-store` 持久化到本地；在浏览器预览时自动降级到 `localStorage`，解锁成就会弹出右上角提醒。
