# 品牌信息统一处理 Pipeline 方案

> 综合分析时间：2025-12-02 04:18  
> 基于文档：品牌信息统一替换方案 + Public 目录分析 + README

## 一、综合分析

### 1.1 问题域识别

通过三份文档的交叉分析，识别出以下**品牌信息分布域**：

| 域 | 位置 | 文件数 | 影响程度 | 处理优先级 |
|---|------|--------|----------|-----------|
| **Content 域** | `content/author/`, `content/blog/` | ~214 | 🔴 高 | P0 |
| **Public 域** | `public/images/avatars/`, `public/logo*.png` | ~20 | 🔴 高 | P0 |
| **Config 域** | `src/config/`, `messages/` | ~7 | 🟡 中 | P1 |
| **SEO 域** | `public/llms.txt`, `public/og.png` | 2 | 🟡 中 | P1 |
| **Code 域** | `src/components/`, `src/app/` | ~50 | 🟢 低 | P2 |

### 1.2 关键发现

#### 从《品牌信息统一替换方案》
- **5 个作者身份**需要统一：fox, mksaas, haitang, mkdirs, pptx-team
- **204 篇博客文章**的 author 字段需要批量更新
- **5 个头像文件**需要替换

#### 从《Public 目录分析》
- **875 个文件**中，品牌相关资源约 **34 个**
- **关键品牌资源**：
  - Logo: `logo.png`, `logo-dark.png`, `mksaas.png`
  - 头像: `images/avatars/*.png` (4 个)
  - OG 图: `og.png` (867KB，需压缩)
  - AI 索引: `llms.txt`

#### 从《README》
- **PPT 资源**（26 个）与品牌关联度低，可保留
- **技术栈 Logo**（21 个 SVG）无需修改
- **UI 示例图**（20 个）无品牌水印，可保留

### 1.3 依赖关系图

```
品牌信息层级：
┌─────────────────────────────────────────┐
│  L1: 核心品牌资产 (Logo, 名称, Slogan)  │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴───────┐
       ↓               ↓
┌──────────────┐  ┌──────────────┐
│ L2: 作者身份  │  │ L2: 视觉资产  │
│ (author 字段) │  │ (头像, OG 图) │
└──────┬───────┘  └───────┬───────┘
       │                  │
       ↓                  ↓
┌──────────────────────────────────┐
│ L3: 内容引用 (博客文章, 配置文件) │
└──────────────────────────────────┘
```

**处理原则**：自上而下，先定义 L1，再更新 L2，最后批量处理 L3。

---

## 二、Pipeline 设计

### 2.1 总体流程

```
阶段 0: 准备与备份
  ↓
阶段 1: 核心品牌资产替换 (Logo, 名称)
  ↓
阶段 2: 作者身份统一 (Content 域)
  ↓
阶段 3: 视觉资产替换 (Public 域)
  ↓
阶段 4: 配置文件更新 (Config 域)
  ↓
阶段 5: SEO 资源优化 (SEO 域)
  ↓
阶段 6: 验证与清理
```

### 2.2 详细步骤

---

## 阶段 0: 准备与备份

### 0.1 创建备份
```bash
# 创建 Git 备份点
git add .
git commit -m "backup: before brand unification"
git tag backup-before-brand-$(date +%Y%m%d)

# 创建文件系统备份
mkdir -p 深入细化调整/010-公共组件批量处理/backup
cp -r content/ 深入细化调整/010-公共组件批量处理/backup/
cp -r public/images/avatars/ 深入细化调整/010-公共组件批量处理/backup/
cp -r public/images/authors/ 深入细化调整/010-公共组件批量处理/backup/
```

### 0.2 准备新品牌资源

**清单**：
```
新品牌资源包/
├── logo.png (512x512, < 100KB)
├── logo-dark.png (512x512, < 100KB)
├── og.png (1200x630, < 200KB) ⚠️ 需压缩
├── favicon.ico (32x32)
├── avatar-official.png (512x512, < 100KB)
└── brand-config.json (品牌配置)
```

