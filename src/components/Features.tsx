import { 
  Target, 
  Brain, 
  BarChart3, 
  Zap, 
  Map, 
  MessageSquareText,
  TrendingUp,
  Users,
  Clock,
  Shield
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Target,
      title: "Pixel de Conversão",
      description: "Rastreie exatamente de qual campanha, anúncio ou CTA cada lead veio. Atribuição de vendas precisa.",
      color: "text-primary",
      bg: "bg-primary/10"
    },
    {
      icon: Brain,
      title: "IA Avaliadora",
      description: "Analisa cada mensagem do vendedor e sugere respostas mais eficientes em tempo real.",
      color: "text-chart-purple",
      bg: "bg-chart-purple/10"
    },
    {
      icon: BarChart3,
      title: "Diagnóstico Comercial",
      description: "Identifique onde os leads travam, objeções comuns e palavras que aumentam conversão.",
      color: "text-chart-blue",
      bg: "bg-chart-blue/10"
    },
    {
      icon: Zap,
      title: "Automação Inteligente",
      description: "Follow-up automático, reativação de leads e distribuição para o vendedor mais eficiente.",
      color: "text-chart-orange",
      bg: "bg-chart-orange/10"
    },
    {
      icon: Map,
      title: "Mapa da Jornada",
      description: "Visualize todo o caminho do lead: do primeiro contato até o fechamento.",
      color: "text-primary",
      bg: "bg-primary/10"
    },
    {
      icon: MessageSquareText,
      title: "GPT Comercial",
      description: "Gere scripts personalizados, treine vendedores e crie relatórios automáticos.",
      color: "text-chart-purple",
      bg: "bg-chart-purple/10"
    }
  ];

  return (
    <section id="features" className="py-32 relative">
      <div className="absolute inset-0 bg-gradient-glow opacity-30" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Tudo que você precisa para{" "}
            <span className="text-gradient">vender mais</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Uma plataforma completa que transforma seu WhatsApp em uma máquina de vendas previsível e escalável.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group glass glass-hover rounded-2xl p-6 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
        
        {/* Stats */}
        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { icon: TrendingUp, value: "+32%", label: "Aumento em conversão" },
            { icon: Clock, value: "-67%", label: "Tempo de resposta" },
            { icon: Users, value: "2.5k+", label: "Empresas ativas" },
            { icon: Shield, value: "99.9%", label: "Uptime garantido" }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl md:text-4xl font-bold text-foreground mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
