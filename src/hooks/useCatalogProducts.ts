import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// =====================================================
// TIPOS
// =====================================================

export interface ProductCategory {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  icon: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product_count?: number;
}

export interface CatalogProduct {
  id: string;
  workspace_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number | null;
  price_text: string | null;
  image_url: string | null;
  image_urls: string[];
  is_featured: boolean;
  is_available: boolean;
  sort_order: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Dados da categoria (quando joined)
  category?: ProductCategory;
}

interface CreateCategoryData {
  name: string;
  description?: string;
  icon?: string;
  sort_order?: number;
}

interface UpdateCategoryData {
  id: string;
  name?: string;
  description?: string;
  icon?: string;
  sort_order?: number;
  is_active?: boolean;
}

interface CreateProductData {
  name: string;
  category_id?: string;
  description?: string;
  price?: number;
  price_text?: string;
  image_url?: string;
  image_urls?: string[];
  is_featured?: boolean;
  metadata?: Record<string, unknown>;
}

interface UpdateProductData {
  id: string;
  name?: string;
  category_id?: string | null;
  description?: string;
  price?: number | null;
  price_text?: string;
  image_url?: string;
  image_urls?: string[];
  is_featured?: boolean;
  is_available?: boolean;
  sort_order?: number;
  metadata?: Record<string, unknown>;
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export const useCatalogProducts = () => {
  const { workspace } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const workspaceId = workspace?.id;

  // =====================================================
  // CATEGORIAS
  // =====================================================

  const {
    data: categories = [],
    isLoading: isLoadingCategories,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ["product-categories", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return data as ProductCategory[];
    },
    enabled: !!workspaceId,
  });

  const createCategory = useMutation({
    mutationFn: async (data: CreateCategoryData) => {
      if (!workspaceId) throw new Error("Workspace não encontrado");

      const { data: result, error } = await supabase
        .from("product_categories")
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
        queryKey: ["product-categories", workspaceId],
      });
      toast({ title: "Categoria criada com sucesso!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar categoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...data }: UpdateCategoryData) => {
      const { data: result, error } = await supabase
        .from("product_categories")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["product-categories", workspaceId],
      });
      toast({ title: "Categoria atualizada!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar categoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase
        .from("product_categories")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["product-categories", workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["catalog-products", workspaceId],
      });
      toast({ title: "Categoria excluída!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir categoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // =====================================================
  // PRODUTOS
  // =====================================================

  const {
    data: products = [],
    isLoading: isLoadingProducts,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ["catalog-products", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from("catalog_products")
        .select(
          `
          *,
          category:product_categories(*)
        `,
        )
        .eq("workspace_id", workspaceId)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return data as CatalogProduct[];
    },
    enabled: !!workspaceId,
  });

  const createProduct = useMutation({
    mutationFn: async (data: CreateProductData) => {
      if (!workspaceId) throw new Error("Workspace não encontrado");

      const { data: result, error } = await supabase
        .from("catalog_products")
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
        queryKey: ["catalog-products", workspaceId],
      });
      toast({ title: "Produto adicionado com sucesso!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar produto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...data }: UpdateProductData) => {
      const { data: result, error } = await supabase
        .from("catalog_products")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["catalog-products", workspaceId],
      });
      toast({ title: "Produto atualizado!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar produto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from("catalog_products")
        .delete()
        .eq("id", productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["catalog-products", workspaceId],
      });
      toast({ title: "Produto excluído!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir produto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // =====================================================
  // HELPERS
  // =====================================================

  const getProductsByCategory = (categoryId: string | null) => {
    if (categoryId === null) {
      return products.filter((p) => !p.category_id);
    }
    return products.filter((p) => p.category_id === categoryId);
  };

  const featuredProducts = products.filter(
    (p) => p.is_featured && p.is_available,
  );
  const availableProducts = products.filter((p) => p.is_available);
  const activeCategories = categories.filter((c) => c.is_active);

  // Stats
  const stats = {
    totalProducts: products.length,
    availableProducts: availableProducts.length,
    featuredProducts: featuredProducts.length,
    totalCategories: categories.length,
    activeCategories: activeCategories.length,
  };

  return {
    // Categorias
    categories,
    activeCategories,
    isLoadingCategories,
    refetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,

    // Produtos
    products,
    availableProducts,
    featuredProducts,
    isLoadingProducts,
    refetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,

    // Helpers
    getProductsByCategory,
    stats,

    // Loading geral
    isLoading: isLoadingCategories || isLoadingProducts,
  };
};
