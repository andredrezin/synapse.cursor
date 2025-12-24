import { Check } from "lucide-react";

const Metrics = () => {
  const metricCategories = [
    {
      title: "Performance do Time",
      color: "bg-primary",
      metrics: [
        "Tempo médio de resposta",
        "Conversas abertas x concluídas",
        "Produtividade por atendente",
        "Índice de qualidade da conversa"
      ]
    },
    {
      title: "Qualidade das Conversas",
      color: "bg-chart-blue",
      metrics: [
        "Análise de sentimento automática",
        "Objeções detectadas com IA",
        "Palavras-chave de compra",
        "Pontos de ruptura identificados"
      ]
    },
    {
      title: "Conversão Comercial",
      color: "bg-chart-orange",
      metrics: [
        "Taxa por atendente e campanha",
        "Classificação de leads (frio/morno/quente)",
        "Motivos de perda mapeados",
        "ROI por fonte de tráfego"
      ]
    },
    {
      title: "Lead Scoring Inteligente",
      color: "bg-chart-purple",
      metrics: [
        "Score baseado em linguagem",
        "Análise de urgência",
        "Mapeamento de intenção",
        "Histórico de aquecimento"
      ]
    }
  ];

  return (
    <section id="metrics" className="py-32 bg-card/50">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Métricas que{" "}
            <span className="text-gradient">realmente importam</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Pare de adivinhar. Tenha dados precisos sobre cada aspecto da sua operação de vendas no WhatsApp.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {metricCategories.map((category, index) => (
            <div 
              key={index}
              className="glass rounded-2xl p-6 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-3 h-3 rounded-full ${category.color}`} />
                <h3 className="text-xl font-semibold text-foreground">{category.title}</h3>
              </div>
              <ul className="space-y-3">
                {category.metrics.map((metric, mIndex) => (
                  <li key={mIndex} className="flex items-center gap-3 text-muted-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{metric}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Metrics;
