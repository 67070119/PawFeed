# PawFeed — API Contract Baseline

## 1. Conventions

Base path: `/api`

Content types:
- JSON for normal API
- `multipart/form-data` for Point creation with image

Authentication baseline:
- JWT via HttpOnly cookie
- Backend validates cookie on protected routes

Success response baseline:

```json
{
  "success": true,
  "data": {}
}
```

Error response baseline:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "ข้อความที่แสดงต่อผู้ใช้ได้",
    "requestId": "optional-request-id"
  }
}
```

## 2. Health

### GET `/health/live`
Public. ใช้ตรวจ process liveness

Expected: `200`

### GET `/health/ready`
Public/internal verification. ตรวจ dependency สำคัญ เช่น database

Expected:
- `200` ready
- `503` dependency unavailable

## 3. Auth

### POST `/api/auth/register`
Public

Input:

```json
{
  "name": "User A",
  "email": "user@example.com",
  "password": "..."
}
```

Rules:
- required fields
- valid email format
- password policy จะ lock ใน backend implementation โดยต้องมี automated test
- duplicate email reject

Expected:
- `201` created
- `400` validation
- `409` duplicate email

### POST `/api/auth/login`
Public

Input:

```json
{
  "email": "user@example.com",
  "password": "..."
}
```

Expected:
- `200` + Set-Cookie
- `401` generic invalid credential error

ห้ามระบุว่า email หรือ password อย่างใดอย่างหนึ่งผิด

### POST `/api/auth/logout`
Authenticated or idempotent logout behavior

Expected: clear auth cookie and `200/204`

### GET `/api/auth/me`
Authenticated

Expected:
- `200` current user-safe fields
- `401` when not authenticated

ห้าม return `passwordHash`

## 4. Points

### GET `/api/points`
Public

Query baseline:

```text
minLat
maxLat
minLng
maxLng
```

Rules:
- validate ranges and min/max relationship
- return ACTIVE points relevant to viewport

Expected:
- `200`
- `400` invalid bounding box

Marker response should contain only fields required for map rendering/preview; full history should be fetched from detail endpoint

### GET `/api/points/:id`
Public

Expected:
- `200` point detail including images, feeding status/history required by MVP, reporting state required by UI
- `404` not found

### POST `/api/points`
Authenticated

Content-Type: `multipart/form-data`

Fields baseline:
- `animalType`
- `estimatedCount`
- `description`
- `latitude`
- `longitude`
- `usualTime` optional
- `image` required at least 1

Rules:
- auth required
- DOG/CAT/OTHER only
- count >= 1
- coordinate validation
- image type/size validation
- server-controlled filename

Expected:
- `201`
- `400` validation/file error
- `401` unauthenticated
- controlled `5xx` on internal dependency failure

### PATCH `/api/points/:id`
Authenticated

This endpoint remains in baseline spec but exact editable fields/ownership rules must be minimized and locked before implementation. It must not become an unrestricted generic update endpoint.

Phase 4 implementation should expose only fields that are truly required by MVP and protect ownership/authorization.

## 5. Feedings

### GET `/api/points/:id/feedings`
Public

Expected:
- `200` ordered newest-first feeding history
- `404` point not found when applicable

### POST `/api/points/:id/feedings`
Authenticated

Input baseline:

```json
{
  "note": "ให้อาหารเม็ดและเติมน้ำ"
}
```

Image after feeding is optional capability and is not a mandatory v1 acceptance item.

Expected:
- `201`
- `400` invalid input
- `401` unauthenticated
- `404` point not found

Response must allow frontend to update latest feeding state from real saved data.

## 6. Point Reports

### POST `/api/points/:id/reports`
Authenticated

Input:

```json
{
  "type": "STILL_HERE"
}
```

Allowed:
- `STILL_HERE`
- `NOT_FOUND`

Expected:
- `201`
- `400` invalid type
- `401` unauthenticated
- `404` point not found

No v1 promise that repeated NOT_FOUND automatically makes point INACTIVE.

## 7. Profile

To support documented pages, Phase 4 may implement explicit authenticated endpoints such as:

```text
GET /api/profile/points
GET /api/profile/feedings
```

or equivalent routes under user scope.

Rules:
- authenticated user only
- backend must scope query by authenticated user id
- cannot request another user's private profile history through arbitrary client-supplied user id

## 8. Static Upload Access

Uploaded point image must be retrievable by frontend using a controlled public path or backend static route because Point images are intentionally public content.

Rules:
- public URL must not expose server filesystem paths
- directory traversal must be prevented
- only files managed by upload storage are served

## 9. HTTP Status Baseline

| Status | Meaning |
|---:|---|
| 200 | successful read/action |
| 201 | resource created |
| 204 | successful no-content action if used |
| 400 | malformed/validation error |
| 401 | authentication required/invalid |
| 403 | authenticated but not authorized |
| 404 | resource not found |
| 409 | state conflict such as duplicate email |
| 413 | file/request too large if handled at HTTP layer |
| 415 | unsupported media type if used |
| 500 | controlled internal error |
| 503 | dependency unavailable/readiness failure |

## 10. API Security Rules

- Validate all client input server-side
- Do not trust frontend role/auth state
- Cookie flags set appropriately by environment (`HttpOnly`, `SameSite`, `Secure` when HTTPS)
- CORS allowlist from configuration, not `*` with credentials
- Password hashes and internal errors never returned
- Upload MIME/extension/content validation strategy must be implemented conservatively
- Rate limiting may be added where useful, but is not a mandatory MVP claim unless added to requirement baseline

## 11. Contract Change Rule

If Phase 4 changes route names or response shapes:
1. update this document
2. update requirements/traceability if behavior changes
3. update tests
4. update frontend consumer

API documentation must match runtime version used in Demo.
