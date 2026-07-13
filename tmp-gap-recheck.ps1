$ErrorActionPreference = "Continue"
$base = "http://31.220.82.129:3009/api"
$login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -Body '{"email":"admin@nts.com","password":"admin123"}' -ContentType "application/json"
$token = $login.data.token
if (-not $token) { $token = $login.token }
if (-not $token) { $token = $login.data.accessToken }
$h = @{ Authorization = "Bearer $token" }
$mid = "cmrgm59xg00i3kt4malx3fx46"

$model = Invoke-RestMethod -Uri "$base/v1/fpa/models/$mid" -Headers $h
$mods = Invoke-RestMethod -Uri "$base/v1/fpa/models/$mid/modules" -Headers $h
$lis = Invoke-RestMethod -Uri "$base/v1/fpa/models/$mid/line-items" -Headers $h
$val = Invoke-RestMethod -Uri "$base/v1/fpa/models/$mid/validate" -Method POST -Headers $h -Body "{}" -ContentType "application/json"
$graph = Invoke-RestMethod -Uri "$base/v1/fpa/models/$mid/dependency-graph" -Headers $h
$dims = Invoke-RestMethod -Uri "$base/v1/fpa/dimensions" -Headers $h

$ver = $model.data.defaultVersionId
if (-not $ver -and $model.data.versions) { $ver = $model.data.versions[0].id }

$publishStatus = $null
$publishBody = $null
$publishCode = $null
try {
  $pubResp = Invoke-WebRequest -Uri "$base/v1/fpa/versions/$ver/publish" -Method POST -Headers $h -Body '{"notes":"gap-recheck"}' -ContentType "application/json" -UseBasicParsing
  $publishStatus = [int]$pubResp.StatusCode
  $publishBody = $pubResp.Content | ConvertFrom-Json
} catch {
  $publishStatus = [int]$_.Exception.Response.StatusCode
  try {
    $sr = New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())
    $publishBody = ($sr.ReadToEnd() | ConvertFrom-Json)
    $publishCode = $publishBody.code
  } catch {}
}

$firstLi = @($lis.data) | Select-Object -First 1
$withModule = @($lis.data | Where-Object { $_.moduleId })
$out = [ordered]@{
  modelStatus = $model.data.status
  publishedAt = $model.data.publishedAt
  publishedByName = $model.data.publishedByName
  publishedById = $model.data.publishedById
  modulesCount = @($mods.data).Count
  moduleSample = @($mods.data | Select-Object -First 2 | ForEach-Object { @{ id=$_.id; name=$_.name; children=@( $_.children ).Count; lineItemCount=$_.lineItemCount } })
  lineItemsCount = @($lis.data).Count
  lineItemsWithModuleId = $withModule.Count
  firstLi = @{ id=$firstLi.id; name=$firstLi.name; moduleId=$firstLi.moduleId; moduleName=$firstLi.moduleName; formulas=@( $firstLi.formulas ).Count }
  validatePassed = $val.data.passed
  validateErrors = @($val.data.errors | ForEach-Object { @{ code=$_.code; severity=$_.severity; message=$_.message } })
  validateWarnings = @($val.data.warnings | ForEach-Object { @{ code=$_.code; severity=$_.severity; message=$_.message } })
  graphModules = @($graph.data.modules).Count
  graphEdges = @($graph.data.edges).Count
  graphCircular = $graph.data.circular
  dimensionsCount = @($dims.data).Count
  publishHttp = $publishStatus
  publishCode = $publishCode
  publishSuccess = $publishBody.success
  publishPublishedByName = $publishBody.data.publishedByName
  versionId = $ver
}
$out | ConvertTo-Json -Depth 8 | Set-Content -Encoding utf8 "c:\Users\lysp\Downloads\nvccz-new\docs\_gap-recheck.json"
$out | ConvertTo-Json -Depth 8
