import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://aktwyjsfvydxaaipedyb.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdHd5anNmdnlkeGFhaXBlZHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ0MTAxOCwiZXhwIjoyMDgyMDE3MDE4fQ.pXrVqUOgEUvDPhSb8_e1iQlVzUXgZEUxZr6rJr9akCM";

async function run() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: p } = await supabase
    .from("profiles")
    .select("id, user_id, current_workspace_id");
  console.log("Profiles:", p);

  const { data: w } = await supabase
    .from("workspaces")
    .select("id, name, owner_id");
  console.log("Workspaces:", w);

  const { data: m } = await supabase
    .from("workspace_members")
    .select("workspace_id, user_id");
  console.log("Members:", m);

  const { data: c } = await supabase
    .from("whatsapp_connections")
    .select("id, workspace_id, name");
  console.log("Connections:", c);
}

run();
