#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT"
# Container-side checks work with custom host ports and need no host Node/curl.
docker compose exec -T frontend node --input-type=module -e '
  for (const url of ["http://backend:3001/health/ready", "http://127.0.0.1:3000/", "http://127.0.0.1:3000/backend-health/ready"]) {
    let ok = false;
    for (let i = 0; i < 60; i++) {
      try { const r = await fetch(url, { signal: AbortSignal.timeout(5000) }); if (r.ok) { ok = true; break; } } catch {}
      await new Promise(r => setTimeout(r, 2000));
    }
    if (!ok) { console.error(`FAIL: ${url}`); process.exit(1); }
    console.log(`OK: ${url}`);
  }
'
echo 'PawFeed smoke test passed.'
