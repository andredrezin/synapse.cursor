-- Create table for n8n message queueing (Antigravidade logic)
CREATE TABLE IF NOT EXISTS n8n_fila_mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telefone TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    id_mensagem TEXT UNIQUE,
    conteudo TEXT,
    workspace_id UUID REFERENCES workspaces(id),
    processed BOOLEAN DEFAULT FALSE
);

-- Index for performance when cleaning/checking queue
CREATE INDEX IF NOT EXISTS idx_n8n_fila_telefone ON n8n_fila_mensagens(telefone);
CREATE INDEX IF NOT EXISTS idx_n8n_fila_timestamp ON n8n_fila_mensagens(timestamp);

-- Enable RLS (though n8n uses service role usually)
ALTER TABLE n8n_fila_mensagens ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access on n8n_fila_mensagens" 
ON n8n_fila_mensagens 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);
