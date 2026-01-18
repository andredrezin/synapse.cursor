import fetch from "node-fetch";

const url =
  "https://aktwyjsfvydxaaipedyb.supabase.co/functions/v1/sync-whatsapp-webhooks";
const key =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdHd5anNmdnlkeGFhaXBlZHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ0MTAxOCwiZXhwIjoyMDgyMDE3MDE4fQ.pXrVqUOgEUvDPhSb8_e1iQlVzUXgZEUxZr6rJr9akCM";

async function run() {
  console.log("Invoking sync function...");
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 1 minute timeout

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text);
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

run();
