'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeftOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import Protected from '../../../../components/Protected';
import TimeRangePicker from '../../../../components/TimeRangePicker';
import AnimalTypePicker from '../../../../components/AnimalTypePicker';
import PointStatusPicker from '../../../../components/PointStatusPicker';
import { api, assetUrl } from '../../../../lib/api';
import { useAuth } from '../../../../lib/auth-context';

const ANIMAL_LABELS = { DOG: 'สุนัข', CAT: 'แมว', OTHER: 'สัตว์อื่น ๆ' };

export default function EditPointPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [point, setPoint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [animalType, setAnimalType] = useState('DOG');
  const [customAnimal, setCustomAnimal] = useState('');
  const [estimatedCount, setEstimatedCount] = useState('1');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [usualStart, setUsualStart] = useState('');
  const [usualEnd, setUsualEnd] = useState('');

  const loadPoint = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api(`/api/points/${id}`);
      setPoint(data);
      setAnimalType(data.animalType || 'DOG');
      setEstimatedCount(String(data.estimatedCount || 1));
      
      let rawDesc = data.description || '';
      if (data.animalType === 'OTHER') {
        const match = rawDesc.match(/^\[ชนิดสัตว์:\s*([^\]]+)\]\s*\n*/);
        if (match) {
          setCustomAnimal(match[1].trim());
          rawDesc = rawDesc.replace(/^\[ชนิดสัตว์:\s*([^\]]+)\]\s*\n*/, '');
        }
      }
      setDescription(rawDesc);
      setStatus(data.status || 'ACTIVE');

      if (data.usualTime && data.usualTime.includes(' - ')) {
        const [start, end] = data.usualTime.split(' - ');
        setUsualStart(start.trim());
        setUsualEnd(end.trim());
      } else if (data.usualTime) {
        setUsualStart(data.usualTime.trim());
      }
    } catch (err) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูลจุดได้');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPoint();
  }, [loadPoint]);

  function clearFieldError(name) {
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  function validate() {
    const nextErrors = {};

    const countNum = Number.parseInt(estimatedCount, 10);
    if (!estimatedCount || Number.isNaN(countNum) || countNum < 1 || countNum > 1000) {
      nextErrors.estimatedCount = 'จำนวนต้องอยู่ระหว่าง 1 ถึง 1000 ตัว';
    }

    if (animalType === 'OTHER' && !customAnimal.trim()) {
      nextErrors.customAnimal = 'กรุณาระบุชนิดสัตว์ เช่น กระต่าย, นก, ลิง';
    }

    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      nextErrors.description = 'กรุณาระบุคำอธิบาย';
    } else if (trimmedDesc.length > 2000) {
      nextErrors.description = 'คำอธิบายยาวเกิน 2000 ตัวอักษร';
    }

    if ((usualStart && !usualEnd) || (!usualStart && usualEnd)) {
      nextErrors.usualTime = 'กรุณาระบุเวลาให้ครบทั้งเวลาเริ่มและเวลาสิ้นสุด';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!validate()) {
      return;
    }

    setSaving(true);
    try {
      const computedUsualTime = usualStart && usualEnd
        ? `${usualStart} - ${usualEnd}`
        : (usualStart || null);

      let finalDescription = description.trim();
      if (animalType === 'OTHER' && customAnimal.trim()) {
        finalDescription = `[ชนิดสัตว์: ${customAnimal.trim()}]\n\n${finalDescription}`;
      }

      const payload = {
        animalType,
        estimatedCount: Number.parseInt(estimatedCount, 10),
        description: finalDescription,
        status,
        usualTime: computedUsualTime,
      };

      await api(`/api/points/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      router.push(`/points/${id}`);
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSaving(false);
    }
  }

  const isOwner = Boolean(user && point && (user.id === point.createdByUserId || user.id === point.createdBy?.id));
  const photo = point ? assetUrl(point.images?.[0]?.imageUrl) : null;

  return (
    <Protected>
      <main className="page narrow pointEditPage">
        <header className="pageTitle" style={{ marginBottom: '24px' }}>
          <div>
            <span className="eyebrow">จัดการข้อมูล</span>
            <h1>
              <EditOutlined aria-hidden="true" style={{ marginRight: '8px', fontSize: '0.85em', color: 'var(--primary-dark)' }} />
              แก้ไขข้อมูลจุดสัตว์จรจัด
            </h1>
            <p>อัปเดตสถานะและข้อมูลเพื่อให้ชุมชนดูแลสัตว์ได้อย่างแม่นยำ</p>
          </div>
          <Link href={`/points/${id}`} className="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeftOutlined aria-hidden="true" />
            <span>ยกเลิก</span>
          </Link>
        </header>

        {loading ? (
          <div className="centerState" role="status">กำลังโหลดข้อมูลจุด...</div>
        ) : error && !point ? (
          <div className="card">
            <div className="errorBox" role="alert">{error}</div>
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <button type="button" className="button primary" onClick={loadPoint}>ลองอีกครั้ง</button>
              <Link href="/" className="button">กลับแผนที่</Link>
            </div>
          </div>
        ) : !isOwner ? (
          <div className="card">
            <div className="warningBox" role="alert">
              <strong>คุณไม่มีสิทธิ์แก้ไขจุดนี้</strong>
              <p style={{ margin: '8px 0 0' }}>เฉพาะผู้ที่สร้างหรือรายงานจุดนี้เท่านั้นที่สามารถแก้ไขข้อมูลได้</p>
            </div>
            <div style={{ marginTop: '16px' }}>
              <Link href={`/points/${id}`} className="button primary">กลับไปหน้ารายละเอียดจุด</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {error && <div className="errorBox" role="alert">{error}</div>}

            {photo && (
              <section className="card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <img
                  src={photo}
                  alt="รูปจุดสัตว์จรจัด"
                  style={{ width: '88px', height: '88px', objectFit: 'cover', borderRadius: '14px', flexShrink: 0 }}
                />
                <div>
                  <strong>รูปถ่ายปัจจุบัน</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--muted)' }}>
                    {ANIMAL_LABELS[point.animalType] || 'สัตว์'}จรจัด พิกัด {Number(point.latitude).toFixed(4)}, {Number(point.longitude).toFixed(4)}
                  </p>
                </div>
              </section>
            )}

            <section className="card">
              <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>สถานะของจุดนี้</h2>
              <div className="field">
                <label style={{ marginBottom: '8px', display: 'block' }}>สถานะปัจจุบัน</label>
                <PointStatusPicker
                  value={status}
                  onChange={(val) => setStatus(val)}
                />
              </div>
            </section>

            <section className="card">
              <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>ข้อมูลสัตว์</h2>

              <div className="field full" style={{ marginBottom: '16px' }}>
                <label style={{ marginBottom: '8px', display: 'block' }}>ประเภทสัตว์ <span aria-hidden="true">*</span></label>
                <AnimalTypePicker
                  value={animalType}
                  customValue={customAnimal}
                  error={fieldErrors.animalType}
                  customError={fieldErrors.customAnimal}
                  onChange={(type) => {
                    setAnimalType(type);
                    clearFieldError('animalType');
                    if (type !== 'OTHER') clearFieldError('customAnimal');
                  }}
                  onCustomChange={(val) => {
                    setCustomAnimal(val);
                    clearFieldError('customAnimal');
                  }}
                />
              </div>

              <div className="formGrid">

                <div className="field full">
                  <label htmlFor="estimated-count">จำนวนโดยประมาณ <span aria-hidden="true">*</span></label>
                  <div className="estimatedCountWrapper">
                    <div className="estimatedCountRow">
                      <input
                        id="estimated-count"
                        type="number"
                        inputMode="numeric"
                        min="1"
                        max="1000"
                        value={estimatedCount}
                        className="estimatedCountInput"
                        aria-invalid={fieldErrors.estimatedCount ? 'true' : undefined}
                        aria-describedby={fieldErrors.estimatedCount ? 'estimated-count-error' : undefined}
                        onChange={(event) => {
                          setEstimatedCount(event.target.value);
                          clearFieldError('estimatedCount');
                        }}
                      />
                      <span className="estimatedCountUnit">ตัว</span>
                      <div className="estimatedCountChips" role="group" aria-label="เลือกจำนวนด่วน">
                        {['1', '2', '3', '5', '10'].map((cnt) => {
                          const isMatch = String(estimatedCount) === cnt;
                          return (
                            <button
                              key={cnt}
                              type="button"
                              className={`estimatedCountChip ${isMatch ? 'active' : ''}`}
                              onClick={() => {
                                setEstimatedCount(cnt);
                                clearFieldError('estimatedCount');
                              }}
                            >
                              {cnt} ตัว
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  {fieldErrors.estimatedCount && (
                    <small id="estimated-count-error" className="fieldError" role="alert">{fieldErrors.estimatedCount}</small>
                  )}
                </div>

                <div className="field full">
                  <label htmlFor="point-description">คำอธิบายและจุดสังเกต <span aria-hidden="true">*</span></label>
                  <textarea
                    id="point-description"
                    value={description}
                    maxLength={2000}
                    aria-invalid={fieldErrors.description ? 'true' : undefined}
                    aria-describedby="point-description-help"
                    onChange={(event) => {
                      setDescription(event.target.value);
                      clearFieldError('description');
                    }}
                    placeholder="เช่น สุนัขสีน้ำตาล 2 ตัว มักนอนอยู่ใต้ร่มไม้ข้างร้านค้า"
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                    <small id="point-description-help" className={fieldErrors.description ? 'fieldError' : undefined}>
                      {fieldErrors.description || 'ระบุรายละเอียดลักษณะสัตว์หรือจุดสังเกต'}
                    </small>
                    <small>{description.length}/2000</small>
                  </div>
                </div>

                <div className="field full">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label>ช่วงเวลาที่มักพบ</label>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>ไม่บังคับ</span>
                  </div>
                  <TimeRangePicker
                    startTime={usualStart}
                    endTime={usualEnd}
                    error={fieldErrors.usualTime}
                    onChange={({ startTime: s, endTime: e }) => {
                      setUsualStart(s);
                      setUsualEnd(e);
                      clearFieldError('usualTime');
                    }}
                  />
                </div>
              </div>
            </section>

            <div className="formActions" style={{ marginTop: '24px' }}>
              <button
                type="button"
                className="button"
                disabled={saving}
                onClick={() => router.push(`/points/${id}`)}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="button primary"
                disabled={saving}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <SaveOutlined aria-hidden="true" />
                <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</span>
              </button>
            </div>
          </form>
        )}
      </main>
    </Protected>
  );
}
