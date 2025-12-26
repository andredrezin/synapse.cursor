
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
// fallback to .env.local if needed
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listLeads() {
    console.log('Connecting to:', supabaseUrl);

    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, phone, score, temperature, workspace_id');

    if (error) {
        console.error('Error fetching leads:', error);
        return;
    }

    console.log(`Found ${leads?.length || 0} leads:`);
    leads?.forEach(l => {
        console.log(`- [${l.id}] ${l.name} (${l.phone}) | Score: ${l.score} | Temp: ${l.temperature} | Workspace: ${l.workspace_id}`);
    });
}

listLeads();
