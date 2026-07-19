# 学时喵 · TimeKitten

记录每天学习时长的动漫风 Windows 桌面应用，含可常驻桌面的桌宠（兽耳娘）。

## 技术栈

- **Electron + React + TypeScript**
- 构建：electron-vite（开发 HMR）+ electron-builder（打包）
- 数据：better-sqlite3（模块1起）
- 桌宠动画：Live2D / pixi-live2d-display（模块5）
- UI：二次元通透风（玻璃拟态 + 柔光渐变 + 描边），主题/皮肤系统可替换

## 目录结构

```
src/
  main/        Electron 主进程（窗口、IPC、桌宠窗口）
  preload/     受控的 IPC 桥（contextBridge）
  renderer/    React 渲染层（主界面 + 桌宠窗口入口）
  shared/      主进程与渲染层共享代码（主题系统等）
```

## 换 UI / 换皮肤

所有界面颜色走 `src/shared/theme` 定义的 Theme 令牌，注入为 CSS 变量。
新增皮肤：在 `src/shared/theme/themes.ts` 追加一份 `Theme` 即可，主题切换会自动出现。

## 开发命令

```bash
npm install       # 安装依赖
npm run dev       # 开发模式（HMR）
npm run build     # 构建
npm run typecheck # 类型检查
npm run package:win  # 打包 Windows 安装包
```

## 分支策略

- `main` — 发布分支（稳定版）
- `dev` — 生产/日常开发分支

## 开发路线图

- [x] 模块0：脚手架 + 主题系统 + Git 双分支
- [ ] 模块1：数据层
- [ ] 模块2：每日计划列表
- [ ] 模块3：正向计时
- [ ] 模块4：时长圆环可视化
- [ ] 模块5：桌宠
