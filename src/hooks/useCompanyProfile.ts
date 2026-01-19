import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface CompanyProfile {
  id?: string;
  workspace_id?: string;
  nome_empresa: string;
  tipo_negocio?: string;
  produto_principal?: string;
  precos?: string;
  beneficios?: string;
  diferenciais?: string;
  horario_suporte?: string;
  integracoes?: string;
  cases_sucesso?: string;
  rag_processed?: boolean;
  rag_processed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export const useCompanyProfile = () => {
  const { workspace } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const workspaceId = workspace?.id;

  // Fetch company profile
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["company-profile", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null;

      const { data, error } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("workspace_id", workspaceId)
        .maybeSingle();

      if (error) throw error;
      return data as CompanyProfile | null;
    },
    enabled: !!workspaceId,
  });

  // Create or update profile
  const saveProfile = useMutation({
    mutationFn: async (
      data: Omit<
        CompanyProfile,
        "id" | "workspace_id" | "created_at" | "updated_at"
      >,
    ) => {
      if (!workspaceId) throw new Error("No workspace");

      // Check if profile exists
      const { data: existing } = await supabase
        .from("company_profiles")
        .select("id")
        .eq("workspace_id", workspaceId)
        .maybeSingle();

      if (existing) {
        // Update
        const { data: result, error } = await supabase
          .from("company_profiles")
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return result;
      } else {
        // Create
        const { data: result, error } = await supabase
          .from("company_profiles")
          .insert({
            ...data,
            workspace_id: workspaceId,
          })
          .select()
          .single();

        if (error) throw error;
        return result;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["company-profile", workspaceId],
      });
      toast({
        title: "Perfil da empresa salvo! FAQs sendo gerados automaticamente...",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar perfil",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    profile,
    isLoading,
    error,
    saveProfile,
  };
};
