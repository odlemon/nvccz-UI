param([ValidateSet('api','staff','events','media')][string]$Service)
$ErrorActionPreference = 'Stop'
$uiRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$apiRoot = Join-Path (Split-Path $uiRoot) 'nvccz'
if ($Service -eq 'api') {
  Set-Location $apiRoot
  $env:PORT = '3019'
  $env:ALLOW_LOOPBACK_CORS = '1'
  $env:EVENTS_PORTAL_URL = 'http://localhost:3150'
  $env:FRONTEND_URL = 'http://localhost:3001'
  $env:API_PUBLIC_BASE_URL = 'http://localhost:3019/api'
  $env:EVENTS_MEDIA_PUBLIC_BASE_URL = 'http://localhost:3019/api/public-media'
  $env:MAIL_PROVIDER = 'zeptomail'
  & npm.cmd run dev
} elseif ($Service -eq 'media') {
  Set-Location $uiRoot
  & python -u scripts/_uat/run-events-media-tunnel.py --handoff 'C:\Users\lysp\.codex-vscode\attachments\db8834e9-fff2-42b6-b8b3-a8d9bded2392\Pasted text.txt'
} else {
  Set-Location $uiRoot
  $env:NEXT_PUBLIC_API_BASE_URL = 'http://127.0.0.1:3019/api'
  $env:NEXT_PUBLIC_EVENTS_PORTAL_URL = 'http://localhost:3150'
  & node scripts/run-portal-dev.mjs $Service --dist=events-local-3019
}
