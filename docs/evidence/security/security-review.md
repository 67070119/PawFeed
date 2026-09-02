# Security & Privacy Evidence

Verified by automated test + code inspection:

- Password is hashed before database storage and raw password is not returned
- Login cookie is `HttpOnly` and `SameSite=Lax`
- Production requires a changed JWT secret with minimum length guard
- `.env` and secret files are ignored; `.env.example` contains only baseline/demo values
- Upload accepts JPEG/PNG/WebP allowlist and checks content signature
- Upload filename is generated server-side and does not trust client filename
- Upload has configured file-size limit
- Protected write endpoints re-check authentication server-side
- Error responses do not expose password/JWT/cookie
- Geolocation is requested in browser only; denied permission leaves map usable

Evidence paths:

```text
backend/src/modules/auth/auth.routes.js
backend/src/middlewares/auth.js
backend/src/utils/upload.js
backend/tests/integration/critical-flow.test.js
tests/e2e/failure-cases.spec.js
.gitignore
.env.example
docs/architecture/security-privacy.md
```