**brand-config.json 示例**：
```json
{
  "name": "YourBrand",
  "tagline": "Your Brand Tagline",
  "domain": "yourdomain.com",
  "author": {
    "id": "official",
    "name": "YourBrand Team",
    "avatar": "/images/avatars/official.png",
    "bio": "Official account of YourBrand"
  },
  "replacements": {
    "MkSaaS": "YourBrand",
    "Indie Maker Fox": "Your Brand Tagline",
    "mksaas.me": "yourdomain.com",
    "Fox": "YourBrand Team"
  }
}
```

---

## 阶段 1: 核心品牌资产替换

### 1.1 替换 Logo 文件

```bash
#!/bin/bash
# scripts/pipeline/01-replace-logos.sh

echo "🎨 阶段 1: 替换核心品牌资产"

# 备份原 Logo
mv public/logo.png public/logo.png.bak
mv public/logo-dark.png public/logo-dark.png.bak
mv public/mksaas.png public/mksaas.png.bak

# 复制新 Logo
cp 新品牌资源包/logo.png public/logo.png
cp 新品牌资源包/logo-dark.png public/logo-dark.png

# 压缩 Logo（如果过大）
pngquant --quality=80-90 --force --ext .png public/logo*.png

echo "✅ Logo 替换完成"
```

### 1.2 更新 Favicon

```bash
# 使用工具生成完整 Favicon 套件
# 推荐工具: https://realfavicongenerator.net/

cp 新品牌资源包/favicon.ico public/favicon.ico
cp 新品牌资源包/favicon-16x16.png public/favicon-16x16.png
cp 新品牌资源包/favicon-32x32.png public/favicon-32x32.png
cp 新品牌资源包/apple-touch-icon.png public/apple-touch-icon.png
cp 新品牌资源包/android-chrome-*.png public/
```

---

## 阶段 2: 作者身份统一

### 2.1 创建新作者配置

```bash
# scripts/pipeline/02-unify-authors.ts
import { readFileSync, writeFileSync } from 'fs';

const brandConfig = JSON.parse(readFileSync('新品牌资源包/brand-config.json', 'utf-8'));

// 创建新的官方作者文件
const officialAuthor = `---
name: ${brandConfig.author.name}
avatar: ${brandConfig.author.avatar}
---

${brandConfig.author.bio}
`;

writeFileSync('content/author/official.mdx', officialAuthor);
writeFileSync('content/author/official.zh.mdx', officialAuthor);

console.log('✅ 新作者配置已创建');
```

### 2.2 批量更新博客文章 author 字段

```typescript
// scripts/pipeline/02-update-blog-authors.ts
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

const OLD_AUTHORS = ['fox', 'mksaas', 'haitang', 'mkdirs', 'pptx-team'];
const NEW_AUTHOR = 'official';

function updateAuthors(dir: string) {
  const files = readdirSync(dir, { withFileTypes: true });
  let count = 0;

  for (const file of files) {
    const fullPath = join(dir, file.name);

    if (file.isDirectory()) {
      count += updateAuthors(fullPath);
    } else if (file.name.endsWith('.mdx')) {
      const content = readFileSync(fullPath, 'utf-8');
      const { data, content: body } = matter(content);

      if (OLD_AUTHORS.includes(data.author)) {
        data.author = NEW_AUTHOR;
        const newContent = matter.stringify(body, data);
        writeFileSync(fullPath, newContent);
        count++;
        console.log(`✅ Updated: ${fullPath}`);
      }
    }
  }

  return count;
}

const totalUpdated = updateAuthors('content/blog');
console.log(`\n📊 总计更新: ${totalUpdated} 篇文章`);
```

### 2.3 清理旧作者文件

