# 🔐 Variáveis de Ambiente - Synapse

Este documento lista todas as variáveis de ambiente necessárias para o projeto.

## 📋 Variáveis do Frontend (.env)

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica-aqui
```

**Onde obter:**

- Acesse: https://app.supabase.com/project/[seu-projeto]/settings/api
- Copie a URL e a chave pública (anon key)

---

## 🔧 Variáveis das Edge Functions (Supabase Dashboard)

Configure essas variáveis no **Supabase Dashboard**:

1. Acesse: Edge Functions > Settings > Secrets
2. Adicione cada variável abaixo:

### Obrigatórias

```env
# OpenAI API Key (para substituir o Lovable)
OPENAI_API_KEY=sua-chave-openai-aqui

# URLs do Frontend
FRONTEND_URL=https://seu-dominio.com
SITE_URL=https://seu-dominio.com
```

### Opcionais (dependendo das integrações)

```env
# Evolution API (se usar Evolution API)
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-chave-evolution-aqui

# Meta Business API (se usar Meta Business API)
META_APP_ID=seu-app-id-meta
META_APP_SECRET=seu-app-secret-meta

# Stripe (para pagamentos)
STRIPE_SECRET_KEY=sk_test_sua-chave-secreta-aqui
```

---

## 📝 Variáveis Automáticas do Supabase

Essas são configuradas automaticamente pelo Supabase:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Não é necessário configurá-las manualmente!**

---

## 🚀 Configuração Rápida

### 1. Frontend (Local)

```bash
# 1. Copie o exemplo
cp ENV_EXAMPLE.md .env

# 2. Edite o .env com seus valores
# 3. Execute o projeto
npm run dev
```

### 2. Edge Functions (Supabase)

1. Acesse: https://app.supabase.com/project/[seu-projeto]
2. Vá em: Edge Functions > Settings > Secrets
3. Adicione as variáveis necessárias
4. Clique em "Save"

---

## ⚠️ Segurança

- ❌ **NUNCA** commite o arquivo `.env` com valores reais
- ✅ O arquivo `.env` já está no `.gitignore`
- ✅ Use variáveis de ambiente no Supabase para secrets
- ✅ Use diferentes chaves para desenvolvimento e produção

---

## 🔍 Verificação

Para verificar se as variáveis estão configuradas:

### Frontend

```typescript
console.log(import.meta.env.VITE_SUPABASE_URL);
```

### Edge Functions

```typescript
const apiKey = Deno.env.get("LOVABLE_API_KEY");
console.log("API Key configured:", !!apiKey);
```

---

## 📚 Documentação Adicional

- [Documentação do Supabase](https://supabase.com/docs)
- [Configuração de Edge Functions](https://supabase.com/docs/guides/functions/secrets)
- [Variáveis de Ambiente no Vite](https://vitejs.dev/guide/env-and-mode.html)
