import fetch from "node-fetch";

const n8nUrl = "https://n8n.synapseautomacao.com.br/api/v1/workflows";
const apiKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZTMyMTFlZC03Nzk5LTRjZjAtOTMyZi1kOTE4MzYwODNhNjIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY2ODU2ODA0fQ.5NljGMPyFWUQJk0bw6Wx1r7ClRXZ-7s9IFYM9rOwq8M";

const TO_ACTIVATE = [
  {
    id: "AHtJ80TqRIFvcli8",
    name: "SynapsePixel - Marcela V8 Evolution (Completo)",
    active: true,
  },
];

// Note: V6 will be activated after deployment returns its ID.
// For now, I'll just deactivate everything else.
const TO_DEACTIVATE = [
  "N1byRCNkHp3WQxDs", // V7
  "Qnma9aiTWFkoJMmZ", // V6
  "SZXNkLE5CWQlxxDp", // V5
  "exQq154psu0wGpLY", // V4
  "4OqMMGLgItHW5MwX",
  "SPLCGV8KmpkREHOf",
  "mKG32LwrBfzABgcO",
  "98QrviKRskhnQeaf",
  "LbV9CrdR22ks2HQn",
  "HArqu3g92QfIiepj",
  "NrDzry9bBdgRrauZ",
  "iU8DMzBA1X78Q168",
  "Wpu3ZZO1uI1QlWxn",
  "UOg777xB90Z8BefD",
  "c0QgcHPw8Pz8zyc3",
  "VkYDmOUKfAQxTOIV",
  "6kA5983wUrLPZENf",
  "k9Sg4NHQx3xkFDMQ",
  "18CyT22k4MnIwq7P",
];

async function toggleWorkflow(id: string, active: boolean) {
  try {
    const response = await fetch(
      `${n8nUrl}/${id}/${active ? "activate" : "deactivate"}`,
      {
        method: "POST",
        headers: { "X-N8N-API-KEY": apiKey },
      }
    );

    if (response.ok) {
      console.log(
        `[SUCCESS] Workflow ${id} ${active ? "ACTIVATED" : "DEACTIVATED"}`
      );
    } else {
      const patchResp = await fetch(`${n8nUrl}/${id}`, {
        method: "PUT",
        headers: {
          "X-N8N-API-KEY": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ active }),
      });

      if (patchResp.ok) {
        console.log(
          `[SUCCESS] Workflow ${id} ${
            active ? "ACTIVATED" : "DEACTIVATED"
          } (via Update)`
        );
      } else {
        console.error(
          `[ERROR] Failed to toggle ${id}: ${
            patchResp.status
          } ${await patchResp.text()}`
        );
      }
    }
  } catch (error: any) {
    console.error(`[ERROR] Network error for ${id}:`, error.message);
  }
}

async function run() {
  console.log("Stopping old workflows...");
  for (const id of TO_DEACTIVATE) {
    await toggleWorkflow(id, false);
  }

  console.log("Starting new workflows...");
  for (const item of TO_ACTIVATE) {
    if (item.active) {
      await toggleWorkflow(item.id, true);
    }
  }
}

run();
