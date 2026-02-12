# ✅ Solução: Adicionar Variáveis SEM Poder Copiar

Como o Supabase não permite copiar, você pode **DIGITAR manualmente** os valores. Aqui estão as opções:

## 🎯 Opção 1: Via Dashboard do Vercel (Mais Fácil) ⭐

1. **Abra duas abas:**
   - Aba 1: Supabase Dashboard (onde você vê os valores)
   - Aba 2: Vercel Dashboard

2. **No Vercel:**
   - Vá em: Settings > Environment Variables
   - Clique em: "Add New"

3. **Digite manualmente:**
   - **Key:** `VITE_SUPABASE_URL`
   - **Value:** Digite o valor que você vê no Supabase (mesmo que não possa copiar)
   - **Environments:** Marque Production, Preview, Development
   - Clique em "Save"

4. **Repita para a segunda:**
   - **Key:** `VITE_SUPABASE_PUBLISHABLE_KEY`
   - **Value:** Digite o valor de `SUPABASE_ANON_KEY` que você vê
   - **Environments:** Marque Production, Preview, Development
   - Clique em "Save"

## 🎯 Opção 2: Via CLI Interativo

Execute este comando na pasta do projeto:

```powershell
cd "C:\Users\User\Downloads\Programas e  Drives\Lovable\repositorio GIT hub\Synapse-git-andredrezin\Synapse1-main"
.\adicionar-variaveis-interativo.ps1
```

O script vai pedir para você **digitar** os valores quando solicitado.

## 🎯 Opção 3: Criar Arquivo .env e Usar Script

1. **Crie um arquivo `.env` na raiz do projeto:**
   - Abra o Bloco de Notas
   - Digite manualmente:
   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-aqui
   ```
   - Salve como `.env` na pasta do projeto

2. **Execute o script que vou criar** para ler do arquivo e adicionar no Vercel

## 💡 Dicas para Digitar Valores Longos

### Para SUPABASE_URL:
- Formato: `https://xxxxx.supabase.co`
- Geralmente é curto e fácil de digitar

### Para SUPABASE_ANON_KEY:
- Formato: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (muito longo)
- **Dica:** Use um editor de texto temporário:
  1. Abra o Bloco de Notas
  2. Digite o valor lá (pode verificar enquanto digita)
  3. Depois copie do Bloco de Notas e cole no Vercel

## 🔍 Onde Encontrar os Valores

### No Supabase Dashboard:

1. **Acesse:** https://app.supabase.com/project/[seu-projeto]/settings/api

2. **SUPABASE_URL:**
   - Procure por: **Project URL** ou **Project API URL**
   - Está na seção "Project API keys"
   - Formato: `https://xxxxx.supabase.co`

3. **SUPABASE_ANON_KEY:**
   - Procure por: **anon public** ou **anon key**
   - Clique no ícone 👁️ para revelar
   - Está na seção "Project API keys"
   - Formato: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (muito longo)

## ⚠️ Importante

- Mesmo que não possa copiar diretamente, você pode **ver** os valores
- **Digite manualmente** - é trabalhoso mas funciona!
- Após adicionar, **faça um novo deploy** no Vercel

## ✅ Verificação Após Adicionar

1. Acesse: https://synapsecursor.vercel.app
2. Abra o console (F12)
3. Execute:
```javascript
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Key:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? '✅ OK' : '❌ Faltando');
```

Se aparecer `undefined`, as variáveis não foram configuradas corretamente.

---

**Recomendação:** Use a **Opção 1 (Dashboard)** - é mais visual e fácil de verificar enquanto digita!




