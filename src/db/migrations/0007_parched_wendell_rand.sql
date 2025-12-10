CREATE TABLE "ad_watch_record" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"ip_address" text,
	"ppt_id" text,
	"watch_token" text NOT NULL,
	"download_token" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"status" text DEFAULT 'pending' NOT NULL,
	"credits_awarded" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ad_watch_record_watch_token_unique" UNIQUE("watch_token")
);
--> statement-breakpoint
CREATE TABLE "hot_keywords" (
	"id" text PRIMARY KEY NOT NULL,
	"keyword" text NOT NULL,
	"search_count" integer DEFAULT 0,
	"download_score" numeric DEFAULT '0',
	"final_score" numeric DEFAULT '0',
	"rank" integer NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pinned_keywords" (
	"id" text PRIMARY KEY NOT NULL,
	"keyword" text NOT NULL,
	"rank" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ppt" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text,
	"title" text NOT NULL,
	"author" text,
	"slides_count" integer DEFAULT 0,
	"file_url" text NOT NULL,
	"cover_image_url" text,
	"thumbnail_url" text,
	"category" text,
	"tags" text[],
	"language" text,
	"status" text DEFAULT 'draft',
	"visibility" text,
	"download_count" integer DEFAULT 0,
	"view_count" integer DEFAULT 0,
	"embedding_id" text,
	"embedding_model" text,
	"embedding" vector(1024),
	"review_status" text,
	"deleted_at" timestamp,
	"description" text,
	"file_size" integer,
	"file_format" text DEFAULT 'pptx',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "search_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"keyword" text NOT NULL,
	"result_count" integer DEFAULT 0,
	"clicked_ppt_id" text,
	"source" text DEFAULT 'search',
	"from_suggestion" boolean DEFAULT false,
	"search_type" text,
	"duration_ms" integer,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_download_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"ppt_id" text NOT NULL,
	"download_method" text NOT NULL,
	"credits_spent" integer DEFAULT 0,
	"ip_address" text,
	"downloaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "user_id_idx";--> statement-breakpoint
ALTER TABLE "credit_transaction" ADD COLUMN "stripe_invoice_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "ad_watch_record" ADD CONSTRAINT "ad_watch_record_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_watch_record" ADD CONSTRAINT "ad_watch_record_ppt_id_ppt_id_fk" FOREIGN KEY ("ppt_id") REFERENCES "public"."ppt"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_log" ADD CONSTRAINT "search_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_download_history" ADD CONSTRAINT "user_download_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_download_history" ADD CONSTRAINT "user_download_history_ppt_id_ppt_id_fk" FOREIGN KEY ("ppt_id") REFERENCES "public"."ppt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ad_watch_user_id_idx" ON "ad_watch_record" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ad_watch_ip_idx" ON "ad_watch_record" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "ad_watch_token_idx" ON "ad_watch_record" USING btree ("watch_token");--> statement-breakpoint
CREATE INDEX "ad_watch_created_idx" ON "ad_watch_record" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ad_watch_status_idx" ON "ad_watch_record" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "hot_keywords_rank_idx" ON "hot_keywords" USING btree ("rank");--> statement-breakpoint
CREATE UNIQUE INDEX "pinned_keywords_rank_idx" ON "pinned_keywords" USING btree ("rank");--> statement-breakpoint
CREATE UNIQUE INDEX "pinned_keywords_keyword_idx" ON "pinned_keywords" USING btree ("keyword");--> statement-breakpoint
CREATE INDEX "ppt_category_idx" ON "ppt" USING btree ("category");--> statement-breakpoint
CREATE INDEX "ppt_status_idx" ON "ppt" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ppt_language_idx" ON "ppt" USING btree ("language");--> statement-breakpoint
CREATE INDEX "ppt_created_at_idx" ON "ppt" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ppt_download_count_idx" ON "ppt" USING btree ("download_count");--> statement-breakpoint
CREATE INDEX "ppt_view_count_idx" ON "ppt" USING btree ("view_count");--> statement-breakpoint
CREATE INDEX "ppt_status_created_idx" ON "ppt" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "search_log_keyword_idx" ON "search_log" USING btree ("keyword");--> statement-breakpoint
CREATE INDEX "search_log_user_id_idx" ON "search_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "search_log_created_at_idx" ON "search_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "search_log_search_type_idx" ON "search_log" USING btree ("search_type");--> statement-breakpoint
CREATE INDEX "download_user_ppt_idx" ON "user_download_history" USING btree ("user_id","ppt_id");--> statement-breakpoint
CREATE INDEX "download_user_idx" ON "user_download_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "download_ppt_idx" ON "user_download_history" USING btree ("ppt_id");--> statement-breakpoint
CREATE INDEX "download_method_idx" ON "user_download_history" USING btree ("download_method");--> statement-breakpoint
CREATE INDEX "download_method_date_idx" ON "user_download_history" USING btree ("download_method","downloaded_at");--> statement-breakpoint
ALTER TABLE "credit_transaction" DROP COLUMN "payment_id";--> statement-breakpoint
ALTER TABLE "user_credit" DROP COLUMN "last_refresh_at";--> statement-breakpoint
ALTER TABLE "user_credit" ADD CONSTRAINT "user_credit_user_id_unique" UNIQUE("user_id");