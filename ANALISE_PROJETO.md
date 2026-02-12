# 📊 Análise Completa do Projeto Synapse

## 🎯 Visão Geral

**Nome do Projeto**: Synapse / LeadFlux  
**Tipo**: CRM Inteligente para WhatsApp com IA  
**Stack Principal**: React + TypeScript + Vite + Supabase + Tailwind CSS

Este é um sistema completo de gestão de leads e conversas via WhatsApp, com inteligência artificial integrada para automação, análise e otimização de vendas.

---

## 🏗️ Arquitetura do Projeto

### Frontend

- **Framework**: React 18.3.1 com TypeScript
- **Build Tool**: Vite 5.4.19
- **Roteamento**: React Router DOM 6.30.1
- **Estado Global**: React Context API + TanStack Query
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Estilização**: Tailwind CSS 3.4.17
- **Internacionalização**: i18next (pt-BR, en, es)
- **Formulários**: React Hook Form + Zod

### Backend

- **BaaS**: Supabase (PostgreSQL + Edge Functions)
- **Autenticação**: Supabase Auth
- **Edge Functions**: Deno (TypeScript)
- **Pagamentos**: Stripe (integração via webhooks)

### Integrações Externas

- **WhatsApp**: Evolution API + Meta Business API
- **IA**: Lovable AI Gateway (para análise e chat)
- **Email**: Sistema de envio via Supabase Functions

---

## 📁 Estrutura de Diretórios

```
synapsewhats1-main/
├── src/
│   ├── components/          # Componentes React reutilizáveis
│   │   ├── ai-guide/       # Guia IA interativo
│   │   ├── analytics/      # Componentes de analytics
│   │   ├── auth/           # Autenticação
│   │   ├── dashboard/      # Componentes do dashboard
│   │   ├── onboarding/     # Fluxo de onboarding
│   │   ├── subscription/   # Componentes de assinatura
│   │   ├── ui/             # Componentes UI base (shadcn)
│   │   └── whatsapp/       # Componentes WhatsApp
│   ├── contexts/           # Contextos React (Auth, Subscription)
│   ├── hooks/              # Custom hooks
│   ├── i18n/               # Traduções (pt-BR, en, es)
│   ├── integrations/       # Integrações (Supabase)
│   ├── lib/                # Utilitários
│   ├── pages/              # Páginas/rotas da aplicação
│   └── utils/              # Funções utilitárias
├── supabase/
│   ├── functions/          # Edge Functions (backend)
│   └── migrations/         # Migrações do banco de dados
└── public/                 # Arquivos estáticos
```

---

## 🚀 Funcionalidades Principais

### 1. **Autenticação e Workspace**

- ✅ Login/Registro com Supabase Auth
- ✅ Sistema de workspaces (multi-tenant)
- ✅ Perfis de usuário com roles (owner, admin, member, seller)
- ✅ Onboarding guiado para novos usuários
- ✅ Recuperação de senha

### 2. **Conexões WhatsApp**

- ✅ Suporte para Evolution API
- ✅ Suporte para Meta Business API (OAuth)
- ✅ Conexão via QR Code
- ✅ Múltiplas conexões simultâneas
- ✅ Health check de conexões
- ✅ Atribuição de vendedores por conexão

### 3. **Gestão de Conversas**

- ✅ Lista de conversas em tempo real
- ✅ Chat room individual
- ✅ Envio de mensagens via WhatsApp
- ✅ Histórico completo de mensagens
- ✅ Status de leitura e entrega
- ✅ Análise de sentimento (IA)

### 4. **Gestão de Leads**

- ✅ Lista de leads com filtros
- ✅ Qualificação automática por IA
- ✅ Score de leads (0-100)
- ✅ Temperatura do lead (hot/warm/cold)
- ✅ Atribuição para vendedores
- ✅ Histórico de interações

### 5. **Inteligência Artificial**

#### 5.1 Chat IA (ai-chat)

- Respostas automáticas para leads
- Personalidade customizável
- Prompt de sistema configurável
- Integração com base de conhecimento (RAG)
- Horário de funcionamento configurável
- Palavras-chave para transferência humana

