import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateMemberRequest {
    email: string;
    password?: string;
    fullName: string;
    role: "admin" | "member" | "seller";
    workspaceId: string;
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "No authorization header" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { persistSession: false },
        });

        const token = authHeader.replace("Bearer ", "");
        const { data: { user: requester }, error: requesterError } = await supabaseAdmin.auth.getUser(token);

        if (requesterError || !requester) {
            return new Response(JSON.stringify({ error: "Invalid token" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const body: CreateMemberRequest = await req.json();
        const { email, password, fullName, role, workspaceId } = body;

        const { data: memberCheck, error: memberCheckError } = await supabaseAdmin
            .from("workspace_members")
            .select("role")
            .eq("workspace_id", workspaceId)
            .eq("user_id", requester.id)
            .single();

        if (memberCheckError || !memberCheck || (memberCheck.role !== "admin" && memberCheck.role !== "owner")) {
            return new Response(JSON.stringify({ error: "Unauthorized: Admin access required for this workspace" }), {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: password || Math.random().toString(36).slice(-12),
            email_confirm: true,
            user_metadata: { full_name: fullName }
        });

        if (createError) {
            return new Response(JSON.stringify({ error: "Failed to create user", details: createError.message }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        await supabaseAdmin
            .from("profiles")
            .update({
                full_name: fullName,
                onboarding_completed: true,
                current_workspace_id: workspaceId
            })
            .eq("user_id", newUser.user.id);

        const { error: joinError } = await supabaseAdmin
            .from("workspace_members")
            .insert({
                workspace_id: workspaceId,
                user_id: newUser.user.id,
                role: role
            });

        if (joinError) {
            return new Response(JSON.stringify({ error: "User created but failed to join workspace", details: joinError.message }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ success: true, userId: newUser.user.id }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: "Internal server error", details: String(error) }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
