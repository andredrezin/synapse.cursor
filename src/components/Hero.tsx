import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-glow opacity-60" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse-glow" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-slide-up">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              Pixel de Conversão + IA para WhatsApp
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight mb-6 animate-slide-up delay-100">
            Transforme conversas em{" "}
            <span className="text-gradient">conversões</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up delay-200">
            Inteligência artificial que analisa, classifica e otimiza cada
            conversa do seu time de vendas no WhatsApp. Métricas reais,
            recomendações acionáveis.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up delay-300">
            <Link to="/dashboard">
              <Button variant="hero" size="lg" className="w-full sm:w-auto">
                Ver Dashboard Demo
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="glass" size="lg" className="w-full sm:w-auto">
              <Play className="w-5 h-5" />
              Ver Demonstração
            </Button>
          </div>

          {/* Trust badges */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-muted-foreground animate-slide-up delay-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm">+2.500 empresas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-chart-blue animate-pulse" />
              <span className="text-sm">1M+ conversas analisadas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-chart-orange animate-pulse" />
              <span className="text-sm">32% mais conversão</span>
            </div>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-20 max-w-5xl mx-auto animate-slide-up delay-500">
          <div className="relative rounded-2xl overflow-hidden glass p-1 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
            <div className="bg-card rounded-xl p-6">
              <DashboardPreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const DashboardPreview = () => {
  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Metrics row */}
      <div className="col-span-3 glass rounded-lg p-4">
        <p className="text-xs text-muted-foreground mb-1">Taxa de Conversão</p>
        <p className="text-2xl font-bold text-foreground">32.4%</p>
        <p className="text-xs text-primary">+12% esta semana</p>
      </div>
      <div className="col-span-3 glass rounded-lg p-4">
        <p className="text-xs text-muted-foreground mb-1">Tempo de Resposta</p>
        <p className="text-2xl font-bold text-foreground">2.3min</p>
        <p className="text-xs text-chart-blue">-45s vs ontem</p>
      </div>
      <div className="col-span-3 glass rounded-lg p-4">
        <p className="text-xs text-muted-foreground mb-1">Leads Quentes</p>
        <p className="text-2xl font-bold text-foreground">147</p>
        <p className="text-xs text-chart-orange">23 prontos p/ fechar</p>
      </div>
      <div className="col-span-3 glass rounded-lg p-4">
        <p className="text-xs text-muted-foreground mb-1">Vendas Hoje</p>
        <p className="text-2xl font-bold text-foreground">R$ 24.5k</p>
        <p className="text-xs text-primary">Meta: 85%</p>
      </div>

      {/* Chart area */}
      <div className="col-span-8 glass rounded-lg p-4 h-48">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-foreground">
            Conversões por Canal
          </p>
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary" />
              Orgânico
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-chart-blue" />
              Ads
            </span>
          </div>
        </div>
        <div className="flex items-end justify-between h-28 gap-2">
          {[65, 45, 80, 55, 90, 70, 85].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col gap-1">
              <div
                className="bg-primary/80 rounded-t"
                style={{ height: `${h}%` }}
              />
              <div
                className="bg-chart-blue/60 rounded-t"
                style={{ height: `${h * 0.6}%` }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* AI insights */}
      <div className="col-span-4 glass rounded-lg p-4 h-48">
        <p className="text-sm font-medium text-foreground mb-3">
          Insights da IA
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
            <p className="text-xs text-muted-foreground">
              <span className="text-foreground font-medium">Lead #234</span>{" "}
              demonstrou alta intenção de compra
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-chart-orange mt-1.5" />
            <p className="text-xs text-muted-foreground">
              <span className="text-foreground font-medium">3 objeções</span>{" "}
              detectadas nas últimas 2h
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-chart-blue mt-1.5" />
            <p className="text-xs text-muted-foreground">
              <span className="text-foreground font-medium">João</span> atingiu
              95% de qualidade hoje
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
