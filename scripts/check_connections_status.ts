import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkState() {
  const email = "synapse.test.auto.1766803777496@gmail.com";

  // 1. Get user profile
  const { data: profile, error: pError } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .single();

  if (pError) {
    console.error("Profile error:", pError);
    return;
  }
  console.log("Profile Found:", {
    id: profile.id,
    current_workspace_id: profile.current_workspace_id,
  });

  // 2. Get workspace members for this user
  const { data: memberships, error: mError } = await supabase
    .from("workspace_members")
    .select("*, workspaces(name)")
    .eq("user_id", profile.id);

  if (mError) console.error("Membership error:", mError);
  console.log(
    "User Memberships:",
    memberships?.map((m) => ({
      workspace_id: m.workspace_id,
      role: m.role,
      name: m.workspaces?.name,
    }))
  );

  // 3. Get all whatsapp connections
  const { data: connections, error: cError } = await supabase
    .from("whatsapp_connections")
    .select("*");

  if (cError) console.error("Connections error:", cError);
  console.log(
    "All WhatsApp Connections:",
    connections?.map((c) => ({
      id: c.id,
      workspace_id: c.workspace_id,
      name: c.name,
      status: c.status,
      has_qr: !!c.qr_code,
      created_at: c.created_at,
    }))
  );

  // 4. Test RLS function manually
  try {
    const { data: rlsTest, error: rlsError } = await supabase.rpc(
      "is_workspace_member",
      { _workspace_id: profile.current_workspace_id }
    );
    console.log(
      "RLS Function 'is_workspace_member' check for current workspace:",
      { result: rlsTest, error: rlsError }
    );
  } catch (e) {
    console.log("RLS RPC failed (likely not accessible or signature mismatch)");
  }
}

checkState();
