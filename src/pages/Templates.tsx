import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FileText, Plus, Search, Copy, Edit2, Trash2, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Template {
  id: string;
  name: string;
  content: string;
  category: string;
  usageCount: number;
  lastUsed?: string;
}

const mockTemplates: Template[] = [
  {
    id: '1',
    name: 'Boas-vindas',
    content: 'Olá {{nome}}! 👋 Seja bem-vindo(a) à nossa empresa! Como posso ajudar você hoje?',
    category: 'Atendimento',
    usageCount: 234,
    lastUsed: '2024-01-15T10:30:00',
  },
  {
    id: '2',
    name: 'Follow-up',
    content: 'Oi {{nome}}, tudo bem? Vi que você demonstrou interesse em nossos serviços. Posso esclarecer alguma dúvida?',
    category: 'Vendas',
    usageCount: 156,
    lastUsed: '2024-01-15T09:00:00',
  },
  {
    id: '3',
    name: 'Orçamento',
    content: 'Olá {{nome}}! Segue o orçamento solicitado:\n\n{{descricao}}\nValor: {{valor}}\n\nQualquer dúvida, estou à disposição!',
    category: 'Vendas',
    usageCount: 89,
    lastUsed: '2024-01-14T15:45:00',
  },
  {
    id: '4',
    name: 'Agradecimento',
    content: 'Obrigado pela sua compra, {{nome}}! 🎉 Seu pedido foi confirmado. Em breve você receberá mais informações.',
    category: 'Pós-venda',
    usageCount: 178,
    lastUsed: '2024-01-15T11:00:00',
  },
  {
    id: '5',
    name: 'Feedback',
    content: 'Oi {{nome}}! Como foi sua experiência conosco? Sua opinião é muito importante para nós! ⭐',
    category: 'Pós-venda',
    usageCount: 67,
    lastUsed: '2024-01-13T14:20:00',
  },
];

const Templates = () => {
  const { t } = useTranslation();
  const [templates] = useState(mockTemplates);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { toast } = useToast();

  const categories = [...new Set(templates.map(t => t.category))];

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                          t.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: t('templates.copied'),
      description: t('templates.copiedDesc'),
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('templates.title')}</h1>
            <p className="text-muted-foreground">
              {t('templates.subtitle')}
            </p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            {t('templates.newTemplate')}
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('templates.searchTemplates')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant={selectedCategory === null ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              {t('templates.all')}
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('templates.totalTemplates')}</CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{templates.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('templates.totalUses')}</CardTitle>
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {templates.reduce((acc, t) => acc + t.usageCount, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('templates.categories')}</CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <Badge variant="secondary">{template.category}</Badge>
                </div>
                <CardDescription className="text-xs">
                  {t('templates.used')} {template.usageCount} {t('templates.times')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-muted text-sm whitespace-pre-wrap line-clamp-3">
                  {template.content}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => copyToClipboard(template.content)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {t('templates.copy')}
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t('templates.noTemplates')}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Templates;