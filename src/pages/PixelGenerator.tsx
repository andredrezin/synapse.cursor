import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Code,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  BarChart3,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const PixelGenerator = () => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { workspace } = useAuth();

  const pixelCode = `<!-- Synapse Pixel -->
<script>
  (function(w,h,a,t,s,m,e,t,r,i,c,s){
    w['SynapseObject']=s;w[s]=w[s]||function(){
    (w[s].q=w[s].q||[]).push(arguments)};w[s].l=1*new Date();
    m=h.createElement(a);e=h.getElementsByTagName(a)[0];
    m.async=1;m.src=t;e.parentNode.insertBefore(m,e)
  })(window,document,'script','https://cdn.synapseautomacao.com.br/pixel.js','wm');
  
  wm('init', '${workspace?.id || "YOUR_WORKSPACE_ID"}');
  wm('track', 'PageView');
</script>
<!-- End Synapse Pixel -->`;

  const handleCopy = () => {
    navigator.clipboard.writeText(pixelCode);
    setCopied(true);
    toast({
      title: "Código copiado!",
      description: "Cole o código no <head> do seu site.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Pixel de Conversão
          </h1>
          <p className="text-muted-foreground">
            Instale o pixel para rastrear conversões do WhatsApp
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Pixel Code Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5 text-primary" />
                Seu Código de Rastreamento
              </CardTitle>
              <CardDescription>
                Copie e cole este código no {"<head>"} de todas as páginas do
                seu site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <pre className="bg-secondary p-4 rounded-lg overflow-x-auto text-sm font-mono">
                  <code className="text-foreground/80">{pixelCode}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Como Instalar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <span>Copie o código acima</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <span>
                    Cole no {"<head>"} do seu site, antes do fechamento{" "}
                    {"</head>"}
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <span>Publique as alterações</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                    4
                  </span>
                  <span>Verifique a instalação abaixo</span>
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status da Instalação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-3 h-3 rounded-full bg-chart-orange animate-pulse" />
                <span className="text-sm">Aguardando primeira conexão...</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Após instalar o pixel, acesse seu site para ativar o
                rastreamento.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-card/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Rastreamento de Cliques</h3>
                  <p className="text-xs text-muted-foreground">
                    Identifica cada clique no botão de WhatsApp
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Atribuição de Origem</h3>
                  <p className="text-xs text-muted-foreground">
                    Sabe de qual campanha veio cada lead
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <ExternalLink className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">UTM Tracking</h3>
                  <p className="text-xs text-muted-foreground">
                    Captura automaticamente parâmetros UTM
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PixelGenerator;
