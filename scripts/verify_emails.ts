import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://aktwyjsfvydxaaipedyb.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdHd5anNmdnlkeGFhaXBlZHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ0MTAxOCwiZXhwIjoyMDgyMDE3MDE4fQ.pXrVqUOgEUvDPhSb8_e1iQlVzUXgZEUxZr6rJr9akCM";

async function run() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const emails = ["andredrezin@gmail.com", "contato@synapseautomacao.com.br"];

  for (const email of emails) {
    console.log(`--- Checking ${email} ---`);
    const {
      data: { users },
    } = await supabase.auth.admin.listUsers();
    const user = users.find((u) => u.email === email);

    if (user) {
      console.log(`Auth ID: ${user.id}`);
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      console.log(`Profile WS ID: ${profile?.current_workspace_id}`);

      const { data: m } = await supabase
        .from("workspace_members")
        .select("*")
        .eq("user_id", user.id);
      console.log(
        `Membership in WS:`,
        m?.map((i) => i.workspace_id)
      );
    } else {
      console.log("NOT FOUND in Auth");
    }
  }
}

run();
