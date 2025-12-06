/**
 * PPTHub 数据库 Schema 定义
 *
 * 数据库优化迁移: 2025-12-06
 * - R1: 外键约束 (ad_watch_record.ppt_id, user_download_history.ppt_id)
 * - R2: 唯一约束 (user_credit.user_id)
 * - R3: 冗余索引清理 (user_id_idx 等)
 * - R4: 复合索引优化 (ppt_status_created_idx, download_method_date_idx)
 * - R5: 字段重命名 (payment_id -> stripe_invoice_id)
 * - R6: 软删除字段 (ppt.deleted_at, user.deleted_at)
 * - R7: NOT NULL 约束 (ppt.title, ppt.file_url)
 * - R10: 元数据字段 (ppt.description, file_size, file_format)
 */

import { boolean, integer, pgTable, text, timestamp, index, unique } from "drizzle-orm/pg-core";

/**
 * 用户表 - Better Auth 核心表
 * 支持软删除 (deleted_at)
 */
export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').notNull(),
	image: text('image'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	role: text('role'),
	banned: boolean('banned'),
	banReason: text('ban_reason'),
	banExpires: timestamp('ban_expires'),
	customerId: text('customer_id'),
	deletedAt: timestamp('deleted_at'), // R6: 软删除字段
}, (table) => ({
	// 移除 userIdIdx (R3) - 主键已是索引
	userCustomerIdIdx: index("user_customer_id_idx").on(table.customerId),
	userRoleIdx: index("user_role_idx").on(table.role),
}));

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp('expires_at').notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	impersonatedBy: text('impersonated_by')
}, (table) => ({
	sessionTokenIdx: index("session_token_idx").on(table.token),
	sessionUserIdIdx: index("session_user_id_idx").on(table.userId),
}));

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull()
}, (table) => ({
	accountUserIdIdx: index("account_user_id_idx").on(table.userId),
	accountAccountIdIdx: index("account_account_id_idx").on(table.accountId),
	accountProviderIdIdx: index("account_provider_id_idx").on(table.providerId),
}));

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at'),
	updatedAt: timestamp('updated_at')
});

export const payment = pgTable("payment", {
	id: text("id").primaryKey(),
	priceId: text('price_id').notNull(),
	type: text('type').notNull(),
	scene: text('scene'), // payment scene: 'lifetime', 'credit', 'subscription'
	interval: text('interval'),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	customerId: text('customer_id').notNull(),
	subscriptionId: text('subscription_id'),
	sessionId: text('session_id'),
	invoiceId: text('invoice_id').unique(), // unique constraint for avoiding duplicate processing
	status: text('status').notNull(),
	paid: boolean('paid').notNull().default(false), // indicates whether payment is completed (set in invoice.paid event)
	periodStart: timestamp('period_start'),
	periodEnd: timestamp('period_end'),
	cancelAtPeriodEnd: boolean('cancel_at_period_end'),
	trialStart: timestamp('trial_start'),
	trialEnd: timestamp('trial_end'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
	paymentTypeIdx: index("payment_type_idx").on(table.type),
	paymentSceneIdx: index("payment_scene_idx").on(table.scene),
	paymentPriceIdIdx: index("payment_price_id_idx").on(table.priceId),
	paymentUserIdIdx: index("payment_user_id_idx").on(table.userId),
	paymentCustomerIdIdx: index("payment_customer_id_idx").on(table.customerId),
	paymentStatusIdx: index("payment_status_idx").on(table.status),
	paymentPaidIdx: index("payment_paid_idx").on(table.paid),
	paymentSubscriptionIdIdx: index("payment_subscription_id_idx").on(table.subscriptionId),
	paymentSessionIdIdx: index("payment_session_id_idx").on(table.sessionId),
	paymentInvoiceIdIdx: index("payment_invoice_id_idx").on(table.invoiceId),
}));

/**
 * 用户积分表
 * - R2: user_id 唯一约束，确保每个用户只有一条积分记录
 * - R5: 已删除废弃字段 last_refresh_at
 */
export const userCredit = pgTable("user_credit", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
	currentCredits: integer("current_credits").notNull().default(0),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
	userCreditUserIdIdx: index("user_credit_user_id_idx").on(table.userId),
	/** R2: 唯一约束 - 确保每个用户只有一条积分记录 */
	userCreditUserIdUnique: unique("user_credit_user_id_unique").on(table.userId),
}));

/**
 * 积分交易记录表
 * - R5: payment_id 重命名为 stripe_invoice_id，语义更清晰
 */
export const creditTransaction = pgTable("credit_transaction", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
	type: text("type").notNull(), // purchase, gift, usage, refund, expiration
	description: text("description"),
	amount: integer("amount").notNull(), // 正数为增加，负数为消耗
	remainingAmount: integer("remaining_amount"), // 剩余可用积分
	/** R5: 重命名 payment_id -> stripe_invoice_id，存储 Stripe Invoice ID */
	stripeInvoiceId: text("stripe_invoice_id"),
	expirationDate: timestamp("expiration_date"), // 积分过期时间
	expirationDateProcessedAt: timestamp("expiration_date_processed_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
	creditTransactionUserIdIdx: index("credit_transaction_user_id_idx").on(table.userId),
	creditTransactionTypeIdx: index("credit_transaction_type_idx").on(table.type),
}));

/**
 * PPT 模板表 - 核心业务表
 * - R6: 支持软删除 (deleted_at)
 * - R7: title 和 file_url 强制 NOT NULL
 * - R10: 新增元数据字段 (description, file_size, file_format)
 * - R4: 复合索引优化 (status + created_at)
 */
