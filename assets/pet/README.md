# 桌宠图片资源

把桌宠的立绘图片（PNG/JPG/WEBP/GIF）放在此目录，文件名与 `src/shared/petForms.ts` 里配置的 `file` 字段一致。

## 当前配置的形态文件

- `图片4.png` — 水手服（默认）
- `图片1.png` — 元气马尾
- `图片3.png` — 悠闲时刻
- `图片2.png` — 温柔一面
- `图片5.png` — 闪耀盛装

## 切换机制

计时中每 30 分钟（`PET_FORM_ROTATE_MINUTES`）自动切换到下一个形态；非计时时通过桌宠菜单手动轮播。

## 注意

- 此目录下的图片文件已在 `.gitignore` 中忽略，不进版本控制（版权+体积）。
- 打包时通过 `electron-builder` 的 `extraResources` 复制进 `resources/assets/pet`。
