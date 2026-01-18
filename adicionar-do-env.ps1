# Script para ler valores de um arquivo .env e adicionar no Vercel
# Útil quando você não consegue copiar do Supabase

Write-Host "📁 Adicionar Variáveis do arquivo .env para o Vercel" -ForegroundColor Cyan
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path "vercel.json")) {
    Write-Host "❌ Erro: Execute este script na raiz do projeto" -ForegroundColor Red
    exit 1
}

# Verificar se existe arquivo .env
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Arquivo .env não encontrado!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Crie um arquivo .env na raiz do projeto com:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "VITE_SUPABASE_URL=https://seu-projeto.supabase.co" -ForegroundColor White
    Write-Host "VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-aqui" -ForegroundColor White
    Write-Host ""
    Write-Host "Depois execute este script novamente." -ForegroundColor Yellow
    exit 1
}

# Ler arquivo .env
Write-Host "📖 Lendo arquivo .env..." -ForegroundColor Cyan
$envContent = Get-Content ".env" | Where-Object { $_ -match "^VITE_" }

$supabaseUrl = ""
$supabaseKey = ""

foreach ($line in $envContent) {
    if ($line -match "^VITE_SUPABASE_URL=(.+)") {
        $supabaseUrl = $matches[1].Trim()
    }
    if ($line -match "^VITE_SUPABASE_PUBLISHABLE_KEY=(.+)") {
        $supabaseKey = $matches[1].Trim()
    }
}

if ([string]::IsNullOrWhiteSpace($supabaseUrl)) {
    Write-Host "❌ Erro: VITE_SUPABASE_URL não encontrado no .env" -ForegroundColor Red
    exit 1
}

if ([string]::IsNullOrWhiteSpace($supabaseKey)) {
    Write-Host "❌ Erro: VITE_SUPABASE_PUBLISHABLE_KEY não encontrado no .env" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Valores encontrados no .env" -ForegroundColor Green
Write-Host ""
Write-Host "📤 Adicionando no Vercel..." -ForegroundColor Cyan
Write-Host ""

# Adicionar VITE_SUPABASE_URL
Write-Host "Adicionando VITE_SUPABASE_URL..." -ForegroundColor Gray
$supabaseUrl | vercel env add VITE_SUPABASE_URL production preview development

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ VITE_SUPABASE_URL adicionada" -ForegroundColor Green
} else {
    Write-Host "⚠️  VITE_SUPABASE_URL pode já existir" -ForegroundColor Yellow
}

Write-Host ""

# Adicionar VITE_SUPABASE_PUBLISHABLE_KEY
Write-Host "Adicionando VITE_SUPABASE_PUBLISHABLE_KEY..." -ForegroundColor Gray
$supabaseKey | vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production preview development

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ VITE_SUPABASE_PUBLISHABLE_KEY adicionada" -ForegroundColor Green
} else {
    Write-Host "⚠️  VITE_SUPABASE_PUBLISHABLE_KEY pode já existir" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Processo concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Faça um novo deploy para aplicar as mudanças:" -ForegroundColor Yellow
Write-Host "   vercel --prod" -ForegroundColor White




