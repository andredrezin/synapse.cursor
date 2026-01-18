import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://aktwyjsfvydxaaipedyb.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdHd5anNmdnlkeGFhaXBlZHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ0MTAxOCwiZXhwIjoyMDgyMDE3MDE4fQ.pXrVqUOgEUvDPhSb8_e1iQlVzUXgZEUxZr6rJr9akCM";

async function listTables() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Try to use a common view if available, otherwise just try to select from likely tables
  // Since we can't query information_schema via REST easily, we'll try to select from known tables
  const tables = [
    "profiles",
    "workspaces",
    "workspace_members",
    "whatsapp_connections",
    "leads",
    "messages",
    "n8n_fila_mensagens",
    "whatsapp_messages", // suggested by the error hint in screenshot
    "contacts",
  ];

  console.log("Checking tables existence...");
  for (const table of tables) {
    const { error } = await supabase.from(table).select("id").limit(1);
    if (error) {
      console.log(`[ABSENT] ${table}: ${error.message}`);
    } else {
      console.log(`[EXIST ] ${table}`);
    }
  }
}

listTables();
