
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bhaaunojqtxbfkrpgdix.supabase.co";
// Using the same Anon Key (Assuming RLS allows insert or we get lucky with Service Role if available, else we rely on user manually running this logic via UI if I can expose it, but let's try script first as I did before).
// Actually, I should check if I have service role key. I don't.
// But wait, the previous script failed due to RLS.
// I can try to use the 'simulate_ai.ts' approach which seemed to work or just guide the user.

// Better approach: Create a robust script that tries to find the workspace and insert the status.
// If it fails, I will instruct the user to click a 'Reset/Init' button in the UI that I will add.

const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoYWF1bm9qcXR4YmZrcnBnZGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NDY2MjksImV4cCI6MjA4MjAyMjYyOX0.cIQOA-8ROEtZfhELiPlFD6ob6eyL0vq51K9fSEenprg";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function initAIStatus() {
    console.log('--- Initializing AI Training Status ---');

    // 1. Get Workspace (Try finding ANY workspace first)
    const { data: workspaces, error: wsError } = await supabase
        .from('workspaces')
        .select('id')
        .limit(1);

    if (wsError || !workspaces || workspaces.length === 0) {
        console.error('Error finding workspace (RLS might be blocking):', wsError);
        return;
    }
    const workspaceId = workspaces[0].id;
    console.log('Workspace ID found:', workspaceId);

    // 2. Check if status exists
    const { data: existing } = await supabase
        .from('ai_training_status')
        .select('id')
        .eq('workspace_id', workspaceId)
        .maybeSingle();

    if (existing) {
        console.log('Training status already exists:', existing.id);
        return;
    }

    // 3. Insert Status
    const { data, error } = await supabase
        .from('ai_training_status')
        .insert({
            workspace_id: workspaceId,
            status: 'collecting_data',
            messages_analyzed: 0,
            faqs_detected: 0,
            company_info_extracted: 0,
            seller_patterns_learned: 0,
            objections_learned: 0,
            confidence_score: 0,
            min_days_required: 7,
            min_messages_required: 100,
            started_at: new Date().toISOString()
        })
        .select();

    if (error) {
        console.error('Error inserting status:', error);
    } else {
        console.log('Success! AI Status initialized:', data[0].id);
    }
}

initAIStatus();
