<#
# ─────────────────────────────────────────────
# File: bin\setup_network_meaning_v1.0.ps1
# File Version: 1.0.0
# ─────────────────────────────────────────────
.SYNOPSIS
    Mounts the network-meaning app under IIS as /network_meaning on the
    site toughguycomputing.net, the same way the other apps on this server
    are mounted.

.DESCRIPTION
    Safe to run again: each step checks whether it is already done.
    - Creates the application pool NetworkMeaning (No Managed Code).
    - Lets the pool read the app folder and write to logs\.
    - Registers the application /network_meaning at D:\Projects\network-meaning.
    - Asks the app for /health and prints what came back.
    Everything it prints is also written to logs\setup.log.

    It changes nothing about the site itself or the other applications.
    To take the app off the site again:
        Remove-WebApplication -Site toughguycomputing.net -Name network_meaning
        Remove-WebAppPool -Name NetworkMeaning

.CHANGELOG
    v1.0 - Initial version
#>

$AppPath  = "D:\Projects\network-meaning"
$LogPath  = "$AppPath\logs"
$SiteName = "toughguycomputing.net"
$AppAlias = "network_meaning"
$PoolName = "NetworkMeaning"
$NodeExe  = "D:\programs\nvm\v24.14.0\node.exe"
$HostName = "www.toughguycomputing.com"

# Self-elevate if not already running as Administrator
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]"Administrator")) {
    Start-Process powershell -Verb RunAs -Wait -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    exit
}

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

if (-not (Test-Path $LogPath)) { New-Item -ItemType Directory -Path $LogPath | Out-Null }
Start-Transcript -Path "$LogPath\setup.log" -Force | Out-Null
try {
    Write-Step "Checking what the app needs"
    if (-not (Test-Path $NodeExe)) { throw "node.exe not found at $NodeExe. Fix processPath in web.config and `$NodeExe here." }
    Write-Host "  node: $NodeExe ($(& $NodeExe --version))"
    foreach ($f in "server.js", "web.config", "public\index.html", ".env", "node_modules\pg") {
        if (-not (Test-Path "$AppPath\$f")) { throw "Missing: $AppPath\$f" }
    }
    Write-Host "  server.js, web.config, the built page, .env and the dependencies are in place."

    Write-Step "Loading IIS PowerShell module"
    Import-Module WebAdministration -ErrorAction Stop
    if (-not (Get-WebGlobalModule -Name "httpPlatformHandler" -ErrorAction SilentlyContinue)) { throw "HttpPlatformHandler is not installed in IIS." }
    Write-Host "  HttpPlatformHandler is installed."

    Write-Step "Verifying site: $SiteName"
    if (-not (Get-Website -Name $SiteName -ErrorAction SilentlyContinue)) { throw "Site '$SiteName' not found in IIS." }
    Write-Host "  Site '$SiteName' found. Bindings:"
    Get-WebBinding -Name $SiteName | ForEach-Object { Write-Host "    $($_.protocol) $($_.bindingInformation)" }

    # The pool comes first: its identity has to exist before it can be given access.
    Write-Step "Creating IIS application pool: $PoolName"
    if (Test-Path "IIS:\AppPools\$PoolName") {
        Write-Host "  App pool '$PoolName' already exists, skipping."
    } else {
        New-WebAppPool -Name $PoolName | Out-Null
        Set-ItemProperty "IIS:\AppPools\$PoolName" managedRuntimeVersion ""
        Write-Host "  App pool '$PoolName' created (No Managed Code)."
    }

    Write-Step "Setting filesystem permissions for IIS AppPool\$PoolName"
    $identity = "IIS AppPool\$PoolName"
    $acl = Get-Acl $AppPath
    $acl.AddAccessRule((New-Object System.Security.AccessControl.FileSystemAccessRule($identity, "ReadAndExecute", "ContainerInherit,ObjectInherit", "None", "Allow")))
    Set-Acl $AppPath $acl
    Write-Host "  ReadAndExecute granted on: $AppPath"
    $aclLog = Get-Acl $LogPath
    $aclLog.AddAccessRule((New-Object System.Security.AccessControl.FileSystemAccessRule($identity, "Modify", "ContainerInherit,ObjectInherit", "None", "Allow")))
    Set-Acl $LogPath $aclLog
    Write-Host "  Modify granted on: $LogPath"

    Write-Step "Creating IIS application /$AppAlias under $SiteName"
    if (Test-Path "IIS:\Sites\$SiteName\$AppAlias") {
        Set-ItemProperty "IIS:\Sites\$SiteName\$AppAlias" -Name applicationPool -Value $PoolName
        Set-ItemProperty "IIS:\Sites\$SiteName\$AppAlias" -Name physicalPath -Value $AppPath
        Write-Host "  Application already exists. Pool and path set."
    } else {
        New-WebApplication -Site $SiteName -Name $AppAlias -PhysicalPath $AppPath -ApplicationPool $PoolName | Out-Null
        Write-Host "  Application created."
    }
    Restart-WebAppPool -Name $PoolName
    Write-Host "  App pool recycled."

    Write-Step "Asking the app for /health"
    Start-Sleep -Seconds 2
    try {
        $r = Invoke-WebRequest -Uri "http://localhost/$AppAlias/health" -Headers @{ Host = $HostName } -UseBasicParsing -TimeoutSec 90
        Write-Host "  $($r.StatusCode) $($r.Content)"
    } catch {
        Write-Warning "  /health did not answer: $($_.Exception.Message)"
        Write-Host "  Look in $LogPath\iis-stdout*.log for what the node process said."
    }

    Write-Host "`nDone."
    Write-Host "  URL      : http://$HostName/$AppAlias/"
    Write-Host "  App pool : $PoolName  (No Managed Code, ApplicationPoolIdentity)"
    Write-Host "  Recycle  : bin\recycle_apppool_v1.0.ps1"
} catch {
    Write-Host "`nFAILED: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    Stop-Transcript | Out-Null
}
Start-Sleep -Seconds 3
