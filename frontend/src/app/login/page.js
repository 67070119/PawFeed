'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '../../lib/auth-context';

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function safeNextPath(value) {
  if (!value?.startsWith('/')) return '/';
  try {
    const resolved = new URL(value, 'https://pawfeed.local');
    if (resolved.origin !== 'https://pawfeed.local') return '/';
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return '/';
  }
}

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function clearFieldError(name) {
    setFieldErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function validate() {
    const next = {};
    const email = form.email.trim();

    if (!email) next.email = 'กรุณากรอกอีเมล';
    else if (email.length > 254 || !validEmail(email)) next.email = 'กรุณากรอกอีเมลให้ถูกต้อง';

    if (!form.password) next.password = 'กรุณากรอกรหัสผ่าน';
    else if (form.password.length > 128) next.password = 'รหัสผ่านยาวเกิน 128 ตัวอักษร';

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event) {
    event.preventDefault();
    setServerError('');

    if (!validate()) {
      window.requestAnimationFrame(() => document.querySelector('.authCard [aria-invalid="true"]')?.focus());
      return;
    }

    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      const next = new URLSearchParams(window.location.search).get('next');
      router.replace(safeNextPath(next));
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="authShell">
      <section className="authVisual" aria-label="เกี่ยวกับ PawFeed">
        <div className="authBrandMark" aria-hidden="true"><span className="brandGlyph" /></div>
        <div>
          <span className="authVisualEyebrow">PawFeed Community</span>
          <h2>ช่วยกันดูแลสัตว์จรจัดในพื้นที่ของเรา</h2>
          <p>ค้นหาจุดที่ต้องการความช่วยเหลือ ดูการให้อาหารล่าสุด และร่วมอัปเดตข้อมูลให้ชุมชน</p>
        </div>
      </section>

      <section className="authPanel" aria-labelledby="login-heading">
        <form className="authCard" onSubmit={submit} noValidate>
          <span className="eyebrow">ยินดีต้อนรับกลับ</span>
          <h1 id="login-heading">เข้าสู่ระบบ PawFeed</h1>
          <p className="authIntro">เข้าสู่ระบบเพื่อเพิ่มจุดและบันทึกการให้อาหาร</p>

          {serverError && <div className="errorBox authServerError" role="alert">{serverError}</div>}

          <div className="field">
            <label htmlFor="login-email">อีเมล</label>
            <input
              id="login-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck="false"
              maxLength={254}
              required
              value={form.email}
              aria-invalid={fieldErrors.email ? 'true' : undefined}
              aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
              onChange={(event) => {
                setForm({ ...form, email: event.target.value });
                clearFieldError('email');
              }}
            />
            {fieldErrors.email && <small id="login-email-error" className="fieldError" role="alert">{fieldErrors.email}</small>}
          </div>

          <div className="field authFieldGap">
            <label htmlFor="login-password">รหัสผ่าน</label>
            <div className="authPasswordControl">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                maxLength={128}
                required
                value={form.password}
                aria-invalid={fieldErrors.password ? 'true' : undefined}
                aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
                onChange={(event) => {
                  setForm({ ...form, password: event.target.value });
                  clearFieldError('password');
                }}
              />
              <button
                type="button"
                className="authPasswordToggle"
                aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? 'ซ่อน' : 'แสดง'}
              </button>
            </div>
            {fieldErrors.password && <small id="login-password-error" className="fieldError" role="alert">{fieldErrors.password}</small>}
          </div>

          <button className="button primary block authSubmit" disabled={loading}>
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>

          <p className="authSwitch">
            ยังไม่มีบัญชี? <Link href="/register" className="authSwitchLink">สมัครสมาชิก</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
