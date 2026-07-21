# 学时喵 · TimeKitten

记录每天学习时长的二次元通透风 Windows 桌面应用，含可常驻桌面的 Q 版桌宠。

## 功能一览

- 📋 **每日计划**：新建/改名/删除/拖拽排序，自动分配区分色
- ⏱️ **正向计时**：点计划开始计时，SVG 环形进度盘秒级刷新，停止后自动记录时长
- 📊 **时长可视化**：Doughnut 圆环图 + 排行榜，支持日/周/月 + 自定义时间范围切换
- 📝 **每日日记**：Markdown 编辑/预览，自动保存到数据库
- 🐾 **桌宠**：透明置顶窗口悬浮桌面
  - **v0.3+**：帧序列动画（idle/active/happy 三态），5 形态 × 130 帧，setInterval 固定间隔驱动
  - **v0.2**：5 张静态图 + CSS 呼吸/摇摆动效，30 分钟自动轮播
  - 圆形玻璃拟态头像框 + 光晕脉冲 + 悬浮粒子特效，可拖拽移动

## 技术栈

- **Electron 35 + React 18 + TypeScript 5.6**
- 构建：electron-vite（开发 HMR）+ electron-builder（打包 Windows）
- 数据：better-sqlite3（WAL 模式，本地库）
- 拖拽：@dnd-kit（计划排序）
- 桌宠：独立透明 BrowserWindow + setInterval 帧动画 + CSS 动效 + IPC 图片加载
- UI：二次元通透风（玻璃拟态 + 柔光渐变 + 描边），主题/皮肤系统可替换
- 包管理：npm

## 安装与使用

