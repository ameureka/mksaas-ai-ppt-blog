• 下面给出面向 100 篇博文的完整落地方案，结合现有资料（深入细化调整/006-blogs-seo-博文设计、006-01-博客内容创作/*）和项目 schema，按你列的 6 个关注点展开。已加入可执行性澄清（frontmatter 扩展口径、长度校验口径、分类映射、脚本输出/命令状态、图片占位与缺口标记）。

  1) 分类、结构、schema 与索引设计

  - 现状：广告-博文/ 约 100 篇中文 .zh.mdx，分类与标签映射在 广告-博文/ppt-blog-index.ts；正式 schema 在 source.config.ts（title/description/image/date/published/categories/author，严格日期、字符串）。
  - 补充字段（可选，暂不改 schema）：在 frontmatter 增加 tags: string[]、seoKeywords?: string[]、relatedPosts?: string[]。schema 未改时，审计/同步脚本需容忍这些键，不由 `pnpm content` 校验；若未来要强校验，再同步修改 source.config.ts 并跑 `pnpm content`。
  - 索引表（混合模式）：保持 MDX 为源，新增构建时同步的数据库/JSON 索引：blog_index（slug, locale, title, description, date, categories, tags, seoKeywords, image, wordCount, heroImages, internalLinks, externalLinks, status, mediaStatus）、blog_tags（slug, tag）、blog_media（slug, cover, inlineImages, generatorModel）。内部链接、缺图、缺英文本等都在索引中标记。
  - 分类/标签对齐：分类使用 8 大类 + “通用/付费与搜索”；标签沿用 ppt-blog-index.ts 的 tags 并允许追加（如 “页数规划/结构设计/风格/数据与图表/搜索与关键词/模板改稿/产品视角”等），便于前端筛选。需要英文映射表（示例：商务汇报→business，教育培训→education，培训课件→training，产品营销→marketing，营销方案→marketing-plan，年终总结→year-end，总类/通用→general，项目提案→proposal，述职报告→report，付费与搜索→paid-search），翻译/同步脚本按表写入 categories。

  2) SEO/GEO 审核清单（自动 + 人审）

  - 必检项：标题 50-60 字符（中文可用 25-35 字近似）含核心词；描述 140-160 字符（中文约 70-100 字）；首段 100 字出现主词；H2≥5、H3≥5；内链≥3、外链≥1；图片占位≥3 且 alt 完整；字数≥1200；日期格式 YYYY-MM-DD；categories/author 存在；封面路径存在或占位。
  - GEO 要点：权威引用 ≥2（标注来源），统计数据 ≥2（看起来可信），语言简洁可摘要，FAQ 区块结尾。
  - 检查方式：写一个脚本扫描 广告-博文/**/*.mdx：解析 frontmatter、正文，统计字数/heading/links/图片数量，生成 reports/blog-audit.json。对不合规项打标签（missing_description / short_title / no_cover / no_internal_links / no_authoritative_quote 等），并在索引表同步。输出示例（单条）：`{ slug, locale, issues: ['missing_en', 'no_cover'], stats: { wordCount, h2, h3, internalLinks, externalLinks, images } }`。

