import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import SetupIAForm from "@/components/SetupIAForm";
import { gerarFAQsAutomatico } from "@/services/setupIA";

export default function SetupIA() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (dados: any) => {
    setLoading(true);
    try {
      const resultado = await gerarFAQsAutomatico(dados);

      toast({
        title: "✅ FAQs gerados com sucesso!",
        description: `${resultado.total_faqs} perguntas e respostas criadas para sua IA.`,
      });
    } catch (error: any) {
      toast({
        title: "❌ Erro ao gerar FAQs",
        description: error.message || "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🤖 Configurar IA</h1>
        <p className="text-muted-foreground">
          Preencha as informações sobre seu negócio e nossa IA gerará
          automaticamente 30 perguntas e respostas personalizadas.
        </p>
      </div>

      <Card className="p-6">
        <SetupIAForm onSubmit={handleSubmit} loading={loading} />
      </Card>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          💡 Como funciona?
        </h3>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>
            • Preencha os campos com informações sobre seu produto/serviço
          </li>
          <li>
            • Nossa IA (GPT-4) gerará 30 perguntas e respostas automaticamente
          </li>
          <li>
            • As FAQs serão salvas e sua IA já poderá usá-las nas conversas
          </li>
          <li>• Tempo estimado: 30-60 segundos</li>
        </ul>
      </div>
    </div>
  );
}
