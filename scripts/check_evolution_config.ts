import axios from "axios";

const evolutionUrl = "https://evolution.synapseautomacao.com.br";
const apiKey = "429683C4C97C41029CDCC6AB2F66275E";

async function checkEvolution() {
  try {
    console.log("Fetching instances...");
    const instancesRes = await axios.get(
      `${evolutionUrl}/instance/fetchInstances`,
      {
        headers: { apikey: apiKey },
      }
    );
    console.log("Instances:", JSON.stringify(instancesRes.data, null, 2));

    const instanceName = "atendimento-Marcela";
    console.log(`\nChecking webhooks for ${instanceName}...`);
    // Note: The endpoint might differ based on Evolution version (v1/v2)
    const webhookRes = await axios.get(
      `${evolutionUrl}/webhook/find/${instanceName}`,
      {
        headers: { apikey: apiKey },
      }
    );
    console.log("Webhook Config:", JSON.stringify(webhookRes.data, null, 2));
  } catch (error: any) {
    console.error("Error:", error.response?.data || error.message);
  }
}

checkEvolution();
