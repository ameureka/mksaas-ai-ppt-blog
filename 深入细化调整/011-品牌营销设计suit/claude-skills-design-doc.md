# Claude Code Skills 设计说明文档

## 1. 概述

### 1.1 什么是 Agent Skills

Agent Skills 是包含指令、脚本和资源的组织化文件夹,Claude 可以动态发现和加载这些技能以更好地执行特定任务。Skills 通过将专业知识打包成可组合的资源来扩展 Claude 的能力,将通用型代理转变为符合特定需求的专业化代理。

### 1.2 核心价值

- **可组合性**: Skills 可以堆叠使用,Claude 自动识别需要哪些技能并协调使用
- **专业化**: 将 Claude 转变为特定领域的专家
- **可复用性**: 一次创建,多处使用,消除重复性工作
- **可分享性**: 通过版本控制系统在团队间共享

## 2. 架构设计原则

### 2.1 渐进式信息披露 (Progressive Disclosure)

渐进式信息披露是 Agent Skills 灵活性和可扩展性的核心设计原则。类似于一本组织良好的手册,从目录开始,然后是具体章节,最后是详细附录,Skills 让 Claude 按需加载信息。

**三层加载机制**:

1. **第一层 - 元数据层**: YAML frontmatter (name + description)
   - 启动时预加载到系统提示中
   - 约 100 tokens,让 Claude 知道何时使用该技能
   - 零上下文成本

2. **第二层 - 指令层**: SKILL.md 文件的 Markdown 正文
   - 被触发时才加载到上下文窗口
   - 通常 <5k tokens
   - 包含详细的执行指南

3. **第三层 - 资源层**: 引用文件、脚本和模板
   - 仅在需要时通过 bash 命令读取
   - 按需加载,不占用常驻上下文

### 2.2 元工具架构 (Meta-Tool Architecture)

Skills 系统通过元工具架构运行,其中名为 Skill 的工具充当所有单个技能的容器和分发器。

**关键特点**:

- **上下文注入**: Skills 不直接执行操作,而是将专门的指令注入到对话历史中
- **双消息模式**: 每次调用注入两条用户消息
  - 一条包含用户可见的元数据
  - 一条包含隐藏的完整技能提示发送给 API
- **动态权限修改**: 通过改变执行上下文来修改工具权限、切换模型和调整思考令牌参数

### 2.3 基于文件系统的设计

Claude 在具有文件系统访问权限的虚拟机中运行,允许 Skills 作为包含指令、可执行代码和参考材料的目录存在。

**优势**:

- **按需文件访问**: Claude 只读取每个特定任务所需的文件
- **高效脚本执行**: 运行脚本时,脚本代码本身不会进入上下文窗口,只接收输出
- **零令牌开销**: 未使用的参考文件保持在文件系统上,消耗零令牌

## 3. Skills 结构规范

### 3.1 基本文件结构

```
skill-name/
├── SKILL.md           # 必需: 核心技能定义文件
├── REFERENCE.md       # 可选: 补充参考信息
├── scripts/           # 可选: 可执行脚本
│   ├── validate.py
│   └── process.sh
└── resources/         # 可选: 模板、配置等
    ├── template.json
    └── schema.yaml
```

### 3.2 SKILL.md 文件规范

#### YAML Frontmatter (必需字段)

```yaml
---
name: skill-name
description: 简短描述技能的功能和使用时机
---
```

**字段要求**:

- `name`: 
  - 只能使用小写字母、数字和连字符
  - 最大 64 字符
  
- `description`: 
  - 技能功能和使用时机的简短描述
  - 最大 1024 字符
  - **关键重要**: 这是 Claude 发现何时使用技能的主要信号
  - 应包含"做什么"和"何时使用"两方面信息

#### 可选字段

```yaml
---
name: skill-name
description: 技能描述
version: "1.0.0"                           # 版本追踪
model: "claude-opus-4-20250514"            # 指定模型或 "inherit"
disable-model-invocation: false            # 禁用自动调用
---
```

#### Markdown 正文结构

```markdown
# Skill Name

## 概述
简要说明技能的目的和使用场景

## 指令
为 Claude 提供清晰的分步指导

## 示例
展示使用该技能的具体示例

## 最佳实践
列出使用技能时的注意事项

## 参考资源
指向其他文件或外部资源
```

## 4. 设计标准与最佳实践

### 4.1 描述字段设计标准

**✅ 好的描述示例**:

```yaml
description: 分析 Excel 电子表格,创建数据透视表和生成图表。用于处理 Excel 文件、电子表格或分析 .xlsx 格式的表格数据。
```

**❌ 模糊的描述**:

```yaml
description: 帮助处理数据
```

**设计原则**:

- 明确说明功能范围
- 包含具体的触发关键词
- 提及相关的文件格式或领域术语
- 使用面向行动的语言

### 4.2 指令编写标准

**清晰性原则**:

1. **分步骤指导**: 将复杂任务分解为可执行的步骤
2. **明确输入输出**: 说明期望的输入格式和输出格式
3. **边界条件**: 定义技能的适用范围和限制
4. **错误处理**: 提供异常情况的处理指南

