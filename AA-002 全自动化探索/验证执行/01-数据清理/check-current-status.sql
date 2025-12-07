-- 查看当前向量状态
-- 运行此SQL查看当前数据库中向量的状态

SELECT 
  COUNT(*) as total_ppts,
  COUNT(embedding) as with_embedding,
  COUNT(DISTINCT embedding_model) as model_types,
  STRING_AGG(DISTINCT embedding_model, ', ') as models_used
FROM ppt;
