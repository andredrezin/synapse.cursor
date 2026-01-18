-- Vincular instância de teste ao primeiro workspace encontrado
UPDATE workspaces
SET instance_name = 'atendimento-Marcela'
WHERE id = (SELECT id FROM workspaces LIMIT 1);
