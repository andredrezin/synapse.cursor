import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";

// Load env vars from .env file if it exists, or look for them in process.env
// Since we are in a script, we might need to load manually or assume they are set.
// For now, I'll try to read from .env or hardcode the URL known from previous steps (if reliable).
// Better: Parse .env file content.

const envFile = fs.readFileSync(".env", "utf8");
const envVars = envFile.split("\n").reduce((acc, line) => {
  const [key, value] = line.split("=");
  if (key && value) acc[key.trim()] = value.trim();
  return acc;
}, {} as any);

const supabaseUrl =
  envVars.VITE_SUPABASE_URL || "https://aktwyjsfvydxaaipedyb.supabase.co";
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY not found in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log("Checking whatsapp_connections as ADMIN...");

  const { data, error } = await supabase
    .from("whatsapp_connections")
    .select("id, name, status, workspace_id, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error:", error);
  } else {
    console.log(`Found ${data.length} connections.`);
    console.table(data);
  }
}

run();
