'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Protected from '../../../components/Protected';
import ProfileNav from '../../../components/ProfileNav';
import { api, relativeTime } from '../../../lib/api';

export default function ProfilePointsPage(){const [items,setItems]=useState([]);const [error,setError]=useState('');useEffect(()=>{api('/api/profile/points').then(setItems).catch(e=>setError(e.message))},[]);return <Protected><main className="page"><div className="pageTitle"><div><span className="eyebrow">Profile</span><h1>จุดที่ฉันสร้าง</h1></div></div>{error&&<div className="errorBox">{error}</div>}<div className="profileGrid"><ProfileNav/><section className="card"><h3>Stray Points</h3>{items.map(p=><div className="listRow" key={p.id}><div className="listIcon">{p.animalType==='DOG'?'🐶':p.animalType==='CAT'?'🐱':'🐾'}</div><div><strong>{p.description.slice(0,60)}{p.description.length>60?'…':''}</strong><div><span className="chip">{p.animalType}</span><span className="chip">{p.status}</span></div><small className="muted">สร้าง {relativeTime(p.createdAt)}</small></div><Link className="button" href={`/points/${p.id}`}>ดูรายละเอียด</Link></div>)}{!items.length&&<div className="empty">ยังไม่มีจุดที่สร้าง</div>}</section></div></main></Protected>}
