'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { api } from '../../lib/api';

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordChecks = useMemo(() => ({
    length: form.password.length >= 8 && form.password.length <= 128,
    letter: /[A-Za-z]/.test(form.password),
    number: /[0-9]/.test(form.password),
  }), [form.password]);

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
    const name = form.name.trim();
    const email = form.email.trim();

    if (!name) next.name = 'กรุณากรอกชื่อที่แสดง';
    else if (name.length > 80) next.name = 'ชื่อที่แสดงต้องไม่เกิน 80 ตัวอักษร';

    if (!email) next.email = 'กรุณากรอกอีเมล';
    else if (email.length > 254 || !validEmail(email)) next.email = 'กรุณากรอกอีเมลให้ถูกต้อง';

    if (!form.password) {
      next.password = 'กรุณากรอกรหัสผ่าน';
    } else if (!passwordChecks.length || !passwordChecks.letter || !passwordChecks.number) {
      next.password = 'รหัสผ่านต้องยาว 8–128 ตัว และมีทั้งตัวอักษรกับตัวเลข';
    }

    if (!form.confirm) next.confirm = 'กรุณายืนยันรหัสผ่าน';
    else if (form.password !== form.confirm) next.confirm = 'รหัสผ่านยืนยันไม่ตรงกัน';

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
      await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      });
      router.push('/login');
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
          <h2>เริ่มช่วยเหลือจากจุดเล็ก ๆ ใกล้ตัว</h2>
          <p>สร้างบัญชีเพื่อรายงานจุดสัตว์จรจัด บันทึกการให้อาหาร และช่วยยืนยันข้อมูลให้เป็นปัจจุบัน</p>
        </div>
      </section>

      <section className="authPanel" aria-labelledby="register-heading">
        <form className="authCard authCardRegister" onSubmit={submit} noValidate>
          <span className="eyebrow">เข้าร่วมชุมชน</span>
          <h1 id="register-heading">สร้างบัญชี PawFeed</h1>
          <p className="authIntro">กรอกข้อมูลด้านล่างเพื่อเริ่มช่วยอัปเดตจุดสัตว์จรจัดในชุมชน</p>

          {serverError && <div className="errorBox authServerError" role="alert">{serverError}</div>}

          <div className="field">
            <label htmlFor="register-name">ชื่อที่แสดง</label>
            <input
              id="register-name"
              type="text"
              autoComplete="name"
              maxLength={80}
              required
              value={form.name}
              aria-invalid={fieldErrors.name ? 'true' : undefined}
              aria-describedby={fieldErrors.name ? 'register-name-error' : 'register-name-help'}
              onChange={(event) => {
                setForm({ ...form, name: event.target.value });
                clearFieldError('name');
              }}
            />
            <small id="register-name-help" className="fieldHint">ชื่อนี้จะแสดงในกิจกรรมของ PawFeed</small>
            {fieldErrors.name && <small id="register-name-error" className="fieldError" role="alert">{fieldErrors.name}</small>}
          </div>

          <div className="field authFieldGap">
            <label htmlFor="register-email">อีเมล</label>
            <input
              id="register-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck="false"
              maxLength={254}
              required
              value={form.email}
              aria-invalid={fieldErrors.email ? 'true' : undefined}
              aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
              onChange={(event) => {
                setForm({ ...form, email: event.target.value });
                clearFieldError('email');
              }}
            />
            {fieldErrors.email && <small id="register-email-error" className="fieldError" role="alert">{fieldErrors.email}</small>}
          </div>

          <div className="field authFieldGap">
            <label htmlFor="register-password">รหัสผ่าน</label>
            <div className="authPasswordControl">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
                value={form.password}
                aria-invalid={fieldErrors.password ? 'true' : undefined}
                aria-describedby={fieldErrors.password ? 'password-requirements register-password-error' : 'password-requirements'}
                onChange={(event) => {
                  setForm({ ...form, password: event.target.value });
                  clearFieldError('password');
                  if (fieldErrors.confirm && event.target.value === form.confirm) clearFieldError('confirm');
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

            <ul id="password-requirements" className="passwordRequirements" aria-label="ข้อกำหนดรหัสผ่าน">
              <li className={passwordChecks.length ? 'isMet' : ''}>8–128 ตัวอักษร</li>
              <li className={passwordChecks.letter ? 'isMet' : ''}>มีตัวอักษรอย่างน้อย 1 ตัว</li>
              <li className={passwordChecks.number ? 'isMet' : ''}>มีตัวเลขอย่างน้อย 1 ตัว</li>
            </ul>
            {fieldErrors.password && <small id="register-password-error" className="fieldError" role="alert">{fieldErrors.password}</small>}
          </div>

          <div className="field authFieldGap">
            <label htmlFor="register-confirm">ยืนยันรหัสผ่าน</label>
            <div className="authPasswordControl">
              <input
                id="register-confirm"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
                value={form.confirm}
                aria-invalid={fieldErrors.confirm ? 'true' : undefined}
                aria-describedby={fieldErrors.confirm ? 'register-confirm-error' : undefined}
                onChange={(event) => {
                  setForm({ ...form, confirm: event.target.value });
                  clearFieldError('confirm');
                }}
              />
              <button
                type="button"
                className="authPasswordToggle"
                aria-label={showConfirm ? 'ซ่อนรหัสผ่านยืนยัน' : 'แสดงรหัสผ่านยืนยัน'}
                aria-pressed={showConfirm}
                onClick={() => setShowConfirm((value) => !value)}
              >
                {showConfirm ? 'ซ่อน' : 'แสดง'}
              </button>
            </div>
            {fieldErrors.confirm && <small id="register-confirm-error" className="fieldError" role="alert">{fieldErrors.confirm}</small>}
          </div>

          <button className="button primary block authSubmit" disabled={loading}>
            {loading ? 'กำลังสร้างบัญชี...' : 'สร้างบัญชี'}
          </button>

          <p className="authSwitch">
            มีบัญชีแล้ว? <Link href="/login" className="authSwitchLink">เข้าสู่ระบบ</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
