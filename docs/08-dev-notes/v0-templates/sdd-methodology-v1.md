# SDD → mk-saas 混合开发方法论（ai-ppt-site 通用版）

> 目标：将「想法/QA → 模块化 spec → 开发 → 集成」流程标准化，确保每次迭代都能快速落地、方便大模型/团队协作，并顺利对接 mk-saas 模板 + v0 UI。

---

## 1. 阶段与输入/输出

| 阶段 | 主要文件夹 | 输入 | 输出 / 交付物 |
| --- | --- | --- | --- |
| **Ideation & QA** | `QA/` | 想法、问题清单 | `ppt_architecture_q*.md`（问题→结论）、`关于…讨论.md`（背景说明） |
| **Domain Research** | `kiro/specs/` 各子目录 | QA 结论 | 架构、成本、API、UI、场景等分模块调研 |
| **Module Specs** | `kiro/specs/.../*.md` + `docs/*.md` | Domain Research 输出 | flow、页面矩阵、prompt、API 表、schema、场景 checklist、验证计划 |
| **Implementation** | `scripts/python/`、`src/…`（mk-saas） | Module spec | 代码（Python 处理器、Next.js 服务层/前端）、迁移说明 |
| **Integration & QA** | `docs/VERIFICATION...`、`agnet/` | 测试场景、spec | 集成记录、测试结果、bug 追踪 |

---

## 2. 文件夹与阶段映射（推荐结构）

```
ai-ppt-site/
├── QA/                        # 想法/问题 → 结论
├── kiro/
│   ├── specs/
│   │   ├── archticture&cost/   # 成本/架构
│   │   ├── backend-services/   # API/Action/Service spec
│   │   ├── api&database/       # API 表、schema、验证、中间件
│   │   ├── ui&ue&ux/           # 页面矩阵、flow、prompt
│   │   ├── ppt-content-management/... # 功能域子spec
│   │   └── ...                 # 其他 domain
│   └── ...                     # 其他资产
├── docs/                      # 快速参考、数据库/API、验证脚本说明
├── scripts/python/            # 批处理程序
├── agnet/                     # Agent 记录/迭代看板
└── admin-ppt-guide/ (new)     # 混合开发规范、v0 模板
```

> 注：`agnet/README.md` 用于记录当前迭代状态、下一步任务、待补充 spec。

---

## 3. 与 mk-saas 集成的关键注意事项

1. **服务层对齐**  
   - Spec 中的 API/Action 必须注明将实现为 `src/actions/<domain>` + 对应 hook（React Query）。  
   - 权限：标明角色（user/editor/admin），以及行动是否使用 `adminActionClient` 或 `userActionClient`。
2. **路由 & 布局**  
   - 前台页面 → `app/[locale]/(marketing)` 或其他 route group；  
   - Admin 页面 → `app/[locale]/(protected)/admin/*`，并在 `sidebar-config` 注册。
3. **设计系统**  
   - 使用 `AdminPageShell`、`@/components/ui/*`，不自建 ThemeProvider/Sidebar；  
   - 文案/SEO → `next-intl` + `generateMetadata`；在 spec 中用 key、结构化字段。
4. **与 v0 协同**  
   - spec 中为每个 UI 流程附上 `v0 prompt` / `props & events` 定义；  
   - 事件回调命名与服务层 Action 一致（如 `onApprove -> reviewPptAction`）。
5. **验证与测试**  
   - 在 spec 末尾附上“验证方法”（Playwright/脚本/手测） + 对应 `docs/VERIFICATION` 链接。

---

## 4. 标准化 SDD 模板（示例）

每份模块 spec（例如 `kiro/specs/backend-services/05-download-service-design.md`）建议包含：

1. **目标 & 场景**  
   - 简述目的、触发条件、依赖。
2. **实体与类型**  
   - 数据表/TypeScript interface；标明与 Drizzle schema 的对应关系。
3. **Actions / API**  
   - 列表（含名称、client 类型、输入/输出、权限说明、hook/route 映射）。
4. **流程**  
   - 步骤或状态机（例如下载流程：校验 → 扣积分 → 签名 URL → 日志）。
5. **界面/交互**  
   - 对应 UI flow/组件（指向 `ui&ue&ux/flows/*.md`）  
   - 初始化状态 + 事件回调（`onDownload`, `onFilterChange`）  
   - 若计划 v0 生成，在此写 prompt 样例。
6. **集成提示**  
   - “挂载到：`app/[locale]/(protected)/admin/ppt`”  
   - “使用 `AdminPageShell` + `usePptList` hook”  
   - “权限：admin/editor”
7. **验证**  
   - 对应 docs/VERIFICATION 脚本或 QA 清单。

---

## 5. 流程执行指南（快速操练版）

1. **想法/问题阶段**  
   - 写入 `QA/`，每个问题文件包括：问题、现状、结论、下一步。  
   - 更新 `QA/SUMMARY.md`，记录哪几个问题已完成、哪些待解决。
2. **拆分调研**  
   - 依据 QA 结论，把任务分配到 `kiro/specs/...`；每条 spec 在开头写 `来源：QA#3` 等。  
   - 在 `docs/INDEX.md` 或 `kiro/specs/INDEX` 中记录新 spec 路径。
3. **输出 spec**  
   - 按模板撰写，确保每个域（UI/后台/搜索/广告）都有对 `mk-saas` 的映射说明。
4. **实现**  
   - 实现代码时在 `admin-ppt-guide/agnet/README` 更新状态（如“download service action 完成 70%”）。  
   - 完成长流程后更新 `kiro/specs/backend-services/PROGRESS.md`（若无可新增）。
5. **集成 & QA**  
   - 将 v0 产物按 `hybrid-dev-spec.v2` 集成到 mk-saas。  
   - 在 `docs/VERIFICATION...` 记录测试结果/问题。  
   - 若 spec 需要调整，回写 `kiro/*` 相关文档。

---

## 6. 推荐协作方式

1. **agnet 目录 = 迭代看板**  
   - `agnet/README.md`：当前迭代目标、关键 spec、待讨论问题。  
   - `agnet/logs/<date>.md`：日常更新或与 agent 的结论摘要。

2. **跨模块索引**  
   - 在 `docs/QUICK-REFERENCE.md` 维护“功能 → spec → 代码目录”的映射表，方便查找。

3. **大模型参与**  
   - 当需要 v0 输出 UI，将 `hybrid-dev-spec.v2.md` + 相关 flow/prompt 作为上下文。  
   - 让模型先阅读 spec，再生成代码，用“spec key → Action hook”机制保持一致。

---

本方法论能确保：你在 SDD 阶段创建的所有 spec 都有清晰的目录结构、状态记录、与 mk-saas/v0 结合的注意项。按照此流程推进，每次新增需求都能快速落地、可追溯、方便协作。欢迎根据实际实施情况继续优化或扩展本文件。***