**示例模板**:

```markdown
## 指令

### 步骤 1: 分析输入
- 检查用户提供的文件类型
- 验证文件格式是否符合要求
- 如果格式不支持,提示用户

### 步骤 2: 执行操作
- 运行 `scripts/process.py` 处理数据
- 解析输出结果
- 验证结果完整性

### 步骤 3: 生成输出
- 按照 resources/template.json 格式化结果
- 包含摘要说明
- 提供下一步建议
```

### 4.3 Poka-Yoke 原则 (防错设计)

工具应该被设计成代理不容易误用它们的样子。

**防错技术**:

- **输入验证**: 在脚本中添加输入格式检查
- **类型约束**: 明确指定参数类型和范围
- **默认值**: 为可选参数提供安全的默认值
- **幂等性**: 确保重复执行不会产生副作用

### 4.4 安全设计标准

**安全注意事项**:

1. **不要硬编码敏感信息**: API密钥、密码等应通过环境变量或安全配置管理
2. **审查下载的 Skills**: 只安装来自可信来源的技能
3. **最小权限原则**: Skills 只请求完成任务所需的最小权限
4. **数据隔离**: 处理敏感数据时使用适当的 MCP 连接

### 4.5 版本管理标准

**版本历史记录**:

```markdown
## 版本历史

- v2.0.0 (2025-10-01): API 的重大变更
- v1.1.0 (2025-09-15): 添加新功能
- v1.0.0 (2025-09-01): 初始版本
```

**语义化版本**:

- **主版本号**: 不兼容的 API 变更
- **次版本号**: 向后兼容的功能添加
- **修订号**: 向后兼容的问题修复

## 5. Skills 类型分类

### 5.1 文档处理类

**预构建技能**:

- **docx**: 创建、编辑和分析 Word 文档
- **pdf**: 提取文本和表格、创建新 PDF、合并/拆分文档
- **pptx**: 创建、编辑和分析 PowerPoint 演示文稿
- **xlsx**: 创建电子表格、分析数据、生成带图表的报告

### 5.2 创意设计类

- **canvas-design**: 使用设计理念创建美丽的视觉艺术
- **algorithmic-art**: 生成算法艺术
- **slack-gif-creator**: 创建针对 Slack 大小限制优化的动画 GIF

### 5.3 开发工具类

- **artifacts-builder**: 使用 React、Tailwind CSS 和 shadcn/ui 构建复杂的 claude.ai HTML artifacts
- **mcp-server**: 创建高质量 MCP 服务器的指南
- **webapp-testing**: 使用 Playwright 测试本地 Web 应用程序

### 5.4 企业工作流类

- **brand-guidelines**: 应用公司品牌指南到所有输出
- **internal-comms**: 撰写内部沟通文档
- **code-reviewer**: 审查代码的最佳实践和潜在问题

### 5.5 元技能类

- **skill-creator**: 交互式技能创建工具,指导构建新技能

## 6. 实施工作流

### 6.1 Claude.ai 中使用 Skills

**路径**: Settings → Features → Skills

**操作**:

1. 上传自定义技能目录
2. Claude 自动扫描可用技能
3. 基于任务相关性自动调用

### 6.2 Claude Code 中使用 Skills

**安装方式**:

```bash
# 从 marketplace 安装
/plugin marketplace add anthropics/skills

# 从本地目录安装
/plugin add /path/to/skill-directory

# 手动安装到个人目录
~/.claude/skills/skill-name/

# 项目级别安装
.claude/skills/skill-name/
```

**调用方式**:

- **自动调用**: Claude 根据任务自动选择相关技能
- **手动调用**: 使用 `/skill-name` 命令显式触发

### 6.3 API 集成

**端点**: `/v1/skills`

**基本示例**:

```python
import anthropic

client = anthropic.Client(api_key="your-api-key")

# 需要三个 beta headers:
# - code-execution-2025-08-25
# - skills-2025-10-16
# - skill-marketplace-2025-08-25

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "使用 pdf 技能提取文件中的表格"}
    ],
    tools=[{"type": "code_execution"}],
    container={
        "type": "code_execution",
        "skill_id": "pdf-skill"
    }
)
```

## 7. Skills vs 其他技术对比

### 7.1 Skills vs Prompts

| 维度 | Skills | Prompts |
|------|--------|---------|
| 作用域 | 跨会话可复用 | 单次会话 |
| 结构化 | 高度组织化 | 自由文本 |
| 发现机制 | 自动匹配 | 手动输入 |
| 维护性 | 版本控制 | 难以管理 |

### 7.2 Skills vs MCP

| 维度 | Skills | MCP |
|------|--------|-----|
| 重点 | 知识和框架 | 工具和数据访问 |
| 实现 | Markdown + YAML | 标准化协议 |
| 复杂度 | 简单易用 | 相对复杂 |
| 使用场景 | 方法论、指南 | API、数据库连接 |

**互补关系**: 工具提供信息供 Claude 推理,Skills 提供知识和框架教 Claude 如何推理这些信息。

### 7.3 Skills vs Subagents

