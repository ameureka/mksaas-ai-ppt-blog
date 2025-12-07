-- 清理旧向量数据
-- 运行此SQL清空所有现有向量，准备重新生成

-- 步骤1: 清空所有现有向量
UPDATE ppt 
SET 
  embedding = NULL, 
  embedding_model = NULL,
  updated_at = NOW()
WHERE embedding IS NOT NULL;

-- 步骤2: 验证清理结果（应该返回 0）
SELECT COUNT(*) as remaining_embeddings 
FROM ppt 
WHERE embedding IS NOT NULL;