#### 5.2 Análise de Sentimento (ai-analyze)

- Análise automática de conversas
- Detecção de sentimento (positivo/neutro/negativo)
- Identificação de intenção do cliente
- Resumo de conversas
- Pontos-chave identificados

#### 5.3 Sugestões Inteligentes (ai-suggest)

- Sugestões de respostas para vendedores
- Tipos: amigável, profissional, fechamento
- Nível de confiança das sugestões

#### 5.4 Qualificação de Leads (ai-qualify)

- Pontuação automática (0-100)
- Classificação de temperatura
- Probabilidade de conversão
- Próximos passos recomendados
- Alertas para leads quentes

#### 5.5 Base de Conhecimento (ai-learn)

- Upload de documentos
- Treinamento da IA com informações do negócio
- FAQ e respostas padrão
- Análise de conteúdo

#### 5.6 Roteador IA (ai-router)

- Direcionamento inteligente de tarefas
- Verificação de disponibilidade
- Gerenciamento de horários

### 6. **Dashboard e Analytics**

- ✅ Métricas em tempo real
- ✅ Taxa de conversão
- ✅ Leads ativos
- ✅ Conversas do dia
- ✅ Tempo médio de resposta
- ✅ Gráficos de conversão
- ✅ Performance da equipe
- ✅ Fontes de leads
- ✅ Insights de IA

### 7. **Equipe e Permissões**

- ✅ Gestão de membros da equipe
- ✅ Roles e permissões
- ✅ Dashboard individual para vendedores
- ✅ Performance por vendedor

### 8. **Automações**

- ✅ Respostas automáticas
- ✅ Qualificação automática
- ✅ Alertas configuráveis
- ✅ Regras de negócio customizáveis

### 9. **Templates e Mensagens**

- ✅ Templates de mensagens
- ✅ Respostas rápidas
- ✅ Personalização de mensagens

### 10. **Pixel de Rastreamento**

- ✅ Geração de pixels de conversão
- ✅ Rastreamento de origem de leads
- ✅ Analytics de fontes

### 11. **Relatórios**

- ✅ Relatórios personalizados
- ✅ Exportação de dados
- ✅ Analytics de churn
- ✅ Analytics de IA

### 12. **Assinatura e Pagamentos**

- ✅ Planos de assinatura (Stripe)
- ✅ Controle de acesso por plano
- ✅ Portal do cliente
- ✅ Webhooks do Stripe
- ✅ Emails de assinatura

---

## 🔧 Tecnologias e Bibliotecas Principais

