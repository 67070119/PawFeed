'use client';

import Link from 'next/link';
import { useState } from 'react';
import { InfoCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { api } from '../../lib/api';

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function validate() {
    const trimmed = email.trim();
    if (!trimmed) {
      setFieldError('กรุณากรอกอีเมล');
      return false;
    }
    if (trimmed.length > 254 || !validEmail(trimmed)) {
      setFieldError('กรุณากรอกอีเมลให้ถูกต้อง');
      return false;
    }
    setFieldError('');
    return true;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await api('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'ไม่สามารถส่งคำขอได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="authShell">
      <section className="authVisual" aria-label="เกี่ยวกับ PawFeed">
        <div className="authBrandMark" aria-hidden="true"><span className="brandGlyph" /></div>
        <div>
          <span className="authVisualEyebrow">ระบบความปลอดภัย PawFeed</span>
          <h2>กู้คืนการเข้าถึงบัญชีของคุณ</h2>
          <p>หากคุณจำรหัสผ่านไม่ได้ เราพร้อมช่วยเหลือให้คุณกลับมาร่วมดูแลสัตว์จรจัดในชุมชนได้อย่างปลอดภัย</p>
        </div>
      </section>

      <section className="authPanel" aria-labelledby="forgot-heading">
        <div className="authCard">
          <span className="eyebrow">กู้คืนบัญชี</span>
          <h1 id="forgot-heading">ลืมรหัสผ่าน?</h1>

          {submitted ? (
            <div className="forgotSuccessCard" style={{ marginTop: '16px' }}>
              <div className="successBox" role="status" style={{ lineHeight: 1.6 }}>
                <strong>ส่งคำแนะนำเรียบร้อยแล้ว</strong>
                <p style={{ margin: '8px 0 0' }}>
                  หากมีอีเมล <strong>{email.trim()}</strong> ในระบบ เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยังกล่องจดหมายของคุณแล้ว
                </p>
              </div>

              <div style={{ marginTop: '20px', padding: '14px', background: 'var(--green-soft)', borderRadius: '14px', fontSize: '13px', color: 'var(--green-dark)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <InfoCircleOutlined aria-hidden="true" style={{ marginTop: '3px', fontSize: '15px' }} />
                <span><strong>คำแนะนำ:</strong> ลิงก์มีอายุ 30 นาที หากไม่พบอีเมลในกล่องจดหมาย กรุณาลองตรวจดูในโฟลเดอร์ Junk/Spam</span>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  className="button soft block"
                  onClick={() => {
                    setSubmitted(false);
                    setError('');
                  }}
                >
                  ส่งอีกครั้งด้วยอีเมลอื่น
                </button>
                <Link href="/login" className="button primary block" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <ArrowLeftOutlined aria-hidden="true" />
                  <span>กลับไปหน้าเข้าสู่ระบบ</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate style={{ marginTop: '12px' }}>
              <p className="authIntro" style={{ marginBottom: '20px' }}>
                กรอกอีเมลที่คุณใช้สมัครสมาชิก เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้คุณทางอีเมล
              </p>

              {error && <div className="errorBox authServerError" role="alert">{error}</div>}

              <div className="field">
                <label htmlFor="forgot-email">อีเมลที่ใช้สมัคร</label>
                <input
                  id="forgot-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck="false"
                  maxLength={254}
                  required
                  placeholder="เช่น example@kmitl.ac.th"
                  value={email}
                  aria-invalid={fieldError ? 'true' : undefined}
                  aria-describedby={fieldError ? 'forgot-email-error' : undefined}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (fieldError) setFieldError('');
                  }}
                />
                {fieldError && <small id="forgot-email-error" className="fieldError" role="alert">{fieldError}</small>}
              </div>

              <button
                type="submit"
                className="button primary block authSubmit"
                style={{ marginTop: '22px' }}
                disabled={loading}
              >
                {loading ? 'กำลังส่งข้อมูล...' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
              </button>

              <p className="authSwitch" style={{ marginTop: '24px' }}>
                นึกรหัสผ่านออกแล้ว? <Link href="/login" className="authSwitchLink">กลับไปเข้าสู่ระบบ</Link>
              </p>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
