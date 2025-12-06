# 广告 / AdSense 目前现状（2025-02）

## 📊 总体状态：✅ 代码就绪（本地可用）；需配置上线参数

博客 / PPT 页面广告位、组件冲突等问题已修复，前后端“看广告换下载”链路可用。当前默认仅开启 AdSense 渲染开关；积分发放总开关保持关闭。

---

## ✅ 已完成（代码与结构）

### 页面广告位
- 博客详情：顶部横幅、侧栏矩形/摩天楼、底部 Multiplex，组件在 `src/components/ads`，入口 `src/app/[locale]/(marketing)/blog/[...slug]/page.tsx`。
- PPT 列表：第 5/11 位插入原生卡片 `NativeAdCard`，入口 `src/app/[locale]/(marketing)/ppt/page.tsx`。
- PPT 详情：评价区上方横幅 + 推荐列表原生广告，入口 `src/app/[locale]/(marketing)/ppt/[id]/page.tsx`。
- 下载弹窗：集成“观看广告解锁下载”流程，逻辑在 `src/components/ppt/download/download-modal.tsx`。

### 架构与配置
- 组件统一：已清理旧的 `src/components/ppt/ads/`，仅使用 `src/components/ads`。
- CLS 占位：广告组件带默认高度，避免布局抖动。
- 脚本与 headers：`src/app/[locale]/layout.tsx` 注入 AdSense script；`next.config.ts` 配置 `/ads.txt` 头。
- 法律链接：页脚含 `/privacy-policy`、`/terms`。

---

## 🚀 待执行（上线前动作）

### 1) 数据库同步
- 运行 `pnpm db:push` 或 `pnpm db:migrate`，确保存在 `ad_watch_record`、`user_download_history`、`user_credit`、`credit_transaction`、`download_record` 等表。

### 2) 环境变量
- `NEXT_PUBLIC_ADSENSE_ENABLED=true` 打开渲染；`NEXT_PUBLIC_ADSENSE_TEST_MODE=true` 可预览占位。
- `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXXXXXXX`。
- Slot IDs：`NEXT_PUBLIC_ADSENSE_BLOG_BANNER`、`_BLOG_SIDEBAR`、`_BLOG_VERTICAL`、`_BLOG_MULTIPLEX`、`_PPT_NATIVE` 等按单元填充。

### 3) ads.txt
- 更新 `public/ads.txt` 中的 `pub-XXXXXXXXXXXXXXXX` 为真实 Publisher ID。

### 4) 功能开关与文案
- `websiteConfig.adReward.enable=true`（默认）；`websiteConfig.credits.enableCredits=false`，当前“看广告”只解锁下载，不写积分流水。若要发积分需同时开启 credits 并配置 Stripe 价格/余额策略。
- 前端倒计时用 `watchDuration`，后端校验用 `minWatchDuration`，需保持文案/引导一致。

---

## 📝 结论

代码与页面广告位已就绪；上线前需完成 DB 同步、环境变量、ads.txt 填充。若需“看广告得积分”，需同时打开 credits 配置；否则默认只提供广告解锁下载。此前组件冲突/缺失已解决。
