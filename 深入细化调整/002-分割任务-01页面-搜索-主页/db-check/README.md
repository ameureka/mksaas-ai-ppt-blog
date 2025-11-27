# PPT 数据库检查记录（设计区）

## 连接信息
```
postgresql://neondb_owner:npg_iAq3klBrmx2O@ep-silent-dream-a1w2dlyp-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## 执行的 SQL 与结果

1) 列出表：
```sql
\dt
```
结果：存在 ppt、slide、category、download_record、view_record、user_favorite 等共 16 张表。

2) 查看 ppt 表结构：
```sql
\d+ ppt
```
结果摘要：
- 字段：id, tenant_id, title, author, slides_count, file_url, cover_image_url, thumbnail_url, category, tags[], language, status, visibility, download_count, view_count, embedding_id, embedding_model, review_status, created_at, updated_at
- 索引：ppt_category_idx, ppt_status_idx, ppt_language_idx, ppt_created_at_idx, ppt_download_count_idx, ppt_view_count_idx
- 触发器：ppt_updated_at_trigger, trigger_category_count（另有 RI 约束触发器）

3) 行数：
```sql
SELECT count(*) AS total FROM ppt;
```
结果：68

4) 数据预览：
```sql
SELECT id, title, category, author, file_url, slides_count, status, created_at FROM ppt LIMIT 5;
```
结果：示例行（均 published，slides_count 20-28，category business/general/marketing...），文件 URL 指向 `https://aippt.guochunlin.com/...`

5) 索引列表：
```sql
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'ppt';
```
结果：ppt_pkey + category/status/language/created_at/download_count/view_count 索引。

6) 触发器列表：
```sql
SELECT tgname, tgrelid::regclass::text AS table_name FROM pg_trigger WHERE tgrelid::regclass::text = 'ppt'::regclass::text;
```
结果：RI_ConstraintTrigger_* 系列、trigger_category_count、ppt_updated_at_trigger。

## 结论
- 数据库可用，ppt 表已有 68 条数据且关键字段/索引/触发器齐全。
- 可直接接入 Drizzle Actions，无需种子导入。

## 后续
- 按实施步骤将 Drizzle actions 迁入 `src/actions/ppt/*`。
- 前台/后台改造可直接使用现有数据验证。


###------实际数据库信息-------
SELECT tgname, tgrelid::regclass::text AS table_name
  FROM pg_trigger
  WHERE tgrelid::regclass::text = 'ppt'::regclass::text;

	tgname	table_name
1	RI_ConstraintTrigger_a_32783	ppt
2	RI_ConstraintTrigger_a_32784	ppt
3	RI_ConstraintTrigger_a_65572	ppt
4	RI_ConstraintTrigger_a_65573	ppt
5	RI_ConstraintTrigger_a_65593	ppt
6	RI_ConstraintTrigger_a_65594	ppt
7	RI_ConstraintTrigger_a_65612	ppt
8	RI_ConstraintTrigger_a_65613	ppt
9	trigger_category_count	ppt
10	ppt_updated_at_trigger	ppt


SELECT indexname, indexdef
  FROM pg_indexes
  WHERE tablename = 'ppt';

#	indexname	indexdef
1	ppt_pkey	CREATE UNIQUE INDEX ppt_pkey ON public.ppt USING btree (id)
2	ppt_category_idx	CREATE INDEX ppt_category_idx ON public.ppt USING btree (category)
3	ppt_status_idx	CREATE INDEX ppt_status_idx ON public.ppt USING btree (status)
4	ppt_language_idx	CREATE INDEX ppt_language_idx ON public.ppt USING btree (language)
5	ppt_created_at_idx	CREATE INDEX ppt_created_at_idx ON public.ppt USING btree (created_at DESC)
6	ppt_download_count_idx	CREATE INDEX ppt_download_count_idx ON public.ppt USING btree (download_count DESC)
7	ppt_view_count_idx	CREATE INDEX ppt_view_count_idx ON public.ppt USING btree (view_count DESC)


-- Failed query:
-- SELECT id, title, category, author, file_url, file_size, slides_count, status, created_at
--   FROM ppt
--   LIMIT 5;
SELECT id, title, category, author, file_url, slides_count, status, created_at
FROM ppt
LIMIT 5


