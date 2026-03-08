# deploy.ps1 — Sovereign V4 Deploy
# Usage:
#   .\deploy.ps1          → smart deploy (only files changed since last git commit)
#   .\deploy.ps1 -Full    → full deploy (everything in dist/)
param([switch]$Full)

$KEY = "C:\Users\76com\.ssh\rika"
$PORT = "18765"
$TARGET = "u2222-vxkuggohnxin@gvam1020.siteground.biz:~/www/verticalwar.com/public_html"

# ── 1. BUILD ──────────────────────────────────────────────────────────────────
Write-Host "[1/3] Building..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed." -ForegroundColor Red; exit 1 }

# ── 2. DECIDE WHAT TO UPLOAD ──────────────────────────────────────────────────
Write-Host "[2/3] Resolving files to upload..." -ForegroundColor Cyan

if ($Full) {
    Write-Host "  Mode: FULL — uploading all dist/ contents." -ForegroundColor Yellow
    $filesToUpload = @(".\dist\*")
}
else {
    # Read Vite manifest to map source entry names -> hashed dist filenames
    $manifestPath = ".\dist\.vite\manifest.json"
    if (-not (Test-Path $manifestPath)) {
        Write-Host "  Manifest not found — falling back to full deploy." -ForegroundColor Yellow
        $filesToUpload = @(".\dist\*")
    }
    else {
        $manifest = Get-Content $manifestPath | ConvertFrom-Json

        # Get source files changed in the last git commit
        $changedSources = git diff --name-only HEAD~1 HEAD 2>$null
        if (-not $changedSources) {
            # Fallback: uncommitted changes
            $changedSources = git diff --name-only
        }

        Write-Host "  Changed source files:" -ForegroundColor Gray
        $changedSources | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }

        # Map changed sources -> dist output files via manifest
        $distFiles = @()
        $manifest.PSObject.Properties | ForEach-Object {
            $entry = $_.Value
            $srcKey = $_.Name  # e.g. "admin/curate.html"
            $isChanged = $changedSources | Where-Object { $_ -like "*$($srcKey.Replace('/', '\'))*" -or $_ -like "*$srcKey*" }
            if ($isChanged) {
                if ($entry.file) { $distFiles += ".\dist\$($entry.file)" }
                if ($entry.css) { $entry.css | ForEach-Object { $distFiles += ".\dist\$_" } }
                # Also include the HTML entry itself
                $htmlFile = ".\dist\$srcKey"
                if (Test-Path $htmlFile) { $distFiles += $htmlFile }
            }
        }

        if ($distFiles.Count -eq 0) {
            Write-Host "  No mapped dist files found — falling back to full deploy." -ForegroundColor Yellow
            $filesToUpload = @(".\dist\*")
        }
        else {
            Write-Host "  Uploading $($distFiles.Count) changed file(s):" -ForegroundColor Gray
            $distFiles | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
            $filesToUpload = $distFiles
        }
    }
}

# ── 3. UPLOAD ─────────────────────────────────────────────────────────────────
Write-Host "[3/3] Uploading..." -ForegroundColor Cyan

if ($Full -or ($filesToUpload.Count -eq 1 -and $filesToUpload[0] -eq ".\dist\*")) {
    # Full mode: single scp -r call, fast
    scp -i $KEY -P $PORT -o StrictHostKeyChecking=no -r .\dist\* $TARGET
    if ($LASTEXITCODE -ne 0) { Write-Host "Upload failed." -ForegroundColor Red; exit 1 }
}
else {
    # Smart mode: upload each resolved dist file preserving relative path
    foreach ($file in $filesToUpload) {
        if (-not (Test-Path $file)) { Write-Host "  Skipping (not found): $file" -ForegroundColor DarkGray; continue }
        $rel = $file.Replace(".\dist\", "").Replace("\", "/")
        $relDir = ($rel -split "/")[0..($rel.Split("/").Count - 2)] -join "/"
        $remote = if ($relDir) { "$TARGET/$relDir/" } else { "$TARGET/" }
        scp -i $KEY -P $PORT -o StrictHostKeyChecking=no $file $remote
        if ($LASTEXITCODE -ne 0) { Write-Host "Upload failed: $file" -ForegroundColor Red; exit 1 }
    }
}

Write-Host "Deploy complete." -ForegroundColor Green
