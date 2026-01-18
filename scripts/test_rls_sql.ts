import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://aktwyjsfvydxaaipedyb.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdHd5anNmdnlkeGFhaXBlZHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ0MTAxOCwiZXhwIjoyMDgyMDE3MDE4fQ.pXrVqUOgEUvDPhSb8_e1iQlVzUXgZEUxZr6rJr9akCM";

async function test() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const andreUid = "9d09ecf0-274a-406d-af63-a0a8e443bcc3";
  const synapseWsId = "4f2e7764-d713-4a19-a7ef-b6bda4f960dd";

  // We will run a SQL query that simulates the user's session variables
  // and see if the RLS condition is met.

  const sql = `
    DO $$
    DECLARE
      v_uid uuid := '${andreUid}'::uuid;
      v_ws_id uuid := '${synapseWsId}'::uuid;
      v_exists boolean;
    BEGIN
      -- Simulate auth.uid() by setting a session variable if we wanted to test actual RLS,
      -- but here we just check our function logic manually with the ID.
      
      SELECT EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_id = v_ws_id AND user_id = v_uid
      ) INTO v_exists;
      
      RAISE NOTICE 'is_workspace_member condition for user % in ws %: %', v_uid, v_ws_id, v_exists;
      
      IF v_exists THEN
         RAISE NOTICE 'SUCCESS: RLS should allow SELECT';
      ELSE
         RAISE NOTICE 'FAILURE: RLS will block SELECT';
      END IF;
    END $$;
  `;

  // Since we can't get NOTICES back easily via generic RPC, we'll use a trick or just check the membership again.
  // Wait! I already checked membership and it exists.

  // LET'S TRY TO QUERY AS THE USER using a proxy if we had one.
  // Actually, I can check if there are ANY OTHER POLICIES.

  const { data: policies, error: pErr } = await supabase
    .from("pg_policies")
    .select("*")
    .eq("tablename", "whatsapp_connections");
  console.log("Policies found (may fail if not accessible):", policies || pErr);
}

test();
