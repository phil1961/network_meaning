<#
# ─────────────────────────────────────────────
# File: bin\recycle_apppool_v1.0.ps1
# File Version: 1.0.0
# ─────────────────────────────────────────────
.SYNOPSIS
    Recycles the NetworkMeaning IIS application pool, so the site picks up
    changes to server.js, src\, public\index.html, web.config or .env.

.DESCRIPTION
    The node process behind the site is started by IIS and keeps running
    the code it started with. After any change, run this, then hard refresh
    the page (Ctrl+Shift+R). What it prints is also written to
    logs\recycle.log.

.CHANGELOG
    v1.0 - Initial version
#>

$PoolName = "NetworkMeaning"
$LogPath  = "D:\Projects\network-meaning\logs"

# Self-elevate if not already running as Administrator
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]"Administrator")) {
    Start-Process powershell -Verb RunAs -Wait -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    exit
}

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Start-Transcript -Path "$LogPath\recycle.log" -Force | Out-Null
try {
    Write-Host "`n==> Loading IIS PowerShell module" -ForegroundColor Cyan
    Import-Module WebAdministration -ErrorAction Stop
    Write-Host "`n==> Recycling app pool: $PoolName" -ForegroundColor Cyan
    Restart-WebAppPool -Name $PoolName
    Start-Sleep -Seconds 2
    $r = Invoke-WebRequest -Uri "http://localhost/network_meaning/health" -Headers @{ Host = "www.toughguycomputing.com" } -UseBasicParsing -TimeoutSec 90
    Write-Host "  $($r.StatusCode) $($r.Content)"
    Write-Host "`nDone. Hard refresh the page (Ctrl+Shift+R)."
} catch {
    Write-Host "`nFAILED: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    Stop-Transcript | Out-Null
}
Start-Sleep -Seconds 2
