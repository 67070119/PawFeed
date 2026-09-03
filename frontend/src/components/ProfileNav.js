'use client';

import Link from 'next/link';
import { useAuth } from '../lib/auth-context';

export default function ProfileNav(){const {user}=useAuth();return <aside className="card profileSide"><div className="avatar" aria-hidden="true">{(user?.name||'P').trim().charAt(0).toUpperCase()}</div><h3 style={{margin:'10px 0 2px'}}>{user?.name||'PawFeed User'}</h3><p className="muted" style={{fontSize:13}}>{user?.email}</p><div style={{display:'grid',gap:7}}><Link className="button soft" href="/profile">ภาพรวม</Link><Link className="button ghost" href="/profile/points">จุดที่ฉันสร้าง</Link><Link className="button ghost" href="/profile/feedings">ประวัติการให้อาหาร</Link></div></aside>}
