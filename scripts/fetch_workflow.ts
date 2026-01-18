import fetch from "node-fetch";
import fs from "fs";

const n8nUrl = "https://n8n.synapseautomacao.com.br/api/v1/workflows";
const apiKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZTMyMTFlZC03Nzk5LTRjZjAtOTMyZi1kOTE4MzYwODNhNjIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY2ODU2ODA0fQ.5NljGMPyFWUQJk0bw6Wx1r7ClRXZ-7s9IFYM9rOwq8M";
const workflowId = process.argv[2] || "mKG32LwrBfzABgcO";
const outputArg = process.argv[3] || "n8n_latest_fetched.json";
const outputFile = `c:\\Users\\User\\.gemini\\antigravity\\brain\\ed1f0a02-19f9-419d-9e4e-fc1db44b0cc1\\${outputArg}`;

async function run() {
  try {
    const response = await fetch(`${n8nUrl}/${workflowId}`, {
      method: "GET",
      headers: { "X-N8N-API-KEY": apiKey },
    });

    if (response.ok) {
      const data = await response.json();
      const jsonContent = JSON.stringify(data, null, 2);
      fs.writeFileSync(outputFile, jsonContent);
      console.log(`Workflow saved to ${outputFile}`);
    } else {
      console.error("Error: " + response.status);
    }
  } catch (error: any) {
    console.error("Network Error:", error.message);
  }
}

run();
