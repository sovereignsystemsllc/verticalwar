# deploy.ps1 — Sovereign V4 Fast Deploy
# Builds, packs dist/ into a single tar.gz, SCPs it, SSH-extracts on server.
# Much faster than SCP of individual files.

$KEY      = "C:\Users\76com\.ssh\rika"
$PORT     = "18765"
$HOST     = "u2222-vxkuggohnxin@gvam1020.siteground.biz"
$REMOTE   = "~/www/verticalwar.com/public_html"
$ARCHIVE  = "$env:TEMP\vw_deploy.tar.gz"

Write-Host "[1/4] Building..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed." -ForegroundColor Red; exit 1 }

Write-Host "[2/4] Packing dist..." -ForegroundColor Cyan
tar -czf $ARCHIVE -C dist .
if ($LASTEXITCODE -ne 0) { Write-Host "Pack failed." -ForegroundColor Red; exit 1 }

$sizeMB = [math]::Round((Get-Item $ARCHIVE).Length / 1MB, 2)
Write-Host "  -> $ARCHIVE ($sizeMB MB)" -ForegroundColor Gray

Write-Host "[3/4] Uploading archive (enter passphrase when prompted)..." -ForegroundColor Cyan
scp -i $KEY -P $PORT -o StrictHostKeyChecking=no $ARCHIVE "${HOST}:~/vw_deploy.tar.gz"
if ($LASTEXITCODE -ne 0) { Write-Host "Upload failed." -ForegroundColor Red; exit 1 }

Write-Host "[4/4] Extracting on server (enter passphrase again)..." -ForegroundColor Cyan
ssh -i $KEY -p $PORT -o StrictHostKeyChecking=no $HOST "cd $REMOTE && tar xzf ~/vw_deploy.tar.gz && rm ~/vw_deploy.tar.gz"
if ($LASTEXITCODE -ne 0) { Write-Host "Extract failed." -ForegroundColor Red; exit 1 }

Remove-Item $ARCHIVE -ErrorAction SilentlyContinue
Write-Host "Deployed." -ForegroundColor Green
