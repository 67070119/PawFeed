'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '../../lib/auth-context';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form,setForm] = useState({ email:'', password:'' });
  const [error,setError] = useState('');
  const [loading,setLoading] = useState(false);

  async function submit(e){
    e.preventDefault(); setLoading(true); setError('');
    try { await login(form.email,form.password); const next = new URLSearchParams(window.location.search).get('next'); router.replace(next || '/'); }
    catch(err){ setError(err.message); }
    finally{ setLoading(false); }
  }

  return <main className="authShell">
    <section className="authVisual"><div className="authBrandMark" aria-hidden="true"><span className="brandGlyph" /></div><div><h1>ช่วยกันดูแลสัตว์จรจัดในพื้นที่ของเรา</h1><p>ค้นหาจุดที่ต้องการความช่วยเหลือ ดูการให้อาหารล่าสุด และร่วมอัปเดตข้อมูลให้ชุมชน</p></div></section>
    <section className="authPanel"><form className="authCard" onSubmit={submit}><span className="eyebrow">ยินดีต้อนรับกลับ</span><h1>เข้าสู่ระบบ PawFeed</h1><p>เข้าสู่ระบบเพื่อเพิ่มจุดและบันทึกการให้อาหาร</p>{error&&<div className="errorBox">{error}</div>}<div className="field"><label>Email</label><input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div><div className="field authFieldGap"><label>Password</label><input type="password" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></div><button className="button primary block authSubmit" disabled={loading}>{loading?'กำลังเข้าสู่ระบบ...':'เข้าสู่ระบบ'}</button><p className="authSwitch">ยังไม่มีบัญชี? <Link href="/register" className="authSwitchLink">สมัครสมาชิก</Link></p></form></section>
  </main>;
}
