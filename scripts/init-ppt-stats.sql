-- PPT 统计数据初始化脚本
-- 为 download_count 和 view_count 为 0 的记录设置随机初始值

-- 初始化下载量 (50-500)
UPDATE ppt
SET download_count = floor(random() * 450 + 50)::int
WHERE download_count = 0 OR download_count IS NULL;

-- 初始化浏览量 (100-2000)
UPDATE ppt
SET view_count = floor(random() * 1900 + 100)::int
WHERE view_count = 0 OR view_count IS NULL;

-- 验证结果
SELECT 
  COUNT(*) as total,
  MIN(download_count) as min_downloads,
  MAX(download_count) as max_downloads,
  AVG(download_count)::int as avg_downloads,
  MIN(view_count) as min_views,
  MAX(view_count) as max_views,
  AVG(view_count)::int as avg_views
FROM ppt;
