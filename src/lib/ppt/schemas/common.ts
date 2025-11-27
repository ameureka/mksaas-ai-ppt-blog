/**
 * 通用 Schema 定义
 * 包含分页、排序等共享 Schema
 */
import { z } from 'zod';

/**
 * 分页参数 Schema
 */
export const paginationSchema = z.object({
  page: z
    .number()
    .int('Pagination.page.invalid')
    .positive('Pagination.page.positive')
    .default(1),
  pageSize: z
    .number()
    .int('Pagination.pageSize.invalid')
    .positive('Pagination.pageSize.positive')
    .max(100, 'Pagination.pageSize.too_large')
    .default(10),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

/**
 * 排序参数 Schema
 */
export const sortingSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type SortingParams = z.infer<typeof sortingSchema>;

/**
 * ID 验证 Schema
 */
export const idSchema = z.object({
  id: z.string().min(1, 'Common.id.required'),
});

export type IdParams = z.infer<typeof idSchema>;

/**
 * 批量操作 Schema
 */
export const bulkActionSchema = z.object({
  ids: z.array(z.string()).min(1, 'Common.ids.empty'),
});

export type BulkActionParams = z.infer<typeof bulkActionSchema>;

/**
 * 搜索参数 Schema
 */
export const searchSchema = z.object({
  search: z.string().optional(),
});

export type SearchParams = z.infer<typeof searchSchema>;

/**
 * 列表查询基础 Schema (分页 + 排序 + 搜索)
 */
export const listParamsSchema = paginationSchema
  .merge(sortingSchema)
  .merge(searchSchema);

export type ListParams = z.infer<typeof listParamsSchema>;
