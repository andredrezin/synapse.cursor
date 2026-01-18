import fetch from "node-fetch";

const n8nUrl = "https://n8n.synapseautomacao.com.br/api/v1/workflows";
const apiKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZTMyMTFlZC03Nzk5LTRjZjAtOTMyZi1kOTE4MzYwODNhNjIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY2ODU2ODA0fQ.5NljGMPyFWUQJk0bw6Wx1r7ClRXZ-7s9IFYM9rOwq8M";

async function run() {
  try {
    const response = await fetch(n8nUrl, {
      method: "GET",
      headers: { "X-N8N-API-KEY": apiKey },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("Workflows found: " + data.data.length);
      data.data.forEach((w: any) => {
        console.log(`- [${w.id}] ${w.name} (Active: ${w.active})`);
      });
    } else {
      console.error("Error: " + response.status);
    }
  } catch (error: any) {
    console.error("Network Error:", error.message);
  }
}

run();
