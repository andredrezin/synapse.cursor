import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://aktwyjsfvydxaaipedyb.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdHd5anNmdnlkeGFhaXBlZHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ0MTAxOCwiZXhwIjoyMDgyMDE3MDE4fQ.pXrVqUOgEUvDPhSb8_e1iQlVzUXgZEUxZr6rJr9akCM";

async function checkState() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log("--- WORKSPACE MEMBERS ---");

  const { data: members, error } = await supabase
    .from("workspace_members")
    .select("*");

  if (error) {
    console.error("Error fetching members:", error);
  } else {
    console.log("All members:", members);
  }

  console.log("--- END ---");
}

checkState();
