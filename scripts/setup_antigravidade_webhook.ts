import axios from "axios";

const evolutionUrl = "https://evolution.synapseautomacao.com.br";
const apiKey = "429683C4C97C41029CDCC6AB2F66275E";
const n8nWebhookUrl =
  "https://n8n.synapseautomacao.com.br/webhook/evolution-ingest";

async function setupWebhook() {
  const instanceName = "atendimento-Marcela";
  try {
    console.log(`Configuring webhook for ${instanceName}...`);

    // Set global webhook for the instance
    const res = await axios.post(
      `${evolutionUrl}/webhook/set/${instanceName}`,
      {
        url: n8nWebhookUrl,
        enabled: true,
        events: ["MESSAGES_UPSERT"],
      },
      {
        headers: { apikey: apiKey },
      }
    );

    console.log("Success:", JSON.stringify(res.data, null, 2));
  } catch (error: any) {
    console.error(
      "Error setting webhook:",
      error.response?.data || error.message
    );
  }
}

setupWebhook();
