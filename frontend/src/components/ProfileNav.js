'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth-context';

const ITEMS = [
  { href: '/profile', label: 'ภาพรวม', exact: true },
  { href: '/profile/points', label: 'จุดที่ฉันสร้าง' },
  { href: '/profile/feedings', label: 'ประวัติการให้อาหาร' },
];

export default function ProfileNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const name = user?.name || 'PawFeed User';

  return (
    <aside className="card profileSide">
      <div className="avatar" aria-hidden="true">{name.trim().charAt(0).toUpperCase()}</div>
      <h3 className="profileName">{name}</h3>
      <p className="muted profileEmail">{user?.email}</p>
      <nav className="profileNav" aria-label="เมนูโปรไฟล์">
        {ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return <Link key={item.href} className={`button ${active ? 'soft' : 'ghost'}`} href={item.href} aria-current={active ? 'page' : undefined}>{item.label}</Link>;
        })}
      </nav>
    </aside>
  );
}
