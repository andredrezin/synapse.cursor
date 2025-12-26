import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Script para testar múltiplos vendedores simultâneos
const supabaseUrl = 'https://bhaaunojqtxbfkrpgdix.supabase.co';
const supabaseKey = 'YOUR_SERVICE_ROLE_KEY'; // Substitua pela sua key

const supabase = createClient(supabaseUrl, supabaseKey);

interface Seller {
    id: string;
    name: string;
    profile_id: string;
}

interface Lead {
    name: string;
    phone: string;
    message: string;
}

async function testMultiSellers() {
    console.log('👥 Testando Sistema Multi-Vendedores...\n');

    const workspaceId = 'YOUR_WORKSPACE_ID'; // Substitua

    // Buscar vendedores
    console.log('📋 Buscando vendedores...');
    const { data: sellers, error: sellersError } = await supabase
        .from('workspace_members')
        .select('user_id, profiles(id, full_name)')
        .eq('workspace_id', workspaceId)
        .eq('role', 'seller')
        .limit(3);

    if (sellersError || !sellers || sellers.length === 0) {
        console.error('❌ Erro ao buscar vendedores:', sellersError);
        return;
    }

    console.log(`✅ Encontrados ${sellers.length} vendedores\n`);

    // Simular 3 leads chegando simultaneamente
    const leads: Lead[] = [
        {
            name: 'João Silva',
            phone: '5511999990001',
            message: 'Olá, quero saber sobre o plano básico',
        },
        {
            name: 'Maria Santos',
            phone: '5511999990002',
            message: 'Quanto custa o plano profissional?',
        },
        {
            name: 'Pedro Costa',
            phone: '5511999990003',
            message: 'Preciso de uma solução para minha empresa',
        },
    ];

    console.log('📨 Simulando 3 leads chegando simultaneamente...\n');

    // Criar conversas para cada lead
    const conversations = await Promise.all(
        leads.map(async (lead, index) => {
            const seller = sellers[index % sellers.length];

            console.log(`📝 Lead: ${lead.name} → Vendedor: ${seller.profiles.full_name}`);

            // Criar conversa
            const { data: conversation, error: convError } = await supabase
                .from('conversations')
                .insert({
                    workspace_id: workspaceId,
                    lead_name: lead.name,
                    lead_phone: lead.phone,
                    assigned_to: seller.profiles.id,
                    status: 'active',
                })
                .select()
                .single();

            if (convError) {
                console.error(`❌ Erro ao criar conversa: ${convError.message}`);
                return null;
            }

            // Criar mensagem inicial
            const { error: msgError } = await supabase
                .from('messages')
                .insert({
                    conversation_id: conversation.id,
                    body: lead.message,
                    from_me: false,
                    timestamp: new Date().toISOString(),
                });

            if (msgError) {
                console.error(`❌ Erro ao criar mensagem: ${msgError.message}`);
                return null;
            }

            console.log(`✅ Conversa criada: ${conversation.id}`);

            // Simular resposta da IA
            try {
                const { data: aiResponse, error: aiError } = await supabase.functions.invoke(
                    'ai-router-multi',
                    {
                        body: {
                            task: 'chat',
                            workspace_id: workspaceId,
                            payload: {
                                message: lead.message,
                                conversation_id: conversation.id,
                            },
                        },
                    }
                );

                if (aiError) {
                    console.error(`❌ Erro na IA: ${aiError.message}`);
                } else {
                    console.log(`🤖 IA respondeu (${aiResponse.agent}): ${aiResponse.response.substring(0, 100)}...`);
                }
            } catch (err) {
                console.error(`❌ Erro ao chamar IA: ${err}`);
            }

            console.log('');
            return conversation;
        })
    );

    console.log('\n📊 Verificando métricas por vendedor...\n');

    // Verificar métricas de cada vendedor
    for (const seller of sellers) {
        const { data: metrics, error: metricsError } = await supabase
            .from('conversations')
            .select('id, status, lead_name')
            .eq('workspace_id', workspaceId)
            .eq('assigned_to', seller.profiles.id);

        if (metricsError) {
            console.error(`❌ Erro ao buscar métricas: ${metricsError.message}`);
            continue;
        }

        console.log(`👤 ${seller.profiles.full_name}:`);
        console.log(`   Conversas: ${metrics?.length || 0}`);
        console.log(`   Ativas: ${metrics?.filter(m => m.status === 'active').length || 0}`);
        console.log('');
    }

    console.log('✅ Teste de Multi-Vendedores concluído!');
    console.log('\n📋 Resumo:');
    console.log(`   - ${leads.length} leads processados`);
    console.log(`   - ${sellers.length} vendedores ativos`);
    console.log(`   - ${conversations.filter(c => c !== null).length} conversas criadas`);
}

// Executar
testMultiSellers().catch(console.error);
