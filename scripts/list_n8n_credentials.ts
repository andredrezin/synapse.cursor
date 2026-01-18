import fetch from "node-fetch";

const n8nUrl = "https://n8n.synapseautomacao.com.br/api/v1/credentials";
const apiKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZTMyMTFlZC03Nzk5LTRjZjAtOTMyZi1kOTE4MzYwODNhNjIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY2ODU2ODA0fQ.5NljGMPyFWUQJk0bw6Wx1r7ClRXZ-7s9IFYM9rOwq8M";

async function run() {
  try {
    const response = await fetch(n8nUrl, {
      headers: { "X-N8N-API-KEY": apiKey },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to list credentials: ${
          response.status
        } ${await response.text()}`
      );
    }

    const data = await response.json();
    // Filter for sensitive logging? No, just list names and IDs.
    // Be careful not to log actual values if the API returns them (usually it doesn't).
    const credentials = data.data.map((c: any) => ({
      id: c.id,
      name: c.name,
      type: c.type,
    }));

    console.table(credentials);
  } catch (error: any) {
    console.error("Error:", error.message);
  }
}

run();
