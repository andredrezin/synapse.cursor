# 🚀 Guia de Deploy no Vercel - SynapseWhats

Este guia explica o que falta fazer para fazer o deploy do projeto no Vercel.

## ✅ O que já está pronto

- ✅ Projeto React/Vite configurado
- ✅ Scripts de build configurados (`npm run build`)
- ✅ Arquivo `vercel.json` criado com configurações adequadas
- ✅ `.gitignore` configurado corretamente

## 📋 O que falta fazer

### 1. Configurar Variáveis de Ambiente no Vercel

Você precisa adicionar as seguintes variáveis de ambiente no painel do Vercel:

#### Variáveis Obrigatórias:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica-aqui
```

**Como configurar:**
1. Acesse seu projeto no [Vercel Dashboard](https://vercel.com/dashboard)
2. Vá em **Settings** > **Environment Variables**
3. Adicione cada variável acima
4. Selecione os ambientes (Production, Preview, Development)
5. Clique em **Save**

**Onde obter as credenciais do Supabase:**
- Acesse: https://app.supabase.com/project/[seu-projeto]/settings/api
- Copie a **URL** e a **chave pública** (anon key)

### 2. Conectar o Repositório ao Vercel

#### Opção A: Via Dashboard do Vercel (Recomendado)

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub/GitLab/Bitbucket
3. Clique em **Add New Project**
4. Importe o repositório do GitHub
5. O Vercel detectará automaticamente que é um projeto Vite
6. Configure as variáveis de ambiente (passo 1)
7. Clique em **Deploy**

#### Opção B: Via CLI do Vercel

```bash
# Instalar Vercel CLI (se ainda não tiver)
npm i -g vercel

# Fazer login
vercel login

# Deploy (na pasta do projeto)
cd synapsewhats1-main
vercel

# Para produção
vercel --prod
```

### 3. Configurar Domínio (Opcional)

1. No painel do Vercel, vá em **Settings** > **Domains**
2. Adicione seu domínio personalizado
3. Configure os registros DNS conforme instruções

### 4. Verificar Configurações do Build

O arquivo `vercel.json` já está configurado com:
- ✅ Comando de build: `npm run build`
- ✅ Diretório de saída: `dist`
- ✅ Rewrites para SPA (Single Page Application)
- ✅ Cache headers para assets estáticos

### 5. Configurar Edge Functions do Supabase

⚠️ **IMPORTANTE**: As Edge Functions do Supabase precisam ser configuradas separadamente no Supabase Dashboard:

1. Acesse: https://app.supabase.com/project/[seu-projeto]
2. Vá em **Edge Functions** > **Settings** > **Secrets**
3. Adicione as variáveis necessárias:
   - `LOVABLE_API_KEY`
   - `FRONTEND_URL` (URL do seu deploy no Vercel)
   - `SITE_URL` (URL do seu deploy no Vercel)
   - Outras variáveis conforme necessário (veja `ENV_EXAMPLE.md`)

### 6. Atualizar URLs nas Edge Functions

Após fazer o deploy no Vercel, você precisará atualizar a variável `FRONTEND_URL` nas Edge Functions do Supabase com a URL do seu deploy no Vercel.

## 🔍 Verificação Pós-Deploy

Após o deploy, verifique:

1. ✅ A aplicação carrega corretamente
2. ✅ As variáveis de ambiente estão sendo lidas (`console.log(import.meta.env.VITE_SUPABASE_URL)`)
3. ✅ A conexão com o Supabase funciona
4. ✅ As Edge Functions estão acessíveis
5. ✅ O roteamento SPA funciona (navegue entre páginas)

## 🐛 Troubleshooting

### Erro: "Environment variable not found"
- Verifique se as variáveis foram adicionadas no Vercel Dashboard
- Certifique-se de que o prefixo `VITE_` está presente
- Faça um novo deploy após adicionar variáveis

### Erro: "Build failed"
- Verifique os logs de build no Vercel
- Certifique-se de que todas as dependências estão no `package.json`
- Execute `npm run build` localmente para testar

### Erro: "404 on routes"
- Verifique se o arquivo `vercel.json` está na raiz do projeto
- Certifique-se de que os rewrites estão configurados corretamente

### Erro: "CORS" ou problemas com Supabase
- Verifique se a URL do frontend está configurada no Supabase Dashboard
- Adicione a URL do Vercel nas configurações de CORS do Supabase

## 📚 Recursos Úteis

- [Documentação do Vercel](https://vercel.com/docs)
- [Deploy de projetos Vite no Vercel](https://vercel.com/docs/frameworks/vite)
- [Variáveis de Ambiente no Vercel](https://vercel.com/docs/environment-variables)
- [Documentação do Supabase](https://supabase.com/docs)

## ✅ Checklist Final

- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Repositório conectado ao Vercel
- [ ] Primeiro deploy realizado com sucesso
- [ ] Edge Functions configuradas no Supabase
- [ ] `FRONTEND_URL` atualizada nas Edge Functions
- [ ] Testes de funcionalidade realizados
- [ ] Domínio personalizado configurado (opcional)

---

**Pronto para fazer deploy!** 🎉

Após seguir este guia, seu projeto estará rodando no Vercel.




