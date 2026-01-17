import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const formSchema = z.object({
  nomeEmpresa: z.string().min(2, "Nome muito curto"),
  tipoNegocio: z.string().min(5, "Descreva melhor seu negócio"),
  produtoPrincipal: z.string().min(10, "Descreva melhor seu produto"),
  precos: z.string().min(5, "Informe ao menos um preço"),
  beneficios: z.string().min(20, "Liste ao menos 3 benefícios"),
  diferenciais: z.string().min(20, "Liste ao menos 2 diferenciais"),
  horarioSuporte: z.string().optional(),
  integracoes: z.string().optional(),
  casesSucesso: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface SetupIAFormProps {
  onSubmit: (dados: any) => Promise<void>;
  loading: boolean;
}

export default function SetupIAForm({ onSubmit, loading }: SetupIAFormProps) {
  const { workspace } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const handleFormSubmit = async (data: FormData) => {
    // Formata os dados para enviar ao n8n
    const payload = {
      workspace_id: workspace?.id,
      tenant_name: workspace?.name || "Cliente",
      informacoes: `
Nome da Empresa: ${data.nomeEmpresa}
Tipo de Negócio: ${data.tipoNegocio}
Produto Principal: ${data.produtoPrincipal}

Preços: ${data.precos}

Benefícios:
${data.beneficios}

Diferenciais:
${data.diferenciais}

${data.horarioSuporte ? `Horário de Suporte: ${data.horarioSuporte}` : ""}
${data.integracoes ? `Integrações: ${data.integracoes}` : ""}
${data.casesSucesso ? `Cases de Sucesso: ${data.casesSucesso}` : ""}
      `.trim(),
    };

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Nome da Empresa */}
      <div>
        <Label htmlFor="nomeEmpresa">Nome da Empresa *</Label>
        <Input
          id="nomeEmpresa"
          placeholder="Ex: Synapse Automações"
          {...register("nomeEmpresa")}
          disabled={loading}
        />
        {errors.nomeEmpresa && (
          <p className="text-sm text-red-500 mt-1">
            {errors.nomeEmpresa.message}
          </p>
        )}
      </div>

      {/* Tipo de Negócio */}
      <div>
        <Label htmlFor="tipoNegocio">Tipo de Negócio *</Label>
        <Input
          id="tipoNegocio"
          placeholder="Ex: SaaS de atendimento automatizado"
          {...register("tipoNegocio")}
          disabled={loading}
        />
        {errors.tipoNegocio && (
          <p className="text-sm text-red-500 mt-1">
            {errors.tipoNegocio.message}
          </p>
        )}
      </div>

      {/* Produto Principal */}
      <div>
        <Label htmlFor="produtoPrincipal">Produto/Serviço Principal *</Label>
        <Textarea
          id="produtoPrincipal"
          placeholder="Ex: Atendimento automatizado via WhatsApp com IA que aprende com cada interação"
          rows={3}
          {...register("produtoPrincipal")}
          disabled={loading}
        />
        {errors.produtoPrincipal && (
          <p className="text-sm text-red-500 mt-1">
            {errors.produtoPrincipal.message}
          </p>
        )}
      </div>

      {/* Preços */}
      <div>
        <Label htmlFor="precos">Preços *</Label>
        <Input
          id="precos"
          placeholder="Ex: A partir de R$ 299/mês, Plano Pro R$ 599/mês"
          {...register("precos")}
          disabled={loading}
        />
        {errors.precos && (
          <p className="text-sm text-red-500 mt-1">{errors.precos.message}</p>
        )}
      </div>

      {/* Benefícios */}
      <div>
        <Label htmlFor="beneficios">Benefícios (um por linha) *</Label>
        <Textarea
          id="beneficios"
          placeholder="Atendimento 24/7&#10;Reduz custos em até 70%&#10;Aumenta conversão em 300%&#10;IA que aprende sozinha"
          rows={5}
          {...register("beneficios")}
          disabled={loading}
        />
        {errors.beneficios && (
          <p className="text-sm text-red-500 mt-1">
            {errors.beneficios.message}
          </p>
        )}
      </div>

      {/* Diferenciais */}
      <div>
        <Label htmlFor="diferenciais">Diferenciais (um por linha) *</Label>
        <Textarea
          id="diferenciais"
          placeholder="Única IA que evolui com vendas reais&#10;Setup em menos de 24h&#10;Suporte especializado incluso"
          rows={4}
          {...register("diferenciais")}
          disabled={loading}
        />
        {errors.diferenciais && (
          <p className="text-sm text-red-500 mt-1">
            {errors.diferenciais.message}
          </p>
        )}
      </div>

      {/* Horário de Suporte (Opcional) */}
      <div>
        <Label htmlFor="horarioSuporte">Horário de Suporte (opcional)</Label>
        <Input
          id="horarioSuporte"
          placeholder="Ex: Segunda a sexta, 9h às 18h"
          {...register("horarioSuporte")}
          disabled={loading}
        />
      </div>

      {/* Integrações (Opcional) */}
      <div>
        <Label htmlFor="integracoes">Integrações (opcional)</Label>
        <Input
          id="integracoes"
          placeholder="Ex: WhatsApp, CRM, Google Sheets, Zapier"
          {...register("integracoes")}
          disabled={loading}
        />
      </div>

      {/* Cases de Sucesso (Opcional) */}
      <div>
        <Label htmlFor="casesSucesso">Cases de Sucesso (opcional)</Label>
        <Input
          id="casesSucesso"
          placeholder="Ex: Mais de 500 empresas atendidas, ROI médio de 400%"
          {...register("casesSucesso")}
          disabled={loading}
        />
      </div>

      {/* Botão Submit */}
      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Gerando 30 FAQs...
          </>
        ) : (
          "🚀 Gerar 30 FAQs Automaticamente"
        )}
      </Button>
    </form>
  );
}
