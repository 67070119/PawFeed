# PawFeed — User Flow

เอกสารนี้สรุป User Flow จาก `docs/spec.md` ให้อ่านง่ายในรูปแบบ Mermaid Diagram

---

## 1. Overall User Flow

```mermaid
flowchart TD
    A[ผู้ใช้เปิด PawFeed] --> B[แสดง Map และจุดสัตว์จรจัด]
    B --> C{ผู้ใช้ต้องการทำอะไร?}

    C -->|ดูจุดใกล้ตัว| D[เลือก Marker บน Map]
    C -->|เพิ่มจุดใหม่| E{Login แล้วหรือยัง?}
    C -->|ดูข้อมูลส่วนตัว| F{Login แล้วหรือยัง?}

    D --> G[ดูรายละเอียดจุด]
    G --> H{เลือกการกระทำ}
    H -->|นำทาง| I[เปิด Navigation Mode ภายใน PawFeed]
    H -->|ให้อาหารแล้ว| J{Login แล้วหรือยัง?}
    H -->|รายงานสถานะ| K{Login แล้วหรือยัง?}

    E -->|ยัง| L[Login / Register]
    E -->|แล้ว| M[สร้าง Stray Point]
    L --> M

    F -->|ยัง| L
    F -->|แล้ว| N[Profile]

    J -->|ยัง| L
    J -->|แล้ว| O[บันทึก Feeding]

    K -->|ยัง| L
    K -->|แล้ว| P[รายงาน STILL_HERE / NOT_FOUND]

    M --> B
    O --> G
    P --> G
```

---

## 2. Flow — ค้นหาจุดและไปให้อาหาร

```mermaid
flowchart TD
    A[เปิดเว็บไซต์] --> B[ระบบแสดง Map]
    B --> C{อนุญาต Location หรือไม่?}

    C -->|อนุญาต| D[แสดงตำแหน่งปัจจุบันของผู้ใช้]
    C -->|ไม่อนุญาต| E[ผู้ใช้เลื่อน Map เอง]

    D --> F[แสดง Marker จุดสัตว์จรจัด]
    E --> F

    F --> G[เลือก Marker]
    G --> H[ดูรูปและรายละเอียดจุด]

    H --> I{ต้องการไปที่จุดหรือไม่?}
    I -->|ใช่| J[กด นำทาง]
    J --> K[แสดงจุดหมายบน Map ภายใน PawFeed]
    K --> K2{อนุญาต Location หรือไม่?}
    K2 -->|อนุญาต| K3[แสดงตำแหน่งฉัน + ระยะตรงโดยประมาณ]
    K2 -->|ไม่อนุญาต| K4[ดูจุดหมายต่อได้โดยไม่ใช้ตำแหน่ง]
    K3 --> L[ใช้แผนที่ช่วยเดินทางไปยังจุด]
    K4 --> L

    L --> M{ให้อาหารแล้วหรือยัง?}
    M -->|ใช่| N{Login แล้วหรือยัง?}
    M -->|ไม่| H

    N -->|ยัง| O[Login / Register]
    N -->|แล้ว| P[กด ให้อาหารแล้ว]
    O --> P

    P --> Q[เพิ่ม Note / รูป Optional]
    Q --> R[บันทึก Feeding History]
    R --> S[อัปเดตเวลาที่ให้อาหารล่าสุด]
    S --> T[แสดง เช่น มีคนให้อาหารแล้วเมื่อ 2 ชั่วโมงก่อน]
```

---

## 3. Flow — เพิ่มจุดสัตว์จรจัดใหม่

```mermaid
flowchart TD
    A[ผู้ใช้ต้องการเพิ่มจุด] --> B{Login แล้วหรือยัง?}

    B -->|ยัง| C[Login / Register]
    B -->|แล้ว| D[เปิดหน้า Add Stray Point]
    C --> D

    D --> E[เลือกตำแหน่งบน Map]
    E --> F{ใช้ตำแหน่งปัจจุบันหรือเลือกเอง?}

    F -->|ตำแหน่งปัจจุบัน| G[อ่าน Location หลังได้รับ Permission]
    F -->|เลือกเอง| H[ปักตำแหน่งบน Map]

    G --> I[กำหนด Latitude / Longitude]
    H --> I

    I --> J[อัปโหลดรูปอย่างน้อย 1 รูป]
    J --> K[เลือกประเภทสัตว์ DOG / CAT / OTHER]
    K --> L[ระบุจำนวนโดยประมาณ]
    L --> M[เขียนคำอธิบาย]
    M --> N[ระบุช่วงเวลาที่มักพบ Optional]
    N --> O[Submit]

    O --> P{Validation ผ่านหรือไม่?}
    P -->|ไม่ผ่าน| Q[แสดง Validation Error]
    Q --> D

    P -->|ผ่าน| R[บันทึก Stray Point ลง Database]
    R --> S[บันทึกรูปลง Persistent Storage]
    S --> T[สร้าง Marker ใหม่]
    T --> U[แสดงจุดบน Map]
```