### Frontend

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.30.1",
  "@tanstack/react-query": "^5.83.0",
  "@supabase/supabase-js": "^2.89.0",
  "react-hook-form": "^7.61.1",
  "zod": "^3.25.76",
  "i18next": "^25.7.3",
  "recharts": "^2.15.4",
  "date-fns": "^3.6.0",
  "lucide-react": "^0.462.0",
  "sonner": "^1.7.4"
}
```

### UI Components (shadcn/ui)

- Radix UI primitives (acessibilidade)
- Tailwind CSS para estilização
- Componentes totalmente customizáveis

### Backend (Supabase Edge Functions)

- Deno runtime
- TypeScript
- Integração com Lovable AI Gateway
- Webhooks do WhatsApp

---

## 📊 Banco de Dados (Supabase)

### Tabelas Principais (inferidas das migrations)

- `profiles` - Perfis de usuários
- `workspaces` - Workspaces multi-tenant
- `workspace_members` - Membros e roles
- `whatsapp_connections` - Conexões WhatsApp
- `conversations` - Conversas
- `messages` - Mensagens
- `leads` - Leads
- `subscriptions` - Assinaturas
- `knowledge_base` - Base de conhecimento
- `ai_settings` - Configurações de IA
- `templates` - Templates de mensagens
- `automations` - Automações
- `tracking_pixels` - Pixels de rastreamento

---

## 🌐 Rotas da Aplicação

### Rotas Públicas

- `/` - Landing page
- `/auth` - Login/Registro
- `/auth/callback` - Callback OAuth
- `/forgot-password` - Recuperar senha
- `/reset-password` - Redefinir senha

### Rotas Protegidas (Dashboard)

- `/dashboard` - Dashboard principal
- `/dashboard/seller` - Dashboard do vendedor
- `/dashboard/profile` - Perfil do usuário
- `/dashboard/conversations` - Conversas
- `/dashboard/chat/:conversationId` - Chat individual
- `/dashboard/leads` - Leads
- `/dashboard/team` - Equipe
- `/dashboard/whatsapp` - Conexões WhatsApp
- `/dashboard/knowledge` - Base de conhecimento
- `/dashboard/ai-settings` - Configurações de IA
- `/dashboard/automations` - Automações
- `/dashboard/templates` - Templates
- `/dashboard/alerts` - Alertas
- `/dashboard/reports` - Relatórios
- `/dashboard/scoring` - Lead Scoring
- `/dashboard/pixel` - Pixel Generator
- `/dashboard/settings` - Configurações
- `/dashboard/pricing` - Planos e preços
- `/dashboard/churn-analytics` - Analytics de churn
- `/dashboard/ai-analytics` - Analytics de IA
- `/dashboard/lead-distribution` - Distribuição de leads

---

## 🤖 Edge Functions (Supabase)

### Funções de IA

1. **ai-chat** - Chat automático com leads
2. **ai-analyze** - Análise de sentimento
3. **ai-suggest** - Sugestões de respostas
4. **ai-qualify** - Qualificação de leads
5. **ai-learn** - Treinamento da base de conhecimento
6. **ai-router** - Roteamento inteligente
7. **ai-guide** - Guia IA interativo

### Funções WhatsApp

1. **whatsapp-connect** - Conectar WhatsApp
2. **whatsapp-send** - Enviar mensagens
3. **whatsapp-webhook** - Receber webhooks
4. **whatsapp-status** - Status de mensagens
5. **whatsapp-oauth-callback** - Callback OAuth Meta
6. **whatsapp-health-check** - Health check

### Funções de Sistema

1. **create-workspace** - Criar workspace
2. **check-subscription** - Verificar assinatura
3. **create-checkout** - Criar checkout Stripe
4. **stripe-webhook** - Webhook Stripe
5. **customer-portal** - Portal do cliente
6. **send-subscription-email** - Email de assinatura
7. **apply-retention-coupon** - Cupom de retenção

### Funções Utilitárias

1. **analyze-image** - Análise de imagens
2. **transcribe-audio** - Transcrição de áudio

---

## 🎨 Design System

### Cores (Tailwind CSS)

- Sistema de cores baseado em HSL
- Suporte a tema claro/escuro
- Cores de gráficos (green, blue, orange, red, purple)
- Cores de sidebar customizadas

### Componentes UI

- Sistema completo de componentes shadcn/ui
- 49+ componentes disponíveis
- Totalmente acessíveis (Radix UI)
- Customizáveis via Tailwind

---

## 🔐 Segurança

- ✅ Autenticação via Supabase Auth
- ✅ Proteção de rotas (ProtectedRoute)
- ✅ Controle de acesso por workspace
- ✅ Roles e permissões
- ✅ Validação de dados (Zod)
- ✅ Sanitização de inputs

---

## 📱 Internacionalização (i18n)

- ✅ Português (pt-BR) - Padrão
- ✅ Inglês (en)
- ✅ Espanhol (es)
- ✅ Detecção automática de idioma
- ✅ Troca de idioma em tempo real

---

## 🧪 Hooks Customizados

1. **useAuth** - Autenticação
2. **useSubscription** - Assinatura
3. **useConversations** - Conversas
4. **useLeads** - Leads
5. **useWhatsAppConnections** - Conexões WhatsApp
6. **useDashboardMetrics** - Métricas do dashboard
7. **useAISettings** - Configurações de IA
8. **useAISuggestions** - Sugestões de IA
9. **useAITraining** - Treinamento de IA
10. **useKnowledge** - Base de conhecimento
11. **useTeamMembers** - Membros da equipe
12. **usePermissions** - Permissões
13. **useNotifications** - Notificações
14. **useMetricAlerts** - Alertas de métricas
15. **useLeadDistribution** - Distribuição de leads
16. **useTrackingPixels** - Pixels de rastreamento
17. **useWorkspaceSettings** - Configurações do workspace
18. **useOnboarding** - Onboarding
19. **useSendWhatsAppMessage** - Enviar mensagens

---

## 📈 Métricas e Analytics

### Métricas Principais

- Taxa de conversão
- Leads ativos
- Conversas do dia
- Tempo médio de resposta
- Receita
- Performance da equipe

### Analytics Avançados

- Analytics de IA (uso, performance)
- Analytics de churn
- Comparação de períodos
- Alertas de métricas
- Fontes de leads

---

## 💳 Sistema de Assinatura

### Planos (inferidos)

- Free/Basic
- Pro
- Enterprise

### Controle de Acesso

- Features bloqueadas por plano
- Upgrade banners
- Portal do cliente Stripe
- Webhooks de pagamento

---

## 🔄 Fluxos Principais

### 1. Onboarding

1. Registro/Login
2. Criação de workspace
3. Configuração inicial
4. Conexão WhatsApp
5. Configuração de IA
6. Primeira conversa

### 2. Conversa com Lead

1. Lead entra em contato via WhatsApp
2. IA analisa e responde (se configurado)
3. Vendedor recebe notificação
4. Vendedor assume conversa
5. IA sugere respostas
6. Conversa é qualificada automaticamente
7. Lead é pontuado
8. Alertas são gerados se necessário

### 3. Gestão de Lead

1. Lead é criado automaticamente
2. IA qualifica o lead
3. Lead recebe score e temperatura
4. Lead é atribuído para vendedor
5. Histórico é mantido
6. Métricas são atualizadas

---

## 🚦 Estado Atual do Projeto

### ✅ Implementado

- Sistema completo de autenticação
- Gestão de workspaces
- Conexões WhatsApp (Evolution + Meta)
- Chat em tempo real
- Sistema de IA completo
- Dashboard com métricas
- Gestão de leads
- Base de conhecimento
- Automações
- Templates
- Sistema de assinatura
- Internacionalização
- Onboarding

### 🔄 Possíveis Melhorias

- Testes automatizados
- Documentação de API
- Performance optimization
- Cache strategies
- Offline support
- Mobile app
- Mais integrações (CRM externos)

---

## 📝 Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento (porta 8080)
npm run build        # Build de produção
npm run build:dev    # Build de desenvolvimento
npm run lint         # Linter
npm run preview      # Preview do build
```

