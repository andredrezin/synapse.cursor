import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Structured logging helper
function log(level: "INFO" | "WARN" | "ERROR" | "DEBUG", message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, level, function: "whatsapp-oauth-callback", message, ...(data && { data }) };
  console.log(JSON.stringify(logEntry));
}

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  log("INFO", `[${requestId}] OAuth callback received`, { method: req.method });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const metaAppId = Deno.env.get("META_APP_ID")!;
    const metaAppSecret = Deno.env.get("META_APP_SECRET")!;

    log("DEBUG", `[${requestId}] Environment check`, {
      hasMetaAppId: !!metaAppId,
      hasMetaAppSecret: !!metaAppSecret,
    });

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    log("INFO", `[${requestId}] OAuth params`, { 
      hasCode: !!code, 
      hasState: !!state, 
      error: error || null 
    });

    // Get the frontend URL for redirects
    const frontendUrl = Deno.env.get("FRONTEND_URL") || supabaseUrl.replace(".supabase.co", ".lovable.app");
    log("DEBUG", `[${requestId}] Frontend URL`, { frontendUrl });

    if (error) {
      log("ERROR", `[${requestId}] OAuth error from Facebook`, { error });
      return Response.redirect(`${frontendUrl}/dashboard/whatsapp?error=oauth_denied`);
    }

    if (!code || !state) {
      log("ERROR", `[${requestId}] Missing code or state`);
      return Response.redirect(`${frontendUrl}/dashboard/whatsapp?error=missing_params`);
    }

    // Decode state
    let stateData;
    try {
      stateData = JSON.parse(atob(decodeURIComponent(state)));
      log("INFO", `[${requestId}] State decoded`, { 
        connection_id: stateData.connection_id, 
        workspace_id: stateData.workspace_id 
      });
    } catch (e) {
      log("ERROR", `[${requestId}] Failed to decode state`, { state });
      return Response.redirect(`${frontendUrl}/dashboard/whatsapp?error=invalid_state`);
    }

    const { connection_id, workspace_id } = stateData;

    // Exchange code for access token
    const redirectUri = `${supabaseUrl}/functions/v1/whatsapp-oauth-callback`;
    log("INFO", `[${requestId}] Exchanging code for token`);

    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${metaAppId}` +
      `&client_secret=${metaAppSecret}` +
      `&code=${code}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`
    );

    log("DEBUG", `[${requestId}] Token exchange response`, { status: tokenResponse.status });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      log("ERROR", `[${requestId}] Token exchange failed`, { status: tokenResponse.status, error: errorText });
      return Response.redirect(`${frontendUrl}/dashboard/whatsapp?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    log("INFO", `[${requestId}] Token received successfully`);

    // Get WhatsApp Business Account ID
    log("DEBUG", `[${requestId}] Fetching business accounts`);
    const businessResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/businesses?access_token=${tokenData.access_token}`
    );
    
    if (!businessResponse.ok) {
      log("ERROR", `[${requestId}] Failed to get business accounts`, { status: businessResponse.status });
      return Response.redirect(`${frontendUrl}/dashboard/whatsapp?error=business_fetch_failed`);
    }

    const businessData = await businessResponse.json();
    log("DEBUG", `[${requestId}] Business accounts fetched`, { count: businessData.data?.length || 0 });

    // Try to get WhatsApp Business Account
    let wabaId = null;
    let phoneNumber = null;
    let phoneNumberId = null;

    if (businessData.data && businessData.data.length > 0) {
      const businessId = businessData.data[0].id;
      log("DEBUG", `[${requestId}] Using business`, { businessId, businessName: businessData.data[0].name });
      
      // Get WhatsApp Business Accounts for this business
      const wabaResponse = await fetch(
        `https://graph.facebook.com/v18.0/${businessId}/owned_whatsapp_business_accounts?access_token=${tokenData.access_token}`
      );

      if (wabaResponse.ok) {
        const wabaData = await wabaResponse.json();
        log("DEBUG", `[${requestId}] WABA accounts fetched`, { count: wabaData.data?.length || 0 });

        if (wabaData.data && wabaData.data.length > 0) {
          wabaId = wabaData.data[0].id;
          log("INFO", `[${requestId}] Using WABA`, { wabaId });

          // Get phone numbers for this WABA
          const phonesResponse = await fetch(
            `https://graph.facebook.com/v18.0/${wabaId}/phone_numbers?access_token=${tokenData.access_token}`
          );

          if (phonesResponse.ok) {
            const phonesData = await phonesResponse.json();
            log("DEBUG", `[${requestId}] Phone numbers fetched`, { count: phonesData.data?.length || 0 });

            if (phonesData.data && phonesData.data.length > 0) {
              phoneNumberId = phonesData.data[0].id;
              phoneNumber = phonesData.data[0].display_phone_number;
              log("INFO", `[${requestId}] Phone number found`, { phoneNumberId, phoneNumber });
            }
          } else {
            log("WARN", `[${requestId}] Failed to fetch phone numbers`, { status: phonesResponse.status });
          }
        }
      } else {
        log("WARN", `[${requestId}] Failed to fetch WABA accounts`, { status: wabaResponse.status });
      }
    }

    // Update connection in database
    log("INFO", `[${requestId}] Updating connection in database`);
    const { error: updateError } = await supabase
      .from("whatsapp_connections")
      .update({
        status: phoneNumberId ? "connected" : "connecting",
        instance_name: phoneNumberId || wabaId || null,
        phone_number: phoneNumber,
        api_key: tokenData.access_token,
        updated_at: new Date().toISOString(),
      })
      .eq("id", connection_id);

    if (updateError) {
      log("ERROR", `[${requestId}] Database update failed`, { error: updateError.message });
      return Response.redirect(`${frontendUrl}/dashboard/whatsapp?error=db_update_failed`);
    }

    // Log the connection event
    await supabase.from("whatsapp_connection_logs").insert({
      connection_id: connection_id,
      event_type: "oauth_complete",
      event_data: { 
        wabaId, 
        phoneNumberId, 
        phoneNumber,
        hasToken: !!tokenData.access_token,
        timestamp: new Date().toISOString()
      },
    });

    // Redirect back to frontend
    const successParam = phoneNumberId ? "connected" : "pending_phone";
    log("INFO", `[${requestId}] OAuth flow completed`, { successParam, phoneNumberId, wabaId });

    return Response.redirect(`${frontendUrl}/dashboard/whatsapp?success=${successParam}`);

  } catch (error: any) {
    log("ERROR", `[${requestId}] Unhandled error`, { error: error.message, stack: error.stack });
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://app.lovable.dev";
    return Response.redirect(`${frontendUrl}/dashboard/whatsapp?error=oauth_failed`);
  }
});
