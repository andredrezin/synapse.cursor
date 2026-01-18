import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

// Load env vars
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log(`\n\n--- STARTING WHATSAPP CONNECT DEBUG (REUSE USER) ---`);

  // Reuse the user we know exists
  const email = "synapse.test.auto.1766803777496@gmail.com";
  const password = "Password123!";

  console.log(`1. Logging in: ${email}`);
  const { data: session, error: loginError } =
    await supabase.auth.signInWithPassword({ email, password });

  if (loginError) {
    console.error("❌ Login Failed:", loginError.message);
    return;
  }
  const token = session.session?.access_token;
  const user = session.user;
  if (!token || !user) {
    console.error("No token/user");
    return;
  }
  console.log("✅ Logged in.");

  // 2. Get Existing Workspace
  console.log("2. Fetching Workspace...");
  const { data: workspaces, error: wsError } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1);

  if (wsError || !workspaces || workspaces.length === 0) {
    console.error("❌ No workspace found for user:", wsError?.message);
    return;
  }

  const workspaceId = workspaces[0].id;
  console.log(`✅ Found Workspace: ${workspaceId}`);

  // 3. Call WhatsApp Connect
  console.log("3. Invoking 'whatsapp-connect' (Evolution)...");

  const payload = {
    workspace_id: workspaceId,
    name: "Debug Connection Retry",
    provider: "evolution",
  };

  const response = await fetch(`${supabaseUrl}/functions/v1/whatsapp-connect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  console.log(`   Response Status: ${response.status} ${response.statusText}`);
  const text = await response.text();
  console.log(`   Response Body: ${text}`);

  if (response.ok) {
    console.log("✅ SUCCESS: WhatsApp Connect initiated.");
  } else {
    console.log("❌ FAILED: Error captured.");
  }
}

runTest();
