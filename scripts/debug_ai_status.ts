import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log(`Checking project: ${supabaseUrl}`);

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_KEY in .env");
  console.log("Found URL:", supabaseUrl);
  console.log("Found Key:", supabaseKey ? "Yes (Hidden)" : "No");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("🔍 Checking WhatsApp Connections and AI Status...");

  // 1. Get all connections
  const { data: connections, error: connError } = await supabase
    .from("whatsapp_connections")
    .select("*");

  if (connError) {
    console.error("Error fetching connections:", connError);
    return;
  }

  console.log(`Found ${connections.length} connections.`);

  for (const conn of connections) {
    console.log(`\n------------------------------------------------`);
    console.log(
      `📱 Connection: ${conn.instance_name} (${
        conn.phone_number || "No number"
      })`
    );
    console.log(`   ID: ${conn.id}`);
    console.log(`   Workspace: ${conn.workspace_id}`);
    console.log(`   Status: ${conn.status}`);
    console.log(`   Provider: ${conn.provider}`);

    // 2. Check AI Settings
    const { data: settings, error: settingsError } = await supabase
      .from("ai_settings")
      .select("*")
      .eq("workspace_id", conn.workspace_id)
      .single();

    if (settingsError) {
      console.log(`   ❌ AI Settings: Error (${settingsError.message})`);
    } else {
      console.log(`   ✅ AI Settings Found:`);
      console.log(`      Enabled: ${settings.is_enabled}`);
      console.log(`      Name: ${settings.ai_name}`);
    }

    // 3. Check AI Training Status
    const { data: training, error: trainingError } = await supabase
      .from("ai_training_status")
      .select("*")
      .eq("workspace_id", conn.workspace_id)
      .single();

    if (trainingError) {
      console.log(`   ❌ AI Training Status: Error (${trainingError.message})`);
    } else {
      console.log(`   ✅ AI Training Found:`);
      console.log(`      Status: ${training.status}`);
      console.log(`      Linked WhatsApp ID: ${training.linked_whatsapp_id}`);

      if (training.linked_whatsapp_id !== conn.id) {
        console.log(
          `      ⚠️ WARNING: AI is linked to: ${training.linked_whatsapp_id} (Expected: ${conn.id})`
        );
      }
    }
  }
}

main();
