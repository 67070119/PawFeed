'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '../../lib/api';

export default function RegisterPage(){
  const router=useRouter();
  const [form,setForm]=useState({name:'',email:'',password:'',confirm:''});
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  async function submit(e){e.preventDefault();setError('');if(form.password!==form.confirm)return setError('รหัสผ่านยืนยันไม่ตรงกัน');setLoading(true);try{await api('/api/auth/register',{method:'POST',body:JSON.stringify({name:form.name,email:form.email,password:form.password})});router.push('/login');}catch(err){setError(err.message);}finally{setLoading(false)}}
  return <main className="authShell"><section className="authVisual"><div className="paw">🐾</div><div><h1>เริ่มช่วยเหลือจากจุดเล็ก ๆ ใกล้ตัว</h1><p>สร้างบัญชีเพื่อรายงานจุดสัตว์จรจัด บันทึกการให้อาหาร และช่วยยืนยันข้อมูลให้เป็นปัจจุบัน</p></div></section><section className="authPanel"><form className="authCard" onSubmit={submit}><span className="eyebrow">เข้าร่วมชุมชน</span><h1>สร้างบัญชี PawFeed</h1><p>ใช้ชื่อ อีเมล และรหัสผ่านอย่างน้อย 8 ตัวที่มีตัวอักษรและตัวเลข</p>{error&&<div className="errorBox">{error}</div>}<div className="field"><label>ชื่อที่แสดง</label><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div><div className="field" style={{marginTop:12}}><label>Email</label><input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div><div className="field" style={{marginTop:12}}><label>Password</label><input type="password" minLength={8} required value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></div><div className="field" style={{marginTop:12}}><label>Confirm Password</label><input type="password" minLength={8} required value={form.confirm} onChange={e=>setForm({...form,confirm:e.target.value})}/></div><button className="button primary block" style={{marginTop:18}} disabled={loading}>{loading?'กำลังสร้างบัญชี...':'สร้างบัญชี'}</button><p style={{textAlign:'center',marginTop:18}}>มีบัญชีแล้ว? <Link href="/login" style={{color:'var(--green-dark)',fontWeight:800}}>เข้าสู่ระบบ</Link></p></form></section></main>;
}
