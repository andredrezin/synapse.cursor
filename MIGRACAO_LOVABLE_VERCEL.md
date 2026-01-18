# 🚀 Guia Completo: Migração do Lovable para Vercel

Este guia te ajuda a migrar completamente seu projeto do Lovable para o Vercel.

## ✅ O que já foi feito

- ✅ Arquivo `vercel.json` criado e configurado
- ✅ URLs hardcoded do Lovable atualizadas para usar variáveis de ambiente
- ✅ Scripts automatizados criados
- ✅ Configurações otimizadas para produção

## 📋 Checklist de Migração

### 1. Variáveis de Ambiente no Vercel ⭐ OBRIGATÓRIO

**Valores encontrados no seu código:**
- `VITE_SUPABASE_URL`: `https://bhaaunojqtxbfkrpgdix.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**Como adicionar:**

#### Opção A: Via Dashboard (Recomendado)
1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto: **synapse.cursor**
3. Vá em: **Settings > Environment Variables**
4. Adicione:
   - Key: `VITE_SUPABASE_URL`
   - Value: `https://bhaaunojqtxbfkrpgdix.supabase.co`
   - Environments: ✅ Production ✅ Preview ✅ Development
   - Save
   
   - Key: `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoYWF1bm9qcXR4YmZrcnBnZGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NDY2MjksImV4cCI6MjA4MjAyMjYyOX0.cIQOA-8ROEtZfhELiPlFD6ob6eyL0vq51K9fSEenprg`
   - Environments: ✅ Production ✅ Preview ✅ Development
   - Save

#### Opção B: Via Script Automatizado
```powershell
cd synapsewhats1-main
.\configurar-vercel-completo.ps1
```

### 2. Configurar Edge Functions no Supabase ⭐ OBRIGATÓRIO

As Edge Functions precisam saber a URL do seu frontend no Vercel.

1. **Acesse:** https://app.supabase.com/project/[seu-projeto]
2. **Vá em:** Edge Functions > Settings > Secrets
3. **Adicione/Atualize:**

```env
FRONTEND_URL=https://synapsecursor.vercel.app
SITE_URL=https://synapsecursor.vercel.app
```

**Por que isso é importante:**
- Emails de assinatura precisam de links corretos
- Callbacks do WhatsApp OAuth precisam redirecionar corretamente
- Links de convite de equipe precisam funcionar

### 3. Fazer Deploy no Vercel

#### Opção A: Deploy Automático (via Git)
Se seu repositório está conectado ao Vercel:
- Faça um commit e push
- O Vercel faz deploy automaticamente

#### Opção B: Deploy Manual
```powershell
cd synapsewhats1-main
vercel --prod
```

### 4. Verificar Deploy

1. **Acesse:** https://synapsecursor.vercel.app
2. **Abra o console do navegador (F12)**
3. **Execute:**
```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? '✅ OK' : '❌ Faltando');
```

Se aparecer `undefined`, as variáveis não foram configuradas corretamente.

## 🔧 Mudanças Realizadas no Código

### URLs Atualizadas

**Antes (Lovable):**
```typescript
const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://leadflux.lovable.app";
```

**Depois (Vercel):**
```typescript
const frontendUrl = Deno.env.get("FRONTEND_URL") || Deno.env.get("SITE_URL") || "https://synapsecursor.vercel.app";
```

**Arquivos atualizados:**
- `supabase/functions/whatsapp-oauth-callback/index.ts`
- `supabase/functions/send-subscription-email/index.ts`

### Configuração do Vite

O `lovable-tagger` já está configurado para rodar apenas em desenvolvimento:
```typescript
plugins: [react(), mode === "development" && componentTagger()].filter(Boolean)
```

Isso significa que em produção no Vercel, o tagger não será incluído.

## 📊 Comparação: Lovable vs Vercel

| Aspecto | Lovable | Vercel |
|---------|---------|--------|
| **Deploy** | Automático | Manual ou via Git |
| **Variáveis** | Dashboard do Lovable | Dashboard do Vercel |
| **Domínio** | `.lovable.app` | `.vercel.app` ou custom |
| **Build** | Automático | Configurável via `vercel.json` |
| **Edge Functions** | Supabase | Supabase (mesmo) |
| **Custo** | Pago | Gratuito (com limites) |

## 🎯 Vantagens do Vercel

- ✅ **Controle total** sobre o código
- ✅ **Deploy via Git** (CI/CD automático)
- ✅ **Domínio customizado** fácil
- ✅ **Performance** otimizada
- ✅ **Escalabilidade** automática
- ✅ **Gratuito** para projetos pessoais

## ⚠️ Importante Saber

### O que continua funcionando:
- ✅ Todas as funcionalidades do projeto
- ✅ Edge Functions do Supabase
- ✅ Integração com WhatsApp
- ✅ Sistema de autenticação
- ✅ Banco de dados Supabase

### O que precisa ser configurado:
- ⚠️ Variáveis de ambiente no Vercel
- ⚠️ URLs nas Edge Functions do Supabase
- ⚠️ Domínio customizado (opcional)

## 🐛 Troubleshooting

### Problema: Variáveis não aparecem
**Solução:** Faça um novo deploy após adicionar variáveis

### Problema: Links quebrados em emails
**Solução:** Configure `FRONTEND_URL` e `SITE_URL` nas Edge Functions

### Problema: Erros de CORS
**Solução:** Verifique se a URL do Vercel está nas configurações do Supabase

### Problema: Build falha
**Solução:** Verifique os logs de build no Vercel Dashboard

## 📚 Recursos

- [Dashboard do Vercel](https://vercel.com/dashboard)
- [Documentação do Vercel](https://vercel.com/docs)
- [Supabase Dashboard](https://app.supabase.com)
- [Guia de Deploy](./GUIA_DEPLOY_VERCEL.md)

## ✅ Checklist Final

- [ ] Variáveis de ambiente adicionadas no Vercel
- [ ] Edge Functions configuradas no Supabase
- [ ] Deploy realizado com sucesso
- [ ] Aplicação testada em produção
- [ ] Links e redirecionamentos funcionando
- [ ] Emails com links corretos
- [ ] Domínio customizado configurado (opcional)

---

**🎉 Seu projeto está pronto para rodar no Vercel!**

Após seguir este guia, você terá um frontend totalmente funcional no Vercel, independente do Lovable.




