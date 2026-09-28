# Starts the local test stack detached (so it survives a dropped session): MySQL, backend :3009, upload mock :3050, staff portal :3120.
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
$be = 'C:\Users\lysp\Downloads\nvccz'; $fe = 'C:\Users\lysp\Downloads\nvccz-new'
function Up($p) { [bool](Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue) }
if (-not (Up 3306)) { Start-Process -WindowStyle Hidden -FilePath 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe' -ArgumentList '--defaults-file=C:\mysql-local-data\my.ini','--console'; Start-Sleep 12 }
if (-not (Up 3009)) { Start-Process -WindowStyle Hidden -WorkingDirectory $be -FilePath cmd.exe -ArgumentList '/c','npm run dev > %TEMP%\be-dev.log 2>&1' }
if (-not (Up 3050)) { Start-Process -WindowStyle Hidden -WorkingDirectory $be -FilePath cmd.exe -ArgumentList '/c','npm run upload:mock:local > %TEMP%\upload-mock.log 2>&1' }
if (-not (Up 3120)) {
  $env:NEXT_PUBLIC_PORTAL='staff'; $env:NEXT_DIST_DIR='.next-staff-review'; $env:NEXT_PUBLIC_LP_PORTAL_URL='http://localhost:3110'; $env:NEXT_PUBLIC_INVESTEE_PORTAL_URL='http://localhost:3120'; $env:NEXT_PUBLIC_APPLY_PORTAL_URL='http://localhost:3130'; $env:NEXT_PUBLIC_VENDOR_PORTAL_URL='http://localhost:3140'; $env:NEXT_PUBLIC_EVENTS_PORTAL_URL='http://localhost:3150'
  Start-Process -WindowStyle Hidden -WorkingDirectory $fe -FilePath cmd.exe -ArgumentList '/c','npx next dev -p 3120 > %TEMP%\fe-dev.log 2>&1'
}
