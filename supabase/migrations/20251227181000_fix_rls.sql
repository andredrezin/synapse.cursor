-- Drop the existing function-based policy
DROP POLICY IF EXISTS "Workspace members can view connections" ON whatsapp_connections;

-- Recreate it using direct table check (more reliable for debugging)
CREATE POLICY "Workspace members can view connections"
ON whatsapp_connections FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = whatsapp_connections.workspace_id
    AND user_id = auth.uid()
  )
);
