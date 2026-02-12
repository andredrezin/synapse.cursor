# ⚡ Início Rápido - Deploy no Vercel

## 🎯 3 Passos para Ter Seu Frontend no Vercel

### Passo 1: Adicionar Variáveis no Vercel (2 min)

**Acesse:** https://vercel.com/dashboard > Seu Projeto > Settings > Environment Variables

**Adicione:**

```
VITE_SUPABASE_URL=https://bhaaunojqtxbfkrpgdix.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoYWF1bm9qcXR4YmZrcnBnZGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NDY2MjksImV4cCI6MjA4MjAyMjYyOX0.cIQOA-8ROEtZfhELiPlFD6ob6eyL0vq51K9fSEenprg
```

✅ Marque: Production, Preview, Development

### Passo 2: Configurar Edge Functions (1 min)

**Acesse:** https://app.supabase.com > Edge Functions > Settings > Secrets

**Adicione:**

```
FRONTEND_URL=https://synapsecursor.vercel.app
SITE_URL=https://synapsecursor.vercel.app
```

### Passo 3: Fazer Deploy (1 min)

```powershell
cd Synapse1-main
vercel --prod
```

**OU** faça um commit e push (se Git está conectado)

---

## ✅ Pronto!

Acesse: **https://synapsecursor.vercel.app**

---

## 📚 Documentação Completa

- **[README_VERCEL.md](./README_VERCEL.md)** - Visão geral
- **[MIGRACAO_LOVABLE_VERCEL.md](./MIGRACAO_LOVABLE_VERCEL.md)** - Guia completo
- **[configurar-vercel-completo.ps1](./configurar-vercel-completo.ps1)** - Script automatizado

---

**Tempo total: 4 minutos!** 🚀




