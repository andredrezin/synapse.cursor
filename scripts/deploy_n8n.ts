import fetch from "node-fetch";
import fs from "fs";

const n8nUrl = "https://n8n.synapseautomacao.com.br/api/v1/workflows";
const apiKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZTMyMTFlZC03Nzk5LTRjZjAtOTMyZi1kOTE4MzYwODNhNjIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY2ODU2ODA0fQ.5NljGMPyFWUQJk0bw6Wx1r7ClRXZ-7s9IFYM9rOwq8M";
const WORKFLOW_FILES = [
  "C:/Users/User/.gemini/antigravity/brain/ed1f0a02-19f9-419d-9e4e-fc1db44b0cc1/n8n_marcela_v8_evolution_completo.json",
];

async function run() {
  for (const filePath of WORKFLOW_FILES) {
    console.log(`Reading workflow JSON from ${filePath}...`);
    try {
      const jsonContent = fs.readFileSync(filePath, "utf-8");
      const workflow = JSON.parse(jsonContent);

      // Remove specific ID to force creation or avoid conflict?
      // Ideally we want to UPDATE if exists. But import usually creates new.
      // Let's just POST.

      console.log(`Deploying workflow: ${workflow.name}...`);
      const response = await fetch(n8nUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-N8N-API-KEY": apiKey,
        },
        body: JSON.stringify({
          name: workflow.name,
          nodes: workflow.nodes,
          connections: workflow.connections,
          settings: workflow.settings,
        }),
      });

      if (response.ok) {
        const result: any = await response.json();
        console.log(
          `Workflow deployed successfully: ${result.id} (${result.name})`
        );
      } else {
        const text = await response.text();
        console.error(`Failed to deploy: ${response.status} - ${text}`);
      }
    } catch (e: any) {
      console.error(`Error deploying ${filePath}:`, e.message);
    }
  }
}

run();