---

## 🔑 Variáveis de Ambiente Necessárias

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
LOVABLE_API_KEY=... (para Edge Functions)
STRIPE_SECRET_KEY=... (para pagamentos)
```

---

## 📚 Documentação Adicional

- README.md - Informações básicas do projeto
- GUIA_GITHUB.md - Guia de uso do GitHub
- ENTENDA_REPOSITORIOS.md - Explicação sobre repositórios

---

## 🎯 Conclusão

Este é um projeto **muito completo e bem estruturado** de CRM para WhatsApp com IA integrada. A arquitetura é moderna, escalável e segue boas práticas de desenvolvimento. O sistema oferece funcionalidades avançadas de automação, análise e gestão de leads, tornando-o uma solução robusta para empresas que querem otimizar suas vendas via WhatsApp.

**Pontos Fortes:**

- ✅ Arquitetura bem organizada
- ✅ Código TypeScript tipado
- ✅ UI moderna e responsiva
- ✅ Sistema de IA completo
- ✅ Multi-tenant (workspaces)
- ✅ Internacionalização
- ✅ Sistema de assinatura integrado

**Tecnologias Modernas:**

- React 18 com hooks
- Vite para build rápido
- Supabase para backend
- Tailwind CSS para estilização
- shadcn/ui para componentes

Este projeto está pronto para produção e pode ser facilmente expandido com novas funcionalidades.
