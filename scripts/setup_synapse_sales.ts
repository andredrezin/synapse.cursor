
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Fallback to hardcoded keys if env not set (for convenience in this environment context)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://bhaaunojqtxbfkrpgdix.supabase.co";
// Important: Use Service Role Key for Admin tasks (like updating AI settings for others), 
// BUT users locally might only have Anon. 
// However, the previous Deno script tried to use SERVICE_ROLE_KEY.
// If we don't have it in process.env, we might fail RLS.
// For now, let's try with the key from check_subscription (which is Anon) 
// but wait, writing to `ai_settings` might require authenticated user or Service Role.
// I will try to use the Anon key first, if it fails I'll ask user for Service Key or use "simulate_ai" logic.
// Actually, `init_ai_status.ts` failed due to RLS with Anon key.
// I'll try to use the Anon Key but if I'm not logged in, I can't write to tables usually.
// Wait, `check_subscription.ts` has a hardcoded Anon key.
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoYWF1bm9qcXR4YmZrcnBnZGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NDY2MjksImV4cCI6MjA4MjAyMjYyOX0.cIQOA-8ROEtZfhELiPlFD6ob6eyL0vq51K9fSEenprg";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- CONFIGURATION DATA ---

const AI_SETTINGS = {
    ai_name: 'Consultor Synapse',
    ai_personality: 'consultivo, estratégico e focado em fechar vendas',
    system_prompt: `
ATENÇÃO: Você é um Consultor de Vendas Sênior do SynapseWhats (SaaS de automação de WhatsApp e CRM com IA).
SEU OBJETIVO: Transformar leads de topo de funil em clientes pagantes.

ESTRATÉGIA DE VENDAS (Siga este fluxo):
1. **HOOK & QUALIFICAÇÃO:**
   - Descubra se o lead é dono de empresa ou gestor.
   - Pergunte quantos atendentes usam WhatsApp na empresa hoje.
   - Pergunte se eles perdem tempo respondendo perguntas repetitivas.

2. **APRESENTAÇÃO DA SOLUÇÃO (Nutrição):**
   - Se tiver > 1 atendente: Foque na CENTRALIZAÇÃO (tudo num lugar só) e CONTROLE (gestor vê tudo).
   - Se reclamar de tempo: Foque na AUTOMAÇÃO (Chatbot IA que responde sozinho).
   - Use gatilhos mentais:
     - *Autoridade:* "Nossa IA aprende com seus melhores vendedores."
     - *Escassez:* "Pare de perder leads por demora no atendimento."

3. **FECHAMENTO (CTA):**
   - Para pequenas empresas: Indique o Plano Básico (R$ 297/mês).
   - Para quem quer IA: Indique o Plano Profissional (R$ 497/mês) ou Premium (R$ 899/mês).
   - CTA final: "Vamos agendar uma demo rápida ou prefere começar o teste agora?"

REGRAS DE OURO:
- Seja conciso. Ninguém gosta de textão no WhatsApp.
- Use emojis moderadamente 🚀.
- Se perguntarem preço, fale, mas imediatamente justifique o valor com um benefício.
- Nunca invente funcionalidades que não temos.
`.trim(),
    allowed_topics: ['planos', 'preços', 'automação', 'ia', 'crm', 'whatsapp', 'api', 'suporte'],
    blocked_topics: ['política', 'religião', 'concorrentes', 'futebol']
};

