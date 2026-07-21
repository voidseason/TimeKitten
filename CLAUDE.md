# CLAUDE.md — 学时喵 · TimeKitten

> 记录每天学习时长的动漫风 Windows 桌面应用，含可常驻桌面的桌宠。

## 技术栈与运行

- Electron v35 + React 18 + TypeScript 5.6
- electron-vite（构建/HMR）+ electron-builder（打包 Windows）
- better-sqlite3（数据层，WAL 模式，需 `@electron/rebuild` 编译原生模块）
- dnd-kit（拖拽排序）、Live2D（桌宠动画，模块5）
- npm 包管理

```bash
npm install      # 安装依赖（需要 ELECTRON_MIRROR 加速，见下文）
npx @electron/rebuild  # 重编译 better-sqlite3 原生模块匹配 Electron 版本
npm run dev      # 开发模式（HMR），启动窗口 + dev server
npm run build    # 构建
npm run typecheck # 类型检查
```

**Electron 下载镜像**：始终设置环境变量加速下载
```powershell
$env:ELECTRON_MIRROR="https://registry.npmmirror.com/-/binary/electron/"
```

## 常见环境问题

- `ELECTRON_RUN_AS_NODE=1` 环境变量 → Electron 永远以 Node 模式运行，内置 `electron` 模块不可用。删掉该环境变量后重启终端。
- `NODE_MODULE_VERSION mismatch` → better-sqlite3 与 Electron 内置 Node 版本不匹配，运行 `npx @electron/rebuild`。

## 目录结构

```
src/
  main/            Electron 主进程
    index.ts       入口 — 单实例锁、IPC 注册、窗口创建
    windows/       窗口类（mainWindow, petWindow 模块5）
    ipc/           所有 IPC handler（windowControls, dbHandlers）
    db/            数据库层
      schema.ts    建表 SQL
      connection.ts 单例连接
      dao.ts       CRUD + 统计查询
  preload/
    index.ts       contextBridge 暴露 api 给渲染进程
    index.d.ts     类型声明
  renderer/
    index.html     主界面入口
    pet.html       桌宠窗口入口（模块5）
    src/
      main.tsx     React 挂载点
      pet.tsx      桌宠占位
      App.tsx      根组件（两栏布局）
      App.css
      components/
        TitleBar.*     自绘标题栏 + 主题切换
        PlanList.*     计划列表容器（dnd-kit 排序）
        PlanCard.*     单张计划卡片
        PlanAddInput.* 新增计划输入
      theme/
        ThemeProvider.tsx  React Context 主题注入
      styles/
        global.css     全局样式 + 通透风背景
  shared/
    types.ts        共享类型（Plan, TimeSession, PlanTimeSummary, IPC_CHANNELS）
    theme/
      types.ts      主题 Ts 定义
      themes.ts     内置主题（星海通透 aurora / 治愈暖阳 sunny）
      applyTheme.ts 主题 → CSS 变量
```

## 架构约束

1. **渲染进程无 Node 权限**：所有数据库/系统操作通过 `preload` 的 `api.*` 桥，不能直接 `import 'electron'`
2. **UI 模板化可替换**：所有颜色/圆角/阴影走 `Theme` 定义 → 注入 CSS 变量，组件只用 `var(--xxx)`。新增皮肤在 `src/shared/theme/themes.ts` 追加一份 `Theme` 即可
3. **数据流单向**：渲染层 → IPC invoke → 主进程 handler → DAO → SQLite
4. **桌宠窗口独立**：`pet.html` 是独立 BrowserWindow（透明置顶、无边框、穿透点击），模块5 实现

## 数据库（模块1）

文件位置：`%APPDATA%/TimeKitten/timekitten.db`

| 表 | 说明 |
|---|---|
| plans | id, title, color, sort_order, is_active, created_at, updated_at |
| time_sessions | id, plan_id, started_at, ended_at, duration_seconds, 索引(plan_id, started_at) |
| settings | key PK, value |

IPC 通道常量在 `src/shared/types.ts` 的 `IPC_CHANNELS` 定义。

## 模块进度

| 模块 | 内容 | 状态 |
|------|------|------|
| 0 | 脚手架 + 主题系统 + Git 双分支 | ✅ done |
| 1 | 数据层（表 + DAO + IPC） | ✅ done |
| 2 | 每日计划列表（PlanList/PlanCard/PlanAddInput） | ✅ done |
| 3 | 正向计时（TimerRing/TimerPanel） | ✅ done |
| 4 | 时长圆环可视化（DonutChart/StatLegend/StatView） | ✅ done |
| 5 | 桌宠（透明置顶窗 + CSS 动效 + 30min 轮播） | ✅ done |

## 桌宠模块要点（模块5）

- 独立 `BrowserWindow`：`transparent + frame:false + alwaysOnTop('screen-saver') + skipTaskbar`
- 图片资源在 `assets/pet/`（.gitignore 忽略），通过 IPC 读取为 base64 dataURL 传给渲染层（绕过 CSP `file://`）
- 形态配置在 `src/shared/petForms.ts`，计时中每 `PET_FORM_ROTATE_MINUTES`（默认 30）分钟自动轮播下一张；非计时时通过菜单手动轮播
- 计时状态通过 `pet:timer-state` 通道：主界面 → 主进程 → 桌宠窗口
- 打包：`electron-builder` 的 `extraResources` 把 `assets/pet` 复制进 `resources/`

## 开发踩坑记录

- **`ELECTRON_RUN_AS_NODE` 环境变量**：系统存在此变量时 Electron 以纯 Node.js 模式运行，`electron.app` 等为 `undefined`。需删除此变量并重启终端。
- **`better-sqlite3` 原生模块**：每次换 Electron 版本需 `npx @electron/rebuild` 重新编译，否则 `NODE_MODULE_VERSION` 不匹配（`ERR_DLOPEN_FAILED`）。
- **Electron 下载**：国内建议用 `ELECTRON_MIRROR=npmmirror` 加速。

## 分支策略

- `main` — 发布/稳定
- `dev` — 日常开发（当前）

## Git 提交策略
- 每完成一个模块进行一次提交
- 大版本打 annotated tag（`git tag -a v0.3.0 -m "..."`）
- tag 命名：`v<major>.<minor>.<patch>`