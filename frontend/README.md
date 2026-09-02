# PawFeed Frontend

Frontend ของ PawFeed ใช้ Next.js 16 + React 19 + React Leaflet และเชื่อม Backend REST API จริงผ่าน `NEXT_PUBLIC_API_URL`

## Routes

- `/` — Public Map, bounding-box query, marker popup, location permission
- `/login` — Login และ redirect กลับ protected route
- `/register` — Register
- `/points/create` — Protected create point, map picker, current location, image upload
- `/points/:id` — Public detail, external navigation, feeding, STILL_HERE / NOT_FOUND
- `/profile` — Protected activity overview
- `/profile/points` — Protected points created by current user
- `/profile/feedings` — Protected feeding history

## Critical Flow

```text
Map
→ Login
→ Add Point
→ Pick location / upload image
→ POST /api/points
→ Point Detail
→ PawFeed in-web navigation
→ POST Feeding
→ Reload latest feeding/history
→ POST STILL_HERE / NOT_FOUND
→ Profile history
```

## Error Behavior

- Network/API failure แสดงข้อความและไม่แสดง success state
- Protected page redirect ไป `/login?next=...`
- Invalid login แสดง generic backend error
- Create Point ต้องมีรูปก่อน submit
- Coordinate fields มี browser bounds และ Backend เป็น final validation
- Location permission denied ไม่ทำให้ Map ใช้งานไม่ได้
- Feeding/Report success แสดงเฉพาะหลัง Backend ตอบสำเร็จ และ reload state จาก API จริง

## Map

- Tile: OpenStreetMap
- Library: Leaflet / React Leaflet
- Point query เปลี่ยนตาม viewport bounding box
- Browser location อ่านเมื่อผู้ใช้กดปุ่มและอนุญาตเท่านั้น
- ไม่มี continuous location tracking

## Navigation

Navigation ใช้หน้า `/points/:id/navigate` ภายใน PawFeed พร้อม Road Route Preview, ETA, DRIVING/WALKING/CYCLING, Active Navigation, Follow/Recenter, GPS quality/recovery และ off-route auto-reroute; voice guidance/live traffic/background navigation ไม่อยู่ใน scope ปัจจุบัน

## Verification ใน Phase 5

```bash
npm install
npm audit --audit-level=high
npm run build
```

Full browser E2E และ Failure automation จะเพิ่มใน Phase 7 ด้วย Playwright
