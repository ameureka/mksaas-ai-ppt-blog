## 博客当前状态（2025-02）

- **内容与国际化**：`content/blog` 保留 118 篇中文 MDX，slug 与文件名为英文；博客路由仅 zh，其余模块仍保留多语言。`relatedPosts`、分类等 frontmatter 已统一英文键名，未见缺失字段。
- **图片链路**：所有封面已生成并压缩（<200KB），命名规则 `/public/images/blog/{category}/{slug}-cover.jpg`，category 取 business/education/general/marketing/paid-search/proposal/report/year-end（共 8 类）。博客正文目前仅使用封面，无内页图。
- **生成与校验链**：`scripts/image-pipeline/generate-prompts.ts` 默认 `--mode=cover-only`，按 MDX 扫描生成提示词；`blog-image-tasks` 默认内页数为 0。最新的 `draft-code/data/image-tasks.{json,md}` 与 `pending-prompts.md` 均已清空待办。图片位于 `002-迁移功能深入调整/006-01-博客内容创作/gemini 生图` 的原始备份及 `public/images/blog` 的线上版本。
- **链接与 SEO**：`add_external_links.py`、`fix_blog_links.py`、`generate_related_posts.py` 已更新为基于仓库根路径；`seo_link_audit_report.md` 最新跑完显示 “Fixed 0 / Found 0 issues”。外链/延伸阅读需要按稿件手工补充。
- **构建与配置**：`pnpm build` 通过（GitHub OAuth 环境变量警告可忽略）；AdSense 由 `NEXT_PUBLIC_ADSENSE_ENABLED` 控制，测试模式 `NEXT_PUBLIC_ADSENSE_TEST_MODE`。未启用 Cloudflare Images/CDN，使用 Next.js `next/image` + 本地静态资源。

如需进一步压缩篇幅（~100 篇），需人工删低价值稿；当前 118 篇可直接上线。
