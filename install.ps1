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

$CNDIZip = "$BinDir\cndi.zip"
$CNDIExe = "$BinDir\deno.exe"

$DownloadUrl = if (!$Version) {
  "https://github.com/polyseam/cndi/releases/latest/download/cndi-win.zip"
} else {
  "https://github.com/polyseam/cndi/releases/download/${Version}/cndi-win.zip"
}

if (!(Test-Path $BinDir)) {
  New-Item $BinDir -ItemType Directory | Out-Null
}

curl.exe --fail --location --progress-bar --output $CNDIZip $DownloadUrl

tar.exe --extract --file $CNDIZip -C $BinDir

Remove-Item $CNDIZip

$User = [System.EnvironmentVariableTarget]::User
$Path = [System.Environment]::GetEnvironmentVariable('Path', $User)
if (!(";${Path};".ToLower() -like "*;${BinDir};*".ToLower())) {
  [System.Environment]::SetEnvironmentVariable('Path', "${Path};${BinDir}", $User)
  $Env:Path += ";${BinDir}"
}

Write-Output "CNDI was installed successfully to ${CNDIExe}"
Write-Output "Run 'cndi --help' to get started"
Write-Output "Stuck? Join our Discord https://cndi.run/di?utm_id=5095"
