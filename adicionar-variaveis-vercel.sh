#!/bin/bash
# Script para adicionar variáveis de ambiente no Vercel
# Execute este script na pasta do projeto

echo "🔧 Configurando variáveis de ambiente no Vercel..."
echo ""

# Verificar se está no diretório correto
if [ ! -f "vercel.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto (onde está o vercel.json)"
    exit 1
fi

# Solicitar valores ao usuário
echo "Por favor, forneça os valores das variáveis:"
echo ""

read -p "1. Cole o valor de SUPABASE_URL: " supabase_url
read -p "2. Cole o valor de SUPABASE_ANON_KEY: " supabase_anon_key

if [ -z "$supabase_url" ] || [ -z "$supabase_anon_key" ]; then
    echo "❌ Erro: Valores não podem estar vazios"
    exit 1
fi

echo ""
echo "📤 Adicionando variáveis no Vercel..."

# Adicionar VITE_SUPABASE_URL
echo "Adicionando VITE_SUPABASE_URL..."
echo "$supabase_url" | vercel env add VITE_SUPABASE_URL production preview development

# Adicionar VITE_SUPABASE_PUBLISHABLE_KEY
echo "Adicionando VITE_SUPABASE_PUBLISHABLE_KEY..."
echo "$supabase_anon_key" | vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production preview development

echo ""
echo "✅ Variáveis adicionadas!"
echo "⚠️  IMPORTANTE: Faça um novo deploy para aplicar as mudanças!"
echo "   Execute: vercel --prod"




