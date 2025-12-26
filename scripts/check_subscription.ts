
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bhaaunojqtxbfkrpgdix.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoYWF1bm9qcXR4YmZrcnBnZGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NDY2MjksImV4cCI6MjA4MjAyMjYyOX0.cIQOA-8ROEtZfhELiPlFD6ob6eyL0vq51K9fSEenprg";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkConfig() {
    console.log('--- Checking Subscriptions ---');
    const { data: subs, error: subError } = await supabase
        .from('subscriptions')
        .select('*');

    if (subError) console.error('Error fetching subscriptions:', subError);
    else console.table(subs);

    console.log('\n--- Checking Profiles ---');
    const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('id, email, role'); // Removed 'tier' or 'plan' as I'm not sure if it's on profile or subscription

    if (profError) console.error('Error fetching profiles:', profError);
    else console.table(profiles);
}

checkConfig();
