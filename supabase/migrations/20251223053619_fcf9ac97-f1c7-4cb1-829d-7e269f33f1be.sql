-- ============================================
-- KNOWLEDGE BASE PARA RAG COM IA
-- ============================================

-- Categorias de conhecimento
CREATE TABLE public.knowledge_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, slug)
);

-- Base de conhecimento principal
CREATE TABLE public.knowledge_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.knowledge_categories(id) ON DELETE SET NULL,
  
  -- Conteúdo
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT, -- Resumo curto para contexto rápido
  
  -- Tipo de entrada
  entry_type TEXT NOT NULL DEFAULT 'faq', -- faq, product, service, policy, general
  
  -- Metadados para busca
  keywords TEXT[], -- Palavras-chave para busca
  tags TEXT[],
  
  -- Controle de segurança para IA
  is_public BOOLEAN NOT NULL DEFAULT false, -- Pode ser mostrado para leads
  is_ai_accessible BOOLEAN NOT NULL DEFAULT true, -- IA pode usar este conhecimento
  sensitivity_level TEXT NOT NULL DEFAULT 'public', -- public, internal, confidential
  
  -- Controle de versão
  version INTEGER DEFAULT 1,
  
  -- Embedding para busca vetorial futura (pgvector)
  -- embedding vector(1536), -- Descomentar quando adicionar pgvector
  
  -- Estatísticas de uso
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Auditoria
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Histórico de conversas para contexto de IA
CREATE TABLE public.conversation_context (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  
  -- Contexto extraído
  topics TEXT[], -- Tópicos discutidos
  intent TEXT, -- Intenção do lead (compra, suporte, info)
  sentiment TEXT, -- Sentimento geral
  key_points JSONB, -- Pontos importantes extraídos
  
  -- Produtos/serviços mencionados
  mentioned_products TEXT[],
  mentioned_services TEXT[],
  
  -- Para RAG
  summary TEXT, -- Resumo da conversa para contexto
  is_resolved BOOLEAN DEFAULT false,
  resolution_notes TEXT,
  
  -- Não incluir dados sensíveis
  -- Campos como preços negociados, dados pessoais NÃO devem estar aqui
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Perfil de conhecimento do lead (para personalização)
CREATE TABLE public.lead_knowledge_profile (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  
  -- Interesses detectados (NÃO sensível)
  interests TEXT[],
  preferred_products TEXT[],
  preferred_services TEXT[],
  
  -- Comportamento (NÃO sensível)
  communication_style TEXT, -- formal, informal, técnico
  preferred_channel TEXT,
  best_contact_time TEXT,
  
  -- Histórico agregado (NÃO sensível)
  total_conversations INTEGER DEFAULT 0,
  avg_response_time INTEGER, -- em segundos
  
  -- NÃO armazenar aqui:
  -- - Dados financeiros
  -- - Dados pessoais sensíveis
  -- - Histórico de pagamentos
  -- - Senhas ou tokens
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, lead_id)
);

-- Configurações de IA por workspace
CREATE TABLE public.ai_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE UNIQUE,
  
  -- Configurações gerais
  is_enabled BOOLEAN DEFAULT true,
  ai_name TEXT DEFAULT 'Assistente',
  ai_personality TEXT DEFAULT 'professional', -- professional, friendly, formal
  
  -- Prompt base (sem dados sensíveis)
  system_prompt TEXT,
  greeting_message TEXT,
  
  -- Controles de segurança
  max_context_messages INTEGER DEFAULT 10,
  allowed_topics TEXT[], -- Tópicos que a IA pode discutir
  blocked_topics TEXT[], -- Tópicos proibidos
  
  -- Transferência para humano
  transfer_keywords TEXT[], -- Palavras que trigam transferência
  transfer_after_messages INTEGER DEFAULT 5, -- Transferir após X mensagens sem resolução
  
  -- Horários
  active_hours_start TIME,
  active_hours_end TIME,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE E BUSCA
-- ============================================

-- Knowledge entries
CREATE INDEX idx_knowledge_entries_workspace ON public.knowledge_entries (workspace_id);
CREATE INDEX idx_knowledge_entries_category ON public.knowledge_entries (category_id);
CREATE INDEX idx_knowledge_entries_type ON public.knowledge_entries (entry_type);
CREATE INDEX idx_knowledge_entries_ai_accessible ON public.knowledge_entries (workspace_id, is_ai_accessible) WHERE is_ai_accessible = true;
CREATE INDEX idx_knowledge_entries_keywords ON public.knowledge_entries USING GIN (keywords);
CREATE INDEX idx_knowledge_entries_tags ON public.knowledge_entries USING GIN (tags);

