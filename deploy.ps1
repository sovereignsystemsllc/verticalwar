# deploy.ps1 — Sovereign V4 Deploy (smart: only uploads changed files)
$KEY = "C:\Users\76com\.ssh\rika"
$PORT = "18765"
$TARGET = "u2222-vxkuggohnxin@gvam1020.siteground.biz:~/www/verticalwar.com/public_html"
$STAMP = ".\.last_deploy"

# ── 1. BUILD ──────────────────────────────────────────────────────────────────
Write-Host "[1/3] Building..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed." -ForegroundColor Red; exit 1 }

# ── 2. FIND CHANGED FILES ─────────────────────────────────────────────────────
Write-Host "[2/3] Detecting changed files..." -ForegroundColor Cyan

$lastDeploy = if (Test-Path $STAMP) { (Get-Item $STAMP).LastWriteTime } else { [DateTime]::MinValue }

$changed = Get-ChildItem -Path .\dist -Recurse -File |
Where-Object { $_.LastWriteTime -gt $lastDeploy }

if ($changed.Count -eq 0) {
    Write-Host "Nothing changed since last deploy. Exiting." -ForegroundColor Yellow
    exit 0
}

Write-Host "  $($changed.Count) file(s) to upload:" -ForegroundColor Gray
$changed | ForEach-Object { Write-Host "  + $($_.FullName.Replace((Get-Location).Path + '\dist\', ''))" -ForegroundColor Gray }

# ── 3. UPLOAD ONLY CHANGED FILES ──────────────────────────────────────────────
Write-Host "[3/3] Uploading (enter passphrase when prompted)..." -ForegroundColor Cyan

foreach ($file in $changed) {
    $rel = $file.FullName.Replace((Get-Location).Path + '\dist\', '')
    $relDir = Split-Path $rel -Parent
    $remPath = if ($relDir) { "$TARGET/$($relDir.Replace('\', '/'))/" } else { "$TARGET/" }

    scp -i $KEY -P $PORT -o StrictHostKeyChecking=no $file.FullName $remPath
    if ($LASTEXITCODE -ne 0) { Write-Host "Upload failed: $rel" -ForegroundColor Red; exit 1 }
}

# ── STAMP ─────────────────────────────────────────────────────────────────────
New-Item -Path $STAMP -ItemType File -Force | Out-Null

Write-Host "Deployed $($changed.Count) file(s)." -ForegroundColor Green
