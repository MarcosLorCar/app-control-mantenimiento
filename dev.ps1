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
    $ok = docker compose exec -T db pg_isready -U postgres -d infragest_dev 2>$null
    if ($LASTEXITCODE -eq 0) { break }
    if ($i -eq $max) { Write-Error "DB did not become ready in time."; exit 1 }
    Start-Sleep -Seconds 1
}

Write-Host "→ Waiting for host port to accept connections..." -ForegroundColor Cyan
# Hardcode to your mapped compose port to avoid string parsing issues
$hostPort = 5434 
$portReady = $false

for ($i = 1; $i -le $max; $i++) {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        # Use an explicit IP address to bypass localhost IPv6/IPv4 lookup delays
        $client.Connect('127.0.0.1', $hostPort) 
        $client.Close()
        $portReady = $true
        break
    } catch {
        Start-Sleep -Seconds 1
    }
}
if (-not $portReady) { Write-Error "DB host port $hostPort did not become reachable in time."; exit 1 }
Write-Host "  DB ready." -ForegroundColor Green

Write-Host "→ Running migrations..." -ForegroundColor Cyan
Push-Location backend
npx prisma migrate dev
Pop-Location

$answer = Read-Host "→ Run seed? This will wipe and recreate all dev data [y/N]"
if ($answer -match '^[Yy]$') {
    Write-Host "→ Seeding..." -ForegroundColor Cyan
    Push-Location backend
    npx prisma db seed
    Pop-Location
}

Write-Host "→ Starting dev servers..." -ForegroundColor Cyan
npm run dev
