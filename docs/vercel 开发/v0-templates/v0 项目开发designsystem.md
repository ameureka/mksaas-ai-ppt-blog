下面把在 v0 创建新项目、导入 CSS Design System 时需要填写/对齐的内容整理出来，并附上对应的变量、原则，方便你在导入弹窗中直接复制粘贴或调整。

1) 项目创建时的基础信息
项目名称：建议直接使用 mk-saas-blog，便于与代码仓库对齐，后续多人协作时减少混淆（如截图示例所示）。

设计体系来源说明：在备注或描述里写明“采用 MkSaaS Blog 默认主题（基于 Qoder 风格，Shadcn Dashboard 变量集）”，方便团队知道变量含义。引用文档链接可以用注释形式保留（见 CSS 顶部注释）。

2) 在 v0 的 “Import from CSS” 弹窗中粘贴的核心变量
把下列 CSS 变量整体粘贴到弹窗即可，覆盖浅色/深色、半径、阴影、字体和动画变量，确保与 MkSaaS Blog 主题一致：

:root {
  --background: oklch(1.0 0 0);
  --foreground: oklch(0.1448 0 0);
  --card: oklch(1.0 0 0);
  --card-foreground: oklch(0.1448 0 0);
  --popover: oklch(1.0 0 0);
  --popover-foreground: oklch(0.1448 0 0);
  --primary: oklch(0.6271 0.1699 149.2138);
  --primary-foreground: oklch(0.9851 0 0);
  --secondary: oklch(0.9702 0 0);
  --secondary-foreground: oklch(0.2046 0 0);
  --muted: oklch(0.9702 0 0);
  --muted-foreground: oklch(0.5555 0 0);
  --accent: oklch(0.9819 0.0181 155.8263);
  --accent-foreground: oklch(0.4479 0.1083 151.3277);
  --destructive: oklch(0.5771 0.2152 27.325);
  --destructive-foreground: oklch(0.9851 0 0);
  --border: oklch(0.9219 0 0);
  --input: oklch(0.9219 0 0);
  --ring: oklch(0.7227 0.192 149.5793);
  --chart-1: oklch(0.7227 0.192 149.5793);
  --chart-2: oklch(0.5555 0 0);
  --chart-3: oklch(0.1448 0 0);
  --chart-4: oklch(0.7155 0 0);
  --chart-5: oklch(0.9219 0 0);
  --sidebar: oklch(0.9702 0 0);
  --sidebar-foreground: oklch(0.5555 0 0);
  --sidebar-primary: oklch(0.6271 0.1699 149.2138);
  --sidebar-primary-foreground: oklch(0.9851 0 0);
  --sidebar-accent: oklch(0.9819 0.0181 155.8263);
  --sidebar-accent-foreground: oklch(0.4479 0.1083 151.3277);
  --sidebar-border: oklch(0.9219 0 0);
  --sidebar-ring: oklch(0.7227 0.192 149.5793);
  --font-sans: var(--font-noto-sans);
  --font-serif: var(--font-noto-serif);
  --font-mono: var(--font-noto-sans-mono);
  --radius: 0.5rem;
  --shadow-2xs: 0px 4px 8px 0px hsl(0 0% 0% / 0.03);
  --shadow-xs: 0px 4px 8px 0px hsl(0 0% 0% / 0.03);
  --shadow-sm: 0px 4px 8px 0px hsl(0 0% 0% / 0.05), 0px 1px 2px -1px hsl(0 0% 0% / 0.05);
  --shadow: 0px 4px 8px 0px hsl(0 0% 0% / 0.05), 0px 1px 2px -1px hsl(0 0% 0% / 0.05);
  --shadow-md: 0px 4px 8px 0px hsl(0 0% 0% / 0.05), 0px 2px 4px -1px hsl(0 0% 0% / 0.05);
  --shadow-lg: 0px 4px 8px 0px hsl(0 0% 0% / 0.05), 0px 4px 6px -1px hsl(0 0% 0% / 0.05);
  --shadow-xl: 0px 4px 8px 0px hsl(0 0% 0% / 0.05), 0px 8px 10px -1px hsl(0 0% 0% / 0.05);
  --shadow-2xl: 0px 4px 8px 0px hsl(0 0% 0% / 0.13);
}

