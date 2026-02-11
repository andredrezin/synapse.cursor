import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface WorkspaceAsset {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateAssetData {
  title: string;
  description?: string;
  file_url: string;
  file_type?: string;
}

interface UpdateAssetData {
  id: string;
  title?: string;
  description?: string;
  file_url?: string;
  file_type?: string;
}

export const useWorkspaceAssets = () => {
  const { workspace } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const workspaceId = workspace?.id;

  // Fetch assets
  const {
    data: assets = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["workspace-assets", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from("workspace_assets")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as WorkspaceAsset[];
    },
    enabled: !!workspaceId,
  });

  // Create asset
  const createAsset = useMutation({
    mutationFn: async (data: CreateAssetData) => {
      if (!workspaceId) throw new Error("Workspace não encontrado");

      const { data: result, error } = await supabase
        .from("workspace_assets")
        .insert({
          ...data,
          workspace_id: workspaceId,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-assets", workspaceId],
      });
      toast({ title: "Ativo adicionado com sucesso!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar ativo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update asset
  const updateAsset = useMutation({
    mutationFn: async ({ id, ...data }: UpdateAssetData) => {
      const { data: result, error } = await supabase
        .from("workspace_assets")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-assets", workspaceId],
      });
      toast({ title: "Ativo atualizado!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar ativo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete asset
  const deleteAsset = useMutation({
    mutationFn: async (assetId: string) => {
      const { error } = await supabase
        .from("workspace_assets")
        .delete()
        .eq("id", assetId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-assets", workspaceId],
      });
      toast({ title: "Ativo excluído!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir ativo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get assets by type
  const getAssetsByType = (type: string) => {
    return assets.filter((asset) => asset.file_type === type);
  };

  // Get image assets only
  const imageAssets = assets.filter((asset) => asset.file_type === "image");

  // Get document assets only
  const documentAssets = assets.filter(
    (asset) => asset.file_type === "pdf" || asset.file_type === "document",
  );

  return {
    assets,
    imageAssets,
    documentAssets,
    isLoading,
    error,
    refetch,
    createAsset,
    updateAsset,
    deleteAsset,
    getAssetsByType,
  };
};
