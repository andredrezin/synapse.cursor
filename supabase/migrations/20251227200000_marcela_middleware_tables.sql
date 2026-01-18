-- =====================================================
-- Migration: Marcela Middleware Tables
-- Created: 2025-12-27
-- Description: Tabelas necessárias para Marcela AI com RAG multi-tenant
-- =====================================================

-- =====================================================
-- 1. CONVERSATIONS TABLE (gerenciar conversas por lead)
-- =====================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
  messages_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, lead_id, channel)
);

-- Index para busca rápida
CREATE INDEX IF NOT EXISTS idx_conversations_workspace ON conversations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_conversations_lead ON conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);

-- =====================================================
-- 2. AI_SETTINGS TABLE (configurações de IA por workspace)
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  ai_name TEXT DEFAULT 'Marcela',
  ai_personality TEXT,
  system_prompt TEXT,
  blocked_topics TEXT[],
  allowed_topics TEXT[],
  max_context_messages INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_ai_settings_workspace ON ai_settings(workspace_id);

-- =====================================================
-- 3. KNOWLEDGE_BASE TABLE (RAG - base de conhecimento)
-- =====================================================
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  embedding VECTOR(1536), -- OpenAI embeddings dimension
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_knowledge_workspace ON knowledge_base(workspace_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_base(category);

-- Vector similarity index (requires pgvector extension)
-- CREATE INDEX IF NOT EXISTS idx_knowledge_embedding ON knowledge_base 
-- USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- =====================================================
-- 4. ATUALIZAR WORKSPACES TABLE (adicionar instance_name)
-- =====================================================
ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS instance_name TEXT UNIQUE;

COMMENT ON COLUMN workspaces.instance_name IS 'Nome da instância Evolution API vinculada a este workspace';

-- =====================================================
-- 5. ATUALIZAR MESSAGES TABLE (adicionar conversation_id)
-- =====================================================
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Conversations RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view conversations in their workspaces" ON conversations;
CREATE POLICY "Users can view conversations in their workspaces"
  ON conversations FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role has full access to conversations" ON conversations;
CREATE POLICY "Service role has full access to conversations"
  ON conversations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- AI Settings RLS
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view ai_settings in their workspaces" ON ai_settings;
CREATE POLICY "Users can view ai_settings in their workspaces"
  ON ai_settings FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role has full access to ai_settings" ON ai_settings;
CREATE POLICY "Service role has full access to ai_settings"
  ON ai_settings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Knowledge Base RLS
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view knowledge in their workspaces" ON knowledge_base;
CREATE POLICY "Users can view knowledge in their workspaces"
  ON knowledge_base FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role has full access to knowledge_base" ON knowledge_base;
CREATE POLICY "Service role has full access to knowledge_base"
  ON knowledge_base FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 7. FUNÇÃO: search_knowledge (Semantic Search - Placeholder)
-- =====================================================
-- NOTA: Esta é uma versão simplificada. Para busca semântica real,
-- você precisará implementar embeddings com OpenAI e pgvector

CREATE OR REPLACE FUNCTION search_knowledge(
  p_workspace_id UUID,
  p_query TEXT,
  p_limit INT DEFAULT 3
)
RETURNS TABLE (
  title TEXT,
  content TEXT,
  similarity FLOAT
) AS $$
BEGIN
  -- Busca fulltext simples (substitua por busca vetorial quando tiver embeddings)
  RETURN QUERY
  SELECT 
    kb.title,
    kb.content,
    0.5 AS similarity -- Placeholder, substitua por cálculo real de similaridade
  FROM knowledge_base kb
  WHERE kb.workspace_id = p_workspace_id
    AND (
      kb.title ILIKE '%' || p_query || '%' OR
      kb.content ILIKE '%' || p_query || '%'
    )
  ORDER BY kb.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. TRIGGERS para updated_at
-- =====================================================

-- Conversations
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- AI Settings
DROP TRIGGER IF EXISTS update_ai_settings_updated_at ON ai_settings;
CREATE TRIGGER update_ai_settings_updated_at
  BEFORE UPDATE ON ai_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Knowledge Base
DROP TRIGGER IF EXISTS update_knowledge_base_updated_at ON knowledge_base;
CREATE TRIGGER update_knowledge_base_updated_at
  BEFORE UPDATE ON knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. SEED DATA (opcional - para testes)
-- =====================================================

-- Inserir AI Settings padrão para workspaces existentes
-- INSERT INTO ai_settings (workspace_id, ai_name, system_prompt)
-- SELECT 
--   id,
--   'Marcela',
--   'Você é a Marcela, assistente virtual profissional e prestativa.'
-- FROM workspaces
-- WHERE NOT EXISTS (
--   SELECT 1 FROM ai_settings WHERE ai_settings.workspace_id = workspaces.id
-- );

-- =====================================================
-- 10. COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE conversations IS 'Gerencia conversas entre leads e o workspace via WhatsApp';
COMMENT ON TABLE ai_settings IS 'Configurações de personalidade e comportamento da IA por workspace';
COMMENT ON TABLE knowledge_base IS 'Base de conhecimento RAG para respostas contextualizadas por workspace';
COMMENT ON FUNCTION search_knowledge IS 'Busca conhecimento relevante para RAG (implementar busca vetorial)';
