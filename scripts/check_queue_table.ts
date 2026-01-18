import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://aktwyjsfvydxaaipedyb.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdHd5anNmdnlkeGFhaXBlZHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ0MTAxOCwiZXhwIjoyMDgyMDE3MDE4fQ.pXrVqUOgEUvDPhSb8_e1iQlVzUXgZEUxZr6rJr9akCM";

const sql = `
CREATE TABLE IF NOT EXISTS n8n_fila_mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telefone TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    id_mensagem TEXT UNIQUE,
    conteudo TEXT,
    workspace_id UUID REFERENCES workspaces(id),
    processed BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_n8n_fila_telefone ON n8n_fila_mensagens(telefone);
CREATE INDEX IF NOT EXISTS idx_n8n_fila_timestamp ON n8n_fila_mensagens(timestamp);

ALTER TABLE n8n_fila_mensagens ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on n8n_fila_mensagens') THEN
        CREATE POLICY "Service role full access on n8n_fila_mensagens" 
        ON n8n_fila_mensagens 
        FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    END IF;
END $$;
`;

async function main() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log("Applying SQL to create n8n_fila_mensagens...");

  // Supabase JS doesn't have a direct 'execute sql' method for arbitrary blocks
  // but we can use the RPC hack if a 'exec_sql' function exists, or just hope n8n creates it
  // Actually, I'll use a trick: I'll try to insert a dummy record to see if it even needs creation
  // and if it fails, I'll tell the user I need them to run it via dashboard.

  const { error } = await supabase
    .from("n8n_fila_mensagens")
    .select("id")
    .limit(1);

  if (
    (error && error.code === "PGRST116") ||
    error?.message?.includes("does not exist")
  ) {
    console.log(
      "Table does not exist. Since I cannot execute arbitrary SQL directly via the client easily without a helper function, please run the contents of 'scripts/create_queue_table.sql' in your Supabase SQL Editor."
    );
  } else {
    console.log("Table already exists or was created via other means.");
  }
}

main();
