import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useCompanyProfile, CompanyProfile } from "@/hooks/useCompanyProfile";

const formSchema = z.object({
  nome_empresa: z.string().min(2, "Nome muito curto"),
  tipo_negocio: z.string().min(5, "Descreva melhor seu negócio"),
  produto_principal: z.string().min(10, "Descreva melhor seu produto"),
  precos: z.string().min(5, "Informe ao menos um preço"),
  beneficios: z.string().min(20, "Liste ao menos 3 benefícios"),
  diferenciais: z.string().min(20, "Liste ao menos 2 diferenciais"),
  horario_suporte: z.string().optional(),
  integracoes: z.string().optional(),
  cases_sucesso: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface SetupIAFormProps {
  onSuccess?: () => void;
}

export default function SetupIAForm({ onSuccess }: SetupIAFormProps) {
  const {
    profile,
    isLoading: profileLoading,
    saveProfile,
  } = useCompanyProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  // Load saved profile when available
  useEffect(() => {
    if (profile) {
      reset({
        nome_empresa: profile.nome_empresa || "",
        tipo_negocio: profile.tipo_negocio || "",
        produto_principal: profile.produto_principal || "",
        precos: profile.precos || "",
        beneficios: profile.beneficios || "",
        diferenciais: profile.diferenciais || "",
        horario_suporte: profile.horario_suporte || "",
        integracoes: profile.integracoes || "",
        cases_sucesso: profile.cases_sucesso || "",
      });
    }
  }, [profile, reset]);

  const handleFormSubmit = async (data: FormData) => {
    await saveProfile.mutateAsync(data);
    onSuccess?.();
  };

  const isLoading = profileLoading || saveProfile.isPending;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {profile && (
        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 mb-4">
          ✅ Perfil existente carregado. Edite e salve para atualizar as FAQs
          automaticamente.
        </div>
      )}

      <div>
        <Label htmlFor="nome_empresa">Nome da Empresa *</Label>
        <Input
          id="nome_empresa"
          placeholder="Ex: Synapse"
          {...register("nome_empresa")}
          disabled={isLoading}
        />
        {errors.nome_empresa && (
          <p className="text-sm text-red-500 mt-1">
            {errors.nome_empresa.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="tipo_negocio">Tipo de Negócio *</Label>
        <Input
          id="tipo_negocio"
          placeholder="Ex: Plataforma de inteligência comercial para WhatsApp"
          {...register("tipo_negocio")}
          disabled={isLoading}
        />
        {errors.tipo_negocio && (
          <p className="text-sm text-red-500 mt-1">
            {errors.tipo_negocio.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="produto_principal">Produto/Serviço Principal *</Label>
        <Textarea
          id="produto_principal"
          placeholder="Ex: Sistema de monitoramento e otimização de vendas via WhatsApp com IA"
          rows={3}
          {...register("produto_principal")}
          disabled={isLoading}
        />
        {errors.produto_principal && (
          <p className="text-sm text-red-500 mt-1">
            {errors.produto_principal.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="precos">Preços *</Label>
        <Textarea
          id="precos"
          placeholder="Básico: R$ 297/mês&#10;Profissional: R$ 497/mês&#10;Premium: R$ 899,90/mês"
          rows={3}
          {...register("precos")}
          disabled={isLoading}
        />
        {errors.precos && (
          <p className="text-sm text-red-500 mt-1">{errors.precos.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="beneficios">Benefícios (um por linha) *</Label>
        <Textarea
          id="beneficios"
          placeholder="Visibilidade completa das conversas&#10;IA que analisa qualidade das mensagens&#10;Qualificação automática de leads"
          rows={4}
          {...register("beneficios")}
          disabled={isLoading}
        />
        {errors.beneficios && (
          <p className="text-sm text-red-500 mt-1">
            {errors.beneficios.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="diferenciais">Diferenciais (um por linha) *</Label>
        <Textarea
          id="diferenciais"
          placeholder="Pixel de conversão para atribuição precisa&#10;IA como copiloto do vendedor&#10;Aprendizado contínuo (RAG)"
          rows={3}
          {...register("diferenciais")}
          disabled={isLoading}
        />
        {errors.diferenciais && (
          <p className="text-sm text-red-500 mt-1">
            {errors.diferenciais.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="horario_suporte">Horário de Suporte (opcional)</Label>
        <Input
          id="horario_suporte"
          placeholder="Ex: Segunda a sexta, 9h às 18h"
          {...register("horario_suporte")}
          disabled={isLoading}
        />
      </div>

      <div>
        <Label htmlFor="integracoes">Integrações (opcional)</Label>
        <Input
          id="integracoes"
          placeholder="Ex: WhatsApp, Evolution API, Meta Official API"
          {...register("integracoes")}
          disabled={isLoading}
        />
      </div>

      <div>
        <Label htmlFor="cases_sucesso">Cases de Sucesso (opcional)</Label>
        <Textarea
          id="cases_sucesso"
          placeholder="Potencial de aumento de conversão entre 20% e 35%, conforme benchmark de mercado"
          rows={2}
          {...register("cases_sucesso")}
          disabled={isLoading}
        />
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando e gerando FAQs...
          </>
        ) : profile ? (
          "💾 Atualizar Perfil e Regenerar FAQs"
        ) : (
          "🚀 Salvar Perfil e Gerar FAQs"
        )}
      </Button>
    </form>
  );
}
