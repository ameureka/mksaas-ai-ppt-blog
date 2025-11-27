# SDD → mk-saas 混合开发方法论（V3）

> 本版在 V2 基础上增加 Stage Gate、文档模板、跨模块对照表，让整个流程更易执行和审阅。

---

## 1. 阶段 / 输入输出 / Gate

| 阶段 | 文件夹 | 输入 | 输出 | Gate（进入下阶段的标准） |
| --- | --- | --- | --- | --- |
| **Vision & Requirements** | `product/`（建议新增） | 业务愿景、指标、MVP 范围 | `requirements.md`、愿景文档 | 每条需求有 ID/优先级/验收标准；在 `requirements.md` 中标记“Ready” |
| **Idea & QA** | `QA/` | 想法、问题，引用需求 ID | `ppt_architecture_q*.md` | `QA/SUMMARY.md` 中对应条目标记为“已结论”，附引用需求/spec 位置 |
| **Domain Research** | `kiro/specs/` | QA 结论 | 各 Domain 调研笔记 | `kiro/specs/INDEX.md` 更新链接；Spec 标记 `Status: Draft` |
| **Module Spec 输出** | `kiro/specs/*/*.md`, `docs/*.md` | 调研结果 | Flow、API、Schema、场景、验证计划 | Spec 文件头包含元数据（来源、Owner、状态、关联路由/Action）且模板项填写完成 |
| **Implementation** | `scripts/`, `src/…` | Spec | 代码、迁移说明 | `backend-services/PROGRESS.md` 更新完成度；agnet 日志记录进度 |
| **Integration & QA** | `docs/VERIFICATION.md`, `agnet/` | 测试脚本、checklist | 测试结果、bug 记录 | 对应场景在 `VERIFICATION` 中标记“Pass”，并在 `QA/SUMMARY` 更新结论 |

**建议**：每个阶段结束前由负责人检查 Gate，确保信息同步。

---

## 2. 文档模板示例

### QA 模板
```md
# 问题 N：主题

**现状**
- ...

**结论**
- ...

**下一步**
- ...
```

### Spec 模板（放在文件头）
```md
---
Source: QA#001
Requirement: REQ-01, REQ-03
Owner: @ameureka
Status: Draft | Final
Related Routes: /admin/ppt-review
Related Actions: reviewPptAction
Last Updated: 2025-01-15
---
```
其后按章节：目标&场景 → 实体&类型 → Action/API → 流程 → UI/交互 → 集成提示 → 验证。

### Flow 模板
```md
# Flow XX - 名称

## 场景说明
## 初始化状态
## 交互步骤
## 事件/回调
## UI 组件
## 集成提示（路由、Hook、权限）
## 验证
```

### 验证记录
```md
| 场景 | 步骤 | 预期 | 实际 | 备注 |
```

---

## 3. mk-saas 对应关系表

| Spec 类型 | 目标目录 / 文件 | 备注 |
| --- | --- | --- |
| QA | `QA/*.md` | 结论需同步 `QA/SUMMARY.md` |
| Service Spec | `src/actions/<domain>/...` | 凭 spec 确认 `userActionClient`/`adminActionClient` |
| UI Flow | `src/components/admin/<feature>/...` + `app/[locale]/...` | 用 `AdminPageShell`，遵循 v0 规范 |
| API 表 | `kiro/specs/api&database/api-table.md` | 与 Hook/Route 对应；生成 TypeScript 类型 |
| Scene Checklist | `kiro/specs/scence&user/*.md` | 连接 UI + 服务 + QA |
| v0 指南 | `admin/templates/v0-rules.md`, `admin/guides/hybrid-integration.md` | 生成/集成流程 |
| 验证 | `docs/VERIFICATION.md` | 结果回填 QA/SUMMARY、agnet/logs |

---

## 4. 执行 Checklist

1. **需求 → QA**
   - [ ] 在 `product/requirements.md` 记录/更新需求（ID、优先级、验收标准）
   - [ ] 新问题写入 `QA/xxx.md`，引用需求 ID
   - [ ] 在 `QA/SUMMARY` 更新状态
2. **调研 → Spec**
   - [ ] 在 `kiro/specs` 相应目录创建文档
   - [ ] 文件头添加 metadata
   - [ ] 在 `kiro/specs/INDEX` 登记
3. **Spec → 实现**
   - [ ] `backend-services/PROGRESS` 更新状态
   - [ ] `agnet/logs/<date>` 记录进度/问题
   - [ ] 如有 v0 UI，按照模板输出 README/props/事件
4. **集成 → QA**
   - [ ] 按 `admin/guides/hybrid-integration` 接线
   - [ ] 在 `docs/VERIFICATION` 记录测试结果
   - [ ] Bug/待办写入 `agnet/README` 或 issue tracker

---

## 5. 协作建议

- 每周或每 Sprint 检查：`QA/SUMMARY`, `kiro/specs/INDEX`, `backend-services/PROGRESS`, `agnet/README`。
- 大模型参与：给它 QA 文件 + 对应 spec + v0 规范，让其生成 UI 或 service stub，并在日志记录。
- 当 spec/实现差异较大时，先更新 spec，再产出代码，以保持单一信息源。

---

此 V3 版方法论可直接应用到 `ai-ppt-site` 或其它 mk-saas 项目；如需更细的培训资料，可在 `admin-ppt-guide/` 下继续衍生子文档。
