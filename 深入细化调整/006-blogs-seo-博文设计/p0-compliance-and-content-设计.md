# P0 合规页与现有内容落地设计方案（草案）

## 1. 背景与目标
- **目的**：以最小改动满足 AdSense/合规基础要求，补齐必备静态页，并将已备份的博客内容与图片落地到正式结构，确保 `pnpm content` 可通过。
- **衡量标准**：合规页可访问、内容渲染正常、图片无 404、构建通过、无明显 CLS。

## 2. 范围
- **包含**：
  - About / Contact / Privacy Policy 页面（i18n 路由下的营销分组）。
  - 现有 MDX 内容同步（博客/作者/分类）。
  - 图片目录与命名落地。
  - 基础验证（lint/build/内容生成）。
- **不包含**：
  - 新广告位、AdSense 集成。
  - 新功能/表单后端处理。
  - 新文章创作（仅同步已有备份）。

## 3. 前置条件
- 设计/文案：About/Contact/Privacy 文案已定（如需修改，先定稿）。
- 资源：备份 MDX、作者/分类文件、图片素材（或明确占位文件）。
- 路由：确认营销路由分组位置（默认 `src/app/[locale]/(marketing)/`）。
- Schema：`source.config.ts` 未变更；若变更需先评审再执行。

## 4. 输出与路径
- **设计文件**：本方案。若后续更新，保持同路径增补版本号。
- **开发临时输出**：`深入细化调整/开发输出/p0-compliance-and-content/`（草稿/占位代码、图片放置于此，评审后迁移）。
- **正式迁移路径**：
  - 页面：`src/app/[locale]/(marketing)/about|contact|privacy-policy/page.tsx`
  - 内容：`content/blog|author|category`
  - 图片：`public/images/blog|authors|content`

## 5. 设计细节
### 5.1 页面（About/Contact/Privacy）
- **布局**：复用现有营销布局组件（如公共 Layout/Container/Section），保持一致的排版/间距。
- **多语言**：在 `[locale]` 路由下提供页面，若暂无翻译，可先用同一语言占位。
- **模块建议**：
  - About：简介、团队/使命、数据亮点、产品价值、联系方式。
  - Contact：联系表单（前端校验）、邮件/社媒/地址列表、FAQ 快链。
  - Privacy：信息收集、Cookie/AdSense 说明、第三方供应商、用户权利、生效日期。
- **无后端依赖**：Contact 表单初期可保留前端占位与校验，提交可暂用 toast 提示，后续再接 Server Action。

### 5.2 内容同步（MDX）
- **文件来源**：`深入细化调整/006-blogs-seo-博文设计/205-adsence-article-blogs-design/code-backup/content/` 中的 blog/author/category。
- **Frontmatter 校验**：`title/description/image/date/categories/author/published`（必填），`premium`（可选），日期格式 `YYYY-MM-DD`。
- **多语言**：文件成对 `slug.mdx` / `slug.zh.mdx`，缺失时标记 TODO。
- **内链/外链**：内链指向 `/blog/{slug}`；外链保持 https，添加权威引用。

### 5.3 图片落地
- **命名**：kebab-case，封面 `{slug}-cover.jpg`，内容 `{slug}-{n}.png`，头像 `{author}.jpg`。
- **目录**：`/images/blog`（封面/内容）、`/images/authors`（头像）、`/images/content`（通用）。
- **规格控制**：封面 1200x630 < 200KB；内容图 800-1000 宽 < 150KB；头像 200x200。
- **占位策略**：若暂缺素材，用占位文件并在 README 中列出待补清单。

## 6. 验证与验收
- **构建链路**：`pnpm content`（无 schema 报错）→ `pnpm lint` → `pnpm build`（可选）。
- **页面检查**：About/Contact/Privacy 在本地路由可访问，排版正常，无明显 CLS。
- **资源检查**：图片路径 200/404 检查，前端控制台无资源错误。
- **内容检查**：MDX 元数据齐全，日期/slug 正确，内链可跳转。

## 7. 风险与缓解
- **图片缺失/命名不符** → 先用占位，README 列出缺口；统一命名规则。
- **多语言缺口** → 临时同语言占位，列待翻译清单。
- **布局侵入现有样式** → 优先复用现有 UI 组件，避免自定义全局样式；页面隔离测试。
- **构建失败（schema/日期格式）** → 落地前跑 `pnpm content`，集中修正 frontmatter。

## 8. 里程碑（建议）
- D0：Spec 评审通过。
- D1：在开发输出目录完成页面草稿 + 内容/图片落地占位。
- D2：迁移到正式路径，跑验证链路，修正问题。
- D3：验证通过后收口，记录遗留项（素材/翻译）。

## 9. 评审清单
- 路由位置与 i18n 是否确认。
- 文案/法律条款来源是否确认（Privacy 是否含 AdSense 声明）。
- 图片清单与占位方案是否明确。
- MDX frontmatter 字段与命名是否一致。
- 验证步骤与回滚方案（如临时恢复旧页面/占位）。

## 10. 附录：页面代码骨架 (参考)

```tsx
import { useTranslations } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';

interface PageProps {
  params: { locale: string };
}

export default function AboutPage({ params: { locale } }: PageProps) {
  // Enable static rendering
  unstable_setRequestLocale(locale);
  
  const t = useTranslations('About');

  return (
    <div className="container py-12">
      <div className="prose max-w-3xl mx-auto">
        <h1>{t('title')}</h1>
        <p>{t('description')}</p>
        {/* Add content here */}
      </div>
    </div>
  );
}
```
