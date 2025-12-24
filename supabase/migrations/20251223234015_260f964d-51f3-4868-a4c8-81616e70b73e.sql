-- AI Training Status table - controla o estado de treinamento da IA
CREATE TABLE public.ai_training_status (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL UNIQUE REFERENCES public.workspaces(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'learning' CHECK (status IN ('learning', 'ready', 'active', 'paused')),
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ready_at timestamp with time zone,
  activated_at timestamp with time zone,
  activated_by uuid REFERENCES public.profiles(id),
  
  -- Critérios de ativação
  min_days_required integer NOT NULL DEFAULT 14,
  min_messages_required integer NOT NULL DEFAULT 500,
  
  -- Progresso
  messages_analyzed integer NOT NULL DEFAULT 0,
  faqs_detected integer NOT NULL DEFAULT 0,
  seller_patterns_learned integer NOT NULL DEFAULT 0,
  company_info_extracted integer NOT NULL DEFAULT 0,
  objections_learned integer NOT NULL DEFAULT 0,
  
  -- Confiança
  confidence_score numeric(5,2) DEFAULT 0,
  
  -- WhatsApp vinculado (apenas 1)
  linked_whatsapp_id uuid REFERENCES public.whatsapp_connections(id),
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- AI Learned Content - conteúdo aprendido automaticamente
CREATE TABLE public.ai_learned_content (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('faq', 'seller_response', 'company_info', 'objection_handling', 'product_info')),
  
  -- Contexto original
  source_message_id uuid REFERENCES public.messages(id),
  source_conversation_id uuid REFERENCES public.conversations(id),
  seller_profile_id uuid REFERENCES public.profiles(id),
  
  -- Conteúdo aprendido
  question text,
  answer text NOT NULL,
  context text,
  
  -- Qualidade
  occurrence_count integer NOT NULL DEFAULT 1,
  effectiveness_score numeric(5,2) DEFAULT 0,
  is_approved boolean DEFAULT false,
  approved_by uuid REFERENCES public.profiles(id),
  approved_at timestamp with time zone,
  
  -- Metadata
  tags text[] DEFAULT '{}',
  keywords text[] DEFAULT '{}',
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_ai_training_status_workspace ON public.ai_training_status(workspace_id);
CREATE INDEX idx_ai_training_status_status ON public.ai_training_status(status);
CREATE INDEX idx_ai_learned_content_workspace ON public.ai_learned_content(workspace_id);
CREATE INDEX idx_ai_learned_content_type ON public.ai_learned_content(content_type);
CREATE INDEX idx_ai_learned_content_approved ON public.ai_learned_content(is_approved);

-- Enable RLS
ALTER TABLE public.ai_training_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_learned_content ENABLE ROW LEVEL SECURITY;

-- Policies for ai_training_status
CREATE POLICY "Workspace members can view training status" 
ON public.ai_training_status FOR SELECT 
USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace admins can manage training status" 
ON public.ai_training_status FOR ALL 
USING (user_is_workspace_admin(workspace_id));

-- Policies for ai_learned_content
CREATE POLICY "Workspace members can view learned content" 
ON public.ai_learned_content FOR SELECT 
USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace admins can manage learned content" 
ON public.ai_learned_content FOR ALL 
USING (user_is_workspace_admin(workspace_id));

-- Triggers para updated_at
CREATE TRIGGER update_ai_training_status_updated_at
BEFORE UPDATE ON public.ai_training_status
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_learned_content_updated_at
BEFORE UPDATE ON public.ai_learned_content
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para calcular progresso do treinamento
CREATE OR REPLACE FUNCTION public.calculate_training_progress(ws_id uuid)
RETURNS TABLE(
  days_elapsed integer,
  messages_progress numeric,
  total_progress numeric,
  is_ready boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    EXTRACT(DAY FROM now() - ats.started_at)::integer as days_elapsed,
    LEAST(100, (ats.messages_analyzed::numeric / NULLIF(ats.min_messages_required, 0) * 100)) as messages_progress,
    LEAST(100, (
      (LEAST(100, EXTRACT(DAY FROM now() - ats.started_at)::numeric / NULLIF(ats.min_days_required, 0) * 100) * 0.3) +
      (LEAST(100, ats.messages_analyzed::numeric / NULLIF(ats.min_messages_required, 0) * 100) * 0.7)
    )) as total_progress,
    (
      EXTRACT(DAY FROM now() - ats.started_at) >= ats.min_days_required AND
      ats.messages_analyzed >= ats.min_messages_required
    ) as is_ready
  FROM ai_training_status ats
  WHERE ats.workspace_id = ws_id;
$$;