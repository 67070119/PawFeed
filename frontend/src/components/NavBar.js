'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';

export default function NavBar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/');
    router.refresh();
  }

  return (
    <header className="topbar">
      <Link className="brand" href="/">
        <span className="brandMark" aria-hidden="true"><span className="brandGlyph" /></span>
        <span>PawFeed<small>Community Care Map</small></span>
      </Link>
      <nav className="navActions">
        <Link href="/" className="navLink">แผนที่</Link>
        {!loading && user && <Link href="/profile" className="navLink">กิจกรรมของฉัน</Link>}
        {!loading && user && <Link href="/points/create" className="button soft">+ เพิ่มจุด</Link>}
        {!loading && !user && <Link href="/login" className="button primary">เข้าสู่ระบบ</Link>}
        {!loading && user && <button className="button ghost" onClick={handleLogout}>ออกจากระบบ</button>}
      </nav>
    </header>
  );
}
