-- Migration: Sistema Multi-Agente (Versão Simplificada)
-- Created at: 2025-12-26 00:53:00

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela para armazenar padrões aprendidos de conversas bem-sucedidas
CREATE TABLE IF NOT EXISTS public.ai_learned_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  conversation_id UUID,
  
  -- Resumo da conversa
  conversation_summary TEXT NOT NULL,
  
  -- Embedding para busca por similaridade
  embedding vector(1536),
  
  -- Resultado da conversa
  outcome TEXT NOT NULL CHECK (outcome IN ('venda', 'agendamento', 'qualificacao', 'perdido')),
  success_score DECIMAL(3,2) DEFAULT 0.0 CHECK (success_score >= 0 AND success_score <= 1),
  
  -- Metadados
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para busca vetorial
CREATE INDEX IF NOT EXISTS ai_learned_patterns_embedding_idx 
ON public.ai_learned_patterns 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Índices para performance
CREATE INDEX IF NOT EXISTS ai_learned_patterns_workspace_idx 
ON public.ai_learned_patterns(workspace_id);

CREATE INDEX IF NOT EXISTS ai_learned_patterns_outcome_idx 
ON public.ai_learned_patterns(outcome);

-- Tabela para configuração de agentes
CREATE TABLE IF NOT EXISTS public.ai_agents_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Tipo de agente
  agent_type TEXT NOT NULL CHECK (agent_type IN ('vendedor', 'analista', 'aprendiz')),
  
  -- Configurações
  model TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('gemini', 'openai', 'anthropic')),
  
  -- Parâmetros
  temperature DECIMAL(2,1) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1000,
  
  -- Especialização
  specialization TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Status
  enabled BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(workspace_id, agent_type)
);

-- Tabela para rastrear uso de agentes
CREATE TABLE IF NOT EXISTS public.ai_agents_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  
  -- Métricas
  tokens_used INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,4) DEFAULT 0,
  
  -- Timestamp
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(workspace_id, agent_type, date)
);

-- Tabela para conversas pendentes de aprendizado
CREATE TABLE IF NOT EXISTS public.ai_learning_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  conversation_id UUID,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  outcome TEXT NOT NULL,
  
  -- Revisão
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para fila de aprendizado
CREATE INDEX IF NOT EXISTS ai_learning_queue_status_idx 
ON public.ai_learning_queue(status) 
WHERE status = 'pending';

-- Função para buscar padrões similares
CREATE OR REPLACE FUNCTION public.match_learned_patterns(
  query_embedding vector(1536),
  p_workspace_id UUID,
  match_threshold FLOAT DEFAULT 0.8,
  match_count INT DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  conversation_summary TEXT,
  outcome TEXT,
  success_score DECIMAL,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    lp.id,
    lp.conversation_summary,
    lp.outcome,
    lp.success_score,
    1 - (lp.embedding <=> query_embedding) AS similarity
  FROM public.ai_learned_patterns lp
  WHERE 
    lp.workspace_id = p_workspace_id
    AND lp.approved_at IS NOT NULL
    AND 1 - (lp.embedding <=> query_embedding) > match_threshold
  ORDER BY lp.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- RLS Policies

-- ai_learned_patterns
ALTER TABLE public.ai_learned_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view learned patterns in their workspace"
ON public.ai_learned_patterns FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can manage learned patterns in their workspace"
ON public.ai_learned_patterns FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- ai_agents_config
ALTER TABLE public.ai_agents_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view agents config in their workspace"
ON public.ai_agents_config FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can manage agents config in their workspace"
ON public.ai_agents_config FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- ai_agents_usage
ALTER TABLE public.ai_agents_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view agents usage in their workspace"
ON public.ai_agents_usage FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- ai_learning_queue
ALTER TABLE public.ai_learning_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view learning queue in their workspace"
ON public.ai_learning_queue FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can manage learning queue in their workspace"
ON public.ai_learning_queue FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Trigger para updated_at (se a função já existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE TRIGGER update_ai_learned_patterns_updated_at
      BEFORE UPDATE ON public.ai_learned_patterns
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();

    CREATE TRIGGER update_ai_agents_config_updated_at
      BEFORE UPDATE ON public.ai_agents_config
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();

    CREATE TRIGGER update_ai_learning_queue_updated_at
      BEFORE UPDATE ON public.ai_learning_queue
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Inserir configurações padrão de agentes
INSERT INTO public.ai_agents_config (workspace_id, agent_type, model, provider, specialization)
SELECT 
  id,
  'vendedor',
  'gemini-1.5-pro-latest',
  'gemini',
  ARRAY['atendimento', 'vendas', 'multimodal']
FROM public.workspaces
ON CONFLICT (workspace_id, agent_type) DO NOTHING;

INSERT INTO public.ai_agents_config (workspace_id, agent_type, model, provider, specialization)
SELECT 
  id,
  'analista',
  'gpt-4o',
  'openai',
  ARRAY['metricas', 'calculos', 'dados']
FROM public.workspaces
ON CONFLICT (workspace_id, agent_type) DO NOTHING;