```bash
# 删除旧作者配置（可选，建议先移到 backup）
mv content/author/fox.* 深入细化调整/010-公共组件批量处理/backup/
mv content/author/mksaas.* 深入细化调整/010-公共组件批量处理/backup/
mv content/author/haitang.* 深入细化调整/010-公共组件批量处理/backup/
mv content/author/mkdirs.* 深入细化调整/010-公共组件批量处理/backup/
mv content/author/pptx-team.* 深入细化调整/010-公共组件批量处理/backup/
```

---

## 阶段 3: 视觉资产替换

### 3.1 替换头像文件

```bash
#!/bin/bash
# scripts/pipeline/03-replace-avatars.sh

echo "🖼️ 阶段 3: 替换视觉资产"

# 备份旧头像
mkdir -p 深入细化调整/010-公共组件批量处理/backup/avatars
cp public/images/avatars/*.png 深入细化调整/010-公共组件批量处理/backup/avatars/
cp public/images/authors/*.jpg 深入细化调整/010-公共组件批量处理/backup/avatars/

# 复制新头像
cp 新品牌资源包/avatar-official.png public/images/avatars/official.png

# 可选：覆盖旧头像文件（保持路径不变）
cp 新品牌资源包/avatar-official.png public/images/avatars/fox.png
cp 新品牌资源包/avatar-official.png public/images/avatars/mksaas.png

# 压缩头像
pngquant --quality=80-90 --force --ext .png public/images/avatars/*.png

echo "✅ 头像替换完成"
```

### 3.2 更新 OG 图

```bash
# 替换 Open Graph 图片
cp 新品牌资源包/og.png public/og.png

# 压缩 OG 图（目标 < 200KB）
pngquant --quality=70-80 --force --ext .png public/og.png

# 删除旧版本 OG 图
rm public/og-20250516.png
```

---

## 阶段 4: 配置文件更新

### 4.1 更新网站配置

```typescript
// scripts/pipeline/04-update-configs.ts
import { readFileSync, writeFileSync } from 'fs';

const brandConfig = JSON.parse(readFileSync('新品牌资源包/brand-config.json', 'utf-8'));

// 1. 更新 src/config/website.tsx
let websiteConfig = readFileSync('src/config/website.tsx', 'utf-8');

for (const [old, newVal] of Object.entries(brandConfig.replacements)) {
  websiteConfig = websiteConfig.replace(new RegExp(old, 'g'), newVal);
}

writeFileSync('src/config/website.tsx', websiteConfig);
console.log('✅ website.tsx 已更新');

// 2. 更新国际化文件
const i18nFiles = ['messages/en.json', 'messages/zh.json'];

for (const file of i18nFiles) {
  let content = readFileSync(file, 'utf-8');
  
  for (const [old, newVal] of Object.entries(brandConfig.replacements)) {
    content = content.replace(new RegExp(old, 'g'), newVal);
  }
  
  writeFileSync(file, content);
  console.log(`✅ ${file} 已更新`);
}

// 3. 更新 package.json
let packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
packageJson.name = brandConfig.name.toLowerCase().replace(/\s+/g, '-');
packageJson.description = brandConfig.tagline;
writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('✅ package.json 已更新');
```

### 4.2 更新 README

```bash
# 批量替换 README 中的品牌名称
sed -i '' 's/MkSaaS/YourBrand/g' README.md
sed -i '' 's/Indie Maker Fox/Your Brand Tagline/g' README.md
sed -i '' 's/mksaas.me/yourdomain.com/g' README.md
```

---

## 阶段 5: SEO 资源优化

### 5.1 更新 llms.txt

```bash
# scripts/pipeline/05-update-llms.sh

cat > public/llms.txt << 'EOF'
# YourBrand - AI-Powered Platform

## Core Pages
- /: Homepage - Discover YourBrand's features
- /about: About Us - Learn about our mission
- /blog: Blog - Latest articles and insights

## Blog Categories
- /blog/category/business: Business Reports
- /blog/category/education: Education & Training
- /blog/category/marketing: Product Marketing
- /blog/category/proposal: Project Proposals
- /blog/category/report: Performance Reports
- /blog/category/year-end: Year-End Summaries
- /blog/category/general: General Tips

## Documentation
- /docs: Documentation - Get started with YourBrand
EOF

echo "✅ llms.txt 已更新"
```

