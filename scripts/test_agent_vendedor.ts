import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Script para testar o Agente Vendedor (Gemini)
const supabaseUrl = 'https://bhaaunojqtxbfkrpgdix.supabase.co';
const supabaseKey = 'YOUR_SERVICE_ROLE_KEY'; // Substitua pela sua key

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAgenteVendedor() {
    console.log('🤖 Testando Agente Vendedor (Gemini)...\n');

    const tests = [
        {
            name: 'Saudação inicial',
            message: 'Olá, quero saber sobre o produto',
            expectedAgent: 'Agente Vendedor',
        },
        {
            name: 'Pergunta sobre preço',
            message: 'Qual é o preço do plano básico?',
            expectedAgent: 'Agente Vendedor',
        },
        {
            name: 'Interesse em compra',
            message: 'Quero fechar negócio! Como faço?',
            expectedAgent: 'Agente Vendedor',
        },
        {
            name: 'Dúvida técnica',
            message: 'Como funciona a integração com WhatsApp?',
            expectedAgent: 'Agente Vendedor',
        },
    ];

    for (const test of tests) {
        console.log(`📝 Teste: ${test.name}`);
        console.log(`💬 Mensagem: "${test.message}"`);

        try {
            const { data, error } = await supabase.functions.invoke('ai-router-multi', {
                body: {
                    task: 'chat',
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
        } catch (err) {
            console.error(`❌ Erro inesperado: ${err}\n`);
        }

        // Aguardar 1s entre testes
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('✅ Testes do Agente Vendedor concluídos!');
}

// Executar
testAgenteVendedor().catch(console.error);
