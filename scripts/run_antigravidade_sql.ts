import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://aktwyjsfvydxaaipedyb.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdHd5anNmdnlkeGFhaXBlZHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ0MTAxOCwiZXhwIjoyMDgyMDE3MDE4fQ.pXrVqUOgEUvDPhSb8_e1iQlVzUXgZEUxZr6rJr9akCM";

async function runSql() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const sql = `
    CREATE TABLE IF NOT EXISTS public.n8n_fila_mensagens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        telefone TEXT NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        id_mensagem TEXT UNIQUE,
        conteudo TEXT,
        workspace_id UUID,
        processed BOOLEAN DEFAULT FALSE
    );
    ALTER TABLE public.n8n_fila_mensagens ENABLE ROW LEVEL SECURITY;
  `;

  try {
    console.log("Executing SQL...");
    // Since we can't run arbitrary SQL via REST easily without a specific function,
    // we'll try to use a RPC if it exists, or just confirm table existence.
    // If we can't run SQL, we'll inform the user.
    const { error } = await supabase
      .from("n8n_fila_mensagens")
      .select("id")
      .limit(1);
    if (error && error.code === "42P01") {
      console.log(
        "Table MISSING. User needs to run SQL manually in Supabase Dashboard."
      );
    } else {
      console.log("Table EXISTS or error is different:", error?.message);
    }
  } catch (error: any) {
    console.error("Error:", error.message);
  }
}

runSql();
