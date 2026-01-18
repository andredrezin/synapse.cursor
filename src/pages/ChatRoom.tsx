import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Send,
  Phone,
  User,
  Bot,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  CheckCheck,
  Loader2,
  Lightbulb,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSendWhatsAppMessage } from "@/hooks/useSendWhatsAppMessage";
import { useAISuggestions } from "@/hooks/useAISuggestions";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { sanitizeTextContent } from "@/lib/security";
import { logError } from "@/lib/logger";

interface Message {
  id: string;
  content: string;
  sender_type: string;
  created_at: string;
  is_read: boolean | null;
}

interface Conversation {
  id: string;
  status: string;
  sentiment: string | null;
  lead: {
    id: string;
    name: string;
    phone: string;
    temperature: string;
    score: number;
  };
}

const getSentimentIcon = (sentiment: string | null) => {
  switch (sentiment) {
    case "positive":
      return <TrendingUp className="w-4 h-4 text-chart-green" />;
    case "negative":
      return <TrendingDown className="w-4 h-4 text-chart-red" />;
    default:
      return <Minus className="w-4 h-4 text-muted-foreground" />;
  }
};

const ChatRoom = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { workspace } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");

  const sendMessageMutation = useSendWhatsAppMessage();
  const {
    suggestions,
    isLoading: suggestionsLoading,
    fetchSuggestions,
    clearSuggestions,
  } = useAISuggestions({
    conversationId: conversationId || "",
    leadId: conversation?.lead?.id || "",
  });

  // Fetch conversation and messages
  useEffect(() => {
    if (!conversationId || !workspace?.id) return;

    const fetchData = async () => {
      setIsLoading(true);

      // Fetch conversation with lead
      const { data: convData } = await supabase
        .from("conversations")
        .select(
          `
          id, status, sentiment,
          lead:leads(id, name, phone, temperature, score)
        `
        )
        .eq("id", conversationId)
        .single();

      if (convData) {
        setConversation(convData as unknown as Conversation);
      }

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (messagesError) {
        logError("Error fetching messages", messagesError, "ChatRoom");
      }

      if (messagesData) {
        setMessages(messagesData);
      }

      setIsLoading(false);
    };

    fetchData();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, workspace?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch AI suggestions when lead sends a message
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.sender_type === "lead") {
      const history = messages.map((m) => ({
        content: m.content,
        sender_type: m.sender_type,
      }));
      fetchSuggestions(lastMessage.content, history);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation) return;

    // Sanitize message before saving
    const sanitizedMessage = sanitizeTextContent(newMessage.trim());

    if (!sanitizedMessage) {
      logError(
        "Attempted to send empty message after sanitization",
        undefined,
        "ChatRoom"
      );
      return;
    }

    try {
      // Save message to database with sanitized content
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversation.id,
        workspace_id: workspace?.id,
        content: sanitizedMessage,
        sender_type: "agent",
      });

      if (error) {
        logError("Error saving message to database", error, "ChatRoom");
        throw error;
      }

      setNewMessage("");
      clearSuggestions();
    } catch (error) {
      logError(
        "Failed to send message",
        error instanceof Error ? error : new Error(String(error)),
        "ChatRoom"
      );
    }
  };

  const handleUseSuggestion = (text: string) => {
    setNewMessage(text);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="h-[calc(100vh-8rem)] flex flex-col">
          <Skeleton className="h-16 rounded-lg mb-4" />
          <Skeleton className="flex-1 rounded-lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!conversation) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Conversa não encontrada</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/dashboard/conversations")}
          >
            Voltar para Conversas
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/conversations")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-primary/20">
              <User className="w-5 h-5 text-primary" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">{conversation.lead.name}</h2>
              <Badge
                variant={
                  conversation.status === "open" ? "default" : "secondary"
                }
              >
                {conversation.status === "open" ? "Aberta" : "Fechada"}
              </Badge>
              {getSentimentIcon(conversation.sentiment)}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-3 h-3" />
              {conversation.lead.phone}
              <span className="mx-1">•</span>
              <span>Score: {conversation.lead.score}</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <Card className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => {
                const isLead = message.sender_type === "lead";
                const isAI = message.sender_type === "ai";

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      isLead ? "justify-start" : "justify-end"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-2",
                        isLead
                          ? "bg-secondary rounded-tl-none"
                          : isAI
                          ? "bg-chart-purple/20 text-foreground rounded-tr-none"
                          : "bg-primary text-primary-foreground rounded-tr-none"
                      )}
                    >
                      {isAI && (
                        <div className="flex items-center gap-1 text-xs text-chart-purple mb-1">
                          <Bot className="w-3 h-3" />
                          Resposta da IA
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs opacity-60">
                          {formatDistanceToNow(new Date(message.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                        {!isLead && message.is_read && (
                          <CheckCheck className="w-3 h-3 text-chart-blue" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* AI Suggestions */}
          {suggestions.length > 0 && (
            <div className="px-4 py-2 border-t bg-secondary/30">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-chart-orange" />
                <span className="text-sm font-medium">Sugestões da IA</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-1.5 whitespace-normal text-left"
                    onClick={() => handleUseSuggestion(suggestion.text)}
                  >
                    <Badge
                      variant="secondary"
                      className={cn(
                        "mr-2 text-[10px]",
                        suggestion.type === "closing" &&
                          "bg-chart-green/20 text-chart-green",
                        suggestion.type === "professional" &&
                          "bg-chart-blue/20 text-chart-blue",
                        suggestion.type === "friendly" &&
                          "bg-chart-orange/20 text-chart-orange"
                      )}
                    >
                      {suggestion.type === "closing"
                        ? "Fechamento"
                        : suggestion.type === "professional"
                        ? "Profissional"
                        : "Amigável"}
                    </Badge>
                    <span className="line-clamp-1">{suggestion.text}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {suggestionsLoading && (
            <div className="px-4 py-2 border-t bg-secondary/30 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Gerando sugestões...
              </span>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && handleSendMessage()
                }
              />
              <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ChatRoom;
