$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

Write-Host 'He thong dang ky hoc phan - khoi dong...' -ForegroundColor Cyan

if (-not (Test-Path 'node_modules')) {
    Write-Host 'Dang cai dat thu vien...' -ForegroundColor Yellow
    npm install
}

$port = 3000
Write-Host "Dang mo he thong tai http://localhost:$port" -ForegroundColor Green
Start-Process "http://localhost:$port"
node server.js
