-- OPÇÃO 1: LIMPEZA TOTAL (RESET)
-- Isso vai apagar TODAS as conexões deste workspace para começar do zero.

DELETE FROM whatsapp_connections 
WHERE workspace_id IN (
  SELECT workspace_id 
  FROM workspace_members 
  WHERE user_id = auth.uid()
);

-- Se você for admin e quiser limpar TUDO MESMO (bruto), use:
-- DELETE FROM whatsapp_connections;
