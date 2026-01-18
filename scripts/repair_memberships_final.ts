import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://aktwyjsfvydxaaipedyb.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdHd5anNmdnlkeGFhaXBlZHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ0MTAxOCwiZXhwIjoyMDgyMDE3MDE4fQ.pXrVqUOgEUvDPhSb8_e1iQlVzUXgZEUxZr6rJr9akCM";

async function repair() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("--- FINAL REPAIRING MEMBERSHIPS ---");

    // 1. Get all profiles with workspaces
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("id, user_id, current_workspace_id")
      .not("current_workspace_id", "is", null);

    if (pErr) throw pErr;

    console.log(`Found ${profiles.length} profiles with workspaces.`);

    for (const profile of profiles) {
      // Use profile.id if user_id is null, otherwise use user_id
      const actualUserId = profile.user_id || profile.id;
      const workspaceId = profile.current_workspace_id;

      console.log(
        `Checking membership for User ${actualUserId} in Workspace ${workspaceId}...`
      );

      const { data: member, error: mErr } = await supabase
        .from("workspace_members")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("user_id", actualUserId)
        .maybeSingle();

      if (mErr) {
        console.error(
          `Error checking membership for user ${actualUserId}:`,
          mErr
        );
        continue;
      }

      if (!member) {
        console.log(`Adding User ${actualUserId} to Workspace ${workspaceId}`);
        const { error: insErr } = await supabase
          .from("workspace_members")
          .insert({
            workspace_id: workspaceId,
            user_id: actualUserId,
            role: "owner",
          });
        if (insErr) {
          console.error(`Insert error for user ${actualUserId}:`, insErr);
        } else {
          console.log(`Successfully added User ${actualUserId}`);
        }
      } else {
        console.log(`User ${actualUserId} is already a member.`);
      }
    }
  } catch (err) {
    console.error("Global repair error:", err);
  }

  console.log("--- REPAIR COMPLETE ---");
}

repair();
