import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://aktwyjsfvydxaaipedyb.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdHd5anNmdnlkeGFhaXBlZHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ0MTAxOCwiZXhwIjoyMDgyMDE3MDE4fQ.pXrVqUOgEUvDPhSb8_e1iQlVzUXgZEUxZr6rJr9akCM";

async function run() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const andreUid = "9d09ecf0-274a-406d-af63-a0a8e443bcc3";
  const synapseWsId = "4f2e7764-d713-4a19-a7ef-b6bda4f960dd";

  // We can't use auth.uid() directly in RPC from service role easily IF the function uses auth.uid() internaly
  // BUT the function IS security definer and uses auth.uid().
  // Let's see what happens if we query the workspace_members table directly first to be sure

  const { data: member } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", synapseWsId)
    .eq("user_id", andreUid)
    .maybeSingle();

  console.log("Direct Membership check (DB):", member ? "EXISTS" : "NOT FOUND");

  // Check if we can select using a simulated role? No, let's just check the user's role
  console.log("Member details:", member);

  // One more thing: Check if the user Andre Pereira (9d09ecf0) has any other profile
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", andreUid);
  console.log("Profiles for Andre:", profiles);

  // Check if the current_workspace_id matches
  if (profiles && profiles[0]) {
    console.log(
      "Andre current_workspace_id:",
      profiles[0].current_workspace_id
    );
    console.log("Synapse Workspace ID:", synapseWsId);
    console.log("MATCH:", profiles[0].current_workspace_id === synapseWsId);
  }
}

run();