从 [Releases](https://github.com/voidseason/TimeKitten/releases) 页面下载最新 `.exe` 安装包，双击安装即可。

## 版本历史

| 版本 | Tag | 桌宠形态 | 说明 |
|------|-----|---------|------|
| **v0.3** | `v0.3.0` | 🎬 帧序列动画 | 5 形态 × 3 动画状态（idle/active/happy），130 帧 setInterval 驱动 |
| **v0.2** | `v0.2.0` | 🖼️ 5 张静态图 | CSS 呼吸/摇摆动效，30 分钟自动轮播，圆形玻璃头像框 |
| **v0.1** | — | — | 计划 + 计时 + 统计核心功能（无桌宠） |

### 如何切换到旧版本？

如果你更喜欢 v0.2 的静态图桌宠（无需帧序列图片，放 5 张图即可），可以切换到 v0.2 版本：

```bash
# 克隆仓库
git clone https://github.com/voidseason/TimeKitten.git
cd TimeKitten

# 查看所有版本标签
git tag

# 切换到 v0.2 静态图版本
git checkout v0.2.0

# 然后正常安装运行
$env:ELECTRON_MIRROR="https://registry.npmmirror.com/-/binary/electron/"
npm install
npx @electron/rebuild
npm run dev
```

> **v0.2 vs v0.3 桌宠差异**：
> - v0.2：只需在 `assets/pet/` 放几张图，改 `petForms.ts` 配好文件名即可。桌宠通过 CSS 动画（呼吸起伏 + 摇摆）让图片动起来，效果简洁。
> - v0.3：需要按 `assets/pet/form{1-5}/{idle,active,happy}/` 目录结构放置帧序列图片（每形态 26 张），可以实现眨眼、专注、庆祝等帧动画，效果更生动。没有帧序列时自动降级为 v0.2 模式。

## 面向开发者：从源码构建

### 第一步：清除 VSCode 泄漏的环境变量

VSCode 集成终端有时会泄漏 `ELECTRON_RUN_AS_NODE=1` 环境变量，导致 Electron 无法正常启动。

```powershell
# 临时清除（每次打开终端都要执行）
Remove-Item Env:\ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue

# 永久方案：写入 PowerShell Profile，每次打开终端自动清除
if (!(Test-Path $PROFILE.CurrentUserAllHosts)) {
  New-Item -Path $PROFILE.CurrentUserAllHosts -Force | Out-Null
}
Add-Content -Path $PROFILE.CurrentUserAllHosts -Value @'
# 自动清除 VSCode 终端泄漏的 ELECTRON_RUN_AS_NODE 变量
if ($env:ELECTRON_RUN_AS_NODE) {
  Remove-Item Env:\ELECTRON_RUN_AS_NODE
}
'@
```

> ⚠️ 这不是你安装的程序导致的，是 VSCode 自身的 Electron 子进程变量泄漏到集成终端。详见下方"常见环境问题"。

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

### 第四步：启动与打包

```bash
npm run dev         # 开发模式（HMR 热更新）
npm run typecheck   # 类型检查
npm run build       # 构建
npm run package:win # 打包 Windows 安装包（输出到 release/）
```

## 常见环境问题

### `Error: Cannot read properties of undefined (reading 'requestSingleInstanceLock')`

- **原因**：环境变量 `ELECTRON_RUN_AS_NODE=1` 导致 Electron 以 Node.js 模式运行，`electron.app` 等内置模块不可用。
- **来源**：这个变量 **不是你安装的程序添加的**，而是 VSCode 集成终端的已知问题——VSCode 本身就是 Electron 应用，内部用该变量启动 Node 子进程，偶尔泄漏到终端会话。
- **解决**：
  ```powershell
  Remove-Item Env:\ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
  npm run dev
  ```
  或者执行上面"第一步"的永久方案，写入 PowerShell Profile。

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
  npm install
  ```

### 安装了新 Electron 版本后启动不了

- **原因**：每次更换 Electron 版本，都需要重新编译原生模块。
- **解决**：运行 `npx @electron/rebuild`。

## 桌宠图片配置

### v0.3 帧动画模式（默认）

桌宠使用帧序列动画，目录结构：

```
assets/pet/
  form1/              # 水手服（源图：图片4.png）
    idle/   frame_00.png ~ frame_07.png   (8帧，待机呼吸+眨眼)
    active/ frame_00.png ~ frame_07.png   (8帧，专注学习)
    happy/  frame_00.png ~ frame_09.png   (10帧，庆祝跳跃)
  form2/              # 元气马尾（源图：图片1.png）
    idle/   ...   active/ ...   happy/ ...
  form3/              # 悠闲时刻（源图：图片3.png）
    idle/   ...   active/ ...   happy/ ...
  form4/              # 温柔一面（源图：图片2.png）
    idle/   ...   active/ ...   happy/ ...
  form5/              # 闪耀盛装（源图：图片5.png）
    idle/   ...   active/ ...   happy/ ...
```

- 帧图片 128×128px PNG 透明底
- 没有帧序列时**自动降级为 v0.2 单图模式**（使用 `petForms.ts` 里配的 `file` 作为 fallback）
- 帧动画配置在 `src/shared/petForms.ts`，可调整 fps（默认 idle 1.2fps / active 2fps / happy 3fps）
- 图片来源说明和生成指南详见 `assets/pet/帧动画生成指南.md`

### v0.2 静态图兼容模式

如果不想准备帧序列（或者切换到了 `v0.2.0` tag），只需放几张图：

```ts
// src/shared/petForms.ts — 最简配置
export const PET_FORMS: PetForm[] = [
  { id: 'form1', name: '默认', file: 'my-character.png', unlockSeconds: 0 }
  // 多个形态就写多条
]
```

图片放 `assets/pet/` 下，支持 PNG/JPG/WEBP/GIF，建议正方形透明底。

### 没放图会怎样？

桌宠显示 🐾 占位符，功能正常，不报错不崩溃。

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
        JournalView.*  每日日记（Markdown 编辑/预览）
        SettingsModal.* 设置弹窗（数据路径切换等）
      pet/
        PetApp.tsx         桌宠主组件（帧动画/形态切换/菜单/拖拽/粒子特效）
        pet.css            桌宠样式（动效关键帧）
        useFrameAnimation.ts 帧动画 Hook（rAF 驱动）
      theme/
        ThemeProvider.tsx  React Context 主题注入
      styles/
        global.css     全局样式 + 通透风背景
  shared/
    types.ts        共享类型（Plan, TimeSession, PlanTimeSummary, IPC_CHANNELS, AnimState, PetAnimation）
    petForms.ts     桌宠形态配置（帧动画 + fallback 单图）
    theme/          主题/皮肤系统
      types.ts      Theme 类型定义
      themes.ts     内置主题（星海通透 / 治愈暖阳）
      applyTheme.ts 主题 → CSS 变量注入
assets/
  pet/             桌宠立绘图片（用户自备，.gitignore 忽略）
    帧动画生成指南.md  供生图 Agent 使用的帧序列生成说明
    帧动画修正提示词.md 修复生成图片问题的提示词模板
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
| journals | date PK, content, updated_at |

IPC 通道常量 → `src/shared/types.ts` 的 `IPC_CHANNELS`。

## 分支策略

- `main` — 发布分支（稳定版）
- `dev` — 日常开发分支（当前）