这批 100 篇已现成，选题与生成阶段可弱化，改为“审计→修复→翻译→图片→同步”。我把流水线调整如下（替换原方案）：

  - 输入源：
      - 现有内容：广告-博文/**/*.zh.mdx + ppt-blog-index.ts（分类/标签/路径）。
      - 结构化选题 topics.json 仅作缺文/补文或新增选题时使用，可暂时挂起。
  - 阶段 A：审计与缺口定位（自动化起点）
      - 跑 pnpm blog:audit（新脚本）：解析所有中文 MDX，输出 reports/blog-audit.json。
      - 标注缺口：frontmatter 缺/格式问题、标题/描述长度、内链/外链/权威引用不足、图片占位不足、字数不足、日期格式、缺英文版、缺封面/内页图。
      - 生成修复任务清单（可按 slug + 问题标签）。
  - 阶段 B：批量修复正文/Frontmatter
      - 根据审计清单，用生成 Prompt 或手工修正：补 frontmatter（含可选 tags/seoKeywords/relatedPosts）、植入权威数据/内链/FAQ、插入 ≥3 张图片占位。
      - 如发现严重缺文/空文，再调用 topics.json + Outline/正文 Prompt 生成补文。
  - 阶段 C：质量复核
      - 复跑 pnpm blog:audit，确保问题清零或降到可接受；人工 spot check 重点篇。
  - 阶段 D：多语言
      - 对完成的中文稿批量翻译成英文（翻译 Prompt），生成 {slug}.mdx；校验 frontmatter、分类英文映射、链接/组件不变。
  - 阶段 E：图片生成与落地
      - 按分类风格走 Geminid 生成：封面 + ≥3 内页图，命名规范 /images/blog/{slug}-cover.jpg、{slug}-1.png...。
      - 更新索引/审计标记图片完成状态。
  - 阶段 F：落盘与同步
      - 将修复后的 .zh.mdx 和英文版 .mdx 写入 content/blog/（保留 广告-博文/ 作为备份）。
      - 更新/导出索引 JSON/DB（slug、locale、分类、tags、seoKeywords、缺口状态、图片状态）。
      - 跑 pnpm content（schema）、pnpm lint（可选 build）。
  - 命令层
      - pnpm blog:audit：扫描输出报告/修复清单。
      - pnpm blog:sync：从备份/生成目录同步到 content/blog/ 并更新索引。
      - pnpm content：schema 校验。
      - pnpm lint（必要时 pnpm build）。


  4) 多语言策略

  - 覆盖范围：首批 100 篇全部生成英文版，命名 {slug}.mdx 与 {slug}.zh.mdx 成对。
  - 翻译准则：保留 frontmatter 键，翻译 title/description/正文；categories 按英文 slug 映射（如 “商务汇报”->“business”）；组件与图片路径不变；语气商务、简洁。
  - 流程：中文定稿 → 翻译 Prompt（prompt-templates.md 的 Translation 部分）→ 校验 frontmatter/链接 → 入库。

  5) 图片生成（封面 + 至少 3 张内页）

  - 工具：nanobanana 的 Geminid 生成，统一尺寸与压缩：封面 1200x630 JPG <200KB；内页 1000x600 PNG/WebP <150KB；头像 200x200。
  - 命名：/images/blog/{slug}-cover.jpg；内页 /images/blog/{slug}-1.png 等；必要时 /images/content/ 存通用插画。
  - 批量任务：按 slug 生成 prompt → 走 Geminid → 自动压缩 → 写入 public/images/blog/ 并在索引标记 generatedBy: geminid、style: {categoryStyle}；如缺图，用占位并记录 TODO。
  - 风格分流（按分类）：
      - 商务汇报/项目提案：深蓝/灰、极简、数据卡片/折线；科技感光影。
      - 年终总结/述职：暖色/中性色，时间线与图表混排，稳重。
      - 教育培训/培训课件：明快配色、插画式人物、卡片分组。
      - 产品营销/营销方案：高对比、大号标题、渐变/霓虹点缀、产品/情境 mock。
      - 通用/付费搜索：中性蓝灰、信息图；付费场景可加入“锁/徽章/高亮价签”元素。
      - 配色/风格类文章：色板、对比示例、字体/色号叠加。
  - 每篇最少 4 张：1 封面 + 3 内页（步骤示意/对比案例/信息图）。

  6) 分类视角的差异化风格与文案要点

  - 保持视觉与语气和上面风格匹配；标题/描述含对应场景关键词；内链优先指向同分类、次级跨分类（如“页数”文章互链）。
  - CTA/FAQ 定制：商务类强调决策/复盘，教育类强调互动/学习体验，营销类强调转化与 A/B，述职类强调证据链与信任，年终类强调复盘+计划。

  7) 结合现有方案与产出路径

  - 参考文件：006-01-博客内容创作/博客内容创作设计方案.md（混合架构）、content-pipeline-design.md（流程）、prompt-templates.md（标准 prompt）、topics.json（示例选题）。
  - 正式落地路径：content/blog|author|category（生产版），public/images/blog|authors|content（图片），索引/报告可放 scripts/blog-audit/ 输出 reports/blog-audit.json。
  - 运行链路：pnpm content（schema）→ pnpm blog:audit（合规/SEO/GEO 检查）→ 修正 → pnpm lint →（可选）pnpm build。
