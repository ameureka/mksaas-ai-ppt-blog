✦ 基于对您的代码库的全面分析，以下是关于当前网站设计是否满足 AdSense 快速启动要求的详细报告。

  ✅ 已就绪项目 (Ready)

   1. Google AdSense 核心脚本集成:
       * 状态: ✅ 已完成
       * 位置: src/app/[locale]/layout.tsx
       * 说明: 网站已配置好根据环境变量 NEXT_PUBLIC_ADSENSE_ENABLED 自动在全局注入 Google AdSense 脚本 (adsbygoogle.js)。

   2. 必备法律页面:
       * 状态: ✅ 已存在
       * 文件: content/pages/privacy-policy.mdx (隐私政策) 和 content/pages/terms-of-service.mdx (服务条款)。
       * 说明: 这是 AdSense 审核的强制性要求，内容源文件已就位。

   3. SEO 技术配置:
       * 状态: ✅ 良好
       * Sitemap: src/app/sitemap.ts 能够正确生成包含首页、博客文章、分类页和文档页的站点地图，并支持多语言 (hreflang)。
       * Robots.txt: src/app/robots.ts 配置正确，允许搜索引擎抓取主要内容。

   4. 配置管理:
       * 状态: ✅ 良好
       * 文件: src/lib/config/adsense.ts 提供了完善的配置管理，通过环境变量控制发布商 ID 和广告位 ID，便于后续维护。

  ---

  ❌ 关键缺失与问题 (Critical Issues)

  虽然基础架构已就绪，但目前的网站设计 尚未 准备好进行广告展示，主要存在以下阻碍：

   1. 博客页面缺少广告位代码:
       * 问题: 尽管集成指南中规划了广告位，但实际的博客详情页代码 (src/app/[locale]/(marketing)/blog/[...slug]/page.tsx) 完全没有引入或使用任何广告组件。
       * 影响: 即使审核通过，您的博客文章页面也不会显示任何广告，导致收入为零。
       * 修复建议: 需按照设计文档，将 DisplayAd 组件插入到文章顶部、侧边栏或正文内容中。

   2. 存在冲突的广告组件:
       * 问题: 项目中存在两个 DisplayAd 组件，且实现不一致：
           * src/components/ads/display-ad.tsx: 真实实现。包含真实的 adsbygoogle.push 逻辑。
           * src/components/ppt/ads/display-ad.tsx: Mock/占位符实现。仅显示骨架屏和"广告位"文字，不包含真实的广告代码。
       * 风险: 如果开发时错误引用了 ppt 目录下的组件，上线后广告将无法加载。

   3. 导航栏与页脚链接验证:
       * 待确认: 虽然法律页面的 内容文件 存在，但需确保网站的 页脚 (Footer) 实际包含了指向 /privacy-policy 和 /terms-of-service 的可见链接。这是 AdSense 审核员检查的第一项内容。

  📝 下一步行动建议

  为了快速启动 AdSense，建议执行以下操作：

   1. 统一广告组件: 建议删除或更新 src/components/ppt/ads/display-ad.tsx，确保所有页面都使用 src/components/ads/display-ad.tsx 中的真实逻辑。
   2. 植入广告位: 修改博客详情页 (src/app/[locale]/(marketing)/blog/[...slug]/page.tsx)，引入 DisplayAd 组件。
       * 建议位置: 侧边栏底部 (BlogSidebarAd) 和 文章标题下方 (BlogBannerAd)。
   3. 配置环境变量: 确保生产环境的 .env 文件中设置了 NEXT_PUBLIC_ADSENSE_ENABLED=true 和有效的 NEXT_PUBLIC_ADSENSE_PUBLISHER_ID。
   4. 检查页脚: 确认网站页脚有清晰的"隐私政策"和"服务条款"链接。

✦ 基于 google-adsense-integration-guide.md 指南与当前代码库的对比，我为您整理了以下具体的实施建议和差异分析。

  📋 状态总览
  指南是一份非常完善的 "AdSense 最佳实践" 文档，但在代码落地层面，目前的实现还比较初级。

  核心差距：
   1. 广告组件实现不一致：代码中有两套广告组件，且都没有完全达到指南中建议的 "高性能/防CLS" 标准。
   2. 页面覆盖率低：指南建议在首页、分类页、详情页均投放广告，但目前实际上这些页面 全都没有 植入广告代码。
   3. 关键配置缺失：ads.txt 未配置，且 next.config.ts 缺少对应的 Header 规则。

  ---

  🛠️ 具体实施建议 (Action Plan)

  建议按照以下顺序执行，以达到指南要求的标准：

  1. 标准化广告组件 (Priority: High)
  指南中的 DisplayAd 组件代码（4.2 章节）非常优秀，包含了懒加载、占位符和防布局偏移逻辑。
   * 行动: 使用指南中的代码替换 src/components/ads/display-ad.tsx（注意不是 ppt 目录下的那个，建议统一使用 src/components/ads/ 作为源头）。
   * 清理: 删除 src/components/ppt/ads/display-ad.tsx，避免混淆。

  2. 植入广告位 (Priority: High)
  根据指南 4.3 和 5.2 章节，您需要在以下文件添加组件：

   * 首页 (`src/app/[locale]/(marketing)/(home)/page.tsx`):
       * 目前的首页只是简单转发到 SearchHomePage。
       * 建议: 既然转发了，应在 src/app/[locale]/(marketing)/ppt/page.tsx (即 SearchHomePage) 中添加 <BannerAd /> (顶部) 和 <MobileBannerAd /> (移动端)。

   * 博客详情页 (`src/app/[locale]/(marketing)/blog/[...slug]/page.tsx`):
       * 建议: 在 <PremiumBadge> 附近或标题下方添加 <BannerAd />。
       * 建议: 在右侧 Sidebar 的 "Table of Contents" 下方添加 <SidebarAd />。

   * 博客分类页 (`src/app/[locale]/(marketing)/blog/(blog)/category/[slug]/page.tsx`):
       * 建议: 在 BlogGridWithPagination 组件上方添加 <BannerAd />。

  3. 配置 ads.txt (Priority: Medium)
  指南 7.4 章节提到了防止广告欺诈的 ads.txt。
   * 行动: 编辑 public/ads.txt，填入您真实的 AdSense ID（格式：google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0）。
   * 行动: 在 next.config.ts 的 headers() 方法中添加规则（目前代码中完全没有这个配置）：

   1     // next.config.ts
   2     async headers() {
   3       return [
   4         {
   5           source: '/ads.txt',
   6           headers: [{ key: 'Content-Type', value: 'text/plain' }],
   7         },
   8       ];
   9     }

  4. 环境变量检查 (Priority: Medium)
  指南 4.1 章节列出了需要的环境变量。
   * 行动: 检查生产环境（Vercel 等）是否已设置：
       * NEXT_PUBLIC_ADSENSE_PUBLISHER_ID
       * NEXT_PUBLIC_ADSENSE_ENABLED=true
       * 以及各个 _BANNER 对应的 Slot ID。

  ---

  🚀 一键修复指令
  如果您希望我开始执行，请告诉我。我可以：
   1. 重构组件: 将指南中的 DisplayAd 代码写入 src/components/ads/display-ad.tsx。
   2. 页面植入: 自动修改上述 3 个关键页面文件，插入广告位。
   3. 配置更新: 更新 next.config.ts 添加 ads.txt 支持。
