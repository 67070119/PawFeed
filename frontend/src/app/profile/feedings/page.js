'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Protected from '../../../components/Protected';
import ProfileNav from '../../../components/ProfileNav';
import { api, relativeTime } from '../../../lib/api';

export default function ProfileFeedingsPage(){const [items,setItems]=useState([]);const [error,setError]=useState('');useEffect(()=>{api('/api/profile/feedings').then(setItems).catch(e=>setError(e.message))},[]);return <Protected><main className="page"><div className="pageTitle"><div><span className="eyebrow">บัญชีของฉัน</span><h1>ประวัติการให้อาหาร</h1></div></div>{error&&<div className="errorBox">{error}</div>}<div className="profileGrid"><ProfileNav/><section className="card"><h3>ประวัติการให้อาหาร</h3>{items.map(f=><div className="listRow" key={f.id}><div className="listIcon">FEED</div><div><strong>{relativeTime(f.fedAt)}</strong><p className="muted" style={{margin:'4px 0'}}>{f.point?.animalType} · {f.note||'ให้อาหารแล้ว'}</p></div><Link className="button" href={`/points/${f.point?.id}`}>ดูจุด</Link></div>)}{!items.length&&<div className="empty">ยังไม่มีประวัติการให้อาหาร</div>}</section></div></main></Protected>}
