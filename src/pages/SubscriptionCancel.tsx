import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertTriangle, ArrowLeft, Gift, Heart, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSubscriptionContext } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CANCELLATION_REASONS = [
  { id: "too_expensive", label: "O preço está muito alto para mim" },
  { id: "not_using", label: "Não estou usando o suficiente" },
  { id: "missing_features", label: "Faltam recursos que eu preciso" },
  { id: "found_alternative", label: "Encontrei uma alternativa melhor" },
  { id: "temporary", label: "Preciso pausar temporariamente" },
  { id: "technical_issues", label: "Problemas técnicos frequentes" },
  { id: "other", label: "Outro motivo" },
];

const SubscriptionCancel = () => {
  const navigate = useNavigate();
  const { plan, subscriptionEnd, checkSubscription } = useSubscriptionContext();
  const { user, profile } = useAuth();
  const [selectedReason, setSelectedReason] = useState("");
  const [additionalFeedback, setAdditionalFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showOfferDialog, setShowOfferDialog] = useState(false);

  // Helper function to save feedback to database
  const saveFeedbackToDatabase = async (acceptedOffer: boolean = false) => {
    if (!user) return;
    
    try {
      const { error } = await supabase.from("cancellation_feedback").insert({
        user_id: user.id,
        workspace_id: profile?.current_workspace_id || null,
        reason: selectedReason,
        additional_feedback: additionalFeedback || null,
        plan: plan || null,
        accepted_offer: acceptedOffer,
      });
      
      if (error) {
        console.error("Error saving feedback:", error);
      } else {
        console.log("Feedback saved successfully");
      }
    } catch (error) {
      console.error("Error saving feedback:", error);
    }
  };

  const handleContinueToCancel = () => {
    if (!selectedReason) {
      toast.error("Por favor, selecione um motivo para o cancelamento");
      return;
    }
    
    // Show special offer for price-related cancellations
    if (selectedReason === "too_expensive" || selectedReason === "temporary") {
      setShowOfferDialog(true);
    } else {
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmCancel = async () => {
    setIsLoading(true);
    try {
      // Save feedback to database
      await saveFeedbackToDatabase(false);

      // Open customer portal for cancellation
      const { data, error } = await supabase.functions.invoke("customer-portal");
      
      if (error) throw error;
      
      if (data?.url) {
        toast.info("Redirecionando para o portal de gerenciamento...");
        window.open(data.url, "_blank");
      }
      
      setShowConfirmDialog(false);
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast.error("Erro ao processar cancelamento. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptOffer = async () => {
    setIsLoading(true);
    try {
      // Save feedback with accepted_offer = true
      await saveFeedbackToDatabase(true);
      
      // Apply retention coupon via Stripe
      const { data, error } = await supabase.functions.invoke("apply-retention-coupon");
      
      if (error) {
        console.error("Error applying coupon:", error);
        toast.error("Erro ao aplicar desconto. Entre em contato conosco.");
      } else {
        toast.success("🎉 Cupom de 50% aplicado! Você receberá o desconto nos próximos 2 meses.");
      }
      
      setShowOfferDialog(false);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error in accept offer:", error);
      toast.error("Ocorreu um erro. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclineOffer = () => {
    setShowOfferDialog(false);
    setShowConfirmDialog(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-12">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Card className="border-destructive/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Cancelar Assinatura</CardTitle>
            <CardDescription className="text-base">
              Sentiremos sua falta! Antes de ir, nos ajude a melhorar compartilhando seu feedback.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Current Plan Info */}
            {plan && (
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">Plano atual</p>
                <p className="font-semibold capitalize">{plan}</p>
                {subscriptionEnd && (
                  <p className="text-sm text-muted-foreground">
                    Válido até: {new Date(subscriptionEnd).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
            )}

            {/* Cancellation Reasons */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Por que você está cancelando?
              </Label>
              <RadioGroup
                value={selectedReason}
                onValueChange={setSelectedReason}
                className="space-y-2"
              >
                {CANCELLATION_REASONS.map((reason) => (
                  <div
                    key={reason.id}
                    className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <RadioGroupItem value={reason.id} id={reason.id} />
                    <Label htmlFor={reason.id} className="flex-1 cursor-pointer">
                      {reason.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Additional Feedback */}
            <div className="space-y-2">
              <Label htmlFor="feedback" className="text-base font-medium">
                <MessageSquare className="mr-2 inline h-4 w-4" />
                Comentários adicionais (opcional)
              </Label>
              <Textarea
                id="feedback"
                placeholder="Conte-nos mais sobre sua experiência ou o que poderíamos melhorar..."
                value={additionalFeedback}
                onChange={(e) => setAdditionalFeedback(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              <Button
                variant="destructive"
                onClick={handleContinueToCancel}
                disabled={isLoading}
              >
                Continuar com cancelamento
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
              >
                <Heart className="mr-2 h-4 w-4" />
                Mudei de ideia, quero ficar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar cancelamento</AlertDialogTitle>
              <AlertDialogDescription>
                Você será redirecionado ao portal de gerenciamento do Stripe para confirmar o cancelamento. 
                Sua assinatura permanecerá ativa até o final do período atual.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmCancel}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isLoading}
              >
                {isLoading ? "Processando..." : "Confirmar cancelamento"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Special Offer Dialog */}
        <AlertDialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Gift className="h-6 w-6 text-primary" />
              </div>
              <AlertDialogTitle className="text-center">
                Espere! Temos uma oferta especial para você
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                Que tal 50% de desconto nos próximos 2 meses? 
                Queremos que você continue aproveitando todos os recursos premium.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
              <Button onClick={handleAcceptOffer} className="w-full">
                Aceitar oferta e continuar
              </Button>
              <Button
                variant="ghost"
                onClick={handleDeclineOffer}
                className="w-full text-muted-foreground"
              >
                Não, quero cancelar mesmo assim
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default SubscriptionCancel;
