# ZIP-STRIKE DEPLOYMENT // THE TANK PROTOCOL
Write-Host "[1/4] COMPILING VITE PAYLOAD..." -ForegroundColor Magenta
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "BUILD FAILED. ABORTING STRIKE." -ForegroundColor Red
    exit 1
}

Write-Host "`n[2/4] FILTERING AND COMPRESSING PAYLOAD (ZIP-STRIKE)..." -ForegroundColor Magenta
if (Test-Path -Path build.zip) { Remove-Item -Path build.zip -Force }
if (Test-Path -Path dist_temp) { Remove-Item -Path dist_temp -Recurse -Force }
Copy-Item -Path dist -Destination dist_temp -Recurse

# Nuke the massive 1.5GB image directory from the payload before zipping
if (Test-Path -Path dist_temp\assets\images) { Remove-Item -Path dist_temp\assets\images -Recurse -Force }

Compress-Archive -Path dist_temp\* -DestinationPath build.zip -Force
Remove-Item -Path dist_temp -Recurse -Force

Write-Host "`n[3/4] UPLOADING PAYLOAD TO SITEGROUND (EXPECT SSH PASSPHRASE PROMPT)..." -ForegroundColor Magenta
scp -i C:\Users\76com\.ssh\rika -P 18765 -o StrictHostKeyChecking=no build.zip u2222-vxkuggohnxin@ssh.verticalwar.com:www/verticalwar.com/build.zip

if ($LASTEXITCODE -ne 0) {
    Write-Host "SCP FAILED. ABORTING STRIKE." -ForegroundColor Red
    exit 1
}

Write-Host "`n[4/4] EXECUTING REMOTE UNPACK OVER PUBLIC_HTML (EXPECT SSH PASSPHRASE PROMPT)..." -ForegroundColor Magenta
ssh -i C:\Users\76com\.ssh\rika -p 18765 -o StrictHostKeyChecking=no u2222-vxkuggohnxin@ssh.verticalwar.com "cd www/verticalwar.com; unzip -o build.zip -d public_html/; rm build.zip"

if ($LASTEXITCODE -ne 0) {
    Write-Host "REMOTE UNPACK FAILED." -ForegroundColor Red
    exit 1
}

Write-Host "`n[OK] ZIP-STRIKE SECURED. VERTICAL WAR V4 IS LIVE." -ForegroundColor Green
if (Test-Path -Path build.zip) { Remove-Item -Path build.zip -Force }
