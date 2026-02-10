import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// =====================================================
// Meta WhatsApp Cloud API Hook
// Gerencia envio de mensagens via Graph API
// =====================================================

interface MetaConnection {
  id: string;
  phone_number_id: string;
  meta_access_token: string;
  waba_id: string;
  meta_app_id: string;
  workspace_id: string;
}

interface SendTextParams {
  to: string;
  text: string;
  connectionId: string;
}

interface SendImageParams {
  to: string;
  imageUrl: string;
  caption?: string;
  connectionId: string;
}

interface CarouselCard {
  header: { type: "image"; link: string };
  body: { text: string };
  buttons: Array<{
    type: "quick_reply" | "url";
    title: string;
    id?: string;
    url?: string;
  }>;
}

interface SendCarouselParams {
  to: string;
  bodyText: string;
  cards: CarouselCard[];
  connectionId: string;
}

interface SendListParams {
  to: string;
  bodyText: string;
  buttonText: string;
  sections: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>;
  connectionId: string;
}

const META_API_VERSION = "v21.0";
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

async function getMetaConnection(
  connectionId: string,
): Promise<MetaConnection> {
  const { data, error } = await supabase
    .from("whatsapp_connections")
    .select(
      "id, phone_number_id, meta_access_token, waba_id, meta_app_id, workspace_id",
    )
    .eq("id", connectionId)
    .eq("provider", "official")
    .single();

  if (error || !data) throw new Error("Meta connection not found");
  if (!data.phone_number_id || !data.meta_access_token) {
    throw new Error(
      "Meta credentials not configured. Complete the setup first.",
    );
  }

  return data as MetaConnection;
}

async function metaApiRequest(
  phoneNumberId: string,
  accessToken: string,
  body: Record<string, unknown>,
) {
  const response = await fetch(`${META_BASE_URL}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      ...body,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Meta API Error: ${response.status} - ${errorData?.error?.message || "Unknown error"}`,
    );
  }

  return response.json();
}

export function useMetaWhatsApp() {
  const { workspace } = useAuth();
  const { toast } = useToast();

  // Buscar conexão Meta ativa do workspace
  const metaConnection = useQuery({
    queryKey: ["meta-connection", workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return null;
      const { data } = await supabase
        .from("whatsapp_connections")
        .select("*")
        .eq("workspace_id", workspace.id)
        .eq("provider", "official")
        .eq("status", "connected")
        .maybeSingle();
      return data;
    },
    enabled: !!workspace?.id,
  });

  // Enviar texto simples
  const sendText = useMutation({
    mutationFn: async ({ to, text, connectionId }: SendTextParams) => {
      const conn = await getMetaConnection(connectionId);
      return metaApiRequest(conn.phone_number_id, conn.meta_access_token, {
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: true, body: text },
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Enviar imagem
  const sendImage = useMutation({
    mutationFn: async ({
      to,
      imageUrl,
      caption,
      connectionId,
    }: SendImageParams) => {
      const conn = await getMetaConnection(connectionId);
      return metaApiRequest(conn.phone_number_id, conn.meta_access_token, {
        recipient_type: "individual",
        to,
        type: "image",
        image: { link: imageUrl, caption: caption || "" },
      });
    },
  });

  // Enviar lista interativa
  const sendList = useMutation({
    mutationFn: async ({
      to,
      bodyText,
      buttonText,
      sections,
      connectionId,
    }: SendListParams) => {
      const conn = await getMetaConnection(connectionId);
      return metaApiRequest(conn.phone_number_id, conn.meta_access_token, {
        recipient_type: "individual",
        to,
        type: "interactive",
        interactive: {
          type: "list",
          body: { text: bodyText },
          action: { button: buttonText, sections },
        },
      });
    },
  });

  // Enviar carrossel (interactive carousel)
  const sendCarousel = useMutation({
    mutationFn: async ({
      to,
      bodyText,
      cards,
      connectionId,
    }: SendCarouselParams) => {
      const conn = await getMetaConnection(connectionId);

      // Formatar cards para o formato Meta API
      const formattedCards = cards.map((card, index) => ({
        card_index: index,
        components: [
          {
            type: "header",
            parameters: [{ type: "image", image: { link: card.header.link } }],
          },
          {
            type: "body",
            parameters: [{ type: "text", text: card.body.text }],
          },
          ...card.buttons.map((btn, btnIndex) => ({
            type: "button",
            sub_type: btn.type === "url" ? "url" : "quick_reply",
            index: btnIndex,
            parameters:
              btn.type === "url"
                ? [{ type: "text", text: btn.url }]
                : [
                    {
                      type: "payload",
                      payload: btn.id || `btn_${index}_${btnIndex}`,
                    },
                  ],
          })),
        ],
      }));

      return metaApiRequest(conn.phone_number_id, conn.meta_access_token, {
        recipient_type: "individual",
        to,
        type: "interactive",
        interactive: {
          type: "carousel",
          body: { text: bodyText },
          action: { cards: formattedCards },
        },
      });
    },
  });

  // Marcar mensagem como lida
  const markAsRead = useMutation({
    mutationFn: async ({
      messageId,
      connectionId,
    }: {
      messageId: string;
      connectionId: string;
    }) => {
      const conn = await getMetaConnection(connectionId);
      return metaApiRequest(conn.phone_number_id, conn.meta_access_token, {
        status: "read",
        message_id: messageId,
      });
    },
  });

  return {
    metaConnection: metaConnection.data,
    isMetaConnected: !!metaConnection.data,
    isLoading: metaConnection.isLoading,
    sendText,
    sendImage,
    sendList,
    sendCarousel,
    markAsRead,
  };
}
