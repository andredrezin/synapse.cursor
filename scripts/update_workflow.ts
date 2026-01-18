import fetch from "node-fetch";
import fs from "fs";

const n8nUrl = "https://n8n.synapseautomacao.com.br/api/v1/workflows";
const apiKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZTMyMTFlZC03Nzk5LTRjZjAtOTMyZi1kOTE4MzYwODNhNjIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY2ODU2ODA0fQ.5NljGMPyFWUQJk0bw6Wx1r7ClRXZ-7s9IFYM9rOwq8M";
const workflowPath =
  "C:/Users/User/.gemini/antigravity/brain/ed1f0a02-19f9-419d-9e4e-fc1db44b0cc1/n8n_ingestor_v2.json";
const workflowId = "6kA5983wUrLPZENf"; // ID do Ingestor Master Existente

async function run() {
  console.log("Reading workflow JSON...");
  const workflowJson = JSON.parse(fs.readFileSync(workflowPath, "utf8"));

  console.log(`Updating workflow: ${workflowJson.name} (${workflowId})`);

  try {
    const response = await fetch(`${n8nUrl}/${workflowId}`, {
      method: "PUT",
      headers: {
        "X-N8N-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: workflowJson.name,
        nodes: workflowJson.nodes,
        connections: workflowJson.connections,
        settings: {},
        // active: true, // Cannot set active on update? Let's try without.
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("SUCCESS! Workflow updated.");
      console.log("ID:", result.id);
      console.log("Active:", result.active);
    } else {
      console.error("FAILED to update workflow.");
      console.error("Status:", response.status);
      console.error("Error:", JSON.stringify(result, null, 2));
    }
  } catch (error: any) {
    console.error("Network Error:", error.message);
  }
}

run();
