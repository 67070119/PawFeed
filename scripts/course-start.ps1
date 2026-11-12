param(
    [ValidateRange(1024, 65535)][int]$WebPort = 3400,
    [ValidateRange(1024, 65535)][int]$ApiPort = 3401,
    [ValidateRange(1024, 65535)][int]$MailPort = 8425
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
if ($WebPort -eq $ApiPort -or $WebPort -eq $MailPort -or $ApiPort -eq $MailPort) {
    throw 'WebPort, ApiPort and MailPort must be distinct.'
}
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    foreach ($candidate in @("$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin", "$env:ProgramFiles\Docker\Docker\resources\bin")) {
        if (Test-Path -LiteralPath (Join-Path $candidate 'docker.exe')) {
            $env:PATH = "$candidate;$env:PATH"
            break
        }
    }
}
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Install/start Docker Desktop with Linux containers, then reopen PowerShell.'
}
Push-Location $projectRoot
try {
    $revision = git rev-parse HEAD
    if ($LASTEXITCODE -ne 0) { throw 'Run from a Git checkout.' }
    $sourceState = if (git status --porcelain) { 'dirty' } else { 'clean' }
    New-Item -ItemType Directory -Force '.ci' | Out-Null
    # Linux helper handles tar/docker cp without binary PowerShell pipelines.
    docker run --rm --label io.pawfeed.purpose=cli-helper `
        -v "${projectRoot}:/source:ro" -v "${projectRoot}/.ci:/source/.ci" `
        -v /var/run/docker.sock:/var/run/docker.sock `
        -e "SOURCE_REVISION=$revision" -e "SOURCE_STATE=$sourceState" `
        -e "COURSE_WEB_PORT=$WebPort" -e "COURSE_API_PORT=$ApiPort" -e "COURSE_MAIL_PORT=$MailPort" `
        -w /source docker:29-cli sh scripts/course-start.sh
    if ($LASTEXITCODE -ne 0) {
        throw 'Source demo startup failed. See the console output; the course container is retained for diagnostics.'
    }
} finally { Pop-Location }
