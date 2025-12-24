import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface KnowledgeCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number | null;
  workspace_id: string;
  created_at: string;
  updated_at: string;
}

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  entry_type: string;
  category_id: string | null;
  category?: KnowledgeCategory;
  keywords: string[] | null;
  tags: string[] | null;
  is_ai_accessible: boolean;
  is_public: boolean;
  sensitivity_level: string;
  usage_count: number | null;
  workspace_id: string;
  created_at: string;
  updated_at: string;
}

interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

interface CreateEntryData {
  title: string;
  content: string;
  summary?: string;
  entry_type?: string;
  category_id?: string;
  keywords?: string[];
  tags?: string[];
  is_ai_accessible?: boolean;
  is_public?: boolean;
  sensitivity_level?: string;
}

export const useKnowledge = () => {
  const { workspace } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const workspaceId = workspace?.id;

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['knowledge-categories', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      
      const { data, error } = await supabase
        .from('knowledge_categories')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as KnowledgeCategory[];
    },
    enabled: !!workspaceId,
  });

  // Fetch entries
  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ['knowledge-entries', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      
      const { data, error } = await supabase
        .from('knowledge_entries')
        .select(`
          *,
          category:knowledge_categories(*)
        `)
        .eq('workspace_id', workspaceId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as KnowledgeEntry[];
    },
    enabled: !!workspaceId,
  });

  // Create category
  const createCategory = useMutation({
    mutationFn: async (data: CreateCategoryData) => {
      if (!workspaceId) throw new Error('No workspace');
      
      const { data: result, error } = await supabase
        .from('knowledge_categories')
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
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories', workspaceId] });
      toast({ title: 'Categoria criada com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar categoria', description: error.message, variant: 'destructive' });
    },
  });

  // Delete category
  const deleteCategory = useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase
        .from('knowledge_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories', workspaceId] });
      toast({ title: 'Categoria excluída!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir categoria', description: error.message, variant: 'destructive' });
    },
  });

  // Create entry
  const createEntry = useMutation({
    mutationFn: async (data: CreateEntryData) => {
      if (!workspaceId) throw new Error('No workspace');
      
      const { data: result, error } = await supabase
        .from('knowledge_entries')
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
      queryClient.invalidateQueries({ queryKey: ['knowledge-entries', workspaceId] });
      toast({ title: 'Conhecimento adicionado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao adicionar conhecimento', description: error.message, variant: 'destructive' });
    },
  });

  // Update entry
  const updateEntry = useMutation({
    mutationFn: async ({ id, ...data }: Partial<CreateEntryData> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('knowledge_entries')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-entries', workspaceId] });
      toast({ title: 'Conhecimento atualizado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    },
  });

  // Delete entry
  const deleteEntry = useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase
        .from('knowledge_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-entries', workspaceId] });
      toast({ title: 'Conhecimento excluído!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    },
  });

  return {
    categories,
    entries,
    isLoading: categoriesLoading || entriesLoading,
    createCategory,
    deleteCategory,
    createEntry,
    updateEntry,
    deleteEntry,
  };
};
