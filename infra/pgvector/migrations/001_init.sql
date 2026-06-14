-- Otto pgvector derived recall schema (068). Idempotent.
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS otto_embedding_chunks (
  id              UUID PRIMARY KEY,
  source_kind     TEXT NOT NULL,
  source_path     TEXT NOT NULL,
  content_hash    TEXT NOT NULL,
  chunk_index     INT NOT NULL,
  chunk_text      TEXT NOT NULL,
  embedding       vector(8) NOT NULL,
  embedding_model TEXT NOT NULL,
  captured_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_kind, source_path, content_hash, chunk_index, embedding_model)
);

CREATE INDEX IF NOT EXISTS otto_embedding_chunks_ivfflat
  ON otto_embedding_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
