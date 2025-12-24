import { Sparkles, MessageCircle, AlertTriangle, Lightbulb } from "lucide-react";

const AISection = () => {
  return (
    <section id="ai" className="py-32 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px]" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Powered by AI</span>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Seu copiloto de vendas{" "}
              <span className="text-gradient">inteligente</span>
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Nossa IA analisa cada conversa em tempo real, detecta riscos de perda, 
              sugere as melhores respostas e ajuda seu time a fechar mais negócios.
            </p>
            
            <div className="space-y-4">
              {[
                {
                  icon: MessageCircle,
                  title: "Análise em Tempo Real",
                  description: "Cada mensagem é avaliada automaticamente pela IA"
                },
                {
                  icon: AlertTriangle,
                  title: "Detecção de Riscos",
                  description: "Alertas quando uma conversa pode estar em perigo"
                },
                {
                  icon: Lightbulb,
                  title: "Sugestões Inteligentes",
                  description: "Recomendações de respostas baseadas em conversas de sucesso"
                }
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right: Chat simulation */}
          <div className="relative">
            <div className="glass rounded-2xl p-6 max-w-md mx-auto">
              {/* Chat header */}
              <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">ML</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Maria Lima</p>
                  <p className="text-xs text-muted-foreground">Lead quente • Score: 87</p>
                </div>
                <div className="ml-auto">
                  <span className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                    Alta intenção
                  </span>
                </div>
              </div>
              
              {/* Messages */}
              <div className="space-y-4 mb-4">
                <div className="flex justify-end">
                  <div className="bg-primary/20 rounded-2xl rounded-br-md px-4 py-2 max-w-[80%]">
                    <p className="text-sm text-foreground">Olá Maria! Vi que você se interessou pelo nosso plano Pro. Posso te ajudar?</p>
                  </div>
                </div>
                
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-2 max-w-[80%]">
                    <p className="text-sm text-foreground">Oi! Sim, quero entender melhor os preços. Achei um pouco caro...</p>
                  </div>
                </div>
                
                {/* AI Suggestion */}
                <div className="glass rounded-xl p-3 border border-primary/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-primary">Sugestão da IA</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Objeção de preço detectada. Resposta sugerida:
                  </p>
                  <p className="text-sm text-foreground bg-card/50 rounded-lg p-2">
                    "Entendo sua preocupação, Maria! O que nossos clientes percebem é que o investimento se paga em menos de 30 dias. Posso te mostrar um case similar ao seu negócio?"
                  </p>
                </div>
              </div>
              
              {/* Input */}
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="Digite sua mensagem..."
                  className="flex-1 bg-secondary rounded-lg px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors">
                  <MessageCircle className="w-4 h-4 text-primary-foreground" />
                </button>
              </div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 glass rounded-lg px-3 py-2 animate-float">
              <p className="text-xs text-muted-foreground">Qualidade da resposta</p>
              <p className="text-lg font-bold text-primary">94%</p>
            </div>
            <div className="absolute -bottom-4 -left-4 glass rounded-lg px-3 py-2 animate-float delay-200">
              <p className="text-xs text-muted-foreground">Chance de conversão</p>
              <p className="text-lg font-bold text-chart-blue">78%</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AISection;
