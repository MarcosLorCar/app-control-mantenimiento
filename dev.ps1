#!/usr/bin/env pwsh
# Usage: .\dev.ps1
# Starts the dev DB, runs any pending migrations, then launches backend + frontend.

Set-StrictMode -Off
$ErrorActionPreference = 'Stop'

Write-Host "→ Starting DB container..." -ForegroundColor Cyan
docker compose up -d

Write-Host "→ Waiting for DB to be ready..." -ForegroundColor Cyan
$max = 30
for ($i = 1; $i -le $max; $i++) {
    $ok = docker compose exec db pg_isready -U postgres -d infragest_dev 2>$null
    if ($LASTEXITCODE -eq 0) { break }
    if ($i -eq $max) { Write-Error "DB did not become ready in time."; exit 1 }
    Start-Sleep -Seconds 1
}
Write-Host "  DB ready." -ForegroundColor Green

Write-Host "→ Running migrations..." -ForegroundColor Cyan
Push-Location backend
npx prisma migrate dev
Pop-Location

Write-Host "→ Starting dev servers..." -ForegroundColor Cyan
npm run dev
