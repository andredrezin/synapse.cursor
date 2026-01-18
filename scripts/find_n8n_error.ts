const apiKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZTMyMTFlZC03Nzk5LTRjZjAtOTMyZi1kOTE4MzYwODNhNjIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY2ODU2ODA0fQ.5NljGMPyFWUQJk0bw6Wx1r7ClRXZ-7s9IFYM9rOwq8M";
const executionId = "2585";

async function findError() {
  const response = await fetch(
    `https://n8n.synapseautomacao.com.br/api/v1/executions/${executionId}?includeData=true`,
    {
      headers: {
        "X-N8N-API-KEY": apiKey,
      },
    }
  );
  const data = await response.json();

  const runData = data.data.resultData.runData;
  for (const nodeName in runData) {
    const nodeRun = runData[nodeName][0];
    if (nodeRun.error) {
      console.log(`Node Failed: ${nodeName}`);
      console.log(`Error Message: ${nodeRun.error.message}`);
      console.log(`Error Detail: ${JSON.stringify(nodeRun.error, null, 2)}`);
    }
  }
}

findError();
