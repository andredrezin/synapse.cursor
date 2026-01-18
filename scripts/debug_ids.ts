import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://aktwyjsfvydxaaipedyb.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdHd5anNmdnlkeGFhaXBlZHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ0MTAxOCwiZXhwIjoyMDgyMDE3MDE4fQ.pXrVqUOgEUvDPhSb8_e1iQlVzUXgZEUxZr6rJr9akCM";

async function checkIds() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log("--- PROFILES ID AUDIT ---");
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, user_id, full_name, current_workspace_id");
  console.log(profiles);

  console.log("--- WORKSPACE MEMBERS ---");
  const { data: members } = await supabase
    .from("workspace_members")
    .select("*");
  console.log(members);

  console.log("--- END ---");
}

checkIds();