-- Full text search
CREATE INDEX idx_knowledge_entries_search ON public.knowledge_entries 
  USING GIN (to_tsvector('portuguese', title || ' ' || content));

-- Categories
CREATE INDEX idx_knowledge_categories_workspace ON public.knowledge_categories (workspace_id);

-- Conversation context
CREATE INDEX idx_conversation_context_workspace ON public.conversation_context (workspace_id);
CREATE INDEX idx_conversation_context_lead ON public.conversation_context (lead_id);
CREATE INDEX idx_conversation_context_topics ON public.conversation_context USING GIN (topics);

-- Lead knowledge profile
CREATE INDEX idx_lead_knowledge_workspace ON public.lead_knowledge_profile (workspace_id);
CREATE INDEX idx_lead_knowledge_lead ON public.lead_knowledge_profile (lead_id);

-- AI settings
CREATE INDEX idx_ai_settings_workspace ON public.ai_settings (workspace_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.knowledge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_knowledge_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

-- Knowledge Categories
CREATE POLICY "Workspace members can view categories" 
ON public.knowledge_categories FOR SELECT 
USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace admins can manage categories" 
ON public.knowledge_categories FOR ALL 
USING (user_is_workspace_admin(workspace_id));

-- Knowledge Entries
CREATE POLICY "Workspace members can view knowledge" 
ON public.knowledge_entries FOR SELECT 
USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace admins can create knowledge" 
ON public.knowledge_entries FOR INSERT 
WITH CHECK (user_is_workspace_admin(workspace_id));

CREATE POLICY "Workspace admins can update knowledge" 
ON public.knowledge_entries FOR UPDATE 
USING (user_is_workspace_admin(workspace_id));

CREATE POLICY "Workspace admins can delete knowledge" 
ON public.knowledge_entries FOR DELETE 
USING (user_is_workspace_admin(workspace_id));

-- Conversation Context (sistema pode inserir via service role)
CREATE POLICY "Workspace members can view context" 
ON public.conversation_context FOR SELECT 
USING (is_workspace_member(workspace_id));

CREATE POLICY "System can insert context" 
ON public.conversation_context FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Workspace admins can update context" 
ON public.conversation_context FOR UPDATE 
USING (user_is_workspace_admin(workspace_id));

-- Lead Knowledge Profile
CREATE POLICY "Workspace members can view lead profiles" 
ON public.lead_knowledge_profile FOR SELECT 
USING (is_workspace_member(workspace_id));

CREATE POLICY "System can manage lead profiles" 
ON public.lead_knowledge_profile FOR ALL 
USING (true);

-- AI Settings
CREATE POLICY "Workspace members can view AI settings" 
ON public.ai_settings FOR SELECT 
USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace admins can manage AI settings" 
ON public.ai_settings FOR ALL 
USING (user_is_workspace_admin(workspace_id));

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_knowledge_categories_updated_at
BEFORE UPDATE ON public.knowledge_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_entries_updated_at
BEFORE UPDATE ON public.knowledge_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversation_context_updated_at
BEFORE UPDATE ON public.conversation_context
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_knowledge_updated_at
BEFORE UPDATE ON public.lead_knowledge_profile
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_settings_updated_at
BEFORE UPDATE ON public.ai_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- FUNÇÃO PARA BUSCA DE CONHECIMENTO (RAG)
-- ============================================

CREATE OR REPLACE FUNCTION public.search_knowledge(
  p_workspace_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  summary TEXT,
  entry_type TEXT,
  category_name TEXT,
  relevance REAL
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ke.id,
    ke.title,
    ke.content,
    ke.summary,
    ke.entry_type,
    kc.name as category_name,
    ts_rank(
      to_tsvector('portuguese', ke.title || ' ' || ke.content),
      plainto_tsquery('portuguese', p_query)
    ) as relevance
  FROM knowledge_entries ke
  LEFT JOIN knowledge_categories kc ON ke.category_id = kc.id
  WHERE ke.workspace_id = p_workspace_id
    AND ke.is_ai_accessible = true
    AND ke.sensitivity_level = 'public'
    AND (
      to_tsvector('portuguese', ke.title || ' ' || ke.content) @@ plainto_tsquery('portuguese', p_query)
      OR p_query = ANY(ke.keywords)
      OR p_query = ANY(ke.tags)
    )
  ORDER BY relevance DESC
  LIMIT p_limit;
$$;

-- ============================================
-- REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.knowledge_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_settings;