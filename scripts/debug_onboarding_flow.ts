import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

// Load env vars
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in process.env"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  const timestamp = Date.now();
  const email = `synapse.test.auto.${timestamp}@gmail.com`;
  const password = "Password123!";
  const name = "Test Company " + timestamp;

  console.log(`\n\n--- STARTING AUTOMATED ONBOARDING TEST ---`);
  console.log(`Target: ${supabaseUrl}`);
  console.log(`1. Creating Test User: ${email}`);

  // 1. Sign Up
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: "Test User Autom",
      },
    },
  });

  if (authError) {
    console.error("❌ Sign Up Failed:", authError.message);
    return;
  }

  const user = authData.user;
  if (!user) {
    console.error("❌ No user returned (Email confirmation might be required)");
    if (serviceRoleKey) {
      console.log(
        "   (Attempting to auto-confirm if user ID exists but unconfirmed...)"
      );
      // We'd need the ID, but authData.user might be null if strictly requires confirm.
      // Usually SignUp returns user object with "identities" even if unconfirmed.
    }
    return;
  }

  console.log(`✅ User created. ID: ${user.id}`);

  // 1.5 Auto-confirm (Critical for non-interactive test)
  if (serviceRoleKey) {
    console.log("   (Auto-confirming email with Service Role...)");
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    const { error: confirmError } = await adminClient.auth.admin.updateUserById(
      user.id,
      {
        email_confirm: true,
      }
    );
    if (confirmError) {
      console.error("❌ Failed to auto-confirm:", confirmError.message);
    } else {
      console.log("   (Email confirmed!)");
    }
  }

  // 2. Login (to get fresh session)
  const { data: loginData, error: loginError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (loginError) {
    console.error("❌ Login Failed:", loginError.message);
    return;
  }

  const token = loginData.session?.access_token;
  console.log("✅ Logged in. Access Token acquired.");

  // 3. Call Create Workspace Function
  console.log(`3. Invoking 'create-workspace' for: "${name}"...`);

  // Method 1: direct fetch to see RAW response
  const functionUrl = `${supabaseUrl}/functions/v1/create-workspace`;
  console.log(`   Target URL: ${functionUrl}`);

  try {
    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });

    console.log(
      `   Response Status: ${response.status} ${response.statusText}`
    );

    const text = await response.text();
    console.log(`   Response Body: ${text}`);

    if (!response.ok) {
      console.error("❌ FUNCTION FAILED.");
    } else {
      console.log("✅ FUNCTION SUCCESS!");
    }
  } catch (err) {
    console.error("❌ Network/Fetch Error:", err);
  }
}

runTest();
