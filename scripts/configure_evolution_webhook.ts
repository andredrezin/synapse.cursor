import axios from "axios";

const EVOLUTION_URL = "https://evolution.synapseautomacao.com.br";
const EVOLUTION_API_KEY = "429683C4C97C41029CDCC6AB2F66275E";
const N8N_WEBHOOK_URL =
  "https://n8n.synapseautomacao.com.br/webhook/evolution-ingest";
const INSTANCE_NAME = "atendimento-Marcela";

async function configureWebhook() {
  try {
    console.log(`🔧 Configurando webhook para instância: ${INSTANCE_NAME}`);
    console.log(`📡 N8N Webhook URL: ${N8N_WEBHOOK_URL}`);

    const response = await axios.post(
      `${EVOLUTION_URL}/webhook/set/${INSTANCE_NAME}`,
      {
        url: N8N_WEBHOOK_URL,
        enabled: true,
        events: [
          "MESSAGES_UPSERT", // Quando uma mensagem chega
        ],
        webhook_by_events: false,
      },
      {
        headers: {
          apikey: EVOLUTION_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Webhook configurado com sucesso!");
    console.log("Resposta:", JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error("❌ Erro ao configurar webhook:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Dados:", error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

configureWebhook();
