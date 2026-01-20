import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface AITrainingStatus {
  id: string;
  workspace_id: string;
  status: "learning" | "ready" | "active" | "paused";
  started_at: string;
  ready_at: string | null;
  activated_at: string | null;
  activated_by: string | null;
  min_days_required: number;
  min_messages_required: number;
  messages_analyzed: number;
  faqs_detected: number;
  seller_patterns_learned: number;
  company_info_extracted: number;
  objections_learned: number;
  confidence_score: number | null;
  linked_whatsapp_id: string | null;
  created_at: string;
  updated_at: string;
}

interface TrainingProgress {
  days_elapsed: number;
  messages_progress: number;
  total_progress: number;
  is_ready: boolean;
}

// Unified interface for both old learned_content and new knowledge_base
interface LearnedContent {
  id: string;
  workspace_id: string;
  content_type:
    | "faq"
    | "seller_response"
    | "company_info"
    | "objection_handling"
    | "product_info";
  question: string | null;
  answer: string;
  context: string | null;
  occurrence_count: number;
  effectiveness_score: number | null;
  is_approved: boolean;
  tags: string[];
  keywords: string[];
  created_at: string;
}

export const useAITraining = () => {
  const { workspace } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const workspaceId = workspace?.id;

  // 1. Fetch training status (Legacy + Activation Status)
  const { data: trainingStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: ["ai-training-status", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null;

      const { data, error } = await supabase
        .from("ai_training_status")
        .select("*")
        .eq("workspace_id", workspaceId)
        .maybeSingle();

      if (error) throw error;
      return data as AITrainingStatus | null;
    },
    enabled: !!workspaceId,
  });

  // 2. Fetch REAL RAG COUNTS from knowledge_base
  const { data: ragStats } = useQuery({
    queryKey: ["rag-stats", workspaceId],
    queryFn: async () => {
      if (!workspaceId)
        return {
          faqs: 0,
          company_info: 0,
          products: 0,
          objections: 0,
          total: 0,
        };

      // Helper to count by category
      const countByCategory = async (category: string) => {
        const { count, error } = await supabase
          .from("knowledge_base")
          .select("*", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("category", category);
        return count || 0;
      };

      const { count: total, error } = await supabase
        .from("knowledge_base")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId);

      const [
        faqs,
        companyInfo,
        products,
        objections,
        precos,
        suporte,
        diferenciais,
        politicas,
      ] = await Promise.all([
        countByCategory("faq"),
        countByCategory("company_info"),
        countByCategory("produto"),
        countByCategory("objection"),
        countByCategory("preco"),
        countByCategory("suporte"),
        countByCategory("diferencial"),
        countByCategory("politica"),
      ]);

      // Aggregate for UI display
      return {
        faqs: faqs + precos + suporte + diferenciais + politicas, // All these are essentially FAQs
        company_info: companyInfo,
        products: products,
        objections: objections,
        total: total || 0,
      };
    },
    enabled: !!workspaceId,
    refetchInterval: 10000,
  });

  // 3. Fetch learned content (Merge knowledge_base with legacy learned_content)
  const { data: learnedContent, isLoading: isLoadingContent } = useQuery({
    queryKey: ["ai-learned-content-combined", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      // A. Fetch from knowledge_base (New RAG)
      const { data: kbData, error: kbError } = await supabase
        .from("knowledge_base")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (kbError) throw kbError;

      // Convert KB to LearnedContent format
      const kbMapped: LearnedContent[] = (kbData || []).map((item) => ({
        id: item.id,
        workspace_id: item.workspace_id,
        content_type: mapCategoryToType(item.category),
        question: item.title,
        answer: item.content,
        context: null,
        occurrence_count: 1,
        effectiveness_score: null,
        is_approved: true, // RAG items are auto-approved for now
        tags: item.tags || [],
        keywords: [],
        created_at: item.created_at,
      }));

      return kbMapped;
    },
    enabled: !!workspaceId,
  });

  // Helper to map RAG categories to UI types
  const mapCategoryToType = (
    category: string,
  ): LearnedContent["content_type"] => {
    if (
      [
        "faq",
        "preco",
        "suporte",
        "diferencial",
        "politica",
        "produto",
      ].includes(category)
    )
      return "faq";
    if (category === "objection") return "objection_handling";
    if (category === "company_info") return "company_info";
    return "faq";
  };

  // Start training (creates or updates initial status)
  const startTraining = useMutation({
    mutationFn: async (linkedWhatsappId: string) => {
      if (!workspaceId) throw new Error("No workspace");

      const { data, error } = await supabase
        .from("ai_training_status")
        .upsert(
          {
            workspace_id: workspaceId,
            linked_whatsapp_id: linkedWhatsappId,
            status: "learning",
          },
          { onConflict: "workspace_id" },
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ai-training-status", workspaceId],
      });
      toast({
        title: "Treinamento da IA iniciado!",
        description: "A IA começará a aprender com as conversas.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao iniciar treinamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Initialize status if missing
  const initializeStatus = useMutation({
    mutationFn: async () => {
      if (!workspaceId) return;

      console.log("Autocreating training status for workspace:", workspaceId);

      const { data, error } = await supabase
        .from("ai_training_status")
        .insert({
          workspace_id: workspaceId,
          status: "learning",
          messages_analyzed: 0,
          faqs_detected: 0,
          company_info_extracted: 0,
          seller_patterns_learned: 0,
          objections_learned: 0,
          confidence_score: 0,
          min_days_required: 7,
          min_messages_required: 100,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") return;
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ai-training-status", workspaceId],
      });
    },
  });

  useEffect(() => {
    if (workspaceId && !isLoadingStatus && !trainingStatus) {
      initializeStatus.mutate();
    }
  }, [workspaceId, isLoadingStatus, trainingStatus]);

  // Activate AI (admin approval)
  const activateAI = useMutation({
    mutationFn: async () => {
      if (!workspaceId) throw new Error("No workspace");
      let statusId = trainingStatus?.id;

      // ... (logic to find/create statusId omitted for brevity, keeping existing logic)
      if (!statusId) {
        const { data: existing } = await supabase
          .from("ai_training_status")
          .select("id")
          .eq("workspace_id", workspaceId)
          .limit(1)
          .maybeSingle();
        if (existing) statusId = existing.id;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      const { error } = await supabase
        .from("ai_training_status")
        .update({
          status: "active",
          activated_at: new Date().toISOString(),
          activated_by: profile?.id,
        })
        .eq("id", statusId!); // Bang operator assuming statusId exists by now

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ai-training-status", workspaceId],
      });
      toast({
        title: "IA ativada!",
        description: "A IA agora responderá automaticamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao ativar IA",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Pause/Resume AI
  const togglePause = useMutation({
    mutationFn: async () => {
      if (!trainingStatus) throw new Error("No training status");
      const newStatus =
        trainingStatus.status === "paused" ? "active" : "paused";

      const { error } = await supabase
        .from("ai_training_status")
        .update({ status: newStatus })
        .eq("id", trainingStatus.id);

      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      queryClient.invalidateQueries({
        queryKey: ["ai-training-status", workspaceId],
      });
      toast({ title: newStatus === "paused" ? "IA pausada" : "IA retomada" });
    },
  });

  // Approve content (Placeholder for RAG - maybe update metadata or do nothing since auto-approved)
  const approveContent = useMutation({
    mutationFn: async (contentId: string) => {
      // For RAG KB, approval is implicit or handled differently. Assuming legacy for now.
    },
    onSuccess: () => {
      toast({ title: "Conteúdo aprovado!" });
    },
  });

  // Delete content (Deletes from knowledge_base)
  const deleteContent = useMutation({
    mutationFn: async (contentId: string) => {
      const { error } = await supabase
        .from("knowledge_base")
        .delete()
        .eq("id", contentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ai-learned-content-combined", workspaceId],
      });
      queryClient.invalidateQueries({ queryKey: ["rag-stats", workspaceId] });
      toast({ title: "Conteúdo removido da base de conhecimento" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Content stats by type
  const contentStats =
    learnedContent?.reduce(
      (acc, item) => {
        acc[item.content_type] = (acc[item.content_type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ) || {};

  // Merge legacy status with real RAG stats for UI consumption
  const mergedStatus = trainingStatus
    ? {
        ...trainingStatus,
        faqs_detected: ragStats?.faqs || trainingStatus.faqs_detected,
        company_info_extracted:
          ragStats?.company_info || trainingStatus.company_info_extracted,
        objections_learned:
          ragStats?.objections || trainingStatus.objections_learned,
        // Add custom field if needed or hijack existing ones
      }
    : null;

  return {
    trainingStatus: mergedStatus, // Return merged status so UI updates automatically
    progress: {
      is_ready: (ragStats?.total || 0) > 0,
      total_progress: 100,
      days_elapsed: 0,
      messages_progress: 100,
    }, // Mock progress if RAG has content
    learnedContent,
    contentStats,
    isLoading: isLoadingStatus || isLoadingContent,
    startTraining,
    activateAI,
    togglePause,
    approveContent,
    deleteContent,
    isLearning: trainingStatus?.status === "learning",
    isReady: (ragStats?.total || 0) > 0, // Ready if we have content!
    isActive: trainingStatus?.status === "active",
    isPaused: trainingStatus?.status === "paused",
  };
};
