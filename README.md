# 🚀 Synapse - CRM Inteligente para WhatsApp

> Sistema completo de gestão de leads e conversas via WhatsApp com Inteligência Artificial integrada

[![React](https://img.shields.io/badge/React-18.3.1-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.19-purple)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.com/)

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Uso](#-uso)
- [Documentação](#-documentação)
- [Contribuindo](#-contribuindo)

## 🎯 Sobre o Projeto

**Synapse** (também conhecido como **LeadFlux**) é uma plataforma completa de CRM para WhatsApp que utiliza Inteligência Artificial para:

- 🤖 **Automatizar** respostas e qualificação de leads
- 📊 **Analisar** conversas e sentimentos
- 🎯 **Otimizar** vendas através de insights inteligentes
- 👥 **Gerenciar** equipes e distribuição de leads
- 📈 **Mensurar** performance e conversões

## ✨ Funcionalidades

### 🤖 Inteligência Artificial

- ✅ Chat automático com leads
- ✅ Análise de sentimento em tempo real
- ✅ Sugestões inteligentes de respostas
- ✅ Qualificação automática de leads
- ✅ Base de conhecimento (RAG)
- ✅ Roteamento inteligente

### 💬 WhatsApp

- ✅ Conexão via Evolution API
- ✅ Conexão via Meta Business API (OAuth)
- ✅ Múltiplas conexões simultâneas
- ✅ Chat em tempo real
- ✅ Envio e recebimento de mensagens
- ✅ Status de leitura e entrega

### 📊 Gestão e Analytics

- ✅ Dashboard com métricas em tempo real
- ✅ Gestão completa de leads
- ✅ Score e temperatura de leads
- ✅ Relatórios e analytics
- ✅ Performance da equipe
- ✅ Rastreamento de origem (pixels)

### 👥 Equipe e Workspace

- ✅ Sistema multi-tenant (workspaces)
- ✅ Gestão de membros e permissões
- ✅ Roles (owner, admin, member, seller)
- ✅ Dashboard individual por vendedor

### 🔄 Automações

- ✅ Respostas automáticas
- ✅ Qualificação automática
- ✅ Alertas configuráveis
- ✅ Templates de mensagens

### 💳 Assinatura

- ✅ Planos de assinatura (Stripe)
- ✅ Controle de acesso por plano
- ✅ Portal do cliente

## 🛠️ Tecnologias

### Frontend

- **React 18.3.1** - Biblioteca UI
- **TypeScript 5.8.3** - Tipagem estática
- **Vite 5.4.19** - Build tool
- **React Router 6.30.1** - Roteamento
- **TanStack Query 5.83.0** - Gerenciamento de estado servidor
- **Tailwind CSS 3.4.17** - Estilização
- **shadcn/ui** - Componentes UI
- **i18next** - Internacionalização (pt-BR, en, es)

### Backend

- **Supabase** - BaaS (PostgreSQL + Edge Functions)
- **Deno** - Runtime para Edge Functions
- **Stripe** - Pagamentos

### Integrações

- **Lovable AI Gateway** - IA para análise e chat
- **Evolution API** - Integração WhatsApp
- **Meta Business API** - Integração WhatsApp oficial

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ ([instalar com nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- npm ou yarn
- Conta no Supabase
- (Opcional) Conta no Stripe para pagamentos

### Passos

1. **Clone o repositório**

```bash
git clone https://github.com/andredrezin/Synapse_Cursor.git
cd Synapse_Cursor
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure as variáveis de ambiente**

```bash
# Veja ENV_EXAMPLE.md para detalhes
cp ENV_EXAMPLE.md .env
# Edite o .env com suas credenciais
```

4. **Inicie o servidor de desenvolvimento**

```bash
npm run dev
```

5. **Acesse a aplicação**

```
http://localhost:8080
```

## ⚙️ Configuração

### Variáveis de Ambiente

Veja o arquivo [ENV_EXAMPLE.md](./ENV_EXAMPLE.md) para a lista completa de variáveis de ambiente necessárias.

### Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute as migrations em `supabase/migrations/`
3. Configure as Edge Functions secrets no dashboard
4. Adicione as variáveis de ambiente necessárias

### WhatsApp

Configure uma das opções:

- **Evolution API**: Configure `EVOLUTION_API_URL` e `EVOLUTION_API_KEY`
- **Meta Business API**: Configure `META_APP_ID` e `META_APP_SECRET`

## 🚀 Uso

### Scripts Disponíveis

```bash
# Desenvolvimento (porta 8080)
npm run dev

# Build de produção
npm run build

# Build de desenvolvimento
npm run build:dev

# Linter
npm run lint

# Preview do build
npm run preview
```

### Primeiros Passos

1. **Crie uma conta** em `/auth`
2. **Complete o onboarding** em `/onboarding`
3. **Conecte seu WhatsApp** em `/dashboard/whatsapp`
4. **Configure a IA** em `/dashboard/ai-settings`
5. **Adicione conhecimento** em `/dashboard/knowledge`
6. **Comece a conversar!** 🎉

## 📚 Documentação

- [📊 Análise Completa do Projeto](./ANALISE_PROJETO.md)
- [🔐 Variáveis de Ambiente](./ENV_EXAMPLE.md)
- [🔗 Guia GitHub](./GUIA_GITHUB.md)
- [📖 Entenda os Repositórios](./ENTENDA_REPOSITORIOS.md)

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto é privado e proprietário.

## 🔗 Links Úteis

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

---

**Desenvolvido com ❤️ usando tecnologias modernas**
