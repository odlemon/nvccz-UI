$count = (Import-Csv "$PSScriptRoot\manifest.csv").Count
if ($count -ne 33) { throw "Expected 33 manifest rows; found $count" }
Write-Output "Manifest rows: $count"
Write-Output "Runtime verification requires DATABASE_URL and the backend runner: npx ts-node --transpile-only scripts/fixed-asset-import/import.ts"
