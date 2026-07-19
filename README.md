# 学时喵 · TimeKitten

记录每天学习时长的二次元通透风 Windows 桌面应用，含可常驻桌面的 Q 版桌宠。

## 功能一览

- 📋 **每日计划**：新建/改名/删除/拖拽排序，自动分配区分色
- ⏱️ **正向计时**：点计划开始计时，SVG 环形进度盘秒级刷新，停止后自动记录时长
- 📊 **时长可视化**：Doughnut 圆环图 + 排行榜，支持日/周/月时间范围切换
- 🐾 **桌宠**：透明置顶窗口悬浮桌面，计时中每 30 分钟自动切换形态，圆形头像框 + CSS 动效（呼吸起伏、光晕脉冲、悬浮粒子），可拖拽移动

## 技术栈

- **Electron 35 + React 18 + TypeScript 5.6**
- 构建：electron-vite（开发 HMR）+ electron-builder（打包 Windows）
- 数据：better-sqlite3（WAL 模式，本地库）
- 拖拽：@dnd-kit（计划排序）
- 桌宠：独立透明 BrowserWindow + CSS 动效 + IPC 图片加载
- UI：二次元通透风（玻璃拟态 + 柔光渐变 + 描边），主题/皮肤系统可替换
- 包管理：npm

## 快速开始

### 第一步：检查系统环境变量（重要！）

```powershell
# 检查是否有 ELECTRON_RUN_AS_NODE 环境变量
[Environment]::GetEnvironmentVariable('ELECTRON_RUN_AS_NODE', 'User')
[Environment]::GetEnvironmentVariable('ELECTRON_RUN_AS_NODE', 'Machine')
```

> ⚠️ **如果你的系统存在 `ELECTRON_RUN_AS_NODE=1` 环境变量，必须先删除它！**
> 
> 这个变量会让 Electron 强制以纯 Node.js 模式启动，永远不进入桌面/浏览器模式，
> 导致 `require('electron').app` 为 `undefined`。
> 
> 删除方法：Windows 设置 → 系统 → 关于 → 高级系统设置 → 环境变量，
> 在"用户变量"和"系统变量"里分别找 `ELECTRON_RUN_AS_NODE`，找到就删掉。
> 删完后**重启终端**（必须重新打开 PowerShell）。

### 第二步：安装依赖

```powershell
# 建议用国内镜像加速 Electron 二进制下载
$env:ELECTRON_MIRROR="https://registry.npmmirror.com/-/binary/electron/"
npm install
```

### 第三步：重编译原生模块

`better-sqlite3` 包含 C++ 原生模块，必须匹配 Electron 内置的 Node.js 版本：

```powershell
npx @electron/rebuild
```

### 第四步：运行

```bash
npm run dev      # 开发模式（HMR），同时启动主窗口 + dev server
npm run typecheck # 类型检查
npm run build    # 构建
npm run package:win  # 打包 Windows 安装包（输出到 release/）
```

## 常见环境问题

### `Error: Cannot read properties of undefined (reading 'requestSingleInstanceLock')`

- **原因**：系统环境变量 `ELECTRON_RUN_AS_NODE=1` 导致 Electron 以 Node.js 模式运行，内置 `electron` 模块（`app`, `BrowserWindow` 等）不可用。
- **解决**：删除系统环境变量中的 `ELECTRON_RUN_AS_NODE`（见上方"第一步"），重启终端。

### `NODE_MODULE_VERSION mismatch`（如 127 vs 133）

- **原因**：`better-sqlite3` 的原生模块是针对系统 Node.js 编译的，与 Electron 内置的 Node.js 版本不匹配。
- **解决**：
  ```powershell
  Remove-Item node_modules\better-sqlite3 -Recurse -Force
  npm install better-sqlite3
  npx @electron/rebuild -v 35.0.0 -m .
  ```

### Electron 二进制下载缓慢或失败

- **原因**：`npm install electron` 默认从 GitHub Releases 下载 Electron 二进制文件，国内网络可能不稳定。
- **解决**：设置镜像环境变量：
  ```powershell
  $env:ELECTRON_MIRROR="https://registry.npmmirror.com/-/binary/electron/"
  npm install electron@35.0.0
  ```

### 安装了新 Electron 版本后启动不了

- **原因**：每次更换 Electron 版本，都需要重新编译原生模块。
- **解决**：运行 `npx @electron/rebuild`。

### 桌宠图片配置（开源使用者必读）

桌宠使用**你自己的角色立绘**（圆形头像框展示）。项目**不自带任何图片**，你需要自己准备。

**最低配置（1 张图就能跑）：**

1. 把一张图片放进 `assets/pet/`，比如 `my-character.png`
2. 打开 `src/shared/petForms.ts`，把 `file` 改成你的文件名，几个形态就写几条：

```ts
// 示例：只用一张图
export const PET_FORM_ROTATE_MINUTES = 30 // 计时中每30分钟自动切换形态

export const PET_FORMS: PetForm[] = [
  {
    id: 'default',
    name: '我的角色',
    file: 'my-character.png',   // ← 改这里
    unlockSeconds: 0
  }
]
```

**多形态（5 张图轮播）：**

```ts
export const PET_FORM_ROTATE_MINUTES = 30

export const PET_FORMS: PetForm[] = [
  { id: 'form1', name: '默认形态', file: 'char1.png', unlockSeconds: 0 },
  { id: 'form2', name: '换装1',    file: 'char2.png', unlockSeconds: 0 },
  { id: 'form3', name: '换装2',    file: 'char3.png', unlockSeconds: 0 },
  // 想要几个写几个
]
```

**换装机制：**
- 计时中：每 `PET_FORM_ROTATE_MINUTES` 分钟自动切换到下一个形态
- 计时外：点桌宠 → 菜单 →"切换形态"手动轮播
- 不改代码的话，**放 1 张图也能正常用**（只有一个形态，轮播无效果而已）

**图片要求：**
- 支持 PNG / JPG / WEBP / GIF
- 建议正方形成比例的图（圆形头像框裁切后更美观）
- 建议透明背景 PNG（非强制，无背景更通透）
- 图片放好后重启 `npm run dev` 生效

> **没放图会怎样？** 桌宠显示 🐾 占位符，功能完全正常，不会报错或崩溃。放图后立绘才显示。

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