/* Dark mode overrides */
.dark {
  --background: oklch(0.1591 0 0);
  --foreground: oklch(0.9702 0 0);
  --card: oklch(0.2046 0 0);
  --card-foreground: oklch(0.9702 0 0);
  --popover: oklch(0.2046 0 0);
  --popover-foreground: oklch(0.9702 0 0);
  --primary: oklch(0.8003 0.1821 151.711);
  --primary-foreground: oklch(0.1591 0 0);
  --secondary: oklch(0.9702 0 0);
  --secondary-foreground: oklch(0.2046 0 0);
  --muted: oklch(0.2686 0 0);
  --muted-foreground: oklch(0.7155 0 0);
  --accent: oklch(0.2638 0.0276 154.8977);
  --accent-foreground: oklch(0.8003 0.1821 151.711);
  --destructive: oklch(0.3958 0.1331 25.723);
  --destructive-foreground: oklch(0.9702 0 0);
  --border: oklch(0.4 0 0);
  --input: oklch(0.4 0 0);
  --ring: oklch(0.8003 0.1821 151.711);
  --chart-1: oklch(0.8003 0.1821 151.711);
  --chart-2: oklch(0.7155 0 0);
  --chart-3: oklch(0.9702 0 0);
  --chart-4: oklch(0.4386 0 0);
  --chart-5: oklch(0.2686 0 0);
  --sidebar: oklch(0.22 0 0);
  --sidebar-foreground: oklch(0.7155 0 0);
  --sidebar-primary: oklch(0.8003 0.1821 151.711);
  --sidebar-primary-foreground: oklch(0.1591 0 0);
  --sidebar-accent: oklch(0.2638 0.0276 154.8977);
  --sidebar-accent-foreground: oklch(0.8003 0.1821 151.711);
  --sidebar-border: oklch(0.2686 0 0);
  --sidebar-ring: oklch(0.8003 0.1821 151.711);
  --font-sans: var(--font-noto-sans);
  --font-serif: var(--font-noto-serif);
  --font-mono: var(--font-noto-sans-mono);
  --radius: 0.5rem;
  --shadow-2xs: 0px 4px 8px 0px hsl(0 0% 0% / 0.05);
  --shadow-xs: 0px 4px 8px 0px hsl(0 0% 0% / 0.05);
  --shadow-sm: 0px 4px 8px 0px hsl(0 0% 0% / 0.1), 0px 1px 2px -1px hsl(0 0% 0% / 0.1);
  --shadow: 0px 4px 8px 0px hsl(0 0% 0% / 0.1), 0px 1px 2px -1px hsl(0 0% 0% / 0.1);
  --shadow-md: 0px 4px 8px 0px hsl(0 0% 0% / 0.1), 0px 2px 4px -1px hsl(0 0% 0% / 0.1);
  --shadow-lg: 0px 4px 8px 0px hsl(0 0% 0% / 0.1), 0px 4px 6px -1px hsl(0 0% 0% / 0.1);
  --shadow-xl: 0px 4px 8px 0px hsl(0 0% 0% / 0.1), 0px 8px 10px -1px hsl(0 0% 0% / 0.1);
  --shadow-2xl: 0px 4px 8px 0px hsl(0 0% 0% / 0.25);
}

扩展可选项（可按需一起粘贴）
@theme inline 映射：若 v0 支持 CSS 变量导出，可保留映射块，确保 --color-*、--radius-*、--shadow-*、字体和动画变量一起被识别。

主题预设类：.theme-neutral / .theme-blue / .theme-green / .theme-amber 只是备用色板覆盖，可按需放入 v0 的全局样式里，通常保持默认即可。

3) 逻辑原则 / 对齐要点
变量命名保持一致：沿用 --background / --foreground / --primary 等 shadcn 变量名，避免在 v0 里改名，否则需要在组件层额外映射。

光暗双态成对维护： :root 与 .dark 必须成对复制，保证 v0 的暗色模式与代码一致。

半径与阴影不要删：组件圆角和层级投影依赖 --radius-*、--shadow-*，缺失会导致卡片、弹窗视觉不一致。

动画变量与字体：保留 --animate-* 与 --font-*，否则徽章、骨架屏等动效和字体回退会变形。

主题生成备注：文件头部注释列出了可视化生成器链接（如 shadcn 主题生成器）。如果你在 v0 里想二次微调，可先用这些工具改色再覆盖变量。

默认主题优先：代码建议优先使用 .theme-default（默认留空，表示保持主色），只有需要其他配色方案时再加 .theme-neutral / .theme-blue 等覆盖，避免破坏主体验。

按以上内容把 CSS 变量粘到 v0 “Import Theme” 弹窗即可完成对齐，后续在 v0 里创建组件时直接引用这些 CSS 自定义属性，即可保持与 mk-saas-blog 前端一致的色板、半径、阴影和动效。

