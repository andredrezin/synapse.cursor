import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Script para testar o Agente Analista (OpenAI)
const supabaseUrl = 'https://bhaaunojqtxbfkrpgdix.supabase.co';
const supabaseKey = 'YOUR_SERVICE_ROLE_KEY'; // Substitua pela sua key

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAgenteAnalista() {
    console.log('📊 Testando Agente Analista (OpenAI)...\n');

    const tests = [
        {
            name: 'Solicitação de métricas',
            message: 'Qual foi nossa taxa de conversão ontem?',
            expectedAgent: 'Agente Analista',
        },
        {
            name: 'Cálculo de ROI',
            message: 'Calcule o ROI da campanha de dezembro',
            expectedAgent: 'Agente Analista',
        },
        {
            name: 'Análise de performance',
            message: 'Analise a performance dos vendedores este mês',
            expectedAgent: 'Agente Analista',
        },
        {
            name: 'Relatório de leads',
            message: 'Gere um relatório dos leads qualificados',
            expectedAgent: 'Agente Analista',
        },
        {
            name: 'Estatísticas gerais',
            message: 'Mostre as estatísticas de atendimento',
            expectedAgent: 'Agente Analista',
        },
    ];

    for (const test of tests) {
        console.log(`📝 Teste: ${test.name}`);
        console.log(`💬 Mensagem: "${test.message}"`);

        try {
            const { data, error } = await supabase.functions.invoke('ai-router-multi', {
                body: {
                    task: 'analyze',
                    workspace_id: 'YOUR_WORKSPACE_ID', // Substitua
                    payload: {
                        message: test.message,
                    },
                },
            });

            if (error) {
                console.error(`❌ Erro: ${error.message}\n`);
                continue;
            }

            console.log(`✅ Agente: ${data.agent}`);
            console.log(`💡 Resposta: ${data.response.substring(0, 200)}...`);
            console.log(`📊 Tokens: ${data.tokens}`);

            if (data.agent === test.expectedAgent) {
                console.log(`✅ Agente correto!\n`);
            } else {
                console.log(`⚠️ Agente esperado: ${test.expectedAgent}, recebido: ${data.agent}\n`);
            }

            // Verificar se a resposta contém números/cálculos
            const hasNumbers = /\d+/.test(data.response);
            if (hasNumbers) {
                console.log(`✅ Resposta contém dados numéricos\n`);
            } else {
                console.log(`⚠️ Resposta não contém dados numéricos\n`);
            }
        } catch (err) {
            console.error(`❌ Erro inesperado: ${err}\n`);
        }

        // Aguardar 1s entre testes
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('✅ Testes do Agente Analista concluídos!');
}

// Executar
testAgenteAnalista().catch(console.error);
