'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { CheckCircleOutlined, ArrowRightOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { api } from '../../lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [verifying, setVerifying] = useState(true);
  const [tokenError, setTokenError] = useState('');
  const [targetEmail, setTargetEmail] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenError('ไม่พบคีย์สำหรับรีเซ็ตรหัสผ่าน กรุณาใช้ลิงก์ที่ได้รับจากอีเมล');
      return;
    }

    let isMounted = true;
    async function verify() {
      try {
        const data = await api(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
        if (isMounted) {
          setTargetEmail(data?.email || '');
          setVerifying(false);
        }
      } catch (err) {
        if (isMounted) {
          setTokenError(err.message || 'ลิงก์รีเซ็ตรหัสผ่านนี้หมดอายุหรือไม่ถูกต้อง');
          setVerifying(false);
        }
      }
    }

    verify();
    return () => { isMounted = false; };
  }, [token]);

  function validate() {
    const errors = {};

    if (!password) {
      errors.password = 'กรุณากรอกรหัสผ่านใหม่';
    } else if (password.length < 8) {
      errors.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
    } else if (password.length > 128) {
      errors.password = 'รหัสผ่านยาวเกิน 128 ตัวอักษร';
    } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      errors.password = 'รหัสผ่านต้องประกอบด้วยตัวอักษรภาษาอังกฤษและตัวเลข';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'กรุณายืนยันรหัสผ่านใหม่';
    } else if (confirmPassword !== password) {
      errors.confirmPassword = 'รหัสผ่านทั้งสองช่องไม่ตรงกัน';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError('');

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await api('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          password,
        }),
      });
      setSuccess(true);
      setTimeout(() => {
        router.replace('/login');
      }, 3000);
    } catch (err) {
      setSubmitError(err.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้ กรุณาลองใหม่อีกครั้ง');
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
          <h2>กำหนดรหัสผ่านใหม่</h2>
          <p>สร้างรหัสผ่านใหม่ที่รัดกุม เพื่อความปลอดภัยของข้อมูลการดูแลสัตว์จรจัดของคุณ</p>
        </div>
      </section>

      <section className="authPanel" aria-labelledby="reset-heading">
        <div className="authCard">
          <span className="eyebrow">ตั้งรหัสผ่าน</span>
          <h1 id="reset-heading">กำหนดรหัสผ่านใหม่</h1>

          {verifying ? (
            <div className="centerState" style={{ minHeight: '200px' }}>
              กำลังตรวจสอบลิงก์ความปลอดภัย...
            </div>
          ) : tokenError ? (
            <div style={{ marginTop: '16px' }}>
              <div className="errorBox" role="alert">
                {tokenError}
              </div>
              <p style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '12px' }}>
                ลิงก์รีเซ็ตรหัสผ่านอาจหมดอายุ (มีอายุ 30 นาที) หรือถูกใช้งานไปแล้ว
              </p>
              <div style={{ marginTop: '20px' }}>
                <Link href="/forgot-password" className="button primary block">
                  ขอลิงก์รีเซ็ตรหัสผ่านใหม่
                </Link>
              </div>
            </div>
          ) : success ? (
            <div style={{ marginTop: '16px' }}>
              <div className="successBox" role="status" style={{ lineHeight: 1.6 }}>
                <strong>ตั้งรหัสผ่านใหม่สำเร็จแล้ว <CheckCircleOutlined aria-hidden="true" style={{ color: 'var(--green)', marginLeft: '4px' }} /></strong>
                <p style={{ margin: '8px 0 0' }}>
                  คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที ระบบกำลังนำคุณไปยังหน้าเข้าสู่ระบบอัตโนมัติ...
                </p>
              </div>
              <div style={{ marginTop: '20px' }}>
                <Link href="/login" className="button primary block" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span>เข้าสู่ระบบทันที</span>
                  <ArrowRightOutlined aria-hidden="true" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate style={{ marginTop: '12px' }}>
              {targetEmail && (
                <p className="authIntro" style={{ marginBottom: '16px' }}>
                  สำหรับบัญชี: <strong style={{ color: 'var(--ink)' }}>{targetEmail}</strong>
                </p>
              )}

              {submitError && <div className="errorBox authServerError" role="alert">{submitError}</div>}

              <div className="field authFieldGap">
                <label htmlFor="reset-new-password">รหัสผ่านใหม่</label>
                <div className="authPasswordControl">
                  <input
                    id="reset-new-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    maxLength={128}
                    required
                    value={password}
                    aria-invalid={fieldErrors.password ? 'true' : undefined}
                    aria-describedby={fieldErrors.password ? 'reset-new-password-error' : undefined}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (fieldErrors.password) {
                        setFieldErrors((prev) => ({ ...prev, password: '' }));
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="authPasswordToggle"
                    aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    aria-pressed={showPassword}
                    title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <EyeInvisibleOutlined aria-hidden="true" /> : <EyeOutlined aria-hidden="true" />}
                  </button>
                </div>
                {fieldErrors.password ? (
                  <small id="reset-new-password-error" className="fieldError" role="alert">{fieldErrors.password}</small>
                ) : (
                  <small style={{ color: 'var(--muted)', fontSize: '12px' }}>ความยาวอย่างน้อย 8 ตัวอักษร มีทั้งตัวอักษรและตัวเลข</small>
                )}
              </div>

              <div className="field authFieldGap" style={{ marginTop: '14px' }}>
                <label htmlFor="reset-confirm-password">ยืนยันรหัสผ่านใหม่</label>
                <div className="authPasswordControl">
                  <input
                    id="reset-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    maxLength={128}
                    required
                    value={confirmPassword}
                    aria-invalid={fieldErrors.confirmPassword ? 'true' : undefined}
                    aria-describedby={fieldErrors.confirmPassword ? 'reset-confirm-password-error' : undefined}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      if (fieldErrors.confirmPassword) {
                        setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="authPasswordToggle"
                    aria-label={showConfirmPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    aria-pressed={showConfirmPassword}
                    title={showConfirmPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? <EyeInvisibleOutlined aria-hidden="true" /> : <EyeOutlined aria-hidden="true" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <small id="reset-confirm-password-error" className="fieldError" role="alert">{fieldErrors.confirmPassword}</small>
                )}
              </div>

              <button
                type="submit"
                className="button primary block authSubmit"
                style={{ marginTop: '24px' }}
                disabled={loading}
              >
                {loading ? 'กำลังบันทึกรหัสผ่านใหม่...' : 'บันทึกรหัสผ่านใหม่'}
              </button>

              <p className="authSwitch" style={{ marginTop: '20px' }}>
                <Link href="/login" className="authSwitchLink">ยกเลิกและกลับไปเข้าสู่ระบบ</Link>
              </p>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="centerState">กำลังโหลด...</main>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
