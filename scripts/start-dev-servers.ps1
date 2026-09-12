# Start local dev stack: MySQL + backend API + frontend (staff portal).
# Usage: powershell -ExecutionPolicy Bypass -File scripts/start-dev-servers.ps1
# Or:    npm run start:servers   (from nvccz-new)

$ErrorActionPreference = "Stop"
$BE = "C:\Users\lysp\Downloads\nvccz"
$FE = $PSScriptRoot + "\.."
$FE = (Resolve-Path $FE).Path

Write-Host "=== 1/3 MySQL ===" -ForegroundColor Cyan
& "$BE\scripts\start-local-mysql.bat"
Start-Sleep -Seconds 2

Write-Host "=== 2/3 Backend (port 3009) ===" -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "cd '$BE'; Write-Host 'Backend API :3009' -ForegroundColor Green; npm run dev"
)

Write-Host "=== 3/3 Frontend staff portal (port 3000) ===" -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "cd '$FE'; Write-Host 'Frontend :3000' -ForegroundColor Green; npm run dev"
)

Write-Host ""
Write-Host "Started MySQL + backend + frontend in separate windows." -ForegroundColor Green
Write-Host "  API:  http://127.0.0.1:3009/health"
Write-Host "  UI:   http://localhost:3000"
Write-Host "  Login: admin@nts.com / admin123"
Write-Host ""
Write-Host "Other portals: npm run dev:lp | dev:investee | dev:apply (separate terminals)"
