/**
 * 数据库连接模块
 *
 * 提供 PostgreSQL 数据库连接和 SQL 执行功能
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

let sql: ReturnType<typeof postgres> | null = null;
let db: ReturnType<typeof drizzle> | null = null;

/**
 * 获取数据库连接 URL
 */
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL 环境变量未设置。请在 .env 文件中配置或设置环境变量。'
    );
  }
  return url;
}

/**
 * 初始化数据库连接
 */
export function initDatabase(): {
  sql: ReturnType<typeof postgres>;
  db: ReturnType<typeof drizzle>;
} {
  if (sql && db) {
    return { sql, db };
  }

  const connectionUrl = getDatabaseUrl();

  sql = postgres(connectionUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  db = drizzle(sql);

  return { sql, db };
}

/**
 * 关闭数据库连接
 */
export async function closeDatabase(): Promise<void> {
  if (sql) {
    await sql.end();
    sql = null;
    db = null;
  }
}

/**
 * 执行原始 SQL 查询
 */
export async function executeRawSql<T extends Record<string, unknown>>(
  query: string
): Promise<T[]> {
  const { sql: connection } = initDatabase();

  try {
    const result = await connection.unsafe<T[]>(query);
    return result;
  } catch (error) {
    throw new Error(
      `SQL 执行失败: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * 批量 Upsert 执行器
 * 返回插入/更新的记录信息
 */
export async function executeBatchUpsert(
  sqlQuery: string
): Promise<Array<{ id: string; inserted: boolean }>> {
  const result = await executeRawSql<{ id: string; inserted: boolean }>(
    sqlQuery
  );
  return result;
}

/**
 * 执行 Embedding 触发 SQL
 * 返回被触发的记录 ID 列表
 */
export async function executeEmbeddingTrigger(
  sqlQuery: string
): Promise<string[]> {
  const result = await executeRawSql<{ id: string }>(sqlQuery);
  return result.map((row) => row.id);
}

/**
 * 检查数据库连接是否可用
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const { sql: connection } = initDatabase();
    await connection`SELECT 1 as test`;
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取数据库中的 PPT 记录数量
 */
export async function getPptCount(): Promise<number> {
  const result = await executeRawSql<{ count: string }>(
    'SELECT COUNT(*) as count FROM ppt'
  );
  return Number.parseInt(result[0]?.count || '0', 10);
}
