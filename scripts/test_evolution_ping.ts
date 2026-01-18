// Using native fetch (Node 18+)
const url =
  "https://evo-gwo8ss8wk48w8gg4kw8ggows.coolify.synapseautomacao.com.br";
const keys = [
  "####1404Drezin97####", // AUTHENTICATION_API_KEY
  "Wq3id4r19rO76ola1bfyU9cfzj8zbdgj", // SERVICE_PASSWORD_AUTHENTICATIONAPIKEY
];

async function test() {
  for (const key of keys) {
    console.log(`\nTesting Key: ${key.substring(0, 5)}...`);
    try {
      const response = await fetch(`${url}/instance/fetchInstances`, {
        method: "GET",
        headers: { apikey: key },
      });
      console.log(`Status: ${response.status} ${response.statusText}`);
      const body = await response.text();
      console.log(`Body: ${body.substring(0, 100)}`);
      if (response.ok) {
        console.log(`✅ KEY WORKS!`);
      }
    } catch (e: any) {
      console.error(`Error: ${e.message}`);
    }
  }
}

test();
