import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://aktwyjsfvydxaaipedyb.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdHd5anNmdnlkeGFhaXBlZHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ0MTAxOCwiZXhwIjoyMDgyMDE3MDE4fQ.pXrVqUOgEUvDPhSb8_e1iQlVzUXgZEUxZr6rJr9akCM";

async function checkState() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const email = "synapse.test.auto.1766803777496@gmail.com";

  console.log("--- DIAGNOSTIC START ---");

  // 1. Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .single();
  console.log(
    "User Profile:",
    profile ? { id: profile.id, ws: profile.current_workspace_id } : "Not found"
  );

  if (profile) {
    // 2. Member of?
    const { data: members } = await supabase
      .from("workspace_members")
      .select("*")
      .eq("user_id", profile.id);
    console.log("Memberships:", members);

    // 3. Connections in current workspace
    const { data: connCurrent } = await supabase
      .from("whatsapp_connections")
      .select("*")
      .eq("workspace_id", profile.current_workspace_id);
    console.log("Connections in Current WS:", connCurrent);

    // 4. All connections
    const { data: connAll } = await supabase
      .from("whatsapp_connections")
      .select("*");
    console.log(
      "All Connections in Table:",
      connAll?.map((c) => ({
        id: c.id,
        ws: c.workspace_id,
        status: c.status,
        name: c.name,
        created_at: c.created_at,
      }))
    );

    // 5. Check if is_workspace_member works (using RPC)
    const { data: rlsCheck, error: rlsErr } = await supabase.rpc(
      "is_workspace_member",
      { _workspace_id: profile.current_workspace_id }
    );
    console.log("RPC is_workspace_member check:", {
      result: rlsCheck,
      error: rlsErr,
    });
  }

  console.log("--- DIAGNOSTIC END ---");
}

checkState();
