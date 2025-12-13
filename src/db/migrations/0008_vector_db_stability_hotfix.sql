ALTER TABLE "ppt" ADD COLUMN "embedding_status" text DEFAULT 'pending';
--> statement-breakpoint
ALTER TABLE "ppt" ADD COLUMN "embedding_error" text;
--> statement-breakpoint
ALTER TABLE "ppt" ADD COLUMN "embedding_updated_at" timestamp;
--> statement-breakpoint
UPDATE "ppt"
SET "embedding_status" = 'success',
    "embedding_updated_at" = "updated_at"
WHERE "embedding" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX "ppt_embedding_status_idx" ON "ppt" USING btree ("embedding_status");
--> statement-breakpoint
CREATE INDEX "ppt_embedding_updated_at_idx" ON "ppt" USING btree ("embedding_updated_at");

