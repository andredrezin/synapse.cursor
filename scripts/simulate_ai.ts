
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Fallback to anon key if service role missing, though RLS might block

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing environment variables VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function simulateAI() {
    console.log('Connecting to Supabase...');

    // 1. Find Dona Maria
    const { data: lead, error: findError } = await supabase
        .from('leads')
        .select('id, workspace_id, name')
        .ilike('name', '%Dona Maria%')
        .maybeSingle();

    if (findError) {
        console.error('Error finding lead:', findError);
        return;
    }

    if (!lead) {
        console.error('Lead "Dona Maria" not found in the database.');
        return;
    }

    console.log(`Found lead: ${lead.name} (${lead.id})`);

    // 2. Update Lead Score to simulate AI Qualification
    const { error: updateError } = await supabase
        .from('leads')
        .update({
            score: 88,
            temperature: 'hot',
            status: 'in_progress',
            objections: ['Preço', 'Urgência'],
            last_activity_at: new Date().toISOString()
        })
        .eq('id', lead.id);

    if (updateError) {
        console.error('Failed to update lead:', updateError);
        return;
    }

    console.log('Lead updated successfully: Score 88, Temperature HOT.');

    // 3. Optional: Add a notification to ensure it shows up in alerts/notifications if implemented
    // (ignoring for now, focus is on Insights dashboard query)
}

simulateAI();
