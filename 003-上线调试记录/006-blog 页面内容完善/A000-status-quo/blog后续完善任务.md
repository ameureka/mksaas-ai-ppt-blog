## 后续完善与操作流水线

- **日常发布流程**：1) 在 `content/blog` 新增中文 MDX（slug/文件名英文，补齐 category/summary/description/relatedPosts）；2) 运行 `pnpm content` 校验 frontmatter；3) `pnpm lint` 确认通过。
- **封面生成与压缩**：`pnpm tsx scripts/image-pipeline/generate-prompts.ts --mode=cover-only` 生成提示词（输出到 `draft-code/data/image-tasks.*`），按提示词用 Gemini 生成封面，命名 `/public/images/blog/{category}/{slug}-cover.jpg`，保持 <200KB；更新 MDX `image` 字段；必要时补传源文件至 `gemini 生图` 做留档。
- **链接与推荐修正**：新增/批量改稿后依次运行 `python 003-上线调试记录/006-blog 页面内容完善/A000-status-quo/内链外链/generate_related_posts.py`、`add_external_links.py`、`fix_blog_links.py`，确保 `seo_link_audit_report.md` 仍为 0 issues。
- **验证清单**：1) `pnpm build` 通过；2) spot-check 前台封面加载正常、比例未被拉伸；3) `seo_link_audit_report.md` 为 0；4) 公共目录中不存在 >200KB 的封面图。
- **可选改进（按需择一推进）**：1) 若需加速图片加载，评估接入 Cloudflare Images/R2 + `loader`，保留本地回退；2) 若要扩展内页配图，可将脚本 `generate-prompts.ts --mode=cover-and-inline` 与 `blog-image-tasks` 的内页数量解注释，增加占位/骨架加载；3) 为新增稿件补充 “延伸阅读” 外链，避免 SEO 警告。
