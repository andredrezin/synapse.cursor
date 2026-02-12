# 🚀 Quick Start - Synapse

Guia rápido para começar a desenvolver no projeto.

## ⚡ Setup Rápido (5 minutos)

### 1. Clone e Instale

```bash
git clone https://github.com/andredrezin/Synapse_Cursor.git
cd Synapse_Cursor
npm install
```

### 2. Configure Variáveis de Ambiente

```bash
# Crie o arquivo .env na raiz do projeto
touch .env

# Adicione as variáveis mínimas necessárias:
```

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
```

**Onde obter:**
- Acesse: https://app.supabase.com/project/[seu-projeto]/settings/api
- Copie a URL e a chave pública (anon key)

### 3. Execute o Projeto

```bash
npm run dev
```

### 4. Acesse

Abra seu navegador em: **http://localhost:8080**

---

## 📋 Checklist de Configuração

### Frontend ✅
- [ ] Node.js 18+ instalado
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` configurado
- [ ] Servidor rodando (`npm run dev`)

### Supabase (Backend)
- [ ] Projeto criado no Supabase
- [ ] Migrations executadas
- [ ] Edge Functions secrets configuradas
- [ ] Variáveis de ambiente configuradas

### Integrações (Opcional)
- [ ] WhatsApp configurado (Evolution ou Meta)
- [ ] Stripe configurado (se usar pagamentos)
- [ ] Lovable AI Key configurada

---

## 🎯 Primeiros Passos no Código

### Estrutura Principal

```
src/
├── pages/          # Páginas/rotas da aplicação
├── components/     # Componentes React
├── hooks/         # Custom hooks
├── contexts/      # Contextos (Auth, Subscription)
└── lib/           # Utilitários
```

### Arquivos Importantes

- `src/App.tsx` - Rotas principais
- `src/main.tsx` - Entry point
- `src/contexts/AuthContext.tsx` - Autenticação
- `src/pages/Dashboard.tsx` - Dashboard principal

### Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Linter
npm run lint

# Preview do build
npm run preview
```

---

## 🔧 Configuração do VS Code

### Extensões Recomendadas

O arquivo `.vscode/extensions.json` já está configurado. Instale as extensões recomendadas:

1. Abra VS Code
2. Pressione `Ctrl+Shift+P` (ou `Cmd+Shift+P` no Mac)
3. Digite "Extensions: Show Recommended Extensions"
4. Instale todas as extensões sugeridas

### Extensões Principais

- **ESLint** - Linting de código
- **Prettier** - Formatação automática
- **Tailwind CSS IntelliSense** - Autocomplete do Tailwind
- **TypeScript** - Suporte ao TypeScript

---

## 📚 Próximos Passos

1. **Explore o Código**
   - Veja `src/pages/Dashboard.tsx` para entender a estrutura
   - Explore `src/components/` para ver os componentes disponíveis
   - Leia `ANALISE_PROJETO.md` para visão geral completa

2. **Configure o Supabase**
   - Execute as migrations em `supabase/migrations/`
   - Configure as Edge Functions no dashboard
   - Veja `ENV_EXAMPLE.md` para todas as variáveis

3. **Teste Funcionalidades**
   - Crie uma conta em `/auth`
   - Complete o onboarding
   - Conecte um WhatsApp
   - Teste o chat

---

## 🐛 Problemas Comuns

### Erro: "Cannot find module"
```bash
# Limpe e reinstale dependências
rm -rf node_modules package-lock.json
npm install
```

### Erro: "VITE_SUPABASE_URL is not defined"
- Verifique se o arquivo `.env` existe na raiz
- Verifique se as variáveis começam com `VITE_`
- Reinicie o servidor (`npm run dev`)

### Erro: "Port 8080 already in use"
```bash
# Use outra porta
npm run dev -- --port 3000
```

### Build falha
```bash
# Limpe o cache e rebuild
rm -rf dist node_modules/.vite
npm run build
```

---

## 📖 Documentação Completa

- [README.md](./README.md) - Documentação principal
- [ANALISE_PROJETO.md](./ANALISE_PROJETO.md) - Análise completa
- [ENV_EXAMPLE.md](./ENV_EXAMPLE.md) - Variáveis de ambiente
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Guia de contribuição

---

## 💡 Dicas

- Use `Ctrl+Space` para autocomplete no VS Code
- Use `F12` para ir para definição de função/componente
- Use `Ctrl+Click` para navegar entre arquivos
- Use `Ctrl+Shift+F` para buscar em todo o projeto

---

## 🆘 Precisa de Ajuda?

1. Verifique a documentação completa
2. Procure por issues similares no GitHub
3. Abra uma nova issue com detalhes do problema

---

**Boa sorte e happy coding! 🚀**



