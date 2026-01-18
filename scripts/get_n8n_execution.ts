const apiKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZTMyMTFlZC03Nzk5LTRjZjAtOTMyZi1kOTE4MzYwODNhNjIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY2ODU2ODA0fQ.5NljGMPyFWUQJk0bw6Wx1r7ClRXZ-7s9IFYM9rOwq8M";
const executionId = "2585";

async function getExecution() {
  const response = await fetch(
    `https://n8n.synapseautomacao.com.br/api/v1/executions/${executionId}`,
    {
      headers: {
        "X-N8N-API-KEY": apiKey,
      },
    }
  );
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

getExecution();
