# Droid CLI 使用技巧全指南

## 📚 目录
1. [基础命令](#-基础命令)
2. [关键参数](#-关键参数)
3. [交互模式技巧](#-交互模式技巧)
4. [企业级工作流](#-企业级工作流)
5. [最佳实践](#-最佳实践)
6. [高级功能](#-高级功能)
7. [实际示例](#-实际示例)
8. [组合使用策略](#-组合使用策略)

## 🚀 基础命令

### 交互模式（推荐用于探索和开发）
```bash
droid                                    # 启动交互式会话
droid "分析这个项目架构"                   # 带初始提示启动
```

### 非交互模式（适合脚本和自动化）
```bash
droid exec "添加日志记录"                 # 执行单个任务
droid exec -f plan.md                    # 从文件读取任务
git diff | droid exec "生成发布说明"      # 处理管道输入
```

## ⚙️ 关键参数

### 自主级别控制
- `--auto low` - 安全编辑（创建/编辑文件）
- `--auto medium` - 本地开发（安装依赖、运行测试、git commit）
- `--auto high` - CI/CD 部署（git push、部署脚本）

### 模型选择
- `-m claude-opus-4-5-20251101` - Claude Opus 4.5（默认）
- `-m gpt-5.1-codex-max` - GPT-5.1 Codex Max
- `-r high` - 高推理级别

### 规范模式（重要！）
```bash
droid exec --use-spec "实现用户认证系统"   # 先规划再执行
```

## 💡 交互模式技巧

### 模式切换
- 按 `!` 切换到 Bash 模式（直接执行 shell 命令）
- 按 `Esc` 返回 AI 模式
- 按 `?` 查看所有快捷键

### 实用斜杠命令
- `/new` - 新建会话
- `/model` - 切换模型
- `/mcp` - 管理 MCP 集成
- `/settings` - 配置设置
- `/status` - 查看当前状态

## 🔧 企业级工作流

### 代码审查
```bash
droid exec "审查这个 PR 的安全性"          # 仅分析
droid exec --auto low "修复类型提示"      # 带修改
```

### 调试
```bash
droid exec "分析测试失败的根本原因"
droid exec --auto medium "修复测试并验证"
```

### 重构
```bash
droid exec --use-spec "重构认证模块"       # 先规划再执行
```

## 📋 最佳实践

1. **具体明确**：提供详细上下文而非模糊指令
2. **使用规范模式**：复杂功能先用 `--use-spec` 规划
3. **逐步提升自主权限**：从默认（只读）→ low → medium → high
4. **利用组织知识**：droid 会学习你团队的编码标准
5. **审查所有变更**：始终在批准前检查 diff

## 🧠 Skills（技能系统）

### 什么是 Skills？
- **可重用能力包**：将指令、专业知识、工具打包成轻量级包
- **模型驱动**：由 Droid 自动调用，而非手动触发
- **可组合**：可以作为更大工作流程的一部分链接

### Skill 文件格式
```markdown
---
name: summarize-diff
description: 总结暂存的 git diff 为 3-5 个要点
---

# Summarize Diff

## Instructions
1. 运行 `git diff --staged`
2. 用 3-5 个要点总结变更
3. 标出迁移、风险区域或需要运行的测试
```

### Skill 存储位置
- **工作区**：`.factory/skills/` - 与队友共享，提交到 git
- **个人**：`~/.factory/skills/` - 私有技能，跨项目使用

### 企业价值
- 标准化前端实现、服务集成、数据查询方式
- 编码团队规范、安全规则、SLA
- 通过 git 让自动化可发现、可审计、可共享

## 🤖 Custom Droids（自定义子代理）

### 什么是 Custom Droids？
- **可重用子代理**：每个都有独立的系统提示、模型偏好、工具策略
- **专注任务**：将复杂清单编码一次并通过单次调用重用
- **上下文隔离**：每个子代理使用全新的上下文窗口

### 配置示例
```markdown
---
name: code-reviewer
description: 检查 diff 的正确性、测试和迁移
model: inherit
tools: ["Read", "LS", "Grep", "Glob"]
---

你是团队的资深审查员。给定 diff 和上下文：

- 总结变更意图
- 标出正确性风险、缺失测试或回滚风险
- 调用需要协调的迁移或数据变更

回复：
Summary: <单行总结>
Findings:
- <问题或 ✅ 无阻碍>
  Follow-up: <行动或留空>
```

### 管理方式
- 使用 `/droids` 命令启动界面
- 支持从 Claude Code 导入现有代理
- 支持项目级和个人级，项目设置优先

## ⚡ Hooks（钩子系统）

### 什么是 Hooks？
- **事件驱动**：在特定 Droid 事件发生时自动执行命令
- **强大控制**：可以阻止、修改或仅仅是监控操作
- **企业集成**：集成到现有的开发工作流中

### Hook 事件类型
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{
          "type": "command",
          "command": "\"$FACTORY_PROJECT_DIR\"/.factory/hooks/check-style.sh"
        }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Task",
        "hooks": [{
          "type": "command",
          "command": "echo 'Task completed' >> ~/droid-tasks.log"
        }]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [{
          "type": "command",
          "command": "/path/to/prompt-validator.py"
        }]
      }
    ],
    "SessionStart": [
      {
        "hooks": [{
          "type": "command",
          "command": "\"$FACTORY_PROJECT_DIR\"/.factory/hooks/setup-dev-env.sh"
        }]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [{
          "type": "command",
          "command": "\"$FACTORY_PROJECT_DIR\"/.factory/hooks/cleanup.sh"
        }]
      }
    ]
  }
}
```

### Hook 决策控制
- **Exit Code 0**：成功，stdout 显示给用户
- **Exit Code 2**：阻止错误，stderr 反馈给 Droid
- **JSON 输出**：细粒度控制，包括 `permissionDecision`、`continue`、`updatedInput`

## 🔌 MCP（模型上下文协议）

### 什么是 MCP？
- **外部工具集成**：将外部系统（API、数据库、SaaS 工具）作为工具暴露
- **标准化接口**：统一的协议连接各种服务
- **插件生态**：40+ 预配置服务器（Linear、Sentry、Notion、Stripe、Vercel）

### 使用示例
```bash
# 交互式添加
/mcp

# 命令行添加
droid mcp add linear "linear://..."  
droid mcp add sentry "sentry://..."

# MCP 工具命名：mcp__<server>__<tool>
# 例如：mcp__github__search_repositories
```

### Hook 配置 MCP 工具
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__memory__.*",
        "hooks": [{
          "type": "command", 
          "command": "echo 'Memory operation initiated' >> mcp-.log"
        }]
      }
    ]
  }
}
```

## 🔧 BYOK（自备密钥）

### 什么是 BYOK？
- **自定义模型集成**：使用你自己的 API 密钥
- **多云支持**：OpenRouter、OpenAI、Anthropic 等
- **安全控制**：你可以完全不将任何密钥提供给 Factory

### 配置示例
```json
{
  "models": {
    "my-gpt4": {
      "model": "gpt-4",
      "api_base": "https://api.openai.com/v1",
      "api_key": "${OPENAI_API_KEY}",
      "model_display_name": "GPT-4 (My Key)"
    },
    "custom-openrouter": {
      "model": "anthropic/claude-3-sonnet",
      "api_base": "https://openrouter.ai/api/v1", 
      "api_key": "${OPENROUTER_API_KEY}",
      "headers": {
        "HTTP-Referer": "https://my-site.com",
        "X-Title": "My Custom Droid"
      }
    }
  }
}
```

### 使用自定义模型
```bash
droid exec -m custom:my-gpt4 "分析这个项目"
```

## ⚡ Auto-Run Mode（Power Mode）

### 核心概念
**Auto-Run Mode** 允许你在批准计划后决定 Droid 有多强的自主权，无需确认每个工具调用。选择你愿意接受的风险级别，Droid 会持续执行并显示所有操作。

### 自主级别一览

| 级别 | 自动运行的内容 | 典型例子 |
|------|----------------|----------|
| **Auto (Low)** | 文件编辑、创建、只读命令 | `Edit`, `Create`, `ls`, `git status`, `rg` |
| **Auto (Medium)** | Low级别 + 可逆的工作空间修改 | `npm install`, `pip install`, `git commit`, `mv`, `cp`, 构建工具 |
| **Auto (High)** | 所有非明确阻止的命令 | `docker compose up`, `git push`, 数据库迁移, 自定义脚本 |

### 风险分类系统

每个命令都包含风险评级（`low`、`medium`、`high`）和简要理由：

- **低风险** - 只读操作且无法造成不可逆损害（列出文件、显示日志、git diff）
- **中风险** - 修改工作空间但容易撤销的操作（包安装、移动文件、本地git操作、构建）
- **高风险** - 具有破坏性、难以回滚或安全敏感的命令（sudo、删除目录、部署、远程脚本管道）

### 安全锁定机制
即使 Auto (High) 模式下，以下操作仍需要明确批准：
- 危险模式（`rm -rf /`、`dd of=/dev/*` 等）
- 命令替换（`$(...)`、反引号）
- CLI 安全检查明确标记的任何内容

### 快速切换方式

**键盘快捷键：**
- **Shift+Tab**（Windows: **Ctrl+T**）在模式间循环：
  Normal → Spec → Auto (Low) → Auto (Medium) → Auto (High) → Normal

**状态显示：**
- 活动模式显示在状态栏和帮助弹窗中
- 流式输出始终显示，突出每个文件变更

## 🔄 组合使用策略

### 完整的企业级配置

1. **MCP 用于外部集成**：
   - 暴露内部部署 API
   - 连接 Linear、Jira、Sentry

2. **Custom Droids 用于合规性**：
   - 定义 CI 中允许的工具/模型
   - 实施特定的权限级别

3. **Skills 用于工程手册**：
   - 编码"如何安全进行金丝雀部署"
   - 使用上述 API 和 droid 配置

4. **Hooks 用于自动化**：
   - 每次 Edit 后自动格式化
   - 部署前的安全策略检查

5. **BYOK 用于安全控制**：
   - 使用私有模型处理敏感代码
   - 成本控制和供应商多样化

### 项目结构
```
.factory/
├── droids/           # Custom droids
│   ├── code-reviewer.md
│   └── security-sweeper.md
├── skills/           # 技能包
│   ├── frontend-ui-integration/
│   │   └── SKILL.md
│   └── payments-service/
│       └── SKILL.md
├── hooks/            # Hook 脚本
│   ├── check-style.sh
│   └── security-check.py
└── settings.json     # 配置包括 MCP 和 Hooks
```

### 典型工作流
```bash
# 1. 启动会话（自动加载技能）
droid

# 2. 描述任务（自动触发相关技能）
"为支付服务添加新的结账页面"

# 3. Droid 自动：
#   - 调用 frontend-ui-integration 技能
#   - 使用 code-reviewer 子代理审查
#   - Hook 自动运行格式化和安全检查
#   - 通过 MCP 与 Jira 集成创建工单
```

## 💡 实际示例

### 日常开发工作流
```bash
# 1. 分析项目
droid exec "分析项目架构和技术栈"

# 2. 实现功能（规范模式）
droid exec --use-spec --auto low "实现用户偏好设置"

# 3. 测试验证
droid exec --auto medium "运行测试并修复问题"

# 4. 提交代码
droid exec --auto medium "创建结构化提交信息"
```

### Auto-Run Mode 实际威力

**启用 Auto (Medium) 进行复杂功能开发：**
```bash
droid exec --auto medium "实现完整的用户认证功能"

# Droid 会自动：
# 1. 分析现有代码结构
# 2. 设计认证架构
# 3. 创建必要的文件和组件
# 4. 安装依赖包
# 5. 运行测试和代码检查
# 6. 配置路由和状态管理

# 整个过程可能涉及 50+ 个文件操作和 20+ 个命令
# Auto-Run 让这一切在几分钟内完成，而不是需要你逐个确认每个步骤
```

## 🎯 关键优势

这些高级功能让你可以：

- **标准化企业开发流程**
- **自动化合规性和安全性检查**  
- **构建可组合的 AI 辅助工作流**
- **集成现有的工具生态系统**
- **大幅提升开发效率和代码质量**

## 📚 进一步学习

- 查看 [Factory CLI 文档](https://docs.factory.ai/reference/cli-reference) 获取完整命令参考
- 学习 [Specification Mode](https://docs.factory.ai/cli/user-guides/specification-mode) 进行复杂功能规划
- 探索 [Skills Cookbook](https://docs.factory.ai/cli/configuration/skills) 获取行业特定模板
- 了解 [MCP 集成](https://docs.factory.ai/cli/configuration/mcp) 连接外部工具

---

*最后更新：2025年7月*  
*基于 Factory CLI 最新文档整理*
