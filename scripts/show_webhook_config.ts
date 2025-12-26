import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getWebhookConfig() {
    console.log('🔍 Verificando configuração de webhooks...\n');

    // Get all WhatsApp connections
    const { data: connections, error } = await supabase
        .from('whatsapp_connections')
        .select('id, name, instance_name, webhook_secret, api_url, provider, status');

    if (error) {
        console.error('❌ Erro:', error);
        return;
    }

    if (!connections || connections.length === 0) {
        console.log('⚠️  Nenhuma conexão WhatsApp encontrada.');
        return;
    }

    console.log(`📱 ${connections.length} conexão(ões) encontrada(s):\n`);

    // Get Supabase project URL for webhook
    const projectUrl = supabaseUrl.includes('127.0.0.1')
        ? 'http://127.0.0.1:54321'
        : supabaseUrl;

    const webhookUrl = `${projectUrl}/functions/v1/whatsapp-webhook`;

    connections.forEach((conn, index) => {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📱 Conexão ${index + 1}: ${conn.name}`);
        console.log(`${'='.repeat(60)}`);
        console.log(`Instance: ${conn.instance_name || 'N/A'}`);
        console.log(`Provider: ${conn.provider}`);
        console.log(`Status: ${conn.status}`);
        console.log(`Webhook Secret: ${conn.webhook_secret || 'NÃO CONFIGURADO'}`);

        if (conn.provider === 'evolution' && conn.api_url) {
            console.log(`\n🔧 CONFIGURAÇÃO NECESSÁRIA NA EVOLUTION API:`);
            console.log(`\nURL da API Evolution: ${conn.api_url}`);
            console.log(`\n📝 Execute este comando para configurar o webhook:\n`);
            console.log(`curl -X POST "${conn.api_url}/webhook/set/${conn.instance_name}" \\`);
            console.log(`  -H "apikey: SUA_API_KEY_AQUI" \\`);
            console.log(`  -H "Content-Type: application/json" \\`);
            console.log(`  -d '{`);
            console.log(`    "enabled": true,`);
            console.log(`    "url": "${webhookUrl}",`);
            console.log(`    "events": ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],`);
            console.log(`    "webhook_by_events": false`);
            console.log(`  }'`);
            console.log(`\n✅ Após configurar, teste enviando uma mensagem para o WhatsApp`);
        }
    });

    console.log(`\n\n${'='.repeat(60)}`);
    console.log(`📌 URL DO WEBHOOK PARA TODAS AS INSTÂNCIAS:`);
    console.log(`${'='.repeat(60)}`);
    console.log(`${webhookUrl}`);
    console.log(`${'='.repeat(60)}\n`);

    // Check AI status
    const { data: aiStatus } = await supabase
        .from('ai_training_status')
        .select('workspace_id, linked_whatsapp_id, status')
        .maybeSingle();

    if (aiStatus) {
        console.log(`\n🤖 STATUS DA IA:`);
        console.log(`Workspace ID: ${aiStatus.workspace_id}`);
        console.log(`WhatsApp vinculado: ${aiStatus.linked_whatsapp_id || 'NENHUM'}`);
        console.log(`Status: ${aiStatus.status}`);

        if (!aiStatus.linked_whatsapp_id) {
            console.log(`\n⚠️  A IA NÃO ESTÁ VINCULADA a nenhum WhatsApp!`);
            console.log(`   Vá em "Vendedores" e marque "IA Synapse (Robô)"`);
        }
    } else {
        console.log(`\n⚠️  IA não configurada para este workspace`);
    }
}

getWebhookConfig();
