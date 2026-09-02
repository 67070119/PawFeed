# PawFeed — Security & Privacy Design

## 1. Scope

Security และ Privacy ของ MVP เน้นความเสี่ยงที่เกี่ยวข้องกับ account, public location data, uploaded image, authentication และ deployment secrets

## 2. Authentication

- Password เก็บเฉพาะ hash
- ใช้ password hashing library ที่เหมาะสม เช่น bcrypt/argon2 ตาม implementation compatibility
- JWT อยู่ใน HttpOnly cookie ไม่เก็บ token ใน localStorage
- Cookie configuration แยก development/production-like environment
- Login failure ใช้ข้อความ generic
- Protected API ตรวจ auth ที่ backend ทุกครั้ง

## 3. Authorization

Guest ทำได้เฉพาะ read/public actions และ navigation

Write actions require authenticated user:
- create point
- feeding
- point report
- profile/history

Endpoint ที่แก้ Point ต้องกำหนด owner/authorization ชัดเจนก่อน expose field ใด ๆ

## 4. Input Validation

Backend validates:
- email/name/password
- enum values
- estimated count
- latitude/longitude
- point/report ids
- notes/descriptions
- multipart files

Frontend validation มีเพื่อ UX เท่านั้น ไม่แทน server validation

## 5. Upload Security

- allowlist image type
- limit file size
- generate random/unique filename server-side
- never use raw client path
- prevent path traversal
- store file outside application source tree where practical and mount controlled volume
- serve uploads through controlled static path
- on rejected upload, no database Point is created

## 6. Secret Management

Repository may contain `.env.example` only

Never commit:
- real `DATABASE_URL`
- JWT secret
- Jenkins credentials
- API token
- production password

Jenkins/runtime inject secret from environment/credential store

## 7. Location Privacy

PawFeed intentionally publishes Stray Point coordinates because this is core product data

Current user's browser location:
- ask permission before access
- do not continuously track
- do not persist as user history
- if denied, application remains usable by manual map interaction

## 8. Public Data Boundary

Public:
- Stray Point coordinates/details/images
- feeding status/history as defined by product

Private/account scoped:
- credential data
- password hash
- auth token
- personal profile history endpoint scope

Avoid exposing unnecessary user identity detail on public Point/Feeding response; display name may be included only where product UI needs it.

## 9. Error Handling

Client responses must not include:
- stack trace
- SQL/Prisma internal detail
- filesystem path
- secret/token

Server logs may include diagnostic context but must redact sensitive data.

## 10. CORS / Browser Security

- CORS origin configured from environment
- credentials allowed only with explicit origin
- security headers via suitable Express middleware where compatible
- request body/file limits configured
- production-like cookie uses `Secure` when HTTPS termination exists

## 11. Dependency and Image Hygiene

Phase 7 CI should include dependency installation from lockfiles and can include audit/check steps where stable; critical known vulnerability must not be ignored without documented reason.

Docker images should:
- use explicit suitable base version
- avoid copying secrets
- run minimal required runtime content
- avoid unnecessary privileged behavior in application containers

## 12. Threat/Fault Checklist for Demo

Minimum verifiable cases:
- anonymous create point rejected
- invalid coordinate rejected
- non-image upload rejected
- oversized upload rejected
- invalid login does not reveal credential field mismatch
- protected profile data cannot be read as anonymous user

## 13. Privacy Statement Baseline

README/UI should make it clear that location published for a Stray Point is public content, while current user location is used only after browser permission and is not continuously stored by PawFeed.