#	id	title	category	author	file_url	slides_count	status	created_at
1	ppt_2c9c293e_c408	ppt_2c9c293e_c408-文艺复古-135764-PPT-文艺复古	business	第一PPT	https://aippt.guochunlin.com/templates/business/ppt_2c9c293e_c408.pptx	21	published	2025-11-23 15:50:54.030632
2	ppt_82995cb0_8173	ppt_82995cb0_8173-小清新-135763-PPT-小清新	business	第一PPT	https://aippt.guochunlin.com/templates/business/ppt_82995cb0_8173.pptx	24	published	2025-11-23 15:51:06.243104
3	ppt_d2562801_70d3	ppt_d2562801_70d3-小清新-135762-PPT-小清新	business	第一PPT	https://aippt.guochunlin.com/templates/business/ppt_d2562801_70d3.pptx	25	published	2025-11-23 15:51:15.170892
4	ppt_36315d49_299d	ppt_36315d49_299d-新中式-135776-PPT-新中式	general	第一PPT	https://aippt.guochunlin.com/templates/general/ppt_36315d49_299d.pptx	20	published	2025-11-23 15:51:34.815194
5	ppt_3d3b2160_80ab	ppt_3d3b2160_80ab-弥散风-135882-PPT-弥散风	marketing	第一PPT	https://aippt.guochunlin.com/templates/marketing/ppt_3d3b2160_80ab.pptx	28	published	2025-11-23 15:51:49.00289


SELECT count(*) AS total FROM ppt;

total
1	68


\d+ ppt

Table "public.ppt"
Column	Type	Collation	Nullable	Default	Storage	Compression	Stats target	Description
id	text		not null		extended
tenant_id	text				extended
title	text				extended
author	text				extended
slides_count	integer				plain
file_url	text				extended
cover_image_url	text				extended
thumbnail_url	text				extended
category	text				extended
tags	text[]				extended
language	text				extended
status	text				extended
visibility	text				extended
download_count	integer				plain
view_count	integer				plain
embedding_id	text				extended
embedding_model	text				extended
review_status	text				extended
created_at	timestamp without time zone				plain
updated_at	timestamp without time zone				plain
Indexes:
"ppt_pkey" PRIMARY KEY, btree (id)
"ppt_category_idx" btree (category)
"ppt_created_at_idx" btree (created_at DESC)
"ppt_download_count_idx" btree (download_count DESC)
"ppt_language_idx" btree (language)
"ppt_status_idx" btree (status)
"ppt_view_count_idx" btree (view_count DESC)
Referenced by:
TABLE "download_record" CONSTRAINT "download_record_ppt_id_fkey" FOREIGN KEY (ppt_id) REFERENCES ppt(id) ON DELETE CASCADE
TABLE "slide" CONSTRAINT "slide_ppt_id_fkey" FOREIGN KEY (ppt_id) REFERENCES ppt(id)
TABLE "user_favorite" CONSTRAINT "user_favorite_ppt_id_fkey" FOREIGN KEY (ppt_id) REFERENCES ppt(id) ON DELETE CASCADE
TABLE "view_record" CONSTRAINT "view_record_ppt_id_fkey" FOREIGN KEY (ppt_id) REFERENCES ppt(id) ON DELETE CASCADE
Triggers:
ppt_updated_at_trigger BEFORE UPDATE ON ppt FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
trigger_category_count AFTER INSERT OR DELETE OR UPDATE ON ppt FOR EACH ROW EXECUTE FUNCTION update_category_count()
Access method: heap


\dt

List of relations
Schema	Name	Type	Owner
public	account	table	neondb_owner
public	category	table	neondb_owner
public	credit_transaction	table	neondb_owner
public	download_record	table	neondb_owner
public	import_batch	table	neondb_owner
public	import_record	table	neondb_owner
public	payment	table	neondb_owner
public	playing_with_neon	table	neondb_owner
public	ppt	table	neondb_owner
public	session	table	neondb_owner
public	slide	table	neondb_owner
public	user	table	neondb_owner
public	user_credit	table	neondb_owner
public	user_favorite	table	neondb_owner
public	verification	table	neondb_owner
public	view_record	table	neondb_owner
(16 rows)







