import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://aktwyjsfvydxaaipedyb.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdHd5anNmdnlkeGFhaXBlZHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ0MTAxOCwiZXhwIjoyMDgyMDE3MDE4fQ.pXrVqUOgEUvDPhSb8_e1iQlVzUXgZEUxZr6rJr9akCM";

async function audit() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log("--- WORKSPACES ---");
  const { data: workspaces } = await supabase.from("workspaces").select("*");
  console.log(workspaces);

  console.log("--- PROFILES ---");
  const { data: profiles } = await supabase.from("profiles").select("*");
  console.log(profiles);

  console.log("--- MEMBERSHIPS ---");
  const { data: members } = await supabase
    .from("workspace_members")
    .select("*");
  console.log(members);

  console.log("--- WHATSAPP CONNECTIONS ---");
  const { data: connections } = await supabase
    .from("whatsapp_connections")
    .select("*");
  console.log(
    connections?.map((c) => ({
      id: c.id,
      ws: c.workspace_id,
      name: c.name,
      status: c.status,
    }))
  );
}

audit();
