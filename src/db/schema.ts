import { boolean, integer, pgTable, text, timestamp, index } from "drizzle-orm/pg-core";

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
}, (table) => ({
	userIdIdx: index("user_id_idx").on(table.id),
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

export const userCredit = pgTable("user_credit", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
	currentCredits: integer("current_credits").notNull().default(0),
	lastRefreshAt: timestamp("last_refresh_at"), // deprecated
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
	userCreditUserIdIdx: index("user_credit_user_id_idx").on(table.userId),
}));

export const creditTransaction = pgTable("credit_transaction", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
	type: text("type").notNull(),
	description: text("description"),
	amount: integer("amount").notNull(),
	remainingAmount: integer("remaining_amount"),
	paymentId: text("payment_id"), // field name is paymentId, but actually it's invoiceId
	expirationDate: timestamp("expiration_date"),
	expirationDateProcessedAt: timestamp("expiration_date_processed_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
	creditTransactionUserIdIdx: index("credit_transaction_user_id_idx").on(table.userId),
	creditTransactionTypeIdx: index("credit_transaction_type_idx").on(table.type),
}));

export const ppt = pgTable("ppt", {
	id: text("id").primaryKey(),
	tenantId: text("tenant_id"),
	title: text("title").notNull(),
	author: text("author"),
	slidesCount: integer("slides_count").default(0),
	fileUrl: text("file_url").notNull(),
	coverImageUrl: text("cover_image_url"),
	thumbnailUrl: text("thumbnail_url"),
	category: text("category"),
	tags: text("tags").array(),
	language: text("language"),
	status: text("status").default('draft'),
	visibility: text("visibility"),
	downloadCount: integer("download_count").default(0),
	viewCount: integer("view_count").default(0),
	embeddingId: text("embedding_id"),
	embeddingModel: text("embedding_model"),
	reviewStatus: text("review_status"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
	pptCategoryIdx: index("ppt_category_idx").on(table.category),
	pptStatusIdx: index("ppt_status_idx").on(table.status),
	pptLanguageIdx: index("ppt_language_idx").on(table.language),
	pptCreatedAtIdx: index("ppt_created_at_idx").on(table.createdAt),
	pptDownloadsIdx: index("ppt_download_count_idx").on(table.downloadCount),
	pptViewsIdx: index("ppt_view_count_idx").on(table.viewCount),
}));

/**
 * 广告观看记录表
 * 用于记录用户观看广告的状态和验证
 */
export const adWatchRecord = pgTable("ad_watch_record", {
	id: text("id").primaryKey(),
	userId: text("user_id").references(() => user.id, { onDelete: 'cascade' }),
	ipAddress: text("ip_address"),
	pptId: text("ppt_id"),
	watchToken: text("watch_token").unique().notNull(),
	downloadToken: text("download_token"),
	startedAt: timestamp("started_at").notNull().defaultNow(),
	completedAt: timestamp("completed_at"),
	status: text("status").notNull().default('pending'), // pending, completed, expired
	creditsAwarded: integer("credits_awarded").default(0),
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
 */
export const userDownloadHistory = pgTable("user_download_history", {
	id: text("id").primaryKey(),
	userId: text("user_id").references(() => user.id, { onDelete: 'cascade' }),
	pptId: text("ppt_id").notNull(),
	downloadMethod: text("download_method").notNull(), // firstFree, credits, ad
	creditsSpent: integer("credits_spent").default(0),
	ipAddress: text("ip_address"),
	downloadedAt: timestamp("downloaded_at").notNull().defaultNow(),
}, (table) => ({
	downloadUserPptIdx: index("download_user_ppt_idx").on(table.userId, table.pptId),
	downloadUserIdx: index("download_user_idx").on(table.userId),
	downloadPptIdx: index("download_ppt_idx").on(table.pptId),
	downloadMethodIdx: index("download_method_idx").on(table.downloadMethod),
}));
