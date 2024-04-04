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

$CNDITarGz = "$BinDir\cndi.tar.gz"
$CNDIExe = "$BinDir\cndi.exe"

$DownloadUrl = if (!$Version) {
  "https://github.com/polyseam/cndi/releases/latest/download/cndi-win.tar.gz"
} else {
  "https://github.com/polyseam/cndi/releases/download/${Version}/cndi-win.tar.gz"
}

if (!(Test-Path $BinDir)) {
  New-Item $BinDir -ItemType Directory | Out-Null
}

curl.exe --fail --location --progress-bar --output $CNDITarGz $DownloadUrl

tar.exe --extract --file $CNDITarGz -C $BinDir

Remove-Item $CNDITarGz

$User = [System.EnvironmentVariableTarget]::User
$Path = [System.Environment]::GetEnvironmentVariable('Path', $User)
if (!(";${Path};".ToLower() -like "*;${BinDir};*".ToLower())) {
  [System.Environment]::SetEnvironmentVariable('Path', "${Path};${BinDir}", $User)
  $Env:Path += ";${BinDir}"
}

& $CNDIExe --help

Write-Output "CNDI was installed successfully to ${CNDIExe}"
Write-Output "Stuck? Join our Discord https://cndi.run/di?utm_id=5095"
