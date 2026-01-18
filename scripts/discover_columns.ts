import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://aktwyjsfvydxaaipedyb.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdHd5anNmdnlkeGFhaXBlZHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ0MTAxOCwiZXhwIjoyMDgyMDE3MDE4fQ.pXrVqUOgEUvDPhSb8_e1iQlVzUXgZEUxZr6rJr9akCM";

async function discoverColumns(tableName) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Columns to test
  const testColumns = [
    "id",
    "created_at",
    "updated_at",
    "content",
    "payload",
    "status",
    "direction",
    "lead_id",
    "workspace_id",
    "phone",
    "message_id",
    "external_id",
  ];

  console.log(`Discovering columns for '${tableName}'...`);
  const existingColumns = [];
  for (const col of testColumns) {
    const { error } = await supabase.from(tableName).select(col).limit(1);
    if (!error) {
      existingColumns.push(col);
    }
  }
  console.log(`Table '${tableName}' has columns:`, existingColumns);
}

async function main() {
  await discoverColumns("whatsapp_messages");
}

main();