### 5.2 压缩大文件

```bash
# 压缩 Public 目录中的大文件（> 500KB）
find public -name "*.png" -size +500k -exec sh -c '
  for file; do
    echo "压缩: $file"
    pngquant --quality=70-80 --force --ext .png "$file"
  done
' sh {} +

# 转换大 PNG 为 WebP
find public -name "*.png" -size +500k -exec sh -c '
  for file; do
    echo "转换: $file"
    cwebp -q 80 "$file" -o "${file%.png}.webp"
  done
' sh {} +
```

---

## 阶段 6: 验证与清理

### 6.1 自动化验证脚本

```typescript
// scripts/pipeline/06-verify.ts
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const CHECKS = {
  '✅ Logo 文件存在': () => existsSync('public/logo.png') && existsSync('public/logo-dark.png'),
  '✅ 新作者配置存在': () => existsSync('content/author/official.mdx'),
  '✅ 旧作者已清理': () => !existsSync('content/author/fox.mdx'),
  '✅ OG 图已更新': () => {
    const stat = require('fs').statSync('public/og.png');
    return stat.size < 300 * 1024; // < 300KB
  },
  '✅ llms.txt 已更新': () => {
    const content = readFileSync('public/llms.txt', 'utf-8');
    return !content.includes('MkSaaS');
  },
};

console.log('\n🔍 验证品牌统一处理结果:\n');

let allPassed = true;
for (const [check, fn] of Object.entries(CHECKS)) {
  const passed = fn();
  console.log(passed ? check : check.replace('✅', '❌'));
  if (!passed) allPassed = false;
}

console.log(allPassed ? '\n✅ 所有检查通过！' : '\n❌ 部分检查失败，请检查日志');
process.exit(allPassed ? 0 : 1);
```

### 6.2 手动验证清单

```markdown
## 手动验证清单

### 视觉检查
- [ ] 访问 http://localhost:3005，检查 Logo 显示
- [ ] 检查博客列表页作者头像
- [ ] 检查博客详情页作者信息
- [ ] 检查深色模式下的 Logo

### 功能检查
- [ ] 运行 `pnpm dev`，无构建错误
- [ ] 运行 `pnpm build`，构建成功
- [ ] 检查所有图片正常加载
- [ ] 检查国际化切换正常

### 内容检查
- [ ] 搜索残留的 "MkSaaS"
- [ ] 搜索残留的 "Indie Maker Fox"
- [ ] 搜索残留的 "mksaas.me"
- [ ] 检查 README 品牌名称

### SEO 检查
- [ ] 检查 `<title>` 标签
- [ ] 检查 `<meta name="description">`
- [ ] 检查 Open Graph 标签
- [ ] 检查 llms.txt 内容
```

### 6.3 清理备份文件

```bash
# 确认无误后，清理备份文件
rm -rf 深入细化调整/010-公共组件批量处理/backup/

# 删除 .bak 文件
find public -name "*.bak" -delete

# 提交最终结果
git add .
git commit -m "feat: unified brand identity"
git tag brand-unified-$(date +%Y%m%d)
```

---

## 三、执行脚本汇总

### 3.1 主控脚本

