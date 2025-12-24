-- 1. Adicionar role 'seller' ao enum de workspace_members (se não existir)
-- O role já é TEXT na tabela workspace_members, então só precisamos usar 'seller'

-- 2. Criar tabela de planos com limites
CREATE TABLE public.subscription_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  max_leads integer NOT NULL DEFAULT 100,
  max_whatsapp_connections integer NOT NULL DEFAULT 1,
  max_team_members integer NOT NULL DEFAULT 3,
  max_conversations_per_month integer NOT NULL DEFAULT 500,
  has_ai_features boolean NOT NULL DEFAULT false,
  has_advanced_reports boolean NOT NULL DEFAULT false,
  has_api_access boolean NOT NULL DEFAULT false,
  price_monthly integer NOT NULL DEFAULT 0,
  price_yearly integer NOT NULL DEFAULT 0,
  stripe_price_id_monthly text,
  stripe_price_id_yearly text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. Criar tabela para assinaturas dos workspaces
CREATE TABLE public.workspace_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id),
  status text NOT NULL DEFAULT 'active',
  stripe_subscription_id text,
  stripe_customer_id text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(workspace_id)
);

-- 4. Criar tabela para tracking de uso
CREATE TABLE public.workspace_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  month_year text NOT NULL, -- formato: '2024-01'
  leads_count integer NOT NULL DEFAULT 0,
  conversations_count integer NOT NULL DEFAULT 0,
  messages_count integer NOT NULL DEFAULT 0,
  ai_requests_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, month_year)
);

-- 5. Criar tabela para configurações de distribuição de leads
CREATE TABLE public.lead_distribution_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE UNIQUE,
  distribution_mode text NOT NULL DEFAULT 'connection', -- 'connection', 'round_robin', 'manual'
  round_robin_index integer NOT NULL DEFAULT 0,
  auto_assign_new_leads boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 6. Inserir planos padrão
INSERT INTO public.subscription_plans (name, slug, max_leads, max_whatsapp_connections, max_team_members, max_conversations_per_month, has_ai_features, has_advanced_reports, has_api_access, price_monthly, price_yearly) VALUES
('Gratuito', 'free', 50, 1, 2, 100, false, false, false, 0, 0),
('Starter', 'starter', 500, 2, 5, 1000, false, true, false, 9900, 99000),
('Professional', 'professional', 2000, 5, 15, 5000, true, true, false, 19900, 199000),
('Enterprise', 'enterprise', 10000, 20, 50, 50000, true, true, true, 49900, 499000);

-- 7. Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_distribution_settings ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies para subscription_plans (público para leitura)
CREATE POLICY "Anyone can view subscription plans" 
ON public.subscription_plans 
FOR SELECT 
USING (true);

-- 9. RLS Policies para workspace_subscriptions
CREATE POLICY "Workspace members can view their subscription" 
ON public.workspace_subscriptions 
FOR SELECT 
USING (is_workspace_member(workspace_id));

CREATE POLICY "System can manage subscriptions" 
ON public.workspace_subscriptions 
FOR ALL 
USING (true);

-- 10. RLS Policies para workspace_usage
CREATE POLICY "Workspace admins can view usage" 
ON public.workspace_usage 
FOR SELECT 
USING (user_is_workspace_admin(workspace_id));

CREATE POLICY "System can manage usage" 
ON public.workspace_usage 
FOR ALL 
USING (true);

-- 11. RLS Policies para lead_distribution_settings
CREATE POLICY "Workspace members can view distribution settings" 
ON public.lead_distribution_settings 
FOR SELECT 
USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace admins can manage distribution settings" 
ON public.lead_distribution_settings 
FOR ALL 
USING (user_is_workspace_admin(workspace_id));

-- 12. Função para verificar limites do plano
CREATE OR REPLACE FUNCTION public.check_workspace_limit(
  ws_id uuid,
  limit_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plan_limit integer;
  current_count integer;
BEGIN
  -- Obter limite do plano
  SELECT 
    CASE limit_type
      WHEN 'leads' THEN sp.max_leads
      WHEN 'connections' THEN sp.max_whatsapp_connections
      WHEN 'members' THEN sp.max_team_members
      WHEN 'conversations' THEN sp.max_conversations_per_month
    END INTO plan_limit
  FROM workspace_subscriptions ws
  JOIN subscription_plans sp ON ws.plan_id = sp.id
  WHERE ws.workspace_id = ws_id AND ws.status = 'active';
  
  -- Se não tem plano, usa o gratuito
  IF plan_limit IS NULL THEN
    SELECT 
      CASE limit_type
        WHEN 'leads' THEN max_leads
        WHEN 'connections' THEN max_whatsapp_connections
        WHEN 'members' THEN max_team_members
        WHEN 'conversations' THEN max_conversations_per_month
      END INTO plan_limit
    FROM subscription_plans WHERE slug = 'free';
  END IF;
  
  -- Contar uso atual
  CASE limit_type
    WHEN 'leads' THEN
      SELECT COUNT(*) INTO current_count FROM leads WHERE workspace_id = ws_id;
    WHEN 'connections' THEN
      SELECT COUNT(*) INTO current_count FROM whatsapp_connections WHERE workspace_id = ws_id;
    WHEN 'members' THEN
      SELECT COUNT(*) INTO current_count FROM workspace_members WHERE workspace_id = ws_id;
    WHEN 'conversations' THEN
      SELECT conversations_count INTO current_count 
      FROM workspace_usage 
      WHERE workspace_id = ws_id AND month_year = TO_CHAR(now(), 'YYYY-MM');
      current_count := COALESCE(current_count, 0);
  END CASE;
  
  RETURN current_count < plan_limit;
END;
$$;

-- 13. Função para obter próximo vendedor no round-robin
CREATE OR REPLACE FUNCTION public.get_next_seller_round_robin(ws_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_profile_id uuid;
  seller_count integer;
  current_index integer;
BEGIN
  -- Contar vendedores ativos
  SELECT COUNT(*) INTO seller_count
  FROM workspace_members wm
  JOIN profiles p ON wm.user_id = p.user_id
  WHERE wm.workspace_id = ws_id AND wm.role = 'seller';
  
  IF seller_count = 0 THEN
    RETURN NULL;
  END IF;
  
  -- Obter índice atual
  SELECT round_robin_index INTO current_index
  FROM lead_distribution_settings
  WHERE workspace_id = ws_id;
  
  current_index := COALESCE(current_index, 0);
  
  -- Obter próximo vendedor
  SELECT p.id INTO next_profile_id
  FROM workspace_members wm
  JOIN profiles p ON wm.user_id = p.user_id
  WHERE wm.workspace_id = ws_id AND wm.role = 'seller'
  ORDER BY wm.created_at
  OFFSET current_index % seller_count
  LIMIT 1;
  
  -- Atualizar índice
  UPDATE lead_distribution_settings
  SET round_robin_index = current_index + 1, updated_at = now()
  WHERE workspace_id = ws_id;
  
  RETURN next_profile_id;
END;
$$;

-- 14. Adicionar triggers de updated_at
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_subscriptions_updated_at
  BEFORE UPDATE ON public.workspace_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_usage_updated_at
  BEFORE UPDATE ON public.workspace_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_distribution_settings_updated_at
  BEFORE UPDATE ON public.lead_distribution_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();