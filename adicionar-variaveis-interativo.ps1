# Script Interativo para Adicionar Variáveis no Vercel
# Permite digitar os valores manualmente

Write-Host "🚀 Adicionar Variáveis de Ambiente no Vercel" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path "vercel.json")) {
    Write-Host "❌ Erro: Execute este script na raiz do projeto" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Você precisará dos seguintes valores do Supabase:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. SUPABASE_URL (Project URL)" -ForegroundColor White
Write-Host "   Exemplo: https://xxxxx.supabase.co" -ForegroundColor Gray
Write-Host ""
Write-Host "2. SUPABASE_ANON_KEY (anon public key)" -ForegroundColor White
Write-Host "   Exemplo: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Dica: Se não conseguir copiar, você pode DIGITAR manualmente" -ForegroundColor Cyan
Write-Host ""
Write-Host "Onde encontrar:" -ForegroundColor Yellow
Write-Host "  https://app.supabase.com/project/[seu-projeto]/settings/api" -ForegroundColor Gray
Write-Host ""

$continuar = Read-Host "Pressione ENTER quando estiver pronto para continuar..."

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Adicionar VITE_SUPABASE_URL
Write-Host "1️⃣  Adicionando VITE_SUPABASE_URL..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Cole ou digite o valor de SUPABASE_URL:" -ForegroundColor Yellow
Write-Host "(Formato: https://xxxxx.supabase.co)" -ForegroundColor Gray
Write-Host ""

$result1 = vercel env add VITE_SUPABASE_URL production preview development

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ VITE_SUPABASE_URL adicionada com sucesso!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️  Pode já existir ou houve um erro" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Adicionar VITE_SUPABASE_PUBLISHABLE_KEY
Write-Host "2️⃣  Adicionando VITE_SUPABASE_PUBLISHABLE_KEY..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Cole ou digite o valor de SUPABASE_ANON_KEY:" -ForegroundColor Yellow
Write-Host "(Formato: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)" -ForegroundColor Gray
Write-Host ""

$result2 = vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production preview development

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ VITE_SUPABASE_PUBLISHABLE_KEY adicionada com sucesso!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️  Pode já existir ou houve um erro" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 Processo concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Yellow
Write-Host "   1. Verifique as variáveis no dashboard: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "   2. Faça um novo deploy ou aguarde o próximo commit" -ForegroundColor White
Write-Host "   3. Teste a aplicação: https://synapsecursor.vercel.app" -ForegroundColor White
Write-Host ""




