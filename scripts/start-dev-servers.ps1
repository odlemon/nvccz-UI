# Start the local staff stack on the ports used by .env.local.
# Usage: powershell -ExecutionPolicy Bypass -File scripts/start-dev-servers.ps1

$ErrorActionPreference = "Stop"
$backend = "C:\Users\lysp\Downloads\nvccz"
$frontend = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

function Test-ListeningPort([int]$port) {
  return [bool](Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue)
}

& (Join-Path $backend "scripts\start-local-mysql.bat")

if (-not (Test-ListeningPort 3019)) {
  $env:PORT = "3019"
  Start-Process npm.cmd -ArgumentList @("run", "dev") -WorkingDirectory $backend -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $env:TEMP "nvccz-local-api-3019.out.log") `
    -RedirectStandardError (Join-Path $env:TEMP "nvccz-local-api-3019.err.log") | Out-Null
  Write-Host "Started staff API on port 3019."
} else {
  Write-Host "Staff API already listening on port 3019."
}

if (-not (Test-ListeningPort 3001)) {
  Start-Process npm.cmd -ArgumentList @("run", "dev") -WorkingDirectory $frontend -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $env:TEMP "nvccz-local-fe-3001.out.log") `
    -RedirectStandardError (Join-Path $env:TEMP "nvccz-local-fe-3001.err.log") | Out-Null
  Write-Host "Started staff frontend on port 3001."
} else {
  Write-Host "Staff frontend already listening on port 3001."
}

Write-Host "Frontend: http://localhost:3001"
Write-Host "API: http://127.0.0.1:3019/health"
