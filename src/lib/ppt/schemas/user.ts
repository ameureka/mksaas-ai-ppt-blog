/**
 * User 相关 Schema 定义
 */
import { z } from 'zod';
import { paginationSchema, searchSchema, sortingSchema } from './common';

/**
 * 用户角色枚举
 */
export const userRoleEnum = z.enum(['admin', 'user', 'vip']);

export type UserRole = z.infer<typeof userRoleEnum>;

/**
 * 用户状态枚举
 */
export const userStatusEnum = z.enum(['active', 'inactive', 'banned']);

export type UserStatus = z.infer<typeof userStatusEnum>;

/**
 * 创建用户 Schema
 */
export const createUserSchema = z.object({
  name: z.string().min(1, 'User.name.required').max(50, 'User.name.too_long'),

  email: z.string().min(1, 'User.email.required').email('User.email.invalid'),

  password: z
    .string()
    .min(8, 'User.password.too_short')
    .max(100, 'User.password.too_long'),

  role: userRoleEnum.default('user'),

  avatar: z.string().url('User.avatar.invalid_url').optional(),

  credits: z
    .number()
    .int('User.credits.invalid')
    .min(0, 'User.credits.negative')
    .default(0),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

/**
 * 更新用户 Schema (复用创建 Schema，排除密码)
 */
export const updateUserSchema = createUserSchema
  .omit({ password: true })
  .partial()
  .extend({
    id: z.string().min(1, 'User.id.required'),
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/**
 * 获取用户列表参数 Schema
 */
export const getUsersParamsSchema = paginationSchema
  .merge(sortingSchema)
  .merge(searchSchema)
  .extend({
    role: userRoleEnum.optional(),
    status: userStatusEnum.optional(),
    sortBy: z
      .enum(['createdAt', 'name', 'email', 'lastLoginAt'])
      .default('createdAt'),
  });

export type GetUsersParams = z.infer<typeof getUsersParamsSchema>;

/**
 * 删除用户 Schema
 */
export const deleteUserSchema = z.object({
  id: z.string().min(1, 'User.id.required'),
});

export type DeleteUserInput = z.infer<typeof deleteUserSchema>;

/**
 * 封禁/解封用户 Schema
 */
export const banUserSchema = z.object({
  id: z.string().min(1, 'User.id.required'),
  reason: z.string().max(500, 'User.banReason.too_long').optional(),
});

export type BanUserInput = z.infer<typeof banUserSchema>;

/**
 * 更新用户角色 Schema
 */
export const updateUserRoleSchema = z.object({
  id: z.string().min(1, 'User.id.required'),
  role: userRoleEnum,
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

/**
 * 更新用户积分 Schema
 */
export const updateUserCreditsSchema = z.object({
  id: z.string().min(1, 'User.id.required'),
  credits: z.number().int('User.credits.invalid'),
  reason: z.string().max(200, 'User.creditsReason.too_long').optional(),
});

export type UpdateUserCreditsInput = z.infer<typeof updateUserCreditsSchema>;

/**
 * 修改密码 Schema
 */
export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'User.password.required'),
    newPassword: z.string().min(8, 'User.password.too_short'),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'User.password.mismatch',
        path: ['confirmPassword'],
      });
    }
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
