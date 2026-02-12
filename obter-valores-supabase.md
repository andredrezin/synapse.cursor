# 🔍 Como Obter os Valores do Supabase

Se o Supabase não permite copiar diretamente, aqui estão alternativas:

## Método 1: Via Settings > API (Recomendado)

1. **Acesse:** https://app.supabase.com/project/[seu-projeto]/settings/api
2. **Na seção "Project API keys":**
   - Você verá **Project URL** e **anon public** key
   - Clique no **ícone de olho** 👁️ para revelar a chave
   - Use **Ctrl+A** para selecionar tudo e **Ctrl+C** para copiar

## Método 2: Via Console do Navegador

1. Abra o **Console do Navegador** (F12)
2. No Supabase Dashboard, execute no console:
```javascript
// Isso pode funcionar se os valores estiverem no DOM
document.querySelector('[data-value]')?.getAttribute('data-value')
```

## Método 3: Criar Arquivo .env Local

1. **Crie um arquivo `.env` na raiz do projeto:**
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-aqui
```

2. **Preencha manualmente digitando** (mesmo que não possa copiar)
3. **Use o script** que vou criar para ler desse arquivo e adicionar no Vercel

## Método 4: Usar o Vercel CLI Interativamente

O Vercel CLI permite digitar os valores manualmente:

```powershell
cd Synapse1-main

# Adicionar VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_URL production preview development
# Quando pedir, DIGITE manualmente o valor (não precisa copiar)

# Adicionar VITE_SUPABASE_PUBLISHABLE_KEY  
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production preview development
# Quando pedir, DIGITE manualmente o valor
```

## Método 5: Via Dashboard do Vercel (Digitar Manualmente)

1. **Acesse:** https://vercel.com/dashboard
2. **Vá em:** Settings > Environment Variables
3. **Clique em:** "Add New"
4. **Digite manualmente** os valores (mesmo que não possa copiar do Supabase)

## 📝 Onde Encontrar os Valores no Supabase

### SUPABASE_URL:
- Vá em: **Settings > API**
- Procure por: **Project URL** ou **Project API URL**
- Formato: `https://xxxxx.supabase.co`

### SUPABASE_ANON_KEY:
- Vá em: **Settings > API**  
- Procure por: **anon public** ou **anon key**
- Clique no ícone 👁️ para revelar
- Formato: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (muito longo)

## 💡 Dica

Se você conseguir **ver** os valores na tela (mesmo que não possa copiar), você pode:
1. **Anotar em um papel temporariamente**
2. **Digitar manualmente** no Vercel Dashboard
3. **Deletar o papel** após configurar

---

**Próximo passo:** Vou criar um script que ajuda a adicionar via CLI de forma interativa!




