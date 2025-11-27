/**
 * Server Action 标准类型定义
 * 用于统一 Action 返回格式，便于与 mksaas 集成
 */

// ============ Server Action Result ============

/**
 * Server Action 统一返回类型
 * 模拟 mksaas 的 ServerActionResult 结构
 */
export type ServerActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

/**
 * 创建成功结果的辅助函数
 */
export function successResult<T>(data: T): ServerActionResult<T> {
  return { success: true, data };
}

/**
 * 创建失败结果的辅助函数
 */
export function errorResult(
  error: string,
  code?: string
): ServerActionResult<never> {
  return { success: false, error, code };
}

// ============ List Params & Result ============

/**
 * 列表查询参数
 */
export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

/**
 * 列表查询结果
 */
export interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * 创建分页结果的辅助函数
 */
export function createListResult<T>(
  items: T[],
  total: number,
  page = 1,
  pageSize = 10
): ListResult<T> {
  const totalPages = Math.ceil(total / pageSize);
  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
    hasMore: page < totalPages,
  };
}

// ============ Query Options ============

/**
 * 数据查询选项
 */
export interface QueryOptions {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  retry?: number | boolean;
}

// ============ Mutation Options ============

/**
 * 数据变更选项
 */
export interface MutationOptions<TData = unknown, TVariables = unknown> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: (
    data: TData | undefined,
    error: Error | null,
    variables: TVariables
  ) => void;
}

// ============ 统一 ID 类型 ============

export type EntityId = string | number;
