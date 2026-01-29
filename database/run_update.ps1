# ========================================
# Script PowerShell para atualizar tabela geradores
# Data: 2026-01-19
# ========================================

$DB_URL = "postgres://postgres:bxch64noKxVDUGj3BaSsPYDJAJH6Ozf5skHFaROthSaEpJnmA2ZN0LPCnWeBYicQ@147.93.71.233:6543/postgres"
$SQL_FILE = "update_geradores_table.sql"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ATUALIZANDO TABELA GERADORES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o psql está instalado
try {
    $psqlVersion = psql --version 2>&1
    Write-Host "✓ PostgreSQL Client detectado: $psqlVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ PostgreSQL Client (psql) não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Para instalar o psql no Windows:" -ForegroundColor Yellow
    Write-Host "1. Download: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "2. Ou use: winget install PostgreSQL.PostgreSQL" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Verificar se o arquivo SQL existe
if (-not (Test-Path $SQL_FILE)) {
    Write-Host "✗ Arquivo SQL não encontrado: $SQL_FILE" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Arquivo SQL encontrado: $SQL_FILE" -ForegroundColor Green
Write-Host ""

# Executar o script SQL
Write-Host "Executando script SQL..." -ForegroundColor Yellow
Write-Host ""

try {
    $env:PGPASSWORD = "bxch64noKxVDUGj3BaSsPYDJAJH6Ozf5skHFaROthSaEpJnmA2ZN0LPCnWeBYicQ"
    psql -h 147.93.71.233 -p 6543 -U postgres -d postgres -f $SQL_FILE
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "✓ ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "✗ Erro ao executar script SQL" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "✗ Erro: $_" -ForegroundColor Red
    exit 1
} finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
