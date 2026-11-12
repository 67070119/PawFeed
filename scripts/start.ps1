param([switch]$SetupOnly)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $projectRoot
try {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        $candidates = @(
            "$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin",
            "$env:ProgramFiles\Docker\Docker\resources\bin"
        )
        foreach ($candidate in $candidates) {
            if (Test-Path -LiteralPath (Join-Path $candidate 'docker.exe')) {
                $env:PATH = "$candidate;$env:PATH"
                break
            }
        }
    }
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw 'Install/start Docker Desktop with Linux containers, then reopen PowerShell.'
    }
    docker info --format '{{.ServerVersion}}'
    if ($LASTEXITCODE -ne 0) { throw 'Docker Engine is not ready.' }
    if (-not (Test-Path -LiteralPath '.env')) { Copy-Item -LiteralPath '.env.example' -Destination '.env' }
    $configuration = [IO.File]::ReadAllText((Join-Path $projectRoot '.env'))
    function New-LocalSecret([int]$bytes) {
        $buffer = New-Object byte[] $bytes
        $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
        try { $rng.GetBytes($buffer) } finally { $rng.Dispose() }
        return ([BitConverter]::ToString($buffer)).Replace('-', '').ToLowerInvariant()
    }
    $configuration = $configuration.Replace('JWT_ACCESS_SECRET=GENERATE_WITH_SETUP', 'JWT_ACCESS_SECRET=' + (New-LocalSecret 32))
    $configuration = $configuration.Replace('POSTGRES_PASSWORD=GENERATE_WITH_SETUP', 'POSTGRES_PASSWORD=' + (New-LocalSecret 24))
    [IO.File]::WriteAllText((Join-Path $projectRoot '.env'), $configuration.Replace("`r`n", "`n"), [Text.UTF8Encoding]::new($false))
    docker compose config --quiet
    if ($LASTEXITCODE -ne 0) { throw 'Compose configuration is invalid. Check .env.' }
    if ($SetupOnly) { return }
    docker compose up -d --build --wait --wait-timeout 240
    if ($LASTEXITCODE -ne 0) { throw 'Startup failed. Inspect: docker compose logs --tail=100' }
    docker compose exec -T frontend node -e "fetch('http://127.0.0.1:3000/backend-health/ready').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
    if ($LASTEXITCODE -ne 0) { throw 'Frontend-to-backend readiness check failed.' }
    docker compose ps
    Write-Host 'PawFeed ready. Default web: http://localhost:3000 | Local email inbox: http://localhost:8025'
} finally { Pop-Location }
