import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://aktwyjsfvydxaaipedyb.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdHd5anNmdnlkeGFhaXBlZHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ0MTAxOCwiZXhwIjoyMDgyMDE3MDE4fQ.pXrVqUOgEUvDPhSb8_e1iQlVzUXgZEUxZr6rJr9akCM";

async function run() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase.rpc("query_policies", {
    table_name: "whatsapp_connections",
  });

  if (error) {
    // If RPC doesn't exist, try direct query via postgres function if possible or just use a helper
    console.log("RPC query_policies failed, trying manual check...");

    // We can't query pg_policies directly via Supabase client easily because it's in pg_catalog
    // But we can check if we can select from the table.

    const { data: test, error: testErr } = await supabase
      .from("whatsapp_connections")
      .select("*")
      .limit(1);
    console.log("Direct Select (Service Key):", {
      count: test?.length,
      error: testErr,
    });
  } else {
    console.log("Policies:", data);
  }
}

run();
