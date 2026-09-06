# TASK — 67070119

## Role
Frontend Developer

## Goal
รับผิดชอบ Frontend/UX ของ PawFeed ทั้งระบบ โดยใช้ Backend API จริงและรักษา critical user flow ตั้งแต่ Map → Point → Feeding/Report/Profile → In-web Navigation ให้ responsive และแสดง loading/error/success ตามผล Backend จริง

## Primary Responsibilities

### 1. Application Shell & Shared Frontend
ดูแล:
```text
frontend/src/app/layout.js
frontend/src/app/globals.css
frontend/src/components/NavBar.js
frontend/src/lib/api.js
frontend/src/lib/auth-context.js
frontend/src/components/Protected.js
```

### 2. Authentication UI
ดูแล:
- Login / Register
- authenticated UI state
- protected-page UX
- generic auth error

ไฟล์หลัก:
```text
frontend/src/app/login/page.js
frontend/src/app/register/page.js
```

### 3. Map & Point Flow
ดูแล:
- Main Map
- API point markers
- bounding-box refresh
- Marker → Point Detail
- Create Point form
- Map Picker / current location
- image upload UI
- validation/error states

ไฟล์หลัก:
```text
frontend/src/app/page.js
frontend/src/components/PawMap.js
frontend/src/components/MapPicker.js
frontend/src/app/points/create/page.js
frontend/src/app/points/[id]/page.js
```

### 4. Feeding / Report UI
ดูแล:
- Feeding action/note/history/latest state
- STILL_HERE / NOT_FOUND
- guest/login gate
- loading/error/success states

### 5. Profile UI
ดูแล:
```text
frontend/src/app/profile/page.js
frontend/src/app/profile/points/page.js
frontend/src/app/profile/feedings/page.js
frontend/src/components/ProfileNav.js
```

### 6. Navigation UX
ดูแล In-web Navigation:
- Map-first screen
- Road Route Preview
- DRIVING / WALKING / CYCLING
- route distance / ETA
- Start / Stop Active Navigation
- GPS marker / accuracy UX
- Follow / Recenter
- next maneuver
- remaining distance / ETA
- arrival state
- off-route/reroute UI
- GPS loss/recovery
- manual map-position fallback
- collapsible mobile bottom sheet
- privacy disclosure

ไฟล์หลัก:
```text
frontend/src/app/points/[id]/navigate/page.js
frontend/src/components/NavigationMap.js
frontend/src/app/globals.css
```

### 7. Responsive / Mobile UX
ดูแล mobile portrait, safe-area, overflow และ overlay ไม่ให้ action สำคัญถูกบัง

## Expected Deliverables
- Frontend ใช้ Backend/API จริง
- ไม่มี production mock/fake success ใน Critical Flow
- Loading/error/success แยกชัดเจน
- Map/Navigation ใช้งานได้ทั้ง desktop/mobile
- GPS denied/insecure context มี fallback
- Routing failure ไม่แสดง road route ปลอม
- Frontend lint/build ผ่าน

## Definition of Done
1. `npm run lint` ใน `frontend/` ผ่าน
2. `npm run build` ผ่าน
3. Critical UI ไม่ใช้ hard-coded mock data แทน API
4. Mobile Navigation action ไม่ถูก overlay บัง
5. Error state สำคัญยังใช้งานได้
6. `git diff --check` ผ่าน

## Handoff
หากต้องเปลี่ยน Backend contract ให้ประสาน:
- Backend Core: `67070233`
- Feeding/Report/Navigation Backend: `67070269`
- Tester/CI-CD: `67070151`
