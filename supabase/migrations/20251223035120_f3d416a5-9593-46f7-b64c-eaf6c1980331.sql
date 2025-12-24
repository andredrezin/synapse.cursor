-- Criar função para obter o role do usuário no workspace
CREATE OR REPLACE FUNCTION public.get_user_workspace_role(ws_id uuid, uid uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM workspace_members
  WHERE workspace_id = ws_id AND user_id = uid
  LIMIT 1;
$$;

-- Criar função para verificar se usuário é admin/owner do workspace
CREATE OR REPLACE FUNCTION public.user_is_workspace_admin(ws_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  );
$$;

-- Criar função para verificar se dados pertencem ao usuário (para vendedores)
-- Retorna TRUE se o usuário é admin/owner OU se os dados são atribuídos a ele
CREATE OR REPLACE FUNCTION public.can_access_data(ws_id uuid, assigned_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- É admin/owner = vê tudo
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = ws_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
    OR
    -- É vendedor = vê apenas seus dados
    (
      assigned_profile_id IS NOT NULL 
      AND assigned_profile_id = (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
    OR
    -- Se não está atribuído a ninguém, todos do workspace podem ver
    assigned_profile_id IS NULL;
$$;

-- Atualizar RLS de leads para filtrar por permissão
DROP POLICY IF EXISTS "Workspace members can view leads" ON public.leads;
CREATE POLICY "Users can view leads based on role"
ON public.leads
FOR SELECT
USING (
  is_workspace_member(workspace_id) 
  AND can_access_data(workspace_id, assigned_to)
);

-- Atualizar RLS de conversas para filtrar por permissão
DROP POLICY IF EXISTS "Workspace members can view conversations" ON public.conversations;
CREATE POLICY "Users can view conversations based on role"
ON public.conversations
FOR SELECT
USING (
  is_workspace_member(workspace_id) 
  AND can_access_data(workspace_id, assigned_to)
);

-- Atualizar RLS de messages para filtrar por conversa acessível
DROP POLICY IF EXISTS "Workspace members can view messages" ON public.messages;
CREATE POLICY "Users can view messages based on role"
ON public.messages
FOR SELECT
USING (
  is_workspace_member(workspace_id)
  AND EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id
    AND can_access_data(c.workspace_id, c.assigned_to)
  )
);

-- Permitir que profiles sejam visíveis para membros do mesmo workspace
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view profiles in their workspace"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM workspace_members wm1
    JOIN workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
    WHERE wm1.user_id = auth.uid()
    AND wm2.user_id = profiles.user_id
  )
);

-- Adicionar coluna profile_id na tabela leads se não existir (para referência correta)
-- Atualizar assigned_to para referenciar profiles.id em vez de auth.users
ALTER TABLE public.leads 
DROP CONSTRAINT IF EXISTS leads_assigned_to_fkey;

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_workspace_id ON public.leads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_to ON public.conversations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_conversations_workspace_id ON public.conversations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_composite ON public.workspace_members(workspace_id, user_id, role);