
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Manual config since .env might be tricky to load in this environment
const SUPABASE_URL = "https://bhaaunojqtxbfkrpgdix.supabase.co";
// Using the anon key found in previous output
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoYWF1bm9qcXR4YmZrcnBnZGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NDY2MjksImV4cCI6MjA4MjAyMjYyOX0.cIQOA-8ROEtZfhELiPlFD6ob6eyL0vq51K9fSEenprg";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function updateLead() {
    console.log('Searching for Dona Maria...');

    // 1. Find the lead
    const { data: leads, error: findError } = await supabase
        .from('leads')
        .select('id, name')
        .ilike('name', '%Dona Maria%');

    if (findError) {
        console.error('Error finding lead:', findError);
        return;
    }

    if (!leads || leads.length === 0) {
        console.log('Dona Maria not found.');
        return;
    }

    const lead = leads[0];
    console.log(`Found: ${lead.name} (${lead.id})`);

    // 2. Update
    const { error: updateError } = await supabase
        .from('leads')
        .update({
            score: 88,
            temperature: 'hot',
            status: 'in_progress',
            last_activity_at: new Date().toISOString()
        })
        .eq('id', lead.id);

    if (updateError) {
        console.error('Error updating lead:', updateError);
        console.log('Note: This might be an RLS policy issue. You might need to be logged in as a specific user.');
    } else {
        console.log('Success! Lead updated to Hot/88.');
    }
}

updateLead();
