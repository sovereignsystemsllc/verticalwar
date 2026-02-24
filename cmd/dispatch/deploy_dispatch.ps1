# ==============================================================================
# SOVEREIGN DEPLOYMENT ROUTINE
# Target: /cmd/dispatch/index.html + Context Map
# ==============================================================================
param (
    [switch]$Help
)

# Load environment configuration
if (Test-Path "..\..\.env") {
    . "..\..\.env"
}
else {
    Write-Host "[ERROR] .env file not found. Ensure FTP credentials exist." -ForegroundColor Red
    exit 1
}

# FTP Configuration
$ftpServer = $env:FTP_HOST
$ftpUser = $env:FTP_USER
$ftpPass = $env:FTP_PASS

if (-not $ftpServer -or -not $ftpUser -or -not $ftpPass) {
    Write-Host "[ERROR] Missing FTP credentials in .env file." -ForegroundColor Red
    exit 1
}

$webClient = New-Object System.Net.WebClient
$webClient.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)

Write-Host "===========================" -ForegroundColor Cyan
Write-Host " INITIATING FORGE UPLINK" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan

# 1. Deploy Dispatch HTML
$localFile = ".\index.html"
$remoteDir = "ftp://$ftpServer/public_html/"
$remoteUri = "${remoteDir}cmd/dispatch/index.html"

# Verify directory exists remotely (or rely on FTP auto-create if configured, mostly assumes dir exists or we create it via panel. For pure script, we push file to path assuming dir is made by panel or we ignore errors). We'll push index directly.
try {
    Write-Host "[+] Transmitting: /cmd/dispatch/index.html"
    $webClient.UploadFile($remoteUri, $localFile)
    Write-Host "    [SUCCESS] Transcription uploaded." -ForegroundColor Green
}
catch {
    Write-Host "    [ERROR] Failed to upload. Ensure /cmd/dispatch/ exists on the server." -ForegroundColor Red
    Write-Host "    Exception: $_" -ForegroundColor DarkGray
}

Write-Host " Deployment Cycle Complete. " -ForegroundColor Cyan
