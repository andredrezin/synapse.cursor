import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://aktwyjsfvydxaaipedyb.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdHd5anNmdnlkeGFhaXBlZHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ0MTAxOCwiZXhwIjoyMDgyMDE3MDE4fQ.pXrVqUOgEUvDPhSb8_e1iQlVzUXgZEUxZr6rJr9akCM";

async function checkState() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const synapseWsId = "4f2e7764-d713-4a19-a7ef-b6bda4f960dd";

  console.log(`--- MEMBERS OF WORKSPACE ${synapseWsId} ---`);

  const { data: members } = await supabase
    .from("workspace_members")
    .select("*, profiles(email)")
    .eq("workspace_id", synapseWsId);

  console.log(
    "Members:",
    members?.map((m) => ({
      user_id: m.user_id,
      email: m.profiles?.email,
      role: m.role,
    }))
  );

  // Check if connections actually exist for this WS again just to be 100% sure
  const { data: conns } = await supabase
    .from("whatsapp_connections")
    .select("id, name, status")
    .eq("workspace_id", synapseWsId);
  console.log("Connections for this WS:", conns);

  console.log("--- END ---");
}

checkState();
