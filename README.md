# 学时喵 · TimeKitten

记录每天学习时长的二次元通透风 Windows 桌面应用，含可常驻桌面的 Q 版桌宠。

## 功能一览

- 📋 **每日计划**：新建/改名/删除/拖拽排序，自动分配区分色
- ⏱️ **正向计时**：点计划开始计时，SVG 环形进度盘秒级刷新，停止后自动记录时长
- 📊 **时长可视化**：Doughnut 圆环图 + 排行榜，支持日/周/月时间范围切换
- 🐾 **桌宠**：透明置顶窗口悬浮桌面，计时中每 30 分钟自动切换形态，圆形头像框 + CSS 动效（呼吸起伏、光晕脉冲、悬浮粒子），可拖拽移动

## 技术栈

- **Electron 33 + React 18 + TypeScript 5.6**
- 构建：electron-vite（开发 HMR）+ electron-builder（打包 Windows）
- 数据：better-sqlite3（WAL 模式，本地库）
- 拖拽：@dnd-kit（计划排序）
- 桌宠：独立透明 BrowserWindow + CSS 动效 + IPC 图片加载
- UI：二次元通透风（玻璃拟态 + 柔光渐变 + 描边），主题/皮肤系统可替换
- 包管理：npm

## 快速开始

### 安装依赖

```bash
# 建议用国内镜像加速 Electron 二进制下载
$env:ELECTRON_MIRROR="https://registry.npmmirror.com/-/binary/electron/"
npm install
```

### 开发

```bash
npm run dev      # 开发模式（HMR），同时启动主窗口 + dev server
npm run typecheck # 类型检查
npm run build    # 构建
npm run package:win  # 打包 Windows 安装包（输出到 release/）
```

### 桌宠图片配置

桌宠使用自定义角色立绘（圆形头像框展示），图片放在 `assets/pet/` 目录：

| 文件名 | 形态名 |
|--------|--------|
| `图片4.png` | 水手服（默认） |
| `图片1.png` | 元气马尾 |
| `图片3.png` | 悠闲时刻 |
| `图片2.png` | 温柔一面 |
| `图片5.png` | 闪耀盛装 |

- 计时中每 30 分钟自动切换下一形态（`src/shared/petForms.ts` → `PET_FORM_ROTATE_MINUTES` 可调）
- 非计时时通过桌宠菜单手动轮播
- 支持 PNG/JPG/WEBP/GIF 格式
- 图片不进 Git（.gitignore 已忽略），打包时通过 `extraResources` 复制

## 目录结构

```
src/
  main/            Electron 主进程
    index.ts       入口 — 单实例锁、IPC 注册、窗口创建
    windows/       窗口类（mainWindow, petWindow）
    ipc/           所有 IPC handler（windowControls, dbHandlers, petHandlers）
    db/            数据库层
      schema.ts    建表 SQL
      connection.ts 单例连接
      dao.ts       CRUD + 统计查询
  preload/
    index.ts       contextBridge 暴露 api 给渲染进程
    index.d.ts     类型声明
  renderer/
    index.html     主界面入口
    pet.html       桌宠窗口入口
    src/
      main.tsx     React 挂载点
      pet.tsx      桌宠挂载点
      App.tsx      根组件（两栏布局 + 标签切换）
      App.css
      components/
        TitleBar.*     自绘标题栏 + 主题切换 + 桌宠开关
        PlanList.*     计划列表容器（dnd-kit 排序）
        PlanCard.*     单张计划卡片
        PlanAddInput.* 新增计划输入
        TimerPanel.*   计时面板（开始/停止/今日累计）
        TimerRing.*    SVG 环形进度盘
        DonutChart.*   SVG 扇区圆环图
        StatLegend.*   排行榜/图例
        StatView.*     统计面板容器（日/周/月切换）
      pet/
        PetApp.tsx     桌宠主组件（形态切换/菜单/拖拽/粒子特效）
        pet.css        桌宠样式（动效关键帧）
      theme/
        ThemeProvider.tsx  React Context 主题注入
      styles/
        global.css     全局样式 + 通透风背景
  shared/
    types.ts        共享类型（Plan, TimeSession, PlanTimeSummary, IPC_CHANNELS, PetTimerState）
    petForms.ts     桌宠形态配置（文件名 + 轮播间隔）
    theme/          主题/皮肤系统
      types.ts      Theme 类型定义
      themes.ts     内置主题（星海通透 / 治愈暖阳）
      applyTheme.ts 主题 → CSS 变量注入
assets/
  pet/             桌宠立绘图片（用户自备，.gitignore 忽略）
```

## 换 UI / 换皮肤

所有界面颜色走 `src/shared/theme` 定义的 Theme 令牌，注入为 CSS 变量。组件样式只用 `var(--xxx)`。
新增皮肤：在 `src/shared/theme/themes.ts` 追加一份 `Theme` 即可，主题切换下拉框会自动出现。

## 数据库

运行库文件：`%APPDATA%/TimeKitten/timekitten.db`

| 表 | 字段 |
|---|---|
| plans | id, title, color, sort_order, is_active, created_at, updated_at |
| time_sessions | id, plan_id, started_at, ended_at, duration_seconds, 索引(plan_id, started_at) |
| settings | key PK, value |

IPC 通道常量 → `src/shared/types.ts` 的 `IPC_CHANNELS`。

## 分支策略

- `main` — 发布分支（稳定版）
- `dev` — 生产/日常开发分支（当前）
