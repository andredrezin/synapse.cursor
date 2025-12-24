import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  MessageSquare, 
  Brain, 
  Users, 
  Settings, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  BookOpen,
  Zap,
  Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  route?: string;
  tips: string[];
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'whatsapp',
    title: 'Conectar WhatsApp',
    description: 'Integre seu WhatsApp para receber e enviar mensagens automaticamente.',
    icon: <MessageSquare className="h-8 w-8" />,
    action: 'Configurar WhatsApp',
    route: '/whatsapp-connections',
    tips: [
      'Use a API Evolution para integração simples',
      'Escaneie o QR Code com seu WhatsApp',
      'Mantenha o celular conectado à internet'
    ]
  },
  {
    id: 'knowledge',
    title: 'Base de Conhecimento',
    description: 'Adicione informações sobre sua empresa, produtos e serviços para a IA usar.',
    icon: <BookOpen className="h-8 w-8" />,
    action: 'Criar Conhecimento',
    route: '/knowledge-base',
    tips: [
      'Adicione FAQs frequentes',
      'Inclua informações de produtos/serviços',
      'Defina políticas e procedimentos'
    ]
  },
  {
    id: 'ai-training',
    title: 'Treinar IA',
    description: 'Configure e treine sua IA para responder como um vendedor experiente.',
    icon: <Brain className="h-8 w-8" />,
    action: 'Configurar IA',
    route: '/ai-settings',
    tips: [
      'Defina a personalidade da IA',
      'Configure horários de atendimento',
      'Adicione palavras-chave de transferência'
    ]
  },
  {
    id: 'team',
    title: 'Equipe de Vendas',
    description: 'Adicione vendedores e distribua leads automaticamente.',
    icon: <Users className="h-8 w-8" />,
    action: 'Gerenciar Equipe',
    route: '/team',
    tips: [
      'Convide vendedores por email',
      'Defina permissões de acesso',
      'Configure distribuição de leads'
    ]
  },
  {
    id: 'automations',
    title: 'Automações',
    description: 'Crie fluxos automáticos para qualificar e nutrir leads.',
    icon: <Zap className="h-8 w-8" />,
    action: 'Criar Automação',
    route: '/automations',
    tips: [
      'Configure respostas automáticas',
      'Defina gatilhos de qualificação',
      'Crie sequências de follow-up'
    ]
  },
  {
    id: 'leads',
    title: 'Gestão de Leads',
    description: 'Monitore e gerencie todos os seus leads em um só lugar.',
    icon: <Target className="h-8 w-8" />,
    action: 'Ver Leads',
    route: '/leads',
    tips: [
      'Filtre leads por temperatura',
      'Acompanhe o score de qualificação',
      'Atribua leads a vendedores'
    ]
  }
];

interface OnboardingGuideProps {
  onComplete?: () => void;
  completedSteps?: string[];
}

export const OnboardingGuide = ({ onComplete, completedSteps = [] }: OnboardingGuideProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  
  const progress = (completedSteps.length / onboardingSteps.length) * 100;
  const step = onboardingSteps[currentStep];
  const isCompleted = completedSteps.includes(step.id);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAction = () => {
    if (step.route) {
      navigate(step.route);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-primary/20 bg-card/95 backdrop-blur">
      <CardHeader className="text-center pb-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <CardTitle className="text-xl">Guia de Configuração</CardTitle>
        </div>
        <CardDescription>
          Complete os passos abaixo para configurar sua plataforma LeadFlux
        </CardDescription>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Progresso</span>
            <span>{completedSteps.length}/{onboardingSteps.length} completos</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* Step indicators */}
        <div className="flex justify-center gap-2 mb-6">
          {onboardingSteps.map((s, index) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentStep 
                  ? 'bg-primary scale-125' 
                  : completedSteps.includes(s.id)
                    ? 'bg-green-500'
                    : 'bg-muted hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>

        {/* Current step content */}
        <div className="text-center space-y-4">
          <div className={`inline-flex p-4 rounded-full ${isCompleted ? 'bg-green-500/20 text-green-500' : 'bg-primary/20 text-primary'}`}>
            {isCompleted ? <CheckCircle2 className="h-8 w-8" /> : step.icon}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
              {step.title}
              {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            </h3>
            <p className="text-muted-foreground mt-1">{step.description}</p>
          </div>

          {/* Tips */}
          <div className="bg-muted/50 rounded-lg p-4 text-left">
            <p className="text-sm font-medium mb-2">💡 Dicas:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {step.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Action button */}
          <Button onClick={handleAction} className="w-full" size="lg">
            {step.action}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>
          
          <Button
            variant={currentStep === onboardingSteps.length - 1 ? 'default' : 'outline'}
            onClick={handleNext}
          >
            {currentStep === onboardingSteps.length - 1 ? 'Concluir' : 'Próximo'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
