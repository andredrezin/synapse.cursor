import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateWorkspaceRequest {
  name: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("create-workspace function called");
    
    // Get auth token from header
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header present:", !!authHeader);
    
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    console.log("Supabase URL available:", !!supabaseUrl);
    console.log("Service role key available:", !!supabaseServiceKey);
    console.log("Anon key available:", !!supabaseAnonKey);

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Create user client to verify the token - extract the token from Bearer
    const token = authHeader.replace("Bearer ", "");
    
    // Verify the token by getting the user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error("Failed to get user:", userError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid token", details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", user.id, user.email);

    // Parse request body
    let body: CreateWorkspaceRequest;
    try {
      body = await req.json();
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { name } = body;

    if (!name || name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Workspace name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Creating workspace:", name, "for user:", user.id);

    // Create the workspace using service role
    const { data: workspace, error: workspaceError } = await supabaseAdmin
      .from("workspaces")
      .insert({ name: name.trim(), owner_id: user.id })
      .select()
      .single();

    if (workspaceError) {
      console.error("Failed to create workspace:", workspaceError);
      return new Response(
        JSON.stringify({ error: "Failed to create workspace", details: workspaceError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Workspace created:", workspace.id);

    // Add user as owner member
    const { error: memberError } = await supabaseAdmin
      .from("workspace_members")
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: "owner",
      });

    if (memberError) {
      console.error("Failed to add member:", memberError);
      // Rollback workspace creation
      await supabaseAdmin.from("workspaces").delete().eq("id", workspace.id);
      return new Response(
        JSON.stringify({ error: "Failed to create workspace member", details: memberError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Member added successfully");

    // Update user profile with current_workspace_id and onboarding_completed
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        current_workspace_id: workspace.id,
        onboarding_completed: true,
      })
      .eq("user_id", user.id);

    if (profileError) {
      console.error("Failed to update profile:", profileError);
      return new Response(
        JSON.stringify({ error: "Failed to update profile", details: profileError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Profile updated, onboarding completed");

    return new Response(
      JSON.stringify({
        success: true,
        workspace: {
          id: workspace.id,
          name: workspace.name,
          created_at: workspace.created_at,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
