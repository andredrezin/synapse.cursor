import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Plan mapping
const PLANS: Record<string, { name: string; slug: string }> = {
  "prod_Tf0tjelJXAdXQq": { name: "Básico", slug: "basic" },
  "prod_Tf0t19oIyWqfYw": { name: "Profissional", slug: "professional" },
  "prod_Tf0tDmMTZeQN1O": { name: "Premium", slug: "premium" },
};

// Helper to send email notification
const sendEmailNotification = async (
  to: string,
  type: "subscription_created" | "subscription_canceled" | "payment_failed" | "payment_success",
  planName?: string,
  subscriptionEnd?: string,
  customerName?: string
) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      logStep("Missing Supabase credentials for email", { supabaseUrl: !!supabaseUrl });
      return;
    }
    
    const response = await fetch(`${supabaseUrl}/functions/v1/send-subscription-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ to, type, planName, subscriptionEnd, customerName }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logStep("Email send failed", { status: response.status, error: errorText });
    } else {
      logStep("Email notification sent", { type, to });
    }
  } catch (error) {
    logStep("Error sending email", { error: String(error) });
  }
};

// Helper to sync subscription with database
const syncSubscriptionToDatabase = async (
  supabaseUrl: string,
  supabaseKey: string,
  customerEmail: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  productId: string,
  status: string,
  currentPeriodStart: number,
  currentPeriodEnd: number,
  cancelAtPeriodEnd: boolean
) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    
    // Get user by email
    const { data: userData } = await supabase.auth.admin.listUsers();
    const user = userData?.users?.find((u: { email?: string }) => u.email === customerEmail);
    
    if (!user) {
      logStep("User not found for email", { email: customerEmail });
      return;
    }

    // Get user's profile to find their workspace
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_workspace_id')
      .eq('user_id', user.id)
      .single();

    let workspaceId = profile?.current_workspace_id;

    if (!workspaceId) {
      // Try to find workspace where user is owner
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
        .single();

      if (!workspace) {
        logStep("No workspace found for user", { userId: user.id });
        return;
      }

      workspaceId = workspace.id;
    }

    // Get or create subscription plan reference
    const planInfo = PLANS[productId];
    const { data: planData } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('slug', planInfo?.slug || 'basic')
      .single();

    if (!planData) {
      logStep("Plan not found in database", { productId, slug: planInfo?.slug });
      return;
    }

    // Check if subscription already exists
    const { data: existingSub } = await supabase
      .from('workspace_subscriptions')
      .select('id')
      .eq('workspace_id', workspaceId)
      .single();

    const subscriptionData = {
      workspace_id: workspaceId,
      plan_id: planData.id,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      status: status === 'active' ? 'active' : status,
      current_period_start: new Date(currentPeriodStart * 1000).toISOString(),
      current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
      cancel_at_period_end: cancelAtPeriodEnd,
    };

    if (existingSub) {
      // Update existing subscription
      const { error } = await supabase
        .from('workspace_subscriptions')
        .update(subscriptionData)
        .eq('id', existingSub.id);

      if (error) {
        logStep("Error updating subscription", { error: error.message });
      } else {
        logStep("Subscription updated in database", { workspaceId, status });
      }
    } else {
      // Create new subscription
      const { error } = await supabase
        .from('workspace_subscriptions')
        .insert(subscriptionData);

      if (error) {
        logStep("Error creating subscription", { error: error.message });
      } else {
        logStep("Subscription created in database", { workspaceId, status });
      }
    }
  } catch (error) {
    logStep("Error syncing subscription to database", { error: String(error) });
  }
};

// Helper to delete subscription from database
const deleteSubscriptionFromDatabase = async (
  supabaseUrl: string,
  supabaseKey: string,
  stripeSubscriptionId: string
) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    
    const { error } = await supabase
      .from('workspace_subscriptions')
      .update({ status: 'canceled' })
      .eq('stripe_subscription_id', stripeSubscriptionId);

    if (error) {
      logStep("Error updating subscription status to canceled", { error: error.message });
    } else {
      logStep("Subscription marked as canceled in database", { stripeSubscriptionId });
    }
  } catch (error) {
    logStep("Error deleting subscription from database", { error: String(error) });
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    let event: Stripe.Event;

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        logStep("Webhook signature verified");
      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : String(err);
        logStep("Webhook signature verification failed", { error: errMessage });
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // Parse event without verification (for development)
      event = JSON.parse(body);
      logStep("Webhook received without signature verification");
    }

    logStep("Processing event", { type: event.type, id: event.id });

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout session completed", {
          sessionId: session.id,
          customerId: session.customer,
          customerEmail: session.customer_email,
          subscriptionId: session.subscription,
          mode: session.mode,
        });
        
        // Get subscription details and sync to database
        if (session.mode === "subscription" && session.subscription && session.customer_email) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const productId = subscription.items.data[0]?.price?.product as string;
          const planInfo = PLANS[productId];
          
          // Sync to database
          await syncSubscriptionToDatabase(
            supabaseUrl,
            supabaseKey,
            session.customer_email,
            session.customer as string,
            session.subscription as string,
            productId,
            subscription.status,
            subscription.current_period_start,
            subscription.current_period_end,
            subscription.cancel_at_period_end
          );
          
          // Send email
          await sendEmailNotification(
            session.customer_email,
            "subscription_created",
            planInfo?.name || "Premium",
            undefined,
            session.customer_details?.name || undefined
          );
        }
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription created", {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
          productId: subscription.items.data[0]?.price?.product,
        });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const productId = subscription.items.data[0]?.price?.product as string;
        
        logStep("Subscription updated", {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          productId,
        });
        
        // Get customer email and sync
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if (customer && !customer.deleted && customer.email) {
          // Sync updated subscription to database
          await syncSubscriptionToDatabase(
            supabaseUrl,
            supabaseKey,
            customer.email,
            subscription.customer as string,
            subscription.id,
            productId,
            subscription.status,
            subscription.current_period_start,
            subscription.current_period_end,
            subscription.cancel_at_period_end
          );
          
          // Check if subscription was set to cancel at period end
          if (subscription.cancel_at_period_end) {
            const planInfo = PLANS[productId];
            const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
            
            await sendEmailNotification(
              customer.email,
              "subscription_canceled",
              planInfo?.name || "Premium",
              subscriptionEnd,
              customer.name || undefined
            );
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted/canceled", {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
        });
        
        // Mark subscription as canceled in database
        await deleteSubscriptionFromDatabase(supabaseUrl, supabaseKey, subscription.id);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Invoice paid", {
          invoiceId: invoice.id,
          customerId: invoice.customer,
          subscriptionId: invoice.subscription,
          amountPaid: invoice.amount_paid,
          currency: invoice.currency,
        });
        
        // Send payment success email (skip first invoice as checkout.session.completed handles it)
        if (invoice.billing_reason === "subscription_cycle" && invoice.customer_email) {
          const productId = invoice.lines.data[0]?.price?.product as string;
          const planInfo = PLANS[productId];
          
          await sendEmailNotification(
            invoice.customer_email,
            "payment_success",
            planInfo?.name || "Premium",
            undefined,
            invoice.customer_name || undefined
          );
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Invoice payment failed", {
          invoiceId: invoice.id,
          customerId: invoice.customer,
          subscriptionId: invoice.subscription,
          attemptCount: invoice.attempt_count,
        });
        
        // Send payment failed email
        if (invoice.customer_email) {
          await sendEmailNotification(
            invoice.customer_email,
            "payment_failed",
            undefined,
            undefined,
            invoice.customer_name || undefined
          );
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});