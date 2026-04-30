# ERP — Arranque local (sin Docker)
# Ejecutar desde C:\ERP con: .\start.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ERP Local Dev" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── Backend ───────────────────────────────────────────────────────────────────
Write-Host "[1/3] Instalando dependencias Python..." -ForegroundColor Yellow
$backendDir = Join-Path $root "backend"
Set-Location $backendDir

# Crear venv si no existe
if (-not (Test-Path "venv")) {
    python -m venv venv
}

# Instalar deps (sin psycopg2 para SQLite local)
$pip = Join-Path $backendDir "venv\Scripts\pip.exe"
& $pip install -r requirements.txt --quiet 2>&1 | Out-Null
Write-Host "  OK" -ForegroundColor Green

# ── Frontend ──────────────────────────────────────────────────────────────────
Write-Host "[2/3] Instalando dependencias Node..." -ForegroundColor Yellow
$frontendDir = Join-Path $root "frontend"
Set-Location $frontendDir
if (-not (Test-Path "node_modules")) {
    npm install --silent
}
Write-Host "  OK" -ForegroundColor Green

# ── Arrancar ──────────────────────────────────────────────────────────────────
Write-Host "[3/3] Arrancando servicios..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Backend  → http://localhost:8000" -ForegroundColor Cyan
Write-Host "  API docs → http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "  Frontend → http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Ctrl+C para detener ambos" -ForegroundColor DarkGray
Write-Host ""

Set-Location $root

$uvicorn = Join-Path $backendDir "venv\Scripts\uvicorn.exe"

# Backend en background
$backendJob = Start-Job -ScriptBlock {
    param($backendDir, $uvicorn)
    Set-Location $backendDir
    & $uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
} -ArgumentList $backendDir, $uvicorn

# Esperar que el backend levante
Start-Sleep 3

# Frontend en foreground (bloquea hasta Ctrl+C)
Set-Location $frontendDir
try {
    npm run dev
} finally {
    # Al salir, matar el backend también
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Write-Host ""
    Write-Host "Servicios detenidos." -ForegroundColor DarkGray
}
