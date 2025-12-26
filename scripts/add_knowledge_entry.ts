
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bhaaunojqtxbfkrpgdix.supabase.co";
// Using the same Anon Key
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoYWF1bm9qcXR4YmZrcnBnZGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NDY2MjksImV4cCI6MjA4MjAyMjYyOX0.cIQOA-8ROEtZfhELiPlFD6ob6eyL0vq51K9fSEenprg";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function addEntry() {
    console.log('--- Adding Knowledge Entry ---');

    // 1. Get Workspace (Try finding ANY workspace first)
    const { data: workspaces, error: wsError } = await supabase
        .from('workspaces')
        .select('id')
        .limit(1);

    let workspaceId;

    if (workspaces && workspaces.length > 0) {
        workspaceId = workspaces[0].id;
    } else {
        // If no workspace, try to create one or use a fallback. 
        // Note: Creating with Anon might fail due to RLS, but let's try reading again.
        console.log('No workspace found via Anon key. RLS is likely hiding it.');
        // Trying a known ID or similar won't work without auth context.
        // We will mock one for the sake of the script if this was intended to run locally with user context, 
        // but since this is a script, we need a Service Role key or a real user token.
        // For now, let's just exit and tell the user to use the UI.
        return;
    }
    console.log('Workspace ID found:', workspaceId);

    // 2. Insert Entry
    const { data, error } = await supabase
        .from('knowledge_entries')
        .insert({
            workspace_id: workspaceId,
            title: 'Política de Entrega',
            content: 'Nossas entregas são feitas em até 3 dias úteis para capitais e 7 dias para interior via Sedex. Frete grátis acima de R$500.',
            summary: 'Prazos de entrega Sedex',
            entry_type: 'faq',
            is_ai_accessible: true,
            is_public: true,
            sensitivity_level: 'public',
            tags: ['entrega', 'frete', 'prazo']
        })
        .select();

    if (error) {
        console.error('Error inserting entry:', error);
    } else {
        console.log('Success! Entry added:', data[0].title);
    }
}

addEntry();