export const ppt = pgTable("ppt", {
	id: text("id").primaryKey(),
	tenantId: text("tenant_id"), // 多租户支持（预留）
	/** R7: NOT NULL - PPT 标题必填 */
	title: text("title").notNull(),
	author: text("author"),
	slidesCount: integer("slides_count").default(0),
	/** R7: NOT NULL - 文件 URL 必填 */
	fileUrl: text("file_url").notNull(),
	coverImageUrl: text("cover_image_url"), // 封面图
	thumbnailUrl: text("thumbnail_url"), // 缩略图
	category: text("category"), // 分类
	tags: text("tags").array(), // 标签数组
	language: text("language"), // 语言: en, zh
	status: text("status").default('draft'), // draft, published, archived
	visibility: text("visibility"), // public, private
	downloadCount: integer("download_count").default(0),
	viewCount: integer("view_count").default(0),
	embeddingId: text("embedding_id"), // 向量化 ID（预留）
	embeddingModel: text("embedding_model"), // 向量化模型
	reviewStatus: text("review_status"), // 审核状态
	/** R6: 软删除字段 - NULL 表示未删除，有值表示删除时间 */
	deletedAt: timestamp("deleted_at"),
	/** R10: PPT 描述，用于 SEO 和搜索 */
	description: text("description"),
	/** R10: 文件大小（字节） */
	fileSize: integer("file_size"),
	/** R10: 文件格式，默认 pptx */
	fileFormat: text("file_format").default('pptx'),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
	pptCategoryIdx: index("ppt_category_idx").on(table.category),
	pptStatusIdx: index("ppt_status_idx").on(table.status),
	pptLanguageIdx: index("ppt_language_idx").on(table.language),
	pptCreatedAtIdx: index("ppt_created_at_idx").on(table.createdAt),
	pptDownloadsIdx: index("ppt_download_count_idx").on(table.downloadCount),
	pptViewsIdx: index("ppt_view_count_idx").on(table.viewCount),
	/** R4: 复合索引 - 优化按状态+时间排序的查询 */
	pptStatusCreatedIdx: index("ppt_status_created_idx").on(table.status, table.createdAt),
}));

/**
 * 广告观看记录表
 * 用于记录用户观看广告的状态和验证，支持看广告换积分功能
 * - R1: ppt_id 外键约束，ON DELETE SET NULL（PPT 删除后保留记录但清空关联）
 */
export const adWatchRecord = pgTable("ad_watch_record", {
	id: text("id").primaryKey(),
	userId: text("user_id").references(() => user.id, { onDelete: 'cascade' }),
	ipAddress: text("ip_address"), // 用于匿名用户追踪
	/**
	 * R1: 外键约束 - PPT 删除时设为 NULL
	 * 保留广告观看记录用于统计，但清空 PPT 关联
	 */
	pptId: text("ppt_id").references(() => ppt.id, { onDelete: 'set null' }),
	watchToken: text("watch_token").unique().notNull(), // 观看验证 token
	downloadToken: text("download_token"), // 下载验证 token
	startedAt: timestamp("started_at").notNull().defaultNow(),
	completedAt: timestamp("completed_at"),
	status: text("status").notNull().default('pending'), // pending, completed, expired
	creditsAwarded: integer("credits_awarded").default(0), // 奖励的积分数
	createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
	adWatchUserIdIdx: index("ad_watch_user_id_idx").on(table.userId),
	adWatchIpIdx: index("ad_watch_ip_idx").on(table.ipAddress),
	adWatchTokenIdx: index("ad_watch_token_idx").on(table.watchToken),
	adWatchCreatedIdx: index("ad_watch_created_idx").on(table.createdAt),
	adWatchStatusIdx: index("ad_watch_status_idx").on(table.status),
}));

/**
 * 用户下载历史表
 * 用于记录用户下载 PPT 的历史，支持首次免费检查
 * - R1: ppt_id 外键约束，ON DELETE CASCADE（PPT 删除时级联删除下载记录）
 * - R4: 复合索引优化 (download_method + downloaded_at)
 */
export const userDownloadHistory = pgTable("user_download_history", {
	id: text("id").primaryKey(),
	userId: text("user_id").references(() => user.id, { onDelete: 'cascade' }),
	/**
	 * R1: 外键约束 - PPT 删除时级联删除
	 * 下载记录与 PPT 强关联，PPT 不存在则记录无意义
	 */
	pptId: text("ppt_id").notNull().references(() => ppt.id, { onDelete: 'cascade' }),
	downloadMethod: text("download_method").notNull(), // firstFree, credits, ad
	creditsSpent: integer("credits_spent").default(0), // 消耗的积分数
	ipAddress: text("ip_address"), // 用于匿名用户追踪
	downloadedAt: timestamp("downloaded_at").notNull().defaultNow(),
}, (table) => ({
	downloadUserPptIdx: index("download_user_ppt_idx").on(table.userId, table.pptId),
	downloadUserIdx: index("download_user_idx").on(table.userId),
	downloadPptIdx: index("download_ppt_idx").on(table.pptId),
	downloadMethodIdx: index("download_method_idx").on(table.downloadMethod),
	/** R4: 复合索引 - 优化按下载方式+时间的统计查询 */
	downloadMethodDateIdx: index("download_method_date_idx").on(table.downloadMethod, table.downloadedAt),
}));
