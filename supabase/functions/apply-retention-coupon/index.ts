import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[APPLY-RETENTION-COUPON] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      throw new Error("No Stripe customer found");
    }
    const customerId = customers.data[0].id;
    logStep("Found customer", { customerId });

    // Get active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      throw new Error("No active subscription found");
    }
    const subscription = subscriptions.data[0];
    logStep("Found subscription", { subscriptionId: subscription.id });

    // Create or get retention coupon (50% off for 2 months)
    let coupon;
    const couponId = "retention_50_off_2months";
    
    try {
      coupon = await stripe.coupons.retrieve(couponId);
      logStep("Existing coupon found", { couponId });
    } catch {
      // Coupon doesn't exist, create it
      coupon = await stripe.coupons.create({
        id: couponId,
        percent_off: 50,
        duration: "repeating",
        duration_in_months: 2,
        name: "Oferta de Retenção - 50% por 2 meses",
      });
      logStep("Created new coupon", { couponId: coupon.id });
    }

    // Apply coupon to subscription
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      coupon: coupon.id,
    });
    logStep("Coupon applied to subscription", { 
      subscriptionId: updatedSubscription.id,
      discount: updatedSubscription.discount 
    });

    // Send confirmation email
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (supabaseUrl && supabaseKey) {
        await fetch(`${supabaseUrl}/functions/v1/send-subscription-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            to: user.email,
            type: "subscription_created",
            planName: "Oferta Especial - 50% OFF",
            customerName: customers.data[0].name || user.email,
          }),
        });
        logStep("Confirmation email sent");
      }
    } catch (emailError) {
      logStep("Failed to send email", { error: String(emailError) });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Cupom de 50% aplicado com sucesso!",
        discount: {
          percent_off: 50,
          duration_months: 2,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
