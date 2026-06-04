-- 1. Bật extension pgvector để hỗ trợ vector hóa và tính khoảng cách tương đồng
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Thêm cột embedding vào bảng products (lưu trữ vector 768 chiều từ gemini-embedding-001)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS embedding vector(768);

-- 3. Tạo function tìm kiếm tương đồng sản phẩm (RPC) để gọi từ backend
CREATE OR REPLACE FUNCTION match_products (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id bigint,
  name text,
  description text,
  brand text,
  base_price numeric,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    products.id,
    products.name,
    products.description,
    products.brand,
    products.base_price,
    1 - (products.embedding <=> query_embedding) AS similarity
  FROM products
  WHERE products.deleted_at IS NULL
    AND 1 - (products.embedding <=> query_embedding) > match_threshold
  ORDER BY products.embedding <=> query_embedding
  LIMIT match_count;
$$;
