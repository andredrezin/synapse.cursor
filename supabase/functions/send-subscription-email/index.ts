import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-SUBSCRIPTION-EMAIL] ${step}${detailsStr}`);
};

interface EmailRequest {
  to: string;
  type: "subscription_created" | "subscription_canceled" | "payment_failed" | "payment_success";
  planName?: string;
  subscriptionEnd?: string;
  customerName?: string;
}

const getEmailContent = (type: EmailRequest["type"], planName?: string, subscriptionEnd?: string, customerName?: string) => {
  const name = customerName || "Cliente";
  
  switch (type) {
    case "subscription_created":
      return {
        subject: `🎉 Bem-vindo ao plano ${planName}!`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 40px; text-align: center; color: white;">
              <h1 style="margin: 0 0 10px 0; font-size: 28px;">🎉 Parabéns, ${name}!</h1>
              <p style="margin: 0; font-size: 18px; opacity: 0.9;">Sua assinatura foi ativada com sucesso</p>
            </div>
            
            <div style="background: #f8f9fa; border-radius: 12px; padding: 30px; margin-top: 20px;">
              <h2 style="margin: 0 0 20px 0; color: #333;">Detalhes da sua assinatura</h2>
              <div style="background: white; border-radius: 8px; padding: 20px; border: 1px solid #e9ecef;">
                <p style="margin: 0 0 10px 0;"><strong>Plano:</strong> ${planName}</p>
                <p style="margin: 0;"><strong>Status:</strong> <span style="color: #28a745;">Ativo</span></p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${Deno.env.get("SITE_URL") || "https://leadflux.lovable.app"}/dashboard" 
                 style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Acessar Dashboard
              </a>
            </div>
            
            <p style="color: #6c757d; font-size: 14px; text-align: center; margin-top: 30px;">
              Obrigado por escolher o LeadFlux! Estamos aqui para ajudar você a crescer.
            </p>
          </div>
        `,
      };
      
    case "subscription_canceled":
      return {
        subject: "😢 Sentiremos sua falta",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; border-radius: 12px; padding: 40px; text-align: center;">
              <h1 style="margin: 0 0 10px 0; font-size: 28px; color: #333;">😢 Sentiremos sua falta, ${name}</h1>
              <p style="margin: 0; font-size: 16px; color: #6c757d;">Sua assinatura foi cancelada</p>
            </div>
            
            <div style="background: #fff3cd; border-radius: 12px; padding: 20px; margin-top: 20px; border: 1px solid #ffc107;">
              <p style="margin: 0; color: #856404;">
                <strong>Atenção:</strong> Você ainda terá acesso ao seu plano até ${subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString("pt-BR") : "o final do período atual"}.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #6c757d; margin-bottom: 20px;">Mudou de ideia? Você pode reativar sua assinatura a qualquer momento.</p>
              <a href="${Deno.env.get("SITE_URL") || "https://leadflux.lovable.app"}/dashboard/pricing" 
                 style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Reativar Assinatura
              </a>
            </div>
          </div>
        `,
      };
      
    case "payment_failed":
      return {
        subject: "⚠️ Problema com seu pagamento",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8d7da; border-radius: 12px; padding: 40px; text-align: center; border: 1px solid #f5c6cb;">
              <h1 style="margin: 0 0 10px 0; font-size: 28px; color: #721c24;">⚠️ Atenção, ${name}</h1>
              <p style="margin: 0; font-size: 16px; color: #721c24;">Houve um problema com seu pagamento</p>
            </div>
            
            <div style="background: #f8f9fa; border-radius: 12px; padding: 30px; margin-top: 20px;">
              <p style="margin: 0 0 20px 0; color: #333;">
                Não conseguimos processar seu pagamento. Para evitar a interrupção do seu serviço, 
                por favor atualize suas informações de pagamento.
              </p>
              
              <div style="text-align: center;">
                <a href="${Deno.env.get("SITE_URL") || "https://leadflux.lovable.app"}/dashboard/pricing" 
                   style="display: inline-block; background: #dc3545; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Atualizar Pagamento
                </a>
              </div>
            </div>
          </div>
        `,
      };
      
    case "payment_success":
      return {
        subject: "✅ Pagamento confirmado",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #d4edda; border-radius: 12px; padding: 40px; text-align: center; border: 1px solid #c3e6cb;">
              <h1 style="margin: 0 0 10px 0; font-size: 28px; color: #155724;">✅ Pagamento confirmado!</h1>
              <p style="margin: 0; font-size: 16px; color: #155724;">Obrigado, ${name}</p>
            </div>
            
            <div style="background: #f8f9fa; border-radius: 12px; padding: 30px; margin-top: 20px; text-align: center;">
              <p style="margin: 0 0 20px 0; color: #333;">
                Seu pagamento foi processado com sucesso. Continue aproveitando todos os recursos do seu plano ${planName}.
              </p>
              
              <a href="${Deno.env.get("SITE_URL") || "https://leadflux.lovable.app"}/dashboard" 
                 style="display: inline-block; background: #28a745; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Acessar Dashboard
              </a>
            </div>
          </div>
        `,
      };
      
    default:
      return {
        subject: "Atualização da sua assinatura",
        html: `<p>Houve uma atualização na sua assinatura.</p>`,
      };
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    const { to, type, planName, subscriptionEnd, customerName }: EmailRequest = await req.json();
    
    if (!to || !type) {
      throw new Error("Missing required fields: to and type");
    }
    
    logStep("Preparing email", { to, type, planName });
    
    const { subject, html } = getEmailContent(type, planName, subscriptionEnd, customerName);
    
    const emailResponse = await resend.emails.send({
      from: "LeadFlux <noreply@resend.dev>",
      to: [to],
      subject,
      html,
    });

    logStep("Email sent successfully", { emailResponse });

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
