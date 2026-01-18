-- Create the queue table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.n8n_fila_mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telefone TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    id_mensagem TEXT UNIQUE,
    conteudo TEXT,
    workspace_id UUID,
    processed BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE public.n8n_fila_mensagens ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'n8n_fila_mensagens' 
        AND policyname = 'Full access for service role'
    ) THEN
        CREATE POLICY "Full access for service role" ON public.n8n_fila_mensagens 
        FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;
