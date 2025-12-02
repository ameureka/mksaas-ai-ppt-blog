# Brand Strategy Design Skill

完整的品牌战略设计 Claude Skill,从需求分析到技术实施的全流程自动化。

## 功能特性

✅ **9 阶段完整流程**
- 需求分析 → 品牌战略 → 视觉系统 → 内容营销 → 用户增长 → 商业模式 → 执行路线图 → 技术实施 → 快速开始

✅ **标准化输出**
- 9 个 Markdown 文档
- 1 个 JSON 配置文件
- 3 个自动化脚本
- 完整的品牌资产目录

✅ **灵活适配**
- 支持完整流程或单独阶段
- 根据预算推荐不同方案
- 适配不同行业和产品类型

## 快速开始

### 1. 安装 Skill

```bash
# 复制到 Claude Skills 目录
cp -r brand-strategy-design ~/.claude/skills/

# 或项目级别安装
cp -r brand-strategy-design .claude/skills/
```

### 2. 使用 Skill

在 Claude 对话中:

```
我需要为我的 PPT 模板下载站设计品牌战略。
目标用户是大学生和公务员,核心功能是 AI 推荐模板。
```

Claude 会自动识别并调用 `brand-strategy-design` Skill。

### 3. 验证输出

```bash
# 验证品牌配置
python scripts/validate-brand-config.py brand-config.json

# 生成 Favicon
./scripts/generate-favicon.sh brand-assets/logo/logo-icon.png
```

## 输出文件

```
品牌营销设计suit/
├── 品牌战略设计方案.md          # 完整战略文档
├── brand-config-template.json   # 品牌配置模板
├── logo-design-prompts.md       # Logo 设计方案
├── logo-generation-tools.md     # 工具推荐指南
├── generate-favicon.sh          # Favicon 生成脚本
├── 执行清单.md                  # 进度追踪
├── 快速开始.md                  # 快速开始指南
└── brand-assets/                # 品牌资产目录
```

## 使用场景

### 场景 1: 完整品牌设计

**输入**:
```
我有一个新产品需要从零开始设计品牌。
```

**输出**: 完整的 9 个文档 + 配置文件 + 脚本

---

### 场景 2: 仅视觉系统

**输入**:
```
品牌名称已确定,只需要设计 Logo 和配色。
```

**输出**: Logo 设计方案 + 配色系统 + Favicon 脚本

---

### 场景 3: 营销策略

**输入**:
```
品牌和视觉已完成,需要制定营销策略。
```

**输出**: 内容营销文档 + 用户增长策略 + SEO 方案

## 依赖工具

### 必需
- Python 3.6+
- Bash

### 可选(用于 Favicon 生成)
- ImageMagick
- pngquant

```bash
# macOS
brew install imagemagick pngquant

# Ubuntu
sudo apt-get install imagemagick pngquant
```

## 配置选项

### 自定义模板

编辑 `resources/templates/` 中的模板文件以适配你的需求。

### 调整输出格式

修改 `SKILL.md` 中的文档结构定义。

## 最佳实践

1. **提供详细信息**: 产品定位、目标受众、核心功能越详细,输出越精准
2. **分阶段执行**: 可以先完成前期阶段,确认后再进入后续阶段
3. **验证配置**: 使用验证脚本检查配置文件格式和对比度
4. **版本控制**: 将输出文档纳入 Git 版本控制

## 故障排查

### 问题: Skill 未被触发

**检查**:
- 是否在对话中明确提到"品牌设计"、"品牌战略"等关键词?
- Skill 是否正确安装在 `~/.claude/skills/` 或 `.claude/skills/`?

### 问题: 脚本执行失败

**检查**:
- 依赖是否已安装?
- 文件权限是否正确?

```bash
chmod +x scripts/*.sh
```

## 版本历史

- **v1.0.0** (2025-12-02): 初始版本

## 贡献

欢迎提交 Issue 和 Pull Request!

## 许可证

MIT License

## 作者

基于实际品牌战略设计项目提炼而成。
