import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://aktwyjsfvydxaaipedyb.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdHd5anNmdnlkeGFhaXBlZHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ0MTAxOCwiZXhwIjoyMDgyMDE3MDE4fQ.pXrVqUOgEUvDPhSb8_e1iQlVzUXgZEUxZr6rJr9akCM";

async function run() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // We can't query information_schema directly via JS client usually,
  // but we can check the table structure utilizing an empty select or just RPC if available.
  // Actually, let's just inspect one row from each to inference structure if information_schema is locked.
  // OR we can try to use the rpc 'query_policies' I used before but for columns?
  // Let's try to just select * limit 0 which usually returns headers? No JS client doesn't return headers easily.

  // Best bet: Check what we know from previous view_file of migrations.
  // But to be sure, I will dump one row of each.

  const tables = ["workspaces", "whatsapp_connections", "leads", "messages"];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select("*").limit(1);
    if (data && data.length > 0) {
      console.log(`Table ${t} keys:`, Object.keys(data[0]));
    } else {
      console.log(`Table ${t} seems empty or error:`, error);
    }
  }
}

run();
