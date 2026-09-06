'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';

export default function NavBar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const mapHome = pathname === '/';
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    router.push('/');
    router.refresh();
  }

  return (
    <header className={`topbar${mapHome ? ' mapTopbar' : ''}`}>
      <Link className="brand" href="/">
        <span className="brandMark" aria-hidden="true"><span className="brandGlyph" /></span>
        <span>PawFeed<small>Community Care Map</small></span>
      </Link>

      <nav className="navActions navDesktopActions" aria-label="เมนูหลัก">
        <Link href="/" className="navLink">แผนที่</Link>
        {!loading && user && <Link href="/profile" className="navLink">กิจกรรมของฉัน</Link>}
        {!loading && user && <Link href="/points/create" className="button soft">+ เพิ่มจุด</Link>}
        {!loading && !user && <Link href="/login" className="button primary">เข้าสู่ระบบ</Link>}
        {!loading && user && <button className="button ghost" onClick={handleLogout}>ออกจากระบบ</button>}
      </nav>

      <div className="navMobileWrap">
        <button
          type="button"
          className={`navMenuButton${menuOpen ? ' isOpen' : ''}`}
          aria-label={menuOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
          aria-expanded={menuOpen}
          aria-controls="pawfeed-mobile-menu"
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>

        {menuOpen && (
          <nav id="pawfeed-mobile-menu" className="navMobileMenu" aria-label="เมนูมือถือ">
            <Link href="/" className="navMobileItem">แผนที่</Link>
            {!loading && user && <Link href="/profile" className="navMobileItem">กิจกรรมของฉัน</Link>}
            {!loading && user && <Link href="/points/create" className="navMobileItem navMobilePrimary">+ เพิ่มจุด</Link>}
            {!loading && !user && <Link href="/login" className="navMobileItem navMobilePrimary">เข้าสู่ระบบ</Link>}
            {!loading && user && <button type="button" className="navMobileItem navMobileLogout" onClick={handleLogout}>ออกจากระบบ</button>}
          </nav>
        )}
      </div>
    </header>
  );
}