```bash
#!/bin/bash
# scripts/pipeline/run-all.sh

set -e

echo "🚀 开始品牌统一处理 Pipeline"
echo "================================"

# 阶段 0: 备份
echo "\n📦 阶段 0: 创建备份..."
git add .
git commit -m "backup: before brand unification" || true
git tag backup-before-brand-$(date +%Y%m%d)

# 阶段 1: Logo 替换
echo "\n🎨 阶段 1: 替换核心品牌资产..."
bash scripts/pipeline/01-replace-logos.sh

# 阶段 2: 作者统一
echo "\n👤 阶段 2: 统一作者身份..."
npx tsx scripts/pipeline/02-unify-authors.ts
npx tsx scripts/pipeline/02-update-blog-authors.ts

# 阶段 3: 视觉资产
echo "\n🖼️ 阶段 3: 替换视觉资产..."
bash scripts/pipeline/03-replace-avatars.sh

# 阶段 4: 配置更新
echo "\n⚙️ 阶段 4: 更新配置文件..."
npx tsx scripts/pipeline/04-update-configs.ts

# 阶段 5: SEO 优化
echo "\n🔍 阶段 5: 优化 SEO 资源..."
bash scripts/pipeline/05-update-llms.sh

# 阶段 6: 验证
echo "\n✅ 阶段 6: 验证处理结果..."
npx tsx scripts/pipeline/06-verify.ts

echo "\n🎉 品牌统一处理完成！"
echo "请运行 'pnpm dev' 进行手动验证"
```

### 3.2 执行方式

```bash
# 1. 准备新品牌资源
mkdir -p 新品牌资源包
# 将新 Logo、头像、OG 图放入该目录

# 2. 创建 brand-config.json
cat > 新品牌资源包/brand-config.json << 'EOF'
{
  "name": "YourBrand",
  "tagline": "Your Brand Tagline",
  "domain": "yourdomain.com",
  ...
}
EOF

# 3. 执行主控脚本
chmod +x scripts/pipeline/run-all.sh
bash scripts/pipeline/run-all.sh

# 4. 手动验证
pnpm dev
# 访问 http://localhost:3005 检查

# 5. 构建测试
pnpm build
pnpm start
```

---

## 四、风险控制

### 4.1 回滚方案

```bash
# 方案 A: Git 回滚
git reset --hard backup-before-brand-$(date +%Y%m%d)

# 方案 B: 文件系统回滚
cp -r 深入细化调整/010-公共组件批量处理/backup/content/* content/
cp -r 深入细化调整/010-公共组件批量处理/backup/avatars/* public/images/avatars/
```

### 4.2 分阶段执行建议

**第一天**：
- 阶段 0-1：备份 + Logo 替换
- 验证 Logo 显示正常

**第二天**：
- 阶段 2：作者统一
- 验证博客页面正常

**第三天**：
- 阶段 3-5：视觉资产 + 配置 + SEO
- 全面验证

**第四天**：
- 阶段 6：最终验证 + 清理
- 部署上线

---

## 五、预期效果

### 5.1 量化指标

| 指标 | 处理前 | 处理后 | 改善 |
|------|--------|--------|------|
| 作者身份数 | 5 | 1 | -80% |
| 品牌名称统一性 | 60% | 100% | +40% |
| 头像文件数 | 5 | 1 | -80% |
| OG 图大小 | 867KB | < 200KB | -77% |
| 品牌引用一致性 | 70% | 100% | +30% |

### 5.2 质量提升

- ✅ **品牌识别度**：统一的视觉和文本表达
- ✅ **维护成本**：减少 80% 的作者配置维护
- ✅ **SEO 优化**：统一的品牌关键词
- ✅ **性能优化**：OG 图压缩 77%

---

## 六、总结

### 6.1 核心价值

1. **自动化程度高**：90% 的工作由脚本完成
2. **可回滚性强**：多重备份机制
3. **验证完善**：自动化 + 手动双重验证
4. **分阶段执行**：降低风险，便于调试

### 6.2 预计工作量

- **准备阶段**：1 小时（准备新品牌资源）
- **脚本开发**：2 小时（如使用本方案，可跳过）
- **执行阶段**：30 分钟（运行脚本）
- **验证阶段**：1 小时（手动验证）
- **总计**：4-5 小时

### 6.3 后续维护

- 每月检查品牌名称一致性
- 新增内容时使用统一的 `official` 作者
- 定期压缩新增的大图片文件