| 维度 | Skills | Subagents |
|------|--------|-----------|
| 定位 | 便携式专业知识 | 独立代理 |
| 上下文 | 共享主会话上下文 | 隔离的上下文窗口 |
| 适用场景 | 任何 Claude 实例可用 | 特定目的的独立工作流 |

**组合使用**: Subagents 可以利用 Skills 获取专业知识,融合独立性和便携知识。

## 8. 性能优化

### 8.1 上下文效率

**优化策略**:

- 元数据精简: 保持 description 在 200 字符以内
- 延迟加载: 将大型参考文档放在单独的文件中
- 脚本外置: 可执行代码不进入上下文,只返回输出结果

**效率数据**:

- 元数据扫描: ~100 tokens/skill
- 激活技能: <5k tokens
- 绑定资源: 按需加载,零常驻成本

### 8.2 可扩展性设计

**无限上下文潜力**: 具有文件系统和代码执行工具的代理在处理特定任务时不需要将技能的全部内容读入上下文窗口,这意味着可以捆绑到技能中的上下文量实际上是无限的。

**组合策略**:

- 多个小型专注技能优于单个庞大技能
- Skills 可以自动协同工作
- 通过引用机制间接协作

## 9. 开发生命周期

### 9.1 创建阶段

**使用 skill-creator**:

1. Claude 询问工作流程
2. 生成文件夹结构
3. 格式化 SKILL.md 文件
4. 捆绑所需资源

**手动创建**:

1. 创建技能目录
2. 编写 SKILL.md (frontmatter + 正文)
3. 添加脚本和资源文件
4. 本地测试

### 9.2 测试阶段

**增量测试策略**:

- 每次重大变更后测试,而非一次性构建复杂技能
- 使用简单场景验证核心功能
- 逐步增加复杂度

**测试检查清单**:

- [ ] description 是否足够具体让 Claude 识别使用时机
- [ ] 指令是否清晰可执行
- [ ] 脚本是否处理边界情况
- [ ] 输出格式是否符合预期
- [ ] 错误提示是否友好

### 9.3 部署阶段

**团队共享**:

```bash
# 提交到版本控制
git add .claude/skills/my-skill
git commit -m "Add my-skill v1.0.0"
git push

# 团队成员拉取
git pull
/plugin add .claude/skills/my-skill
```

**企业分发**: Anthropic 正在开发简化的技能创建工作流和企业级部署能力。

### 9.4 维护阶段

**持续改进**:

- 收集使用反馈
- 记录版本变更
- 更新文档和示例
- 优化性能

## 10. 故障排查

### 10.1 常见问题

**问题**: Claude 没有使用相关的技能

**检查点**:

- description 是否足够具体?
- description 是否包含任务相关的关键词?
- 任务描述是否明确提到需要该技能的场景?

**问题**: 技能执行失败

**检查点**:

- 脚本路径是否正确?
- 依赖项是否已安装?
- 文件权限是否正确?
- 输入格式是否符合预期?

### 10.2 调试技巧

**启用详细日志**:

```bash
# Claude Code
export CLAUDE_DEBUG=1
```

**查看技能加载**:

- 检查 Claude 的思考过程中是否提到技能
- 确认技能文件已正确放置在技能目录中
- 验证 YAML frontmatter 格式正确

## 11. 参考资源

### 11.1 官方文档

- **Agent Skills 概述**: https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview
- **Claude Code Skills 文档**: https://code.claude.com/docs/en/skills
- **Skills 创建指南**: https://support.claude.com/en/articles/12512198-how-to-create-custom-skills
- **工程博客 - Agent Skills**: https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- **Skills 产品发布**: https://claude.com/blog/skills

### 11.2 示例库

- **Anthropic 官方 Skills 仓库**: https://github.com/anthropics/skills
- **Awesome Claude Skills**: https://github.com/travisvn/awesome-claude-skills
- **Claude Code 模板**: https://www.aitmpl.com/skills

### 11.3 深度分析

- **第一性原理深度剖析**: https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/
- **Agent-First 设计**: https://claudelog.com/mechanics/agent-first-design/
- **Building Agents with Claude SDK**: https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk

### 11.4 教程与视频

- **Lenny's Podcast - Skills 讲解**: https://www.lennysnewsletter.com/p/claude-skills-explained
- **Anthropic Academy**: 官方培训课程
- **Skills Cookbook**: 实践示例合集

## 12. 未来展望

### 12.1 发展方向

**企业能力增强**:

- 简化的技能创建工作流
- 企业范围的部署能力
- 集中化的技能市场

**生态系统**:

- Skills 商店可能出现
- 企业交易精选的操作智能集合
- 与 MCP、Subagents 更深度集成

### 12.2 设计理念演进

Agent-First 设计的核心问题:产品的哪些方面具有这样的模式,使得 LLM 可以生成对用户仍然有价值的衍生品?

**关键转变**:

- 从为人类团队优化转向为 AI 代理优化
- 模块化架构
- 可模板化的体验
- 可扩展的个性化
- 自动化验证

---

**文档版本**: 1.0.0  
**最后更新**: 2024年12月  
**维护者**: Based on Anthropic's official documentation and community resources