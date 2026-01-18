import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://aktwyjsfvydxaaipedyb.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdHd5anNmdnlkeGFhaXBlZHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ0MTAxOCwiZXhwIjoyMDgyMDE3MDE4fQ.pXrVqUOgEUvDPhSb8_e1iQlVzUXgZEUxZr6rJr9akCM";

async function checkSchema() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log("Checking 'messages' schema...");
  const { data: messages, error: mError } = await supabase
    .from("messages")
    .select("*")
    .limit(1);
  if (mError) {
    console.error("Messages Error:", mError.message);
  } else {
    console.log("Messages Sample Item:", messages[0] || "Empty table");
  }

  console.log("\nChecking 'whatsapp_messages' schema...");
  const { data: wMessages, error: wError } = await supabase
    .from("whatsapp_messages")
    .select("*")
    .limit(1);
  if (wError) {
    console.error("Whatsapp Messages Error:", wError.message);
  } else {
    console.log(
      "Whatsapp Messages Sample Item:",
      wMessages[0] || "Empty table"
    );
  }
}

checkSchema();
