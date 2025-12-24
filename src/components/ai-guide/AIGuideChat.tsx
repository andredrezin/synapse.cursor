import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, BookOpen, Zap, Brain, MessageSquare, Target, Search, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAgent {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  capabilities: string[];
}

const AI_AGENTS: AIAgent[] = [
  {
    id: 'ai-chat',
    name: 'Chat IA',
    description: 'Responde leads automaticamente com personalidade configurável',
    icon: <MessageSquare className="h-5 w-5 text-chart-blue" />,
    capabilities: ['Resposta automática', 'Personalidade customizada', 'RAG com base de conhecimento', 'Segurança de prompts']
  },
  {
    id: 'ai-analyze',
    name: 'Análise de Sentimento',
    description: 'Analisa conversas e detecta sentimentos em tempo real',
    icon: <Brain className="h-5 w-5 text-chart-purple" />,
    capabilities: ['Análise de sentimento', 'Detecção de intenção', 'Resumo de conversas', 'Pontos-chave']
  },
  {
    id: 'ai-suggest',
    name: 'Sugestões Inteligentes',
    description: 'Sugere respostas para vendedores com base no contexto',
    icon: <Zap className="h-5 w-5 text-chart-yellow" />,
    capabilities: ['Sugestões em tempo real', 'Tipos de resposta', 'Nível de confiança', 'Contexto de conversa']
  },
  {
    id: 'ai-qualify',
    name: 'Qualificação de Leads',
    description: 'Pontua e qualifica leads automaticamente',
    icon: <Target className="h-5 w-5 text-primary" />,
    capabilities: ['Lead scoring', 'Temperatura automática', 'Próximos passos', 'Alertas de leads quentes']
  },
  {
    id: 'ai-router',
    name: 'Roteador IA',
    description: 'Direciona tarefas para o agente correto',
    icon: <Search className="h-5 w-5 text-chart-orange" />,
    capabilities: ['Roteamento inteligente', 'Verificação de horários', 'Transferência automática', 'Controle de fluxo']
  },
  {
    id: 'ai-guide',
    name: 'Guia IA (Você está aqui!)',
    description: 'Ensina como usar e implementar a plataforma',
    icon: <BookOpen className="h-5 w-5 text-chart-green" />,
    capabilities: ['Tutoriais interativos', 'Dicas de uso', 'Configuração guiada', 'Suporte contextual']
  }
];

interface AIGuideChatProps {
  onClose: () => void;
}

const AIGuideChat = ({ onClose }: AIGuideChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `👋 Olá! Sou seu Guia IA para a plataforma LeadFlux.

Posso te ajudar com:
• **Configurar** suas conexões WhatsApp
• **Entender** como funcionam os agentes IA
• **Implementar** automações e fluxos
• **Otimizar** suas conversões

Como posso te ajudar hoje?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAgents, setShowAgents] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-guide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Limite de requisições atingido. Aguarde um momento.');
        }
        throw new Error('Erro ao processar mensagem');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      if (reader) {
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();
              if (jsonStr === '[DONE]') continue;

              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  assistantContent += content;
                  setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      role: 'assistant',
                      content: assistantContent
                    };
                    return newMessages;
                  });
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('AI Guide error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Desculpe, ocorreu um erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Tente novamente.`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-chart-purple/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-chart-purple flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Guia IA</h3>
            <p className="text-xs text-muted-foreground">Seu assistente de implementação</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAgents(!showAgents)}
            className="text-xs"
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            Agentes
          </Button>
        </div>
      </div>

      {/* Agents Panel */}
      {showAgents && (
        <div className="p-4 border-b border-border bg-muted/50 max-h-64 overflow-auto">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Agentes IA Disponíveis
          </h4>
          <div className="space-y-2">
            {AI_AGENTS.map(agent => (
              <div
                key={agent.id}
                className="p-3 bg-background rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => {
                  setInput(`Como funciona o ${agent.name}?`);
                  setShowAgents(false);
                }}
              >
                <div className="flex items-start gap-2">
                  {agent.icon}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.description}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {agent.capabilities.slice(0, 2).map((cap, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-3",
                message.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {message.role === 'assistant' && (
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-chart-purple flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                  message.role === 'user'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                <div className="whitespace-pre-wrap prose prose-sm dark:prose-invert">
                  {message.content}
                </div>
              </div>
              {message.role === 'user' && (
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-chart-purple flex items-center justify-center">
                <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
              </div>
              <div className="bg-muted rounded-2xl px-4 py-2">
                <span className="text-sm text-muted-foreground">Pensando...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-t border-border flex gap-2 overflow-x-auto">
        {['Como conectar WhatsApp?', 'Configurar IA', 'Ver leads'].map((quick, i) => (
          <Button
            key={i}
            variant="outline"
            size="sm"
            className="text-xs shrink-0"
            onClick={() => setInput(quick)}
          >
            {quick}
          </Button>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua dúvida..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AIGuideChat;
