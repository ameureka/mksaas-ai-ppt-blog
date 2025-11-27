/**
 * PPT 相关 Schema 定义
 */
import { z } from 'zod';
import { paginationSchema, searchSchema, sortingSchema } from './common';

/**
 * PPT 状态枚举
 */
export const pptStatusEnum = z.enum(['draft', 'published', 'archived']);

export type PPTStatus = z.infer<typeof pptStatusEnum>;

/**
 * PPT 分类枚举
 */
export const pptCategoryEnum = z.enum([
  'business',
  'education',
  'technology',
  'marketing',
  'report',
  'plan',
  'summary',
  'other',
]);

export type PPTCategory = z.infer<typeof pptCategoryEnum>;

/**
 * 创建 PPT Schema
 */
export const createPPTSchema = z.object({
  title: z.string().min(1, 'PPT.title.required').max(100, 'PPT.title.too_long'),

  description: z.string().max(500, 'PPT.description.too_long').optional(),

  category: pptCategoryEnum,

  subcategory: z.string().optional(),

  tags: z.array(z.string()).default([]),

  thumbnailUrl: z.string().url('PPT.thumbnailUrl.invalid').optional(),

  fileUrl: z.string().url('PPT.fileUrl.invalid').optional(),

  fileSize: z.number().positive('PPT.fileSize.invalid').optional(),

  pageCount: z
    .number()
    .int('PPT.pageCount.invalid')
    .positive('PPT.pageCount.positive')
    .optional(),

  status: pptStatusEnum.default('draft'),

  isFeatured: z.boolean().default(false),

  downloadCredits: z
    .number()
    .int('PPT.downloadCredits.invalid')
    .min(0, 'PPT.downloadCredits.negative')
    .default(0),
});

export type CreatePPTInput = z.infer<typeof createPPTSchema>;

/**
 * 更新 PPT Schema (复用创建 Schema)
 */
export const updatePPTSchema = createPPTSchema.partial().extend({
  id: z.string().min(1, 'PPT.id.required'),
});

export type UpdatePPTInput = z.infer<typeof updatePPTSchema>;

/**
 * 获取 PPT 列表参数 Schema
 */
export const getPPTsParamsSchema = paginationSchema
  .merge(sortingSchema)
  .merge(searchSchema)
  .extend({
    category: pptCategoryEnum.optional(),
    status: pptStatusEnum.optional(),
    isFeatured: z.boolean().optional(),
    sortBy: z
      .enum(['createdAt', 'title', 'downloads', 'updatedAt'])
      .default('createdAt'),
  });

export type GetPPTsParams = z.infer<typeof getPPTsParamsSchema>;

/**
 * 删除 PPT Schema
 */
export const deletePPTSchema = z.object({
  id: z.string().min(1, 'PPT.id.required'),
});

export type DeletePPTInput = z.infer<typeof deletePPTSchema>;

/**
 * 批量删除 PPT Schema
 */
export const bulkDeletePPTsSchema = z.object({
  ids: z.array(z.string()).min(1, 'PPT.ids.empty'),
});

export type BulkDeletePPTsInput = z.infer<typeof bulkDeletePPTsSchema>;

/**
 * 更新 PPT 状态 Schema
 */
export const updatePPTStatusSchema = z.object({
  id: z.string().min(1, 'PPT.id.required'),
  status: pptStatusEnum,
});

export type UpdatePPTStatusInput = z.infer<typeof updatePPTStatusSchema>;
