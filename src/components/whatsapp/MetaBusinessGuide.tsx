import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MetaBusinessGuideProps {
  showFullGuide?: boolean;
}

export function MetaBusinessGuide({ showFullGuide = false }: MetaBusinessGuideProps) {
  if (!showFullGuide) {
    return (
      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-800 dark:text-blue-200">
          Requisitos para API Oficial
        </AlertTitle>
        <AlertDescription className="text-blue-700 dark:text-blue-300">
          Para usar a API oficial do WhatsApp, você precisa de uma conta no Meta Business Suite 
          com um número de telefone verificado.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          Configuração do Meta Business
        </CardTitle>
        <CardDescription>
          Siga estes passos para configurar sua integração com a API oficial do WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Prerequisites */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Badge variant="outline">Pré-requisitos</Badge>
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              Conta no Meta Business Suite (Facebook Business)
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              Número de telefone exclusivo para WhatsApp Business
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              App Meta verificado com permissões WhatsApp Business
            </li>
          </ul>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Badge variant="outline">Passo a Passo</Badge>
          </h4>
          
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                1
              </div>
              <div>
                <p className="font-medium">Criar App no Meta Developers</p>
                <p className="text-sm text-muted-foreground">
                  Acesse developers.facebook.com e crie um novo app do tipo "Business"
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                2
              </div>
              <div>
                <p className="font-medium">Adicionar WhatsApp ao App</p>
                <p className="text-sm text-muted-foreground">
                  No painel do app, adicione o produto "WhatsApp" e configure a API
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                3
              </div>
              <div>
                <p className="font-medium">Vincular Número de Telefone</p>
                <p className="text-sm text-muted-foreground">
                  Adicione e verifique um número de telefone que não esteja em uso no WhatsApp pessoal
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                4
              </div>
              <div>
                <p className="font-medium">Configurar OAuth</p>
                <p className="text-sm text-muted-foreground">
                  Configure as URLs de redirecionamento OAuth nas configurações do app
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Warning */}
        <Alert variant="destructive" className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-900">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-200">Importante</AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            O número usado para WhatsApp Business API não pode estar registrado no WhatsApp pessoal. 
            Use um número exclusivo para a API.
          </AlertDescription>
        </Alert>

        {/* Links */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a 
              href="https://developers.facebook.com/apps" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Meta Developers
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a 
              href="https://business.facebook.com/" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Business Suite
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a 
              href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Documentação API
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
