import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const url = new URL(req.url);
    const cleanup = url.searchParams.get("cleanup") === "true";

    if (cleanup) {
      const { error: deleteError } = await supabaseClient
        .from("whatsapp_connections")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Hack to delete all

      return new Response(
        JSON.stringify({ success: true, message: "All connections wiped." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 1. Get all connections
    const { data: connections, error: connError } = await supabaseClient
      .from("whatsapp_connections")
      .select("*")
      .order("created_at", { ascending: false });

    // 2. Get all workspace members (limit 100)
    const { data: members, error: memberError } = await supabaseClient
      .from("workspace_members")
      .select("*")
      .limit(100);

    return new Response(
      JSON.stringify({
        connections: connections || [],
        members: members || [],
        connError,
        memberError,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
