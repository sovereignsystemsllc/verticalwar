Write-Host "==========================================" -ForegroundColor Yellow
Write-Host "        [ FSK-YOKO NETWORK SNIPER ]       " -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host "Scanning local listening ports..." -ForegroundColor DarkGray

$connections = Get-NetTCPConnection -State Listen | Where-Object LocalAddress -Match '.*' | Sort-Object LocalPort

$data = @()
foreach ($conn in $connections) {
    try {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction Stop
        $data += [PSCustomObject] @{
            Port = $conn.LocalPort
            PID = $conn.OwningProcess
            Process = $proc.ProcessName
            # Path = $proc.Path # Can sometimes be noisy or require admin
        }
    } catch {
        # Process might have exited or permission denied
    }
}

# Remove duplicates (some processes listen on both IPv4 and IPv6)
$data = $data | Sort-Object Port, PID -Unique

$data | Format-Table Port, PID, Process -AutoSize

Write-Host "------------------------------------------" -ForegroundColor Yellow
$target = Read-Host "Enter the PID to CUT (or press ENTER to abort)"

if ([string]::IsNullOrWhiteSpace($target)) {
    Write-Host "Aborting. Sniper returning to overwatch." -ForegroundColor Green
    exit
}

try {
    Stop-Process -Id $target -Force -ErrorAction Stop
    Write-Host "TARGET NEUTRALIZED: PID $target eliminated." -ForegroundColor Red
} catch {
    Write-Host "FAILED TO CUT CONNECTION: $_" -ForegroundColor Red
}
