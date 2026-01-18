const N8N_WEBHOOK_URL =
  "https://n8n.synapseautomacao.com.br/webhook/agente-IA-faqs";

export interface SetupIAPayload {
  workspace_id: string;
  tenant_name: string;
  informacoes: string;
}

export interface SetupIAResponse {
  status: string;
  message: string;
  workspace_id: string;
  total_faqs: number;
}

export async function gerarFAQsAutomatico(
  payload: SetupIAPayload,
): Promise<SetupIAResponse> {
  const response = await fetch(N8N_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || "Erro ao gerar FAQs. Tente novamente.",
    );
  }

  return response.json();
}
