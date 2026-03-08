# deploy.ps1 — Sovereign V4 Deploy
# .\deploy.ps1        → smart (manifest-diff, SFTP batch, ~10s)
# .\deploy.ps1 -Full  → full scp -r (slow but uploads everything)
param([switch]$Full)

$KEY = "C:\Users\76com\.ssh\rika"
$PORT = "18765"
$REMOTE_USER = "u2222-vxkuggohnxin@gvam1020.siteground.biz"
$REMOTE_ROOT = "/www/verticalwar.com/public_html"
$SCP_TARGET = "${REMOTE_USER}:${REMOTE_ROOT}"
$MANIFEST = ".\dist\.vite\manifest.json"
$LAST_MANIFEST = ".\.last_manifest.json"

# ── 1. BUILD ──────────────────────────────────────────────────────
Write-Host "[1/3] Building..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed." -ForegroundColor Red; exit 1 }

# ── 2. DIFF ───────────────────────────────────────────────────────
Write-Host "[2/3] Resolving changes..." -ForegroundColor Cyan

if ($Full -or -not (Test-Path $LAST_MANIFEST) -or -not (Test-Path $MANIFEST)) {
    # Full mode — skip images (they never change), upload all code
    Write-Host "  Mode: FULL (all code files, images skipped)" -ForegroundColor Yellow
    $toUpload = Get-ChildItem -Path .\dist -Recurse -File |
    Where-Object { $_.Extension -notmatch '\.(png|jpg|jpeg|webp|gif|svg|pdf|zip)$' } |
    ForEach-Object { $_.FullName.Replace((Resolve-Path .\dist).Path + '\', '').Replace('\', '/') }
}
else {
    # Smart mode — manifest diff
    $curr = Get-Content $MANIFEST | ConvertFrom-Json
    $prev = Get-Content $LAST_MANIFEST | ConvertFrom-Json

    $toUpload = [System.Collections.Generic.List[string]]::new()

    $curr.PSObject.Properties | ForEach-Object {
        $key = $_.Name
        $entry = $_.Value
        $prevProp = $prev.PSObject.Properties[$key]
        $prevFile = if ($prevProp) { $prevProp.Value.file } else { $null }

        if ($entry.file -and $entry.file -ne $prevFile) {
            $toUpload.Add($entry.file)
            if ($entry.css) { $entry.css | ForEach-Object { $toUpload.Add($_) } }
            if ($entry.src -and $entry.isEntry) {
                $htmlPath = $entry.src
                if (Test-Path ".\dist\$($htmlPath.Replace('/', '\'))") { $toUpload.Add($htmlPath) }
            }
        }
    }

    $toUpload = $toUpload | Select-Object -Unique

    if ($toUpload.Count -eq 0) {
        Write-Host "  Nothing changed — already up to date." -ForegroundColor Green
        Copy-Item $MANIFEST $LAST_MANIFEST -Force
        exit 0
    }
    Write-Host "  $($toUpload.Count) file(s) to upload:" -ForegroundColor Gray
    $toUpload | ForEach-Object { Write-Host "    + $_" -ForegroundColor DarkGray }
}

# ── 3. UPLOAD ─────────────────────────────────────────────────────
Write-Host "[3/3] Uploading..." -ForegroundColor Cyan

if ($Full) {
    # One scp call — user enters passphrase once
    scp -i $KEY -P $PORT -o StrictHostKeyChecking=no -r .\dist\* $SCP_TARGET
    if ($LASTEXITCODE -ne 0) { Write-Host "Upload failed." -ForegroundColor Red; exit 1 }
}
else {
    # SFTP batch — one auth prompt, all files in one session
    $batchLines = foreach ($rel in $toUpload) {
        $local = (Resolve-Path ".\dist\$($rel.Replace('/', '\'))").Path.Replace('\', '/')
        $remoteDir = if ($rel -match '/') {
            "$REMOTE_ROOT/$($rel -replace '/[^/]+$', '')/"
        }
        else { "$REMOTE_ROOT/" }
        "-mkdir $remoteDir"   # leading dash = ignore error if dir exists
        "put $local $remoteDir"
    }

    $batch = [System.IO.Path]::GetTempFileName() + ".sftp"
    $batchLines | Set-Content -Path $batch -Encoding ASCII

    sftp -i $KEY -P $PORT -o StrictHostKeyChecking=no -b $batch $REMOTE_USER
    $code = $LASTEXITCODE
    Remove-Item $batch -ErrorAction SilentlyContinue
    if ($code -ne 0) { Write-Host "Upload failed." -ForegroundColor Red; exit 1 }
}

# ── 4. SNAPSHOT ───────────────────────────────────────────────────
Copy-Item $MANIFEST $LAST_MANIFEST -Force
Write-Host "Deploy complete." -ForegroundColor Green
