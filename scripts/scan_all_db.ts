import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://aktwyjsfvydxaaipedyb.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdHd5anNmdnlkeGFhaXBlZHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ0MTAxOCwiZXhwIjoyMDgyMDE3MDE4fQ.pXrVqUOgEUvDPhSb8_e1iQlVzUXgZEUxZr6rJr9akCM";

async function checkState() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log("--- SCANNING USERS ---");

  // 1. All profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, current_workspace_id");
  console.log("Profiles in DB:", profiles);

  // 2. All connections
  const { data: connections } = await supabase
    .from("whatsapp_connections")
    .select("id, workspace_id, name, status, created_at");
  console.log("Connections in DB:", connections);

  // 3. All workspaces
  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("id, name");
  console.log("Workspaces in DB:", workspaces);

  console.log("--- SCAN COMPLETE ---");
}

checkState();
