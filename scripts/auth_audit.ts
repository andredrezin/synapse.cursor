import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://aktwyjsfvydxaaipedyb.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdHd5anNmdnlkeGFhaXBlZHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ0MTAxOCwiZXhwIjoyMDgyMDE3MDE4fQ.pXrVqUOgEUvDPhSb8_e1iQlVzUXgZEUxZr6rJr9akCM";

async function run() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log("--- AUTH USERS AUDIT ---");
  const {
    data: { users },
    error,
  } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error("Error listing users:", error);
    return;
  }

  console.log(
    "Auth Users:",
    users.map((u) => ({ id: u.id, email: u.email }))
  );

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, user_id, full_name");
  console.log("Profiles:", profiles);

  const { data: members } = await supabase
    .from("workspace_members")
    .select("workspace_id, user_id");
  console.log("Memberships:", members);
}

run();
