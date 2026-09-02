# PawFeed — Data Flow

## 1. Purpose

กำหนดเส้นทางข้อมูลสำคัญของ PawFeed เพื่อให้ Implementation, Test และ Demo อ้างอิง flow เดียวกัน

## 2. Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant API as Backend
    participant DB as PostgreSQL

    User->>FE: กรอก email/password
    FE->>API: POST /api/auth/login
    API->>DB: ค้น User ด้วย email
    DB-->>API: User + passwordHash
    API->>API: Verify password
    alt valid
      API-->>FE: Set HttpOnly auth cookie + user
      FE-->>User: Login success
    else invalid
      API-->>FE: 401 generic auth error
      FE-->>User: อีเมลหรือรหัสผ่านไม่ถูกต้อง
    end
```

Security rule: UI และ API ไม่เปิดเผยว่า email หรือ password ช่องใดผิด

## 3. Load Map Flow

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant API as Backend
    participant DB as PostgreSQL

    User->>FE: เปิด Map / เลื่อน / Zoom
    FE->>FE: คำนวณ viewport bounding box
    FE->>API: GET /api/points?minLat&maxLat&minLng&maxLng
    API->>API: Validate coordinates
    API->>DB: Query ACTIVE points within bounds
    DB-->>API: Point marker data
    API-->>FE: JSON points
    FE-->>User: Render markers
```

Map API ไม่ควรโหลดทุก Point ทั้งระบบเมื่อ viewport query พร้อมใช้งาน

## 4. Geolocation Flow

```mermaid
flowchart TD
    A[User เลือกใช้ตำแหน่งปัจจุบัน] --> B[Browser ขอ Permission]
    B -->|Allow| C[Frontend รับ latitude/longitude]
    C --> D[Center map / prefill create-point coordinate]
    B -->|Deny / Error| E[แสดงข้อความที่เข้าใจได้]
    E --> F[User เลื่อน Map และเลือกตำแหน่งเอง]
```

PawFeed อาจติดตาม current user location แบบ session-scoped ระหว่าง Navigation และส่งพิกัดชั่วคราวไป Backend เพื่อ route/reroute แต่ไม่ persist เป็น location history

## 5. Create Point Flow

Request: `multipart/form-data`

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant API as Backend
    participant FS as Upload Volume
    participant DB as PostgreSQL

    User->>FE: Point data + image
    FE->>API: POST /api/points
    API->>API: Verify auth
    API->>API: Validate fields + coordinate + file
    alt validation failed
      API-->>FE: 400/401 with safe error
      FE-->>User: แสดง error และไม่สร้าง Point
    else valid
      API->>FS: Store image with server filename
      API->>DB: Create StrayPoint + PointImage
      alt DB success
        DB-->>API: Created Point
        API-->>FE: 201 Point
        FE-->>User: Success / Marker available
      else DB failure
        API->>FS: Remove newly written orphan file when possible
        API-->>FE: 5xx controlled error
        FE-->>User: แจ้งว่าสร้างจุดไม่สำเร็จ
      end
    end
```

Consistency rule: หาก DB create ไม่สำเร็จหลังเขียนไฟล์ ระบบควร cleanup ไฟล์ใหม่เพื่อไม่ทิ้ง orphan โดยไม่จำเป็น

## 6. Point Detail Flow

```text
Frontend
→ GET /api/points/:id
→ Backend validates id
→ PostgreSQL loads Point + image + creator summary + latest reports/feedings
→ Backend returns normalized detail response
→ Frontend renders detail
```

กรณีไม่พบ Point: API ตอบ `404` และ UI แสดง Not Found state

## 7. Feeding Flow

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant API as Backend
    participant DB as PostgreSQL

    User->>FE: กดให้อาหารแล้ว
    FE->>API: POST /api/points/:id/feedings
    API->>API: Verify auth + input
    API->>DB: Verify point exists
    API->>DB: Create Feeding with fedAt
    DB-->>API: Feeding
    API->>DB: Load latest feeding / history state
    DB-->>API: Updated state
    API-->>FE: Created feeding + latest state
    FE-->>User: History และเวลาล่าสุดเปลี่ยน
```

`last feeding time` ต้อง derive จากข้อมูล Feeding จริง ไม่ใช้ค่าคงที่ใน UI

## 8. Point Report Flow

```text
Authenticated User
→ POST /api/points/:id/reports { type: STILL_HERE | NOT_FOUND }
→ Backend validates auth/type/point
→ Create PointReport
→ STILL_HERE: สามารถ update lastSeenAt ตาม business rule ที่ lock ใน implementation
→ Return updated reporting state
→ UI แสดงผลสำเร็จ
```

MVP ยังไม่รับปาก auto-inactivate Point จากจำนวน NOT_FOUND report

## 9. Navigation Flow

```text
User clicks Navigate
→ Frontend opens /points/:id/navigate inside PawFeed
→ Browser Geolocation or manual map pick provides origin
→ Frontend calls GET /api/navigation/route
→ Backend validates coordinates/mode
→ Backend calls configured OSRM-compatible provider
→ Backend normalizes road geometry + distance + duration + maneuver steps
→ Frontend renders Road Route Preview
→ User starts Active Navigation
→ GPS updates drive Follow/Recenter, remaining distance/ETA and next maneuver
→ accuracy-aware off-route detection may request a replacement route
→ reroute/GPS failures preserve navigation context and expose retry actions
```

Current user location is session/runtime navigation data only and is not persisted in PawFeed database.

## 10. Profile Flow

```text
Authenticated User
→ GET /api/auth/me
→ GET user's created points / feedings
→ Backend scopes query ด้วย authenticated user id
→ PostgreSQL returns only matching records
→ Frontend renders history
```

Authorization ต้อง enforce ที่ backend query ไม่ใช่ filter เฉพาะ frontend

## 11. Error Response Flow

Backend ใช้ response shape ที่ frontend แปลงเป็น UI state ได้ เช่น:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_COORDINATE",
    "message": "ตำแหน่งไม่ถูกต้อง",
    "requestId": "..."
  }
}
```

ข้อกำหนด:
- ไม่ส่ง stack trace ให้ client
- ไม่ส่ง secret/internal database detail
- error code คงที่พอให้ automated test ตรวจได้
- human-readable message ต้องแสดงบน UI สำหรับ failure case สำคัญ

## 12. State Ownership

| State | Source of Truth |
|---|---|
| User account | PostgreSQL |
| Authentication validity | Backend-issued auth/session token rules |
| Stray Point | PostgreSQL |
| Point image metadata | PostgreSQL |
| Image bytes | Persistent upload volume |
| Feeding history | PostgreSQL |
| Point reports | PostgreSQL |
| Current browser location | Browser only; not persisted |
| Map tile/render state | Frontend / external OSM |
