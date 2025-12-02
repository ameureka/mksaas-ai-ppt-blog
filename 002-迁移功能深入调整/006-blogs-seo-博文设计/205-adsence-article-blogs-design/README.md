# AdSense 博客系统 - 使用说明

## 目录结构

```
docs/adsence-article/
├── README.md                           # 本使用说明
├── FINAL-SUMMARY.md                    # 完整总结文档
├── blog-integration-plan.md            # mk-saas-blog 集成方案
├── image-requirements.md               # 图片需求清单
├── content-creation-topics.md          # 60+ 文章主题库
├── mk-saas-blog.md                     # mk-saas 官方文档参考
├── ad-system-analysis.md               # 广告系统完整分析报告
├── google-adsense-integration-guide.md # Google AdSense 集成指南
├── mksaas-docs-blog-*.pdf              # mk-saas 官方文档 PDF
└── code-backup/                        # 代码备份目录
    ├── app-pages/                      # Next.js 页面代码
    └── content/                        # MDX 博客内容
```

---

## 快速开始

### 1. 查看已完成的工作

阅读 `FINAL-SUMMARY.md` 了解所有已完成的工作。

### 2. 制作图片

参考 `image-requirements.md` 使用 Canva 制作：
- 1 张封面图
- 8 张内容配图
- 1 张作者头像

### 3. 继续创作文章

参考 `content-creation-topics.md` 选择下一篇文章主题。

### 4. 未来集成 mk-saas

参考 `blog-integration-plan.md` 进行迁移。

---

## 代码使用说明

### 页面代码

`code-backup/app-pages/` 目录包含所有页面的参考代码。

**已部署的页面**：
- `app/blog/page.tsx` - 博客列表 ✅
- `app/blog/[slug]/page.tsx` - 博客详情 ✅
- `app/terms/page.tsx` - 服务条款 ✅

**待部署的页面**（代码在 code-backup）：
- `app/about/page.tsx` - 关于我们 ⏳
- `app/contact/page.tsx` - 联系我们 ⏳
- `app/privacy-policy/page.tsx` - 隐私政策 ⏳

### 部署待创建页面

```bash
# 创建目录并复制代码
mkdir -p app/about app/contact app/privacy-policy

# 然后将 code-backup/app-pages/ 中的代码复制到对应目录
# 注意：需要根据项目实际情况调整 import 路径
```

### MDX 内容

`code-backup/content/` 目录包含所有 MDX 文件的备份。

实际内容已部署在项目的 `content/` 目录：
- `content/blog/` - 博客文章
- `content/author/` - 作者信息
- `content/category/` - 分类信息

---

## 集成到 mk-saas

### 步骤 1：复制内容

```bash
cp -r content/blog /path/to/mksaas/content/
cp -r content/author /path/to/mksaas/content/
cp -r content/category /path/to/mksaas/content/
```

### 步骤 2：复制图片

```bash
cp -r public/images/blog /path/to/mksaas/public/images/
cp -r public/images/authors /path/to/mksaas/public/images/
```

### 步骤 3：重新生成

```bash
cd /path/to/mksaas
pnpm run content
```

---

## 文章创作流程

1. 从 `content-creation-topics.md` 选择主题
2. 创建 MDX 文件：`content/blog/article-slug.zh.mdx`
3. 填写 frontmatter（title, description, image, date, categories, author）
4. 撰写内容（遵循 SEO/GEO 优化要点）
5. 制作配图（参考 `image-requirements.md`）
6. 创建英文版本：`content/blog/article-slug.mdx`

---

---

## 更多信息

- 完整文件列表：`FILE-INDEX.md`
- 项目状态总结：`FINAL-SUMMARY.md`
- AdSense 申请指南：`google-adsense-integration-guide.md`
- 广告系统分析：`ad-system-analysis.md`

如有问题，请参考相关文档或联系开发团队。
