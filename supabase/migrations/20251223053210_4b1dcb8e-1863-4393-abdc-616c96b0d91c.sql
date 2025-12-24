-- Índices de performance para WhatsApp
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads (phone);
CREATE INDEX IF NOT EXISTS idx_messages_workspace ON public.messages (workspace_id);
CREATE INDEX IF NOT EXISTS idx_messages_whatsapp_id ON public.messages (whatsapp_message_id) WHERE whatsapp_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_workspace ON public.whatsapp_connections (workspace_id);

-- Tabela de Templates WhatsApp (necessário para API Oficial)
CREATE TABLE public.whatsapp_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES public.whatsapp_connections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'pt_BR',
  category TEXT NOT NULL DEFAULT 'MARKETING',
  status TEXT NOT NULL DEFAULT 'pending',
  header_type TEXT,
  header_content TEXT,
  body_text TEXT NOT NULL,
  footer_text TEXT,
  buttons JSONB,
  meta_template_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para templates
CREATE INDEX idx_whatsapp_templates_workspace ON public.whatsapp_templates (workspace_id);
CREATE INDEX idx_whatsapp_templates_connection ON public.whatsapp_templates (connection_id);
CREATE INDEX idx_whatsapp_templates_status ON public.whatsapp_templates (status);

-- Enable RLS
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for templates
CREATE POLICY "Workspace members can view templates" 
ON public.whatsapp_templates 
FOR SELECT 
USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace admins can create templates" 
ON public.whatsapp_templates 
FOR INSERT 
WITH CHECK (user_is_workspace_admin(workspace_id));

CREATE POLICY "Workspace admins can update templates" 
ON public.whatsapp_templates 
FOR UPDATE 
USING (user_is_workspace_admin(workspace_id));

CREATE POLICY "Workspace admins can delete templates" 
ON public.whatsapp_templates 
FOR DELETE 
USING (user_is_workspace_admin(workspace_id));

-- Tabela de logs de conexão para debug/auditoria
CREATE TABLE public.whatsapp_connection_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES public.whatsapp_connections(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para buscar logs por conexão
CREATE INDEX idx_whatsapp_logs_connection ON public.whatsapp_connection_logs (connection_id);
CREATE INDEX idx_whatsapp_logs_created ON public.whatsapp_connection_logs (created_at DESC);

-- Enable RLS
ALTER TABLE public.whatsapp_connection_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy for logs (via connection's workspace)
CREATE POLICY "Workspace members can view connection logs" 
ON public.whatsapp_connection_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM whatsapp_connections wc
    WHERE wc.id = whatsapp_connection_logs.connection_id
    AND is_workspace_member(wc.workspace_id)
  )
);

-- Only system can insert logs (via service role)
CREATE POLICY "System can insert logs" 
ON public.whatsapp_connection_logs 
FOR INSERT 
WITH CHECK (true);

-- Trigger para atualizar updated_at em templates
CREATE TRIGGER update_whatsapp_templates_updated_at
BEFORE UPDATE ON public.whatsapp_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar tabela ao realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_templates;