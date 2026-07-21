# CLAUDE.md — 学时喵 · TimeKitten

> 记录每天学习时长的动漫风 Windows 桌面应用，含可常驻桌面的桌宠。

## 技术栈与运行

- Electron v35 + React 18 + TypeScript 5.6
- electron-vite（构建/HMR）+ electron-builder（打包 Windows）
- better-sqlite3（数据层，WAL 模式，需 `@electron/rebuild` 编译原生模块）
- dnd-kit（拖拽排序）
- npm 包管理

```bash
npm install      # 安装依赖（需要 ELECTRON_MIRROR 加速，见下文）
npx @electron/rebuild  # 重编译 better-sqlite3 原生模块匹配 Electron 版本
npm run dev      # 开发模式（HMR），启动窗口 + dev server
npm run build    # 构建
npm run typecheck # 类型检查
npm run package:win # 打包 Windows 安装包（输出到 release/）
```

**Electron 下载镜像**：始终设置环境变量加速下载
```powershell
$env:ELECTRON_MIRROR="https://registry.npmmirror.com/-/binary/electron/"
```

## 常见环境问题

- `ELECTRON_RUN_AS_NODE=1` 环境变量 → VSCode 集成终端泄漏导致 Electron 以 Node 模式运行，`electron` 模块不可用。在终端执行 `Remove-Item Env:\ELECTRON_RUN_AS_NODE` 后重试，或写入 PowerShell Profile 自动清除。
- `NODE_MODULE_VERSION mismatch` → better-sqlite3 与 Electron 内置 Node 版本不匹配，运行 `npx @electron/rebuild`。

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
        TitleBar.*        自绘标题栏 + 主题切换 + 桌宠开关
        PlanList.*        计划列表容器（dnd-kit 排序）
        PlanCard.*        单张计划卡片
        PlanAddInput.*    新增计划输入
        TimerPanel.*      计时面板（开始/停止/今日累计）
        TimerRing.*       SVG 环形进度盘
        DonutChart.*      SVG 扇区圆环图
        StatLegend.*      排行榜/图例
        StatView.*        统计面板容器（日/周/月切换）
        JournalView.*     每日日记（Markdown 编辑/预览）
        SettingsModal.*   设置弹窗（数据路径切换）
      pet/
        PetApp.tsx         桌宠主组件（帧动画/形态切换/菜单/拖拽/粒子特效）
        pet.css            桌宠样式（CSS 关键帧动画 + 玻璃拟态头像框）
        useFrameAnimation.ts 帧动画 Hook（setInterval 固定间隔驱动）
      theme/
        ThemeProvider.tsx  React Context 主题注入
      styles/
        global.css     全局样式 + 通透风背景
  shared/
    types.ts        共享类型（Plan, TimeSession, PlanTimeSummary, IPC_CHANNELS, AnimState, PetAnimation, PetTimerState）
    petForms.ts     桌宠形态配置（帧动画 fps/帧数 + fallback 单图文件名）
    theme/
      types.ts      主题 Ts 定义
      themes.ts     内置主题（星海通透 aurora / 治愈暖阳 sunny）
      applyTheme.ts 主题 → CSS 变量
assets/
  pet/             桌宠图片资源（.gitignore 忽略）
    帧动画生成指南.md  供生图 Agent 使用的帧序列生成说明
    帧动画修正提示词.md 修复生成图片问题的提示词模板
```

## 架构约束

1. **渲染进程无 Node 权限**：所有数据库/系统操作通过 `preload` 的 `api.*` 桥，不能直接 `import 'electron'`
2. **UI 模板化可替换**：所有颜色/圆角/阴影走 `Theme` 定义 → 注入 CSS 变量，组件只用 `var(--xxx)`。新增皮肤在 `src/shared/theme/themes.ts` 追加一份 `Theme` 即可
3. **数据流单向**：渲染层 → IPC invoke → 主进程 handler → DAO → SQLite
4. **桌宠窗口独立**：`pet.html` 是独立 BrowserWindow（透明置顶、无边框、穿透点击）

## 数据库（模块1）

文件位置：`%APPDATA%/TimeKitten/timekitten.db`

| 表 | 说明 |
|---|---|
| plans | id, title, color, sort_order, is_active, created_at, updated_at |
| time_sessions | id, plan_id, started_at, ended_at, duration_seconds, 索引(plan_id, started_at) |
| settings | key PK, value |
| journals | date PK, content, updated_at |

IPC 通道常量在 `src/shared/types.ts` 的 `IPC_CHANNELS` 定义。

## 模块进度

| 模块 | 内容 | 状态 |
|------|------|------|
| 0 | 脚手架 + 主题系统 + Git 双分支 | ✅ done |
| 1 | 数据层（表 + DAO + IPC） | ✅ done |
| 2 | 每日计划列表（PlanList/PlanCard/PlanAddInput） | ✅ done |
| 3 | 正向计时（TimerRing/TimerPanel） | ✅ done |
| 4 | 时长圆环可视化（DonutChart/StatLegend/StatView） | ✅ done |
| 5 | 桌宠基础（透明置顶窗 + CSS 动效 + 30min 轮播） | ✅ done |
| 6 | 桌宠帧动画（idle/active/happy 三态 setInterval 帧序列） | ✅ done |

## 桌宠模块要点

### 窗口（petWindow.ts）

- 独立 `BrowserWindow`：`transparent + frame:false + alwaysOnTop('screen-saver') + skipTaskbar`
- 尺寸 240×320（含菜单展开空间），默认放在主显示器右下角
- 加载 `pet.html`，运行独立的 React 组件树（PetApp）

### 图片加载

- 图片资源在 `assets/pet/`（.gitignore 忽略），通过 IPC 读取为 base64 dataURL 传给渲染层（绕过 CSP `file://`）
- `PET_GET_ASSET`：读取单个文件 → base64 dataURL
- `PET_LIST_ASSETS`：列出所有图片文件
- `PET_LIST_FRAMES`：列出指定形态/动画状态的帧文件（按文件名排序）

### 帧动画系统（模块6）

- 类型：`AnimState = 'idle' | 'active' | 'happy'`，`PetAnimation = { state, frames, fps }`
- 配置：`src/shared/petForms.ts`，每个 `PetForm` 可选 `animations` 字段
- 运行时：`useFrameAnimation` hook，`setInterval` 固定间隔驱动（不受显示器刷新率影响）
- 降级：帧序列不存在时自动退回单图 + CSS 呼吸/摇摆动画
- 目录约定：`assets/pet/{formId}/{state}/frame_NN.png`
- 帧速率：idle 1.2fps / active 2fps / happy 3fps（慢速呼吸感）

### 形态切换

- 计时中：每 `PET_FORM_ROTATE_MINUTES`（默认 30）分钟自动轮播下一形态
- 计时外：点桌宠 → 菜单 →"切换形态"手动轮播

### 计时状态通信

- 计时状态通过 `pet:timer-state` 通道：主界面 → 主进程 → 桌宠窗口
- PetApp 挂载时主动查询是否有活跃会话（`sessionGetActive`），确保打开桌宠即同步

### 视觉效果

- 圆形玻璃拟态头像框（`border-radius: 50%` + 毛玻璃 `backdrop-filter: blur(4px)` + 阴影）
- 计时中光晕脉冲（`glow-pulse` 关键帧）
- 悬浮粒子特效（hover 时触发 `float-up` 动画）
- 有帧动画时自动关闭 CSS 呼吸/摇摆关键帧（`.pet--sprite` 类）

### 打包

- `electron-builder` 的 `extraResources` 把 `assets/pet` 复制进 `resources/`

## Git 标签/版本

| Tag | 说明 |
|-----|------|
| `v0.3.0` | 帧动画桌宠（当前） |
| `v0.2.0` | 静态图桌宠（CSS 动效） |

## 开发踩坑记录

- **`ELECTRON_RUN_AS_NODE` 环境变量**：来自 VSCode 集成终端泄漏（VSCode 本身是 Electron 应用，用该变量启动 Node 子进程），导致 `electron.app` 为 `undefined`。临时解决：`Remove-Item Env:\ELECTRON_RUN_AS_NODE`。永久解决：写入 PowerShell Profile 自动清除。
- **`better-sqlite3` 原生模块**：每次换 Electron 版本需 `npx @electron/rebuild` 重新编译，否则 `NODE_MODULE_VERSION` 不匹配（`ERR_DLOPEN_FAILED`）。
- **Electron 下载**：国内建议用 `ELECTRON_MIRROR=npmmirror` 加速。
- **帧动画 FPS**：初始设 8fps 太快（像鬼畜），降到 idle 1.2fps 才有舒缓呼吸感。帧动画速度要远低于常规动画（桌宠是微动摄影风格）。
- **rAF vs setInterval**：`requestAnimationFrame` 在 165Hz 高刷显示器上每 ~6ms 触发一次，远比目标帧间隔短，导致 delta 判断不稳定。桌宠这种超低帧率场景适合用 `setInterval` 固定间隔。

## 分支策略

- `main` — 发布/稳定
- `dev` — 日常开发（当前）

## Git 提交策略
- 每完成一个模块进行一次提交
- 大版本打 annotated tag（`git tag -a v0.3.0 -m "..."`）
- tag 命名：`v<major>.<minor>.<patch>`
- 发版流程：dev 稳定 → merge 到 main → 在 main 上打 tag → push both