---

## 4. Flow — รายงานว่าสัตว์ยังอยู่หรือไม่

```mermaid
flowchart TD
    A[เปิด Point Detail] --> B[ดูข้อมูลจุดและ Last Seen]
    B --> C[เลือกอัปเดตสถานะ]
    C --> D{Login แล้วหรือยัง?}

    D -->|ยัง| E[Login / Register]
    D -->|แล้ว| F{พบสัตว์หรือไม่?}
    E --> F

    F -->|ยังพบอยู่| G[เลือก STILL_HERE]
    F -->|ไม่พบแล้ว| H[เลือก NOT_FOUND]

    G --> I[บันทึก Point Report]
    H --> I

    I --> J[อัปเดตเวลารายงานล่าสุด]
    J --> K[แสดงประวัติสถานะใน Point Detail]

    K --> L{ในอนาคตมีรายงาน NOT_FOUND ต่อเนื่องหรือไม่?}
    L -->|ใช่| M[สามารถเปลี่ยน Point เป็น INACTIVE ตามเงื่อนไข]
    L -->|ไม่| N[Point ยังเป็น ACTIVE]
```

---

## 5. Flow — Authentication Gate

```mermaid
flowchart LR
    A[Guest] --> B[ดู Map]
    A --> C[ดู Point Detail]

    A --> D{ต้องการ Action ที่แก้ข้อมูล?}
    D -->|เพิ่มจุด| E[Login Required]
    D -->|ให้อาหารแล้ว| E
    D -->|รายงานสถานะ| E
    D -->|ดู Profile| E

    E --> F[Login / Register]
    F --> G[Authenticated User]

    G --> H[สร้าง Stray Point]
    G --> I[บันทึก Feeding]
    G --> J[รายงาน STILL_HERE / NOT_FOUND]
    G --> K[ดู Profile / History]
```

---

## 6. Flow — Point Lifecycle

```mermaid
stateDiagram-v2
    [*] --> ACTIVE: สร้าง Stray Point

    ACTIVE --> ACTIVE: STILL_HERE
    ACTIVE --> ACTIVE: มีการให้อาหาร
    ACTIVE --> INACTIVE: ไม่พบสัตว์ต่อเนื่อง / ถูกปิดตามเงื่อนไข

    INACTIVE --> ACTIVE: ยืนยันว่ากลับมาพบสัตว์อีกครั้ง
    INACTIVE --> [*]: ยุติการใช้งานจุด
```

---

## 7. Flow — Feeding Data Update

```mermaid
flowchart LR
    A[ผู้ใช้กด ให้อาหารแล้ว] --> B[สร้าง Feeding Record]
    B --> C[เชื่อม User]
    B --> D[เชื่อม Stray Point]
    B --> E[บันทึก fedAt]
    B --> F[Note Optional]
    B --> G[Image Optional]

    C --> H[Feeding History]
    D --> H
    E --> H
    F --> H
    G --> H

    H --> I[คำนวณเวลาที่ให้อาหารล่าสุด]
    I --> J[แสดงบน Point Detail]
```

---

## 8. Demo Flow

Flow นี้เหมาะสำหรับใช้ Demo โปรเจกต์แบบ End-to-End

```mermaid
flowchart LR
    A[เปิด Map] --> B[Login]
    B --> C[เพิ่ม Stray Point]
    C --> D[Upload รูป]
    D --> E[ปัก Location]
    E --> F[Submit]
    F --> G[Marker ปรากฏบน Map]
    G --> H[เปิด Point Detail]
    H --> I[กด Navigate]
    I --> J[กลับมาบันทึก ให้อาหารแล้ว]
    J --> K[Feeding History อัปเดต]
    K --> L[Restart Containers]
    L --> M[ตรวจว่าข้อมูลและรูปยัง Persist]
```

---

## 9. Failure Flow สำหรับ Demo

```mermaid
flowchart TD
    A[User Action] --> B{กรณีผิดพลาด}

    B -->|สร้าง Point โดยไม่ Login| C[401 Unauthorized]
    B -->|Latitude / Longitude ไม่ถูกต้อง| D[Validation Error]
    B -->|Upload ไฟล์ไม่ใช่รูป| E[Reject Upload]

    C --> F[ระบบไม่สร้างข้อมูล]
    D --> F
    E --> F
```

---

## 10. User Flow แบบสั้นที่สุด

```text
Guest
  ↓
เปิด Map
  ↓
ดู Marker
  ↓
เปิด Point Detail
  ↓
กด Navigate
  ↓
เดินทางไปให้อาหาร
  ↓
Login
  ↓
กด "ให้อาหารแล้ว"
  ↓
Feeding History อัปเดต

หรือ

Login
  ↓
เพิ่ม Stray Point
  ↓
ปัก Location + Upload รูป + ใส่รายละเอียด
  ↓
Submit
  ↓
Marker ใหม่ขึ้นบน Map
  ↓
ผู้ใช้อื่นค้นพบและเดินทางไปช่วยได้
```
