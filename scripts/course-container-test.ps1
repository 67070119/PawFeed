param([switch]$FailureDemo, [switch]$LiveRouting)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
# Reuse Docker discovery and preserve local configuration. The course run excludes it.
& (Join-Path $PSScriptRoot 'start.ps1') -SetupOnly
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    foreach ($candidate in @("$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin", "$env:ProgramFiles\Docker\Docker\resources\bin")) {
        if (Test-Path -LiteralPath (Join-Path $candidate 'docker.exe')) { $env:PATH = "$candidate;$env:PATH"; break }
    }
}
Push-Location $projectRoot
try {
    New-Item -ItemType Directory -Force '.ci' | Out-Null
    $revision = git rev-parse HEAD
    if ($LASTEXITCODE -ne 0) { throw 'Run from a Git checkout.' }
    $sourceState = if (git status --porcelain) { 'dirty' } else { 'clean' }
    $failureValue = if ($FailureDemo) { 'true' } else { 'false' }
    $routingValue = if ($LiveRouting) { '1' } else { '0' }
    # No binary PowerShell pipes. Docker cp/tar are performed by the Linux helper.
    docker run --rm --label io.pawfeed.purpose=cli-helper `
        -v "${projectRoot}:/source:ro" -v "${projectRoot}/.ci:/source/.ci" `
        -v /var/run/docker.sock:/var/run/docker.sock `
        -e "SOURCE_REVISION=$revision" -e "SOURCE_STATE=$sourceState" `
        -e "CI_FAILURE_DEMO=$failureValue" -e "COURSE_RUN_LIVE_ROUTING=$routingValue" `
        -w /source docker:29-cli sh scripts/course-container-test.sh
    if ($LASTEXITCODE -ne 0) { throw 'Course verification failed. See .ci/results and the console output.' }
} finally { Pop-Location }
