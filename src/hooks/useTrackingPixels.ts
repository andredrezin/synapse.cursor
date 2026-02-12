import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type TrackingPixel = Database["public"]["Tables"]["tracking_pixels"]["Row"];
type TrackingPixelInsert =
  Database["public"]["Tables"]["tracking_pixels"]["Insert"];

export const useTrackingPixels = () => {
  const { workspace } = useAuth();
  const { toast } = useToast();
  const [pixels, setPixels] = useState<TrackingPixel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPixels = async () => {
    if (!workspace?.id) return;

    setIsLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("tracking_pixels")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching pixels:", fetchError);
      setError(fetchError.message);
    } else {
      setPixels(data || []);
    }

    setIsLoading(false);
  };

  const createPixel = async (name: string, domain?: string) => {
    if (!workspace?.id) {
      return { error: new Error("No workspace selected") };
    }

    const { data, error } = await supabase
      .from("tracking_pixels")
      .insert({
        workspace_id: workspace.id,
        name,
        domain,
      })
      .select()
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar pixel",
        description: error.message,
      });
      return { error };
    }

    toast({
      title: "Pixel criado!",
      description: `O pixel "${name}" foi criado com sucesso.`,
    });

    await fetchPixels();
    return { data, error: null };
  };

  const updatePixel = async (id: string, updates: Partial<TrackingPixel>) => {
    const { data, error } = await supabase
      .from("tracking_pixels")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar pixel",
        description: error.message,
      });
      return { error };
    }

    toast({
      title: "Pixel atualizado!",
    });

    await fetchPixels();
    return { data, error: null };
  };

  const deletePixel = async (id: string) => {
    const { error } = await supabase
      .from("tracking_pixels")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao deletar pixel",
        description: error.message,
      });
      return { error };
    }

    toast({
      title: "Pixel removido!",
    });

    await fetchPixels();
    return { error: null };
  };

  const togglePixelActive = async (id: string, isActive: boolean) => {
    return updatePixel(id, { is_active: isActive });
  };

  const generatePixelCode = (pixelId: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `<!-- Synapse Pixel -->
<script>
  (function(w,d,s,p){
    w['SynapsePixel']=p;
    w[p]=w[p]||function(){(w[p].q=w[p].q||[]).push(arguments)};
    var f=d.getElementsByTagName(s)[0],j=d.createElement(s);
    j.async=true;j.src='${supabaseUrl}/functions/v1/track-pixel?pid=${pixelId}';
    f.parentNode.insertBefore(j,f);
  })(window,document,'script','wm');
  
  wm('track', 'PageView');
</script>
<!-- End Synapse Pixel -->`;
  };

  useEffect(() => {
    if (!workspace?.id) return;
    fetchPixels();
  }, [workspace?.id, fetchPixels]);

  return {
    pixels,
    isLoading,
    error,
    fetchPixels,
    createPixel,
    updatePixel,
    deletePixel,
    togglePixelActive,
    generatePixelCode,
  };
};