const KNOWLEDGE_ENTRIES = [
    {
        title: 'O que é o SynapseWhats?',
        content: 'O SynapseWhats é uma plataforma completa de CRM e Automação para WhatsApp. Ele centraliza todos os seus atendentes em um único número, organiza conversas em funis (Kanban) e possui uma Inteligência Artificial que aprende sobre sua empresa para responder clientes automaticamente 24/7.',
        category: 'Sobre o Produto'
    },
    {
        title: 'Planos e Preços',
        content: `
Temos 3 planos ideais para escalar seu negócio:

1. **Plano Básico (R$ 297/mês):**
   - Ideal para começar.
   - Inclui: Múltiplos atendentes, Dashboard de métricas, Gestão de Leads (CRM).
   - *Nota: Não tem IA.*

2. **Plano Profissional (R$ 497/mês) - O Mais Vendido:**
   - Para quem quer eficiência.
   - Inclui: Tudo do Básico + Insights de IA, Qualificação automática de leads, Sugestão de respostas.

3. **Plano Premium (R$ 899,90/mês) - Automação Total:**
   - A máquina de vendas completa.
   - Inclui: Chatbot IA que conversa sozinho, Transcrição de áudio, Análise de imagens e Conexão Oficial (Meta API).
`.trim(),
        category: 'Preços'
    },
    {
        title: 'Diferença entre Evolution API e Meta Official',
        content: 'Nós suportamos ambas. A **Evolution API** usa conexão via QR Code (mais simples, para testes e baixo volume). A **Meta Official API** é a conexão direta com o Facebook (mais estável, sem risco de bloqueio, obrigatória para o plano Premium e alta escala). Recomendamos Meta Official para operações sérias.',
        category: 'Técnico'
    },
    {
        title: 'Como funciona a IA?',
        content: 'Nossa IA usa tecnologia RAG (Retrieval-Augmented Generation). Você não precisa programar frases prontas. Basta fazer upload de PDFs ou manuais da sua empresa, e a IA "lê" tudo isso. Ela aprende sozinha e responde perguntas baseadas no seu material. É como contratar um vendedor treinado instantaneamente.',
        category: 'Funcionalidades'
    }
];

// --- MAIN SCRIPT ---

const main = async () => {
    console.log("Iniciando configuração de Vendas Synapse...");

    const workspaces = await supabase.from('workspaces').select('id').limit(1);
    if (workspaces.error || !workspaces.data?.length) {
        console.error("Nenhum workspace encontrado.");
        return;
    }
    const workspaceId = workspaces.data[0].id;
    console.log(`Configurando Workspace ID: ${workspaceId}`);

    // 1. Update AI Settings
    console.log("Atualizando configurações da IA...");
    const { error: settingsError } = await supabase
        .from('ai_settings')
        .upsert({
            workspace_id: workspaceId,
            ...AI_SETTINGS
        }, { onConflict: 'workspace_id' });

    if (settingsError) console.error("Erro ao atualizar settings:", settingsError);
    else console.log("Settings atualizadas com sucesso!");

    // 2. Insert Knowledge Base
    console.log("Inserindo Base de Conhecimento de Vendas...");

    // First, get or create categories
    const categories = ['Sobre o Produto', 'Preços', 'Técnico', 'Funcionalidades'];
    const categoryIds: Record<string, string> = {};

    for (const catName of categories) {
        // Check exist
        let { data: cat } = await supabase.from('knowledge_categories')
            .select('id').eq('workspace_id', workspaceId).eq('name', catName).maybeSingle();

        if (!cat) {
            const { data: newCat } = await supabase.from('knowledge_categories')
                .insert({ workspace_id: workspaceId, name: catName }).select().single();
            cat = newCat;
        }
        if (cat) categoryIds[catName] = cat.id;
    }

    // Insert entries
    for (const entry of KNOWLEDGE_ENTRIES) {
        const catId = categoryIds[entry.category];
        if (!catId) continue;

        const { error: entryError } = await supabase
            .from('ai_learned_content')
            .insert({
                workspace_id: workspaceId,
                category_id: catId,
                question: entry.title, // Using question column for title/topic
                answer: entry.content,
                status: 'active',
                approved: true,
                source: 'sales_script_auto'
            });

        if (entryError) console.error(`Erro ao inserir ${entry.title}:`, entryError.message);
        else console.log(`[OK] Inserido: ${entry.title}`);
    }

    console.log("Configuração concluída! Sua IA agora é um vendedor treinado.");
};

main();
