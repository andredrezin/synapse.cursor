-- FIX: Tornar as conexões visíveis para todos os membros do workspace
-- Às vezes a função de segurança (is_workspace_member) falha ou cacheia errado.
-- Isso simplifica a regra para garantir que se você é do workspace, você vê.

DROP POLICY IF EXISTS "Workspace members can view connections" ON whatsapp_connections;

CREATE POLICY "Workspace members can view connections"
ON whatsapp_connections FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- BÔNUS: Garantir que assignments também sejam visíveis
DROP POLICY IF EXISTS "Workspace members can view assignments" ON seller_whatsapp_assignments;

CREATE POLICY "Workspace members can view assignments"
ON seller_whatsapp_assignments FOR SELECT
USING (
  whatsapp_connection_id IN (
    SELECT id 
    FROM whatsapp_connections 
    WHERE workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  )
);
