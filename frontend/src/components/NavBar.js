'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';

function navState(pathname) {
  const pointContext = pathname.startsWith('/points/') && pathname !== '/points/create';
  return {
    map: pathname === '/' || pointContext,
    profile: pathname.startsWith('/profile'),
    create: pathname === '/points/create',
    login: pathname === '/login' || pathname === '/register',
  };
}

export default function NavBar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const mapHome = pathname === '/';
  const active = navState(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const mobileWrapRef = useRef(null);
  const menuButtonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const firstItem = menuRef.current?.querySelector('a, button');
    firstItem?.focus();

    function handleKeyDown(event) {
      if (event.key !== 'Escape') return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    }

    function handlePointerDown(event) {
      if (!mobileWrapRef.current?.contains(event.target)) setMenuOpen(false);
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  async function handleLogout() {
    closeMenu();
    await logout();
    router.push('/');
    router.refresh();
  }

  return (
    <header className={`topbar${mapHome ? ' mapTopbar' : ''}`}>
      <Link className="brand" href="/" aria-label="PawFeed — กลับไปหน้าแผนที่">
        <span className="brandMark" aria-hidden="true"><span className="brandGlyph" /></span>
        <span>PawFeed<small>Community Care Map</small></span>
      </Link>

      <nav className="navActions navDesktopActions" aria-label="เมนูหลัก">
        <Link href="/" className={`navLink${active.map ? ' isActive' : ''}`} aria-current={pathname === '/' ? 'page' : undefined}>แผนที่</Link>
        {!loading && user && <Link href="/profile" className={`navLink${active.profile ? ' isActive' : ''}`} aria-current={pathname === '/profile' ? 'page' : undefined}>กิจกรรมของฉัน</Link>}
        {!loading && user && <Link href="/points/create" className={`button soft navCreateButton${active.create ? ' isActive' : ''}`} aria-current={active.create ? 'page' : undefined}>+ เพิ่มจุด</Link>}
        {!loading && !user && <Link href="/login" className={`button primary navLoginButton${active.login ? ' isActive' : ''}`} aria-current={pathname === '/login' ? 'page' : undefined}>เข้าสู่ระบบ</Link>}
        {!loading && user && <button className="button ghost" onClick={handleLogout}>ออกจากระบบ</button>}
      </nav>

      <div className="navMobileWrap" ref={mobileWrapRef}>
        <button
          ref={menuButtonRef}
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
          <nav ref={menuRef} id="pawfeed-mobile-menu" className="navMobileMenu" aria-label="เมนูมือถือ">
            <Link href="/" onClick={closeMenu} className={`navMobileItem${active.map ? ' isActive' : ''}`} aria-current={pathname === '/' ? 'page' : undefined}>แผนที่</Link>
            {!loading && user && <Link href="/profile" onClick={closeMenu} className={`navMobileItem${active.profile ? ' isActive' : ''}`} aria-current={pathname === '/profile' ? 'page' : undefined}>กิจกรรมของฉัน</Link>}
            {!loading && user && <Link href="/points/create" onClick={closeMenu} className={`navMobileItem navMobilePrimary${active.create ? ' isActive' : ''}`} aria-current={active.create ? 'page' : undefined}>+ เพิ่มจุด</Link>}
            {!loading && !user && <Link href="/login" onClick={closeMenu} className={`navMobileItem navMobilePrimary${active.login ? ' isActive' : ''}`} aria-current={pathname === '/login' ? 'page' : undefined}>เข้าสู่ระบบ</Link>}
            {!loading && user && <button type="button" className="navMobileItem navMobileLogout" onClick={handleLogout}>ออกจากระบบ</button>}
          </nav>
        )}
      </div>
    </header>
  );
}
