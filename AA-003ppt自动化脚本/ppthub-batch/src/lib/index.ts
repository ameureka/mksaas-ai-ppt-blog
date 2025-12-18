/**
 * ppthub-batch 模块统一导出
 *
 * 方便其他项目引用核心功能
 */

// 类型定义
export * from './types.js';

// 解析器
export {
  parseInitJson,
  parseInitCsv,
  ParseError,
  flattenItem,
} from './parser.js';

// Preflight 校验
export {
  preflight,
  type NormalizedItem,
  type PreflightResult,
} from './preflight.js';

// URL 校验
export {
  isShortPublicUrl,
  validatePptUrlPath,
  validateThumbnailUrlPath,
  validateUrlConsistency,
  buildRemotePaths,
} from './url-validator.js';

// Upsert 引擎
export { generateUpsertSql, batchUpsert, toDbRecord } from './upsert.js';

// Embedding 触发
export {
  generateEmbeddingInput,
  generateEmbeddingTriggerSql,
  triggerEmbeddings,
  getRepairCronInstructions,
} from './embedding.js';

// Post-check 报告
export {
  postCheck,
  formatPostCheckResult,
  type PostCheckResult,
} from './postcheck.js';

// Action 执行器
export {
  toCreatePPTInput,
  batchViaAction,
  generateActionExample,
} from './action-executor.js';

// 数据库连接
export {
  initDatabase,
  closeDatabase,
  executeRawSql,
  executeBatchUpsert,
  executeEmbeddingTrigger,
  checkDatabaseConnection,
  getPptCount,
} from './db.js';
