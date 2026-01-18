import fetch from "node-fetch";

const n8nUrl = "https://n8n.synapseautomacao.com.br/api/v1/workflows";
const apiKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZTMyMTFlZC03Nzk5LTRjZjAtOTMyZi1kOTE4MzYwODNhNjIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY2ODU2ODA0fQ.5NljGMPyFWUQJk0bw6Wx1r7ClRXZ-7s9IFYM9rOwq8M";

async function run() {
  console.log("Verifying N8N Workflows Status...");

  try {
    const response = await fetch(`${n8nUrl}`, {
      method: "GET",
      headers: {
        "X-N8N-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (response.ok) {
      const workflows = result.data;
      const ingestor = workflows.find((w: any) =>
        w.name.includes("Ingestão Master")
      );
      const responder = workflows.find((w: any) =>
        w.name.includes("Marcela AI")
      );

      console.log("\n--- STATUS REPORT ---");

      if (ingestor) {
        console.log(
          `[Ingestor] ✅ FOUND | ID: ${ingestor.id} | Active: ${ingestor.active}`
        );
      } else {
        console.log(`[Ingestor] ❌ NOT FOUND`);
      }

      if (responder) {
        console.log(
          `[Responder] ✅ FOUND | ID: ${responder.id} | Active: ${responder.active}`
        );
      } else {
        console.log(`[Responder] ❌ NOT FOUND`);
      }

      const profile = workflows.find((w: any) =>
        w.name.includes("Profile Manager")
      );

      if (profile) {
        console.log(
          `[ProfileMgr] ✅ FOUND | ID: ${profile.id} | Active: ${profile.active}`
        );
      } else {
        console.log(`[ProfileMgr] ❌ NOT FOUND`);
      }
      console.log("---------------------");
    } else {
      console.error("FAILED to list workflows.");
    }
  } catch (error: any) {
    console.error("Network Error:", error.message);
  }
}

run();
