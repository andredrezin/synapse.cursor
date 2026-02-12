# 🚀 Adicionar Variáveis de Ambiente no Vercel

## Método 1: Via Dashboard (Mais Fácil) ⭐ RECOMENDADO

1. **Acesse:** https://vercel.com/dashboard
2. **Selecione o projeto:** synapse.cursor (ou Synapse1-main)
3. **Vá em:** Settings > Environment Variables
4. **Clique em:** "Add New"
5. **Adicione as duas variáveis:**

   **Variável 1:**
   - Key: `VITE_SUPABASE_URL`
   - Value: Cole o valor de `SUPABASE_URL` da sua lista
   - Environments: ✅ Production ✅ Preview ✅ Development
   - Clique em "Save"

   **Variável 2:**
   - Key: `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Value: Cole o valor de `SUPABASE_ANON_KEY` da sua lista
   - Environments: ✅ Production ✅ Preview ✅ Development
   - Clique em "Save"

6. **Faça um novo deploy:**
   - Vá em "Deployments"
   - Clique nos três pontos do último deploy
   - Selecione "Redeploy"

## Método 2: Via CLI (PowerShell)

Execute na pasta do projeto:

```powershell
cd "C:\Users\User\Downloads\Programas e  Drives\Lovable\repositorio GIT hub\Synapse-git-andredrezin\Synapse1-main"

# Adicionar VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_URL production preview development
# Quando solicitado, cole o valor de SUPABASE_URL e pressione Enter

# Adicionar VITE_SUPABASE_PUBLISHABLE_KEY
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production preview development
# Quando solicitado, cole o valor de SUPABASE_ANON_KEY e pressione Enter

# Fazer deploy
vercel --prod
```

## Método 3: Usar o Script Automatizado

Execute o script PowerShell:

```powershell
cd "C:\Users\User\Downloads\Programas e  Drives\Lovable\repositorio GIT hub\Synapse-git-andredrezin\Synapse1-main"
.\adicionar-variaveis-vercel.ps1
```

O script vai pedir os valores e tentar adicionar automaticamente.

## 📋 Resumo das Variáveis

| Variável no Vercel | Valor (copie da sua lista) |
|-------------------|---------------------------|
| `VITE_SUPABASE_URL` | Valor de `SUPABASE_URL` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Valor de `SUPABASE_ANON_KEY` |

## ✅ Verificação

Após adicionar, verifique:

1. Acesse: https://synapsecursor.vercel.app
2. Abra o console do navegador (F12)
3. Execute:
```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? '✅ Configurada' : '❌ Não configurada');
```

Se aparecer `undefined`, as variáveis não foram configuradas corretamente.




