import { createClient } from "@supabase/supabase-js";

const url = "https://aktwyjsfvydxaaipedyb.supabase.co";
const key =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdHd5anNmdnlkeGFhaXBlZHliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NDEwMTgsImV4cCI6MjA4MjAxNzAxOH0.GAIOBYd0BIWmLfXNovu2nVx3oGD4tR6_M911iPijZAQ";
const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

check();
