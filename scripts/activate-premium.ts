
import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

// Load env vars manually if dotenv fails or for extra robustness
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials. Please ensure .env file has VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const email = "Dpereiraandre89@gmail.com";

async function activatePremium() {
    console.log(`🔍 Buscando usuário: ${email}...`);

    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
        console.error("Erro ao listar usuários:", userError);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.error("❌ Usuário não encontrado!");
        return;
    }

    console.log(`✅ Usuário encontrado: ${user.id}`);

    // 2. Finding Workspace
    let workspace;
    const { data: wsData, error: wsError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .single();

    if (wsError || !wsData) {
        console.log("⚠️ Workspace não encontrado diretamente pelo owner_id. Tentando via workspace_members...");
        const { data: member } = await supabase.from('workspace_members').select('workspace_id').eq('user_id', user.id).limit(1).single();
        if (!member) {
            console.error("❌ Usuário não pertence a nenhum workspace.");
            return;
        }
        workspace = { id: member.workspace_id };
    } else {
        workspace = wsData;
    }

    console.log(`✅ Workspace encontrado: ${workspace.id}`);

    // 3. Get Premium Plan ID
    const { data: plan } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('slug', 'premium')
        .single();

    if (!plan) {
        console.error("❌ Plano Premium não encontrado na tabela subscription_plans.");
        return;
    }

    // 4. Upsert Subscription
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    const { error: subError } = await supabase
        .from('workspace_subscriptions')
        .upsert({
            workspace_id: workspace.id,
            plan_id: plan.id,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: oneYearFromNow.toISOString(),
            stripe_customer_id: 'cus_manual_dev',
            stripe_subscription_id: 'sub_manual_dev_' + Date.now(),
            cancel_at_period_end: false
        }, { onConflict: 'workspace_id' });

    if (subError) {
        console.error("❌ Erro ao ativar assinatura:", subError);
    } else {
        console.log("🎉 SUCESSO! Plano Premium ativado manualmente para:", email);
    }
}

activatePremium();
