import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");
    
    const { priceId, couponCode } = await req.json();
    if (!priceId) throw new Error("Price ID is required");
    logStep("Price ID received", { priceId, couponCode });

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { email: user.email });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    const origin = req.headers.get("origin") || "https://your-domain.com";

    // Build checkout session options
    const sessionOptions: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/dashboard/checkout-success`,
      cancel_url: `${origin}/dashboard/pricing?canceled=true`,
      metadata: {
        user_id: user.id,
      },
      allow_promotion_codes: true,
    };

    // If a coupon code is provided, validate and apply it
    if (couponCode) {
      try {
        // Try to find the coupon in Stripe
        const coupons = await stripe.coupons.list({ limit: 100 });
        const matchingCoupon = coupons.data.find(
          (c: { name?: string | null; id: string }) => 
            c.name?.toLowerCase() === couponCode.toLowerCase() || 
            c.id.toLowerCase() === couponCode.toLowerCase()
        );
        
        if (matchingCoupon) {
          sessionOptions.discounts = [{ coupon: matchingCoupon.id }];
          logStep("Coupon applied", { couponId: matchingCoupon.id, couponName: matchingCoupon.name });
        } else {
          // Try as promotion code
          const promotionCodes = await stripe.promotionCodes.list({ code: couponCode, limit: 1 });
          if (promotionCodes.data.length > 0) {
            sessionOptions.discounts = [{ promotion_code: promotionCodes.data[0].id }];
            logStep("Promotion code applied", { promoId: promotionCodes.data[0].id });
          } else {
            logStep("Coupon/promotion code not found", { couponCode });
          }
        }
      } catch (couponError) {
        logStep("Error applying coupon", { error: String(couponError) });
        // Continue without coupon if there's an error
      }
    }

    const session = await stripe.checkout.sessions.create(sessionOptions);

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
