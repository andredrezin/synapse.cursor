-- FIX: Permitir excluir conexões do próprio workspace
-- O problema anterior era que a regra de "Delete" estava muito restrita (só admin) ou falhando.
-- Vamos liberar para que qualquer membro do workspace possa excluir as conexões do workspace.

DROP POLICY IF EXISTS "Admins can delete connections" ON whatsapp_connections;
DROP POLICY IF EXISTS "Workspace members can delete connections" ON whatsapp_connections;

CREATE POLICY "Workspace members can delete connections"
ON whatsapp_connections FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);
