#!/usr/bin/env pwsh

$ErrorActionPreference = 'Stop'

if ($v) {
  $Version = "v${v}"
}

if ($Args.Length -eq 1) {
  $Version = $Args.Get(0)
}

$CNDIInstall = $env:CNDI_INSTALL
$BinDir = if ($CNDIInstall) {
  "${CNDIInstall}\bin"
} else {
  "${Home}\.cndi\bin"
}

$CNDIExe = "$BinDir\cndi.exe"

$DownloadUrl = if (!$Version) {
  "https://github.com/polyseam/cndi/releases/latest/download/cndi-win.exe"
} else {
  "https://github.com/polyseam/cndi/releases/download/${Version}/cndi-win.exe"
}

if (!(Test-Path $BinDir)) {
  New-Item $BinDir -ItemType Directory | Out-Null
}

curl.exe --fail --location --progress-bar --output $CNDIExe $DownloadUrl

$User = [System.EnvironmentVariableTarget]::User
$Path = [System.Environment]::GetEnvironmentVariable('Path', $User)
if (!(";${Path};".ToLower() -like "*;${BinDir};*".ToLower())) {
  [System.Environment]::SetEnvironmentVariable('Path', "${Path};${BinDir}", $User)
  $Env:Path += ";${BinDir}"
}

Write-Output "CNDI was installed successfully to ${CNDIExe}"
Write-Output "Run 'cndi --help' to get started"