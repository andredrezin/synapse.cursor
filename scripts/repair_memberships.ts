import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://aktwyjsfvydxaaipedyb.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdHd5anNmdnlkeGFhaXBlZHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ0MTAxOCwiZXhwIjoyMDgyMDE3MDE4fQ.pXrVqUOgEUvDPhSb8_e1iQlVzUXgZEUxZr6rJr9akCM";

async function repair() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("--- REPAIRING MEMBERSHIPS ---");

    // 1. Get all profiles with workspaces
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("id, email, current_workspace_id")
      .not("current_workspace_id", "is", null);

    if (pErr) {
      console.error("Error fetching profiles:", pErr);
      return;
    }

    console.log(`Found ${profiles.length} profiles with workspaces.`);

    for (const profile of profiles) {
      console.log(
        `Checking membership for ${profile.email} (${profile.id}) in workspace ${profile.current_workspace_id}...`
      );

      const { data: member, error: mErr } = await supabase
        .from("workspace_members")
        .select("*")
        .eq("workspace_id", profile.current_workspace_id)
        .eq("user_id", profile.id)
        .maybeSingle();

      if (mErr) {
        console.error(`Error checking membership for ${profile.email}:`, mErr);
        continue;
      }

      if (!member) {
        console.log(
          `Adding ${profile.email} to workspace ${profile.current_workspace_id}`
        );
        const { error: insErr } = await supabase
          .from("workspace_members")
          .insert({
            workspace_id: profile.current_workspace_id,
            user_id: profile.id,
            role: "owner",
          });
        if (insErr) {
          console.error(`Insert error for ${profile.email}:`, insErr);
        } else {
          console.log(`Successfully added ${profile.email}`);
        }
      } else {
        console.log(`${profile.email} is already a member.`);
      }
    }
  } catch (err) {
    console.error("Global repair error:", err);
  }

  console.log("--- REPAIR COMPLETE ---");
}

repair();
