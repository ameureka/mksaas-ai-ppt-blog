# 博客内容处理流水线 - 草稿代码

> **重要**: 本目录包含博客内容处理流水线的草稿代码，所有代码需要校验通过后才能迁移到主项目。

## 目录结构

```
draft-code/
├── scripts/                    # 脚本代码
│   ├── blog-audit/            # 审计脚本
│   │   ├── index.ts           # 主入口
│   │   ├── rules.ts           # 审计规则
│   │   └── parsers.ts         # 解析器
│   ├── blog-fix/              # 修复脚本
│   │   ├── index.ts           # 主入口
│   │   ├── frontmatter.ts     # Frontmatter 修复
│   │   └── content.ts         # 正文修复
│   ├── blog-translate/        # 翻译脚本
│   │   ├── index.ts           # 主入口
│   │   └── prompts.ts         # 翻译 Prompt
│   ├── blog-image-tasks/      # 图片任务脚本
│   │   ├── index.ts           # 主入口
│   │   ├── prompts.ts         # 图片 Prompt
│   │   └── validate.ts        # 图片验证
│   ├── blog-sync/             # 同步脚本
│   │   └── index.ts           # 主入口
│   └── blog-validate/         # 验收脚本
│       └── index.ts           # 主入口
├── config/                     # 配置文件
│   ├── category-map.ts        # 分类映射
│   └── audit-rules.ts         # 审计规则配置
├── reports/                    # 输出报告
│   ├── blog-audit.json        # 审计报告
│   └── image-tasks.md         # 图片任务清单
├── tests/                      # 测试文件
│   └── *.test.ts              # 单元测试
└── README.md                   # 本文件
```

## 使用方法

### 1. 安装依赖

```bash
# 在主项目根目录
pnpm install
```

### 2. 运行脚本

```bash
# 审计
npx tsx 深入细化调整/006-01-博客内容创作/draft-code/scripts/blog-audit/index.ts

# 修复
npx tsx 深入细化调整/006-01-博客内容创作/draft-code/scripts/blog-fix/index.ts

# 翻译
npx tsx 深入细化调整/006-01-博客内容创作/draft-code/scripts/blog-translate/index.ts

# 图片任务
npx tsx 深入细化调整/006-01-博客内容创作/draft-code/scripts/blog-image-tasks/index.ts

# 同步
npx tsx 深入细化调整/006-01-博客内容创作/draft-code/scripts/blog-sync/index.ts

# 验收
npx tsx 深入细化调整/006-01-博客内容创作/draft-code/scripts/blog-validate/index.ts
```

### 3. 运行测试

```bash
npx vitest run 深入细化调整/006-01-博客内容创作/draft-code/tests/
```

## 迁移流程

1. **开发阶段**: 在 `draft-code/` 中开发和测试
2. **测试阶段**: 运行所有测试，确保功能正确
3. **审核阶段**: 人工审核代码质量
4. **迁移阶段**:
   - 将脚本迁移到 `scripts/` 目录
   - 更新 `package.json` 添加命令
   - 更新导入路径
5. **验证阶段**: 在主项目中运行验证

## 数据流

```
广告-博文/（100 篇 MDX）
    ↓
[blog-audit] → reports/blog-audit.json
    ↓
[blog-fix] → 修复后的 MDX
    ↓
[blog-translate] → 中英文成对 MDX
    ↓
[blog-image-tasks] → reports/image-tasks.md
    ↓
[手工生成图片] → public/images/blog/
    ↓
[blog-sync] → content/blog/
    ↓
[blog-validate] → 验收报告
```

## 相关文档

- 需求文档: `.kiro/specs/blog-content-pipeline/requirements.md`
- 设计文档: `.kiro/specs/blog-content-pipeline/design.md`
- 任务列表: `.kiro/specs/blog-content-pipeline/tasks.md`
- 执行细节: `深入细化调整/006-01-博客内容创作/流水线设计-博文生产/博客综合处理方案-执行细节.md`
