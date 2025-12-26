import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWhatsAppConnections() {
    console.log('🔍 Verificando conexões WhatsApp...\n');

    const { data: connections, error } = await supabase
        .from('whatsapp_connections')
        .select('name, phone_number, status, provider, instance_name')
        .eq('status', 'connected');

    if (error) {
        console.error('❌ Erro:', error);
        return;
    }

    if (!connections || connections.length === 0) {
        console.log('⚠️  Nenhuma conexão WhatsApp conectada encontrada.');
        return;
    }

    console.log(`✅ ${connections.length} conexão(ões) encontrada(s):\n`);

    connections.forEach((conn, index) => {
        console.log(`📱 Conexão ${index + 1}:`);
        console.log(`   Nome: ${conn.name}`);
        console.log(`   Número: ${conn.phone_number || 'Não informado'}`);
        console.log(`   Status: ${conn.status}`);
        console.log(`   Provider: ${conn.provider}`);
        console.log(`   Instance: ${conn.instance_name || 'N/A'}`);
        console.log('');
    });

    // Verificar se a IA está vinculada
    const { data: aiStatus } = await supabase
        .from('ai_training_status')
        .select('linked_whatsapp_id, status')
        .maybeSingle();

    if (aiStatus?.linked_whatsapp_id) {
        const linkedConn = connections.find(c => c.instance_name === aiStatus.linked_whatsapp_id);
        console.log('🤖 IA está vinculada à conexão:', linkedConn?.name || aiStatus.linked_whatsapp_id);
        console.log(`   Status da IA: ${aiStatus.status}`);
    } else {
        console.log('⚠️  IA não está vinculada a nenhuma conexão WhatsApp');
    }
}

checkWhatsAppConnections();
