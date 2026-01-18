import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const TARGET_EMAIL = "dpereiraandre89@gmail.com";

async function main() {
  console.log(`Searching for user: ${TARGET_EMAIL}...`);

  // List users (defaults to page 1, 50 users)
  const {
    data: { users },
    error,
  } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error("Error listing users:", error);
    return;
  }

  const user = users.find((u) => u.email === TARGET_EMAIL);

  if (!user) {
    console.log(
      "User not found via listUsers. Trying getUserIdByEmail is not standard in admin api... checking manually."
    );
    console.log(
      "Found users:",
      users.map((u) => u.email)
    );
    console.log("❌ User not found in the first 50 users.");
    return;
  }

  console.log(`Found user: ${user.id} (${user.email})`);
  console.log("Deleting...");

  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error("Error deleting user:", deleteError);
  } else {
    console.log("✅ User deleted successfully!");
  }
}

main();
