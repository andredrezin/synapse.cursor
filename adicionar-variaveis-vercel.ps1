# Script para adicionar variáveis de ambiente no Vercel
# Execute este script na pasta do projeto

Write-Host "🔧 Configurando variáveis de ambiente no Vercel..." -ForegroundColor Cyan
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path "vercel.json")) {
    Write-Host "❌ Erro: Execute este script na raiz do projeto (onde está o vercel.json)" -ForegroundColor Red
    exit 1
}

# Solicitar valores ao usuário
Write-Host "Por favor, forneça os valores das variáveis:" -ForegroundColor Yellow
Write-Host ""

$supabaseUrl = Read-Host "1. Cole o valor de SUPABASE_URL"
$supabaseAnonKey = Read-Host "2. Cole o valor de SUPABASE_ANON_KEY"

if ([string]::IsNullOrWhiteSpace($supabaseUrl) -or [string]::IsNullOrWhiteSpace($supabaseAnonKey)) {
    Write-Host "❌ Erro: Valores não podem estar vazios" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📤 Adicionando variáveis no Vercel..." -ForegroundColor Cyan

# Adicionar VITE_SUPABASE_URL
Write-Host "Adicionando VITE_SUPABASE_URL..." -ForegroundColor Gray
$result1 = vercel env add VITE_SUPABASE_URL production preview development 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ VITE_SUPABASE_URL adicionada" -ForegroundColor Green
} else {
    Write-Host "⚠️  VITE_SUPABASE_URL pode já existir ou houve erro" -ForegroundColor Yellow
    Write-Host $result1
}

# Adicionar VITE_SUPABASE_PUBLISHABLE_KEY
Write-Host "Adicionando VITE_SUPABASE_PUBLISHABLE_KEY..." -ForegroundColor Gray
$result2 = vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production preview development 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ VITE_SUPABASE_PUBLISHABLE_KEY adicionada" -ForegroundColor Green
} else {
    Write-Host "⚠️  VITE_SUPABASE_PUBLISHABLE_KEY pode já existir ou houve erro" -ForegroundColor Yellow
    Write-Host $result2
}

Write-Host ""
Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "O Vercel CLI pode solicitar que você cole os valores manualmente." -ForegroundColor Yellow
Write-Host "Se isso acontecer, cole os valores quando solicitado." -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Alternativa: Adicione manualmente no dashboard:" -ForegroundColor Cyan
Write-Host "   https://vercel.com/dashboard" -ForegroundColor Cyan
Write-Host "   Settings > Environment Variables" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Variáveis para adicionar:" -ForegroundColor Cyan
Write-Host "   VITE_SUPABASE_URL = $supabaseUrl" -ForegroundColor White
Write-Host "   VITE_SUPABASE_PUBLISHABLE_KEY = $supabaseAnonKey" -ForegroundColor White
Write-Host ""
Write-Host "✅ Após adicionar, faça um novo deploy!" -ForegroundColor Green




