# ZIP-STRIKE DEPLOYMENT // THE TANK PROTOCOL
Write-Host "[1/4] COMPILING VITE PAYLOAD..." -ForegroundColor Magenta
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "BUILD FAILED. ABORTING STRIKE." -ForegroundColor Red
    exit 1
}

Write-Host "`n[2/4] FILTERING AND COMPRESSING PAYLOAD (ZIP-STRIKE)..." -ForegroundColor Magenta
if (Test-Path -Path deployment_smart.zip) { Remove-Item -Path deployment_smart.zip -Force }
if (Test-Path -Path dist_temp) { Remove-Item -Path dist_temp -Recurse -Force }
Copy-Item -Path dist -Destination dist_temp -Recurse

# Nuke the massive 1.5GB image directory from the payload before zipping
if (Test-Path -Path dist_temp\assets\images) { Remove-Item -Path dist_temp\assets\images -Recurse -Force }

Compress-Archive -Path dist_temp\* -DestinationPath deployment_smart.zip -Force
Remove-Item -Path dist_temp -Recurse -Force

Write-Host "`n[3/4] EXECUTING ZIP-STRIKE DEPLOYMENT VIA HEADLESS SSH (NODEJS)..." -ForegroundColor Magenta
node deploy.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "DEPLOY SCRIPT FAILED. ABORTING STRIKE." -ForegroundColor Red
    exit 1
}

Write-Host "`n[OK] ZIP-STRIKE SECURED. VERTICAL WAR V4 IS LIVE." -ForegroundColor Green
if (Test-Path -Path deployment_smart.zip) { Remove-Item -Path deployment_smart.zip -Force }
