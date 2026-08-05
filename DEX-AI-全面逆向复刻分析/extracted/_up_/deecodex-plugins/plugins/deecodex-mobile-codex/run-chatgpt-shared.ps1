$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent $ScriptDir
$PackagedCompanion = Join-Path $ScriptDir "mobile-codex-companion.exe"
$BuiltCompanion = Join-Path $Root "target/windows/mobile-codex-companion.exe"
$Companion = if (Test-Path $PackagedCompanion) {
    $PackagedCompanion
} else {
    $BuiltCompanion
}

if (!(Test-Path $Companion)) {
    throw "未找到 mobile-codex-companion.exe；请先运行 windows/build.ps1"
}
if (Get-Process -Name "ChatGPT" -ErrorAction SilentlyContinue) {
    throw "ChatGPT 已在运行。请先正常退出 ChatGPT，再运行此脚本。"
}

& $Companion launch-chatgpt
if ($LASTEXITCODE -ne 0) {
    throw "通过 Mobile Codex Shim 启动 ChatGPT 失败"
}

$env:MOBILE_CODEX_BRIDGE_MODE = "shared-desktop"
& $Companion serve
