import { createClient } from "@supabase/supabase-js";

const url = "https://aktwyjsfvydxaaipedyb.supabase.co";
const key =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdHd5anNmdnlkeGFhaXBlZHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ0MTAxOCwiZXhwIjoyMDgyMDE3MDE4fQ.pXrVqUOgEUvDPhSb8_e1iQlVzUXgZEUxZr6rJr9akCM";
const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase
    .from("n8n_fila_mensagens")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(5);

  if (error) {
    console.error(error);
  } else {
    console.log("Queue Activity:");
    console.log(JSON.stringify(data, null, 2));
  }
}

check();
