# Persistence Evidence

Verified flow:

```text
Register/Login
→ Create Point + uploaded image
→ Create Feeding
→ Submit STILL_HERE
→ restart frontend/backend/postgres containers
→ smoke check
→ read Point/Feeding/Report again
→ fetch uploaded image again
```

Result: **PASS**

Phase 6 also verified `docker compose down` without `-v` followed by `docker compose up -d`; database records and uploaded image remained available because named volumes were preserved.

Repeat with:

```bash
./scripts/verify-persistence.sh
```
