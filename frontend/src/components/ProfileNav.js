'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/profile', label: 'ภาพรวม', exact: true },
  { href: '/profile/points', label: 'จุดที่ฉันสร้าง' },
  { href: '/profile/feedings', label: 'ประวัติการให้อาหาร' },
];

export default function ProfileNav() {
  const pathname = usePathname();

  return (
    <nav className="profileMiniNav" aria-label="เมนูโปรไฟล์">
      {ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            className={`profileMiniNavItem${active ? ' isActive' : ''}`}
            href={item.href}
            aria-current={active ? 'page' : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
