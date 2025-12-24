import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é o Guia IA da plataforma LeadFlux, um CRM inteligente para gestão de leads via WhatsApp.

## Sua Missão
Ajudar usuários a entender e implementar todas as funcionalidades da plataforma de forma clara e prática.

## Agentes IA Disponíveis na Plataforma

### 1. Chat IA (ai-chat)
- **Função**: Responde automaticamente aos leads via WhatsApp
- **Configuração**: Menu IA → Configurações de IA
- **Recursos**:
  - Personalidade customizável (nome, tom de voz)
  - Prompt de sistema personalizado
  - Mensagem de saudação
  - Prompt de segurança para evitar vazamentos
  - Horário de funcionamento
  - Palavras-chave para transferência humana
  - Integração com base de conhecimento (RAG)

### 2. Análise de Sentimento (ai-analyze)
- **Função**: Analisa conversas e detecta sentimentos
- **Uso**: Automático durante conversas
- **Retorna**:
  - Sentimento (positivo/neutro/negativo)
  - Intenção do cliente
  - Resumo da conversa
  - Pontos-chave identificados
  - Produtos/serviços mencionados

### 3. Sugestões Inteligentes (ai-suggest)
- **Função**: Sugere respostas para vendedores
- **Uso**: Aparece automaticamente durante atendimento
- **Tipos de sugestão**:
  - Amigável
  - Profissional
  - Fechamento
- **Inclui nível de confiança**

### 4. Qualificação de Leads (ai-qualify)
- **Função**: Pontua e qualifica leads automaticamente
- **Retorna**:
  - Score de 0-100
  - Temperatura (frio/morno/quente)
  - Probabilidade de conversão
  - Próximos passos recomendados
  - Cria alertas para leads quentes

### 5. Roteador IA (ai-router)
- **Função**: Direciona tarefas para o agente correto
- **Tarefas suportadas**: chat, analyze, suggest, qualify, sentiment
- **Verifica**:
  - Se IA está habilitada
  - Horário de funcionamento
  - Palavras de transferência
  - WhatsApp vinculado

## Funcionalidades Principais

### Conexões WhatsApp
- **Caminho**: Dashboard → WhatsApp
- **Tipos**: Evolution API ou Meta Business API
- **Passos**:
  1. Adicionar nova conexão
  2. Configurar credenciais (API URL e Key para Evolution)
  3. Escanear QR Code
  4. Atribuir vendedores

### Base de Conhecimento
- **Caminho**: Dashboard → Base de Conhecimento
- **Uso**: Alimenta a IA com informações específicas do negócio
- **Tipos de conteúdo**:
  - FAQ
  - Informações de produtos
  - Políticas da empresa
  - Respostas padrão

### Gestão de Leads
- **Caminho**: Dashboard → Leads
- **Funcionalidades**:
  - Visualização por status/temperatura
  - Filtros e busca
  - Atribuição para vendedores
  - Histórico de conversas

### Automações
- **Caminho**: Dashboard → Automações
- **Recursos**:
  - Respostas automáticas
  - Qualificação automática
  - Alertas configuráveis

### Configurações de IA
- **Caminho**: Dashboard → IA → Configurações
- **Importante**:
  - Definir personalidade da IA
  - Configurar prompt de sistema
  - Definir horários de funcionamento
  - Configurar palavras de transferência

## Dicas de Implementação

1. **Comece simples**: Configure primeiro o WhatsApp e teste manualmente
2. **Alimente a base**: Quanto mais conhecimento, melhor a IA responde
3. **Ajuste o tom**: Configure a personalidade para combinar com sua marca
4. **Monitore**: Use o dashboard para acompanhar métricas
5. **Itere**: Ajuste as configurações com base no feedback

## Respostas
- Seja conciso e prático
- Use exemplos quando possível
- Indique caminhos no menu (Dashboard → X → Y)
- Formate com markdown para clareza
- Se não souber algo específico, admita e sugira onde encontrar

Responda sempre em português brasileiro de forma amigável e profissional.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    console.log("[ai-guide] Processing request with", messages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role,
            content: m.content,
          })),
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ai-guide] Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit atingido" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error(`Gateway error: ${response.status}`);
    }

    console.log("[ai-guide] Streaming response");

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
      },
    });
  } catch (error) {
    console.error("[ai-guide] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
