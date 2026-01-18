# Script Completo para Configurar o Projeto no Vercel
# Este script automatiza todo o processo de configuração

Write-Host "🚀 Configuração Completa do Projeto no Vercel" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path "vercel.json")) {
    Write-Host "❌ Erro: Execute este script na raiz do projeto" -ForegroundColor Red
    exit 1
}

# Verificar se Vercel CLI está instalado
$vercelVersion = vercel --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Vercel CLI não encontrado!" -ForegroundColor Red
    Write-Host "Instale com: npm i -g vercel" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Vercel CLI encontrado: $vercelVersion" -ForegroundColor Green
Write-Host ""

# Valores encontrados no código (do arquivo setup_synapse_sales.ts)
$supabaseUrl = "https://bhaaunojqtxbfkrpgdix.supabase.co"
$supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoYWF1bm9qcXR4YmZrcnBnZGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NDY2MjksImV4cCI6MjA4MjAyMjYyOX0.cIQOA-8ROEtZfhELiPlFD6ob6eyL0vq51K9fSEenprg"

Write-Host "📋 Valores encontrados no código:" -ForegroundColor Yellow
Write-Host "   SUPABASE_URL: $supabaseUrl" -ForegroundColor Gray
Write-Host "   SUPABASE_ANON_KEY: (oculto por segurança)" -ForegroundColor Gray
Write-Host ""

$usarValoresEncontrados = Read-Host "Deseja usar estes valores? (S/N)"

if ($usarValoresEncontrados -ne "S" -and $usarValoresEncontrados -ne "s") {
    Write-Host ""
    Write-Host "Por favor, forneça os valores manualmente:" -ForegroundColor Yellow
    $supabaseUrl = Read-Host "SUPABASE_URL"
    $supabaseAnonKey = Read-Host "SUPABASE_ANON_KEY"
}

Write-Host ""
Write-Host "🔗 Verificando conexão com Vercel..." -ForegroundColor Cyan
$whoami = vercel whoami 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Logado como: $whoami" -ForegroundColor Green
} else {
    Write-Host "⚠️  Não está logado. Fazendo login..." -ForegroundColor Yellow
    vercel login
}

Write-Host ""
Write-Host "📤 Adicionando variáveis de ambiente no Vercel..." -ForegroundColor Cyan
Write-Host ""

# Adicionar VITE_SUPABASE_URL
Write-Host "1️⃣  Adicionando VITE_SUPABASE_URL..." -ForegroundColor Cyan
$supabaseUrl | vercel env add VITE_SUPABASE_URL production preview development 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ VITE_SUPABASE_URL adicionada" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  VITE_SUPABASE_URL pode já existir" -ForegroundColor Yellow
}

Write-Host ""

# Adicionar VITE_SUPABASE_PUBLISHABLE_KEY
Write-Host "2️⃣  Adicionando VITE_SUPABASE_PUBLISHABLE_KEY..." -ForegroundColor Cyan
$supabaseAnonKey | vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production preview development 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ VITE_SUPABASE_PUBLISHABLE_KEY adicionada" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  VITE_SUPABASE_PUBLISHABLE_KEY pode já existir" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Variáveis de ambiente configuradas!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Verifique as variáveis no dashboard:" -ForegroundColor White
Write-Host "   https://vercel.com/dashboard" -ForegroundColor Cyan
Write-Host "   Settings > Environment Variables" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Configure as Edge Functions no Supabase:" -ForegroundColor White
Write-Host "   https://app.supabase.com/project/[seu-projeto]" -ForegroundColor Cyan
Write-Host "   Edge Functions > Settings > Secrets" -ForegroundColor Cyan
Write-Host "   Adicione:" -ForegroundColor Cyan
Write-Host "   - FRONTEND_URL = https://synapsecursor.vercel.app" -ForegroundColor Gray
Write-Host "   - SITE_URL = https://synapsecursor.vercel.app" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Faça um novo deploy:" -ForegroundColor White
Write-Host "   vercel --prod" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Teste a aplicação:" -ForegroundColor White
Write-Host "   https://synapsecursor.vercel.app" -ForegroundColor Cyan
Write-Host ""

$fazerDeploy = Read-Host "Deseja fazer o deploy agora? (S/N)"

if ($fazerDeploy -eq "S" -or $fazerDeploy -eq "s") {
    Write-Host ""
    Write-Host "🚀 Fazendo deploy..." -ForegroundColor Cyan
    vercel --prod
} else {
    Write-Host ""
    Write-Host "💡 Execute 'vercel --prod' quando estiver pronto!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Configuração concluída!" -ForegroundColor Green




