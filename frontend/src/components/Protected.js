'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';

export default function Protected({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, router, pathname]);

  if (loading) return <main className="centerState">กำลังตรวจสอบบัญชี...</main>;
  if (!user) return <main className="centerState">กำลังพาไปหน้าเข้าสู่ระบบ...</main>;
  return children;
}
