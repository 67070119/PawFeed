'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Protected from '../../../components/Protected';
import { api } from '../../../lib/api';

const MapPicker = dynamic(() => import('../../../components/MapPicker'), { ssr: false });
const DEFAULT_CENTER = { latitude: 13.7291, longitude: 100.7789 };
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function CreatePointPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    animalType: 'DOG',
    estimatedCount: '1',
    description: '',
    latitude: null,
    longitude: null,
  });
  const [usualStart, setUsualStart] = useState('');
  const [usualEnd, setUsualEnd] = useState('');
  const [draftPosition, setDraftPosition] = useState(DEFAULT_CENTER);
  const [mapOpen, setMapOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [serverError, setServerError] = useState('');
  const [mapError, setMapError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const mapBackRef = useRef(null);
  const mapOpenerRef = useRef(null);
  const mapDialogRef = useRef(null);
  const imageInputRef = useRef(null);

  const hasPosition = form.latitude != null
    && form.longitude != null
    && Number.isFinite(Number(form.latitude))
    && Number.isFinite(Number(form.longitude));

  useEffect(() => {
    if (!image) {
      setPreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  useEffect(() => {
    if (!mapOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => mapBackRef.current?.focus(), 0);

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setMapOpen(false);
        return;
      }

      if (event.key !== 'Tab') return;
      const focusables = mapDialogRef.current?.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables?.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      window.setTimeout(() => mapOpenerRef.current?.focus(), 0);
    };
  }, [mapOpen]);

  function clearFieldError(name) {
    setFieldErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function openMap(event) {
    mapOpenerRef.current = event.currentTarget;
    setServerError('');
    setMapError('');
    clearFieldError('location');
    setDraftPosition(hasPosition
      ? { latitude: Number(form.latitude), longitude: Number(form.longitude) }
      : DEFAULT_CENTER);
    setMapOpen(true);
  }

  function closeMap() {
    setMapOpen(false);
    setMapError('');
  }

  function confirmPosition() {
    if (!Number.isFinite(Number(draftPosition.latitude)) || !Number.isFinite(Number(draftPosition.longitude))) {
      setMapError('กรุณาเลือกตำแหน่งบนแผนที่ก่อนยืนยัน');
      return;
    }
    setForm((current) => ({ ...current, ...draftPosition }));
    clearFieldError('location');
    closeMap();
  }

  function useCurrentPosition({ openPicker = true } = {}) {
    setServerError('');
    setMapError('');
    if (openPicker) setMapOpen(true);

    if (!window.isSecureContext) {
      setMapError('การใช้ตำแหน่งปัจจุบันต้องเปิดผ่าน HTTPS หรือ localhost');
      return;
    }
    if (!navigator.geolocation) {
      setMapError('เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const current = { latitude: coords.latitude, longitude: coords.longitude };
        setDraftPosition(current);
        setForm((value) => ({ ...value, ...current }));
        clearFieldError('location');
        setMapError('');
        setLocating(false);
      },
      () => {
        setLocating(false);
        setMapError('ไม่สามารถอ่านตำแหน่งปัจจุบันได้ กรุณาอนุญาต Location แล้วลองอีกครั้ง หรือเลือกตำแหน่งบนแผนที่แทน');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );
  }

  function chooseImage(file) {
    setServerError('');
    clearFieldError('image');
    if (!file) {
      setImage(null);
      return;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImage(null);
      setFieldErrors((current) => ({ ...current, image: 'รองรับเฉพาะไฟล์ JPEG, PNG หรือ WebP' }));
      return;
    }
    setImage(file);
  }

  function validate() {
    const next = {};
    if (!hasPosition) next.location = 'กรุณาเลือกตำแหน่งที่พบสัตว์';
    if (!image) next.image = 'กรุณาเพิ่มรูปอย่างน้อย 1 รูป';
    if (!form.description.trim()) next.description = 'กรุณาใส่คำอธิบายเพื่อช่วยให้หาจุดนี้เจอ';
    const estimatedCount = Number(form.estimatedCount);
    if (!Number.isInteger(estimatedCount) || estimatedCount < 1 || estimatedCount > 1000) next.estimatedCount = 'จำนวนต้องเป็นเลขจำนวนเต็มระหว่าง 1–1,000 ตัว';
    if ((usualStart && !usualEnd) || (!usualStart && usualEnd)) next.usualTime = 'กรุณาเลือกเวลาเริ่มและเวลาสิ้นสุดให้ครบ หรือเว้นว่างทั้งคู่';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event) {
    event.preventDefault();
    setServerError('');
    if (!validate()) {
      window.requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }

    setLoading(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== '' && value != null) body.append(key, String(value));
      });
      if (usualStart && usualEnd) body.append('usualTime', `${usualStart} - ${usualEnd}`);
      body.append('image', image);
      const point = await api('/api/points', { method: 'POST', body });
      router.push(`/points/${point.id}`);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Protected>
      <main className="page createPointPage">
        <div className="pageTitle createPageTitle">
          <div>
            <span className="eyebrow">สร้างหมุดใหม่</span>
            <h1>เพิ่มจุดสัตว์จรจัด</h1>
            <p>เพิ่มข้อมูลที่จำเป็น 3 ส่วน เพื่อให้คนอื่นค้นหาและเข้าช่วยเหลือได้ง่าย</p>
          </div>
        </div>

        {serverError && <div className="errorBox createGlobalError" role="alert">{serverError}</div>}

        <form className="createPointForm" onSubmit={submit} noValidate>
          <section className={`card createLocationCard${fieldErrors.location ? ' hasError' : ''}`} aria-labelledby="create-location-heading">
            <div className="createSectionHeading">
              <div>
                <span className="createStep" aria-hidden="true">1</span>
                <div>
                  <h3 id="create-location-heading">ตำแหน่งที่พบสัตว์</h3>
                  <small>เลือกจุดให้ใกล้ตำแหน่งจริงที่สุด</small>
                </div>
              </div>
              <span className={`locationState ${hasPosition ? 'isReady' : ''}`}>
                {hasPosition ? 'เลือกตำแหน่งแล้ว' : 'ยังไม่ได้เลือก'}
              </span>
            </div>

            {hasPosition && (
              <div className="locationPreviewMap" aria-label="ตัวอย่างตำแหน่งที่เลือก">
                <MapPicker
                  value={{ latitude: Number(form.latitude), longitude: Number(form.longitude) }}
                  interactive={false}
                  preview
                />
                <div className="locationPreviewBadge"><span aria-hidden="true">●</span> ตำแหน่งที่เลือก</div>
              </div>
            )}

            {fieldErrors.location && <p className="fieldError" role="alert">{fieldErrors.location}</p>}

            <div className="locationActionGrid">
              <button
                type="button"
                className="button locationSelectButton"
                onClick={openMap}
                aria-invalid={fieldErrors.location ? 'true' : undefined}
              >
                <span aria-hidden="true">⌖</span>
                {hasPosition ? 'เปลี่ยนตำแหน่งบนแผนที่' : 'เลือกตำแหน่งบนแผนที่'}
              </button>
              <button
                type="button"
                className="button soft"
                onClick={(event) => { mapOpenerRef.current = event.currentTarget; useCurrentPosition(); }}
                disabled={locating}
              >
                {locating ? 'กำลังหาตำแหน่ง...' : 'ใช้ตำแหน่งปัจจุบัน'}
              </button>
            </div>
          </section>

          <section className={`card createUploadCard${fieldErrors.image ? ' hasError' : ''}`} aria-labelledby="create-image-heading">
            <div className="createSectionHeading">
              <div>
                <span className="createStep" aria-hidden="true">2</span>
                <div>
                  <h3 id="create-image-heading">รูปสัตว์หรือบริเวณที่พบ</h3>
                  <small>ใช้รูปที่ช่วยให้จำสัตว์หรือสถานที่ได้ชัดเจน</small>
                </div>
              </div>
            </div>

            <input
              ref={imageInputRef}
              className="visuallyHidden"
              type="file"
              tabIndex={-1}
              aria-hidden="true"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => chooseImage(event.target.files?.[0] || null)}
            />

            {previewUrl ? (
              <div className="uploadPreview">
                <img src={previewUrl} alt="ตัวอย่างรูปที่เลือก" />
                <div className="uploadFileMeta">
                  <strong>{image?.name}</strong>
                  <span>{image ? `${Math.max(1, Math.round(image.size / 1024))} KB` : ''}</span>
                </div>
                <div className="uploadPreviewActions">
                  <button type="button" className="button soft" onClick={() => imageInputRef.current?.click()}>เปลี่ยนรูป</button>
                  <button type="button" className="button danger" onClick={() => chooseImage(null)}>ลบรูป</button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="uploadBox uploadBoxClean uploadButton"
                onClick={() => imageInputRef.current?.click()}
                aria-invalid={fieldErrors.image ? 'true' : undefined}
              >
                <div>
                  <span className="uploadSymbol" aria-hidden="true">IMG</span>
                  <strong>เลือกรูปภาพ</strong>
                  <small>JPEG, PNG หรือ WebP</small>
                </div>
              </button>
            )}
            {fieldErrors.image && <p className="fieldError" role="alert">{fieldErrors.image}</p>}
          </section>

          <section className="card" aria-labelledby="create-details-heading">
            <div className="createSectionHeading">
              <div>
                <span className="createStep" aria-hidden="true">3</span>
                <div>
                  <h3 id="create-details-heading">รายละเอียดสัตว์</h3>
                  <small>ข้อมูลสั้น ๆ ที่ช่วยให้คนอื่นตัดสินใจและหาเจอได้ง่าย</small>
                </div>
              </div>
            </div>

            <div className="formGrid">
              <div className="field">
                <label htmlFor="animal-type">ประเภทสัตว์ <span aria-hidden="true">*</span></label>
                <select
                  id="animal-type"
                  value={form.animalType}
                  onChange={(event) => setForm({ ...form, animalType: event.target.value })}
                >
                  <option value="DOG">สุนัข</option>
                  <option value="CAT">แมว</option>
                  <option value="OTHER">อื่น ๆ</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="estimated-count">จำนวนโดยประมาณ <span aria-hidden="true">*</span></label>
                <input
                  id="estimated-count"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="1000"
                  value={form.estimatedCount}
                  aria-invalid={fieldErrors.estimatedCount ? 'true' : undefined}
                  aria-describedby={fieldErrors.estimatedCount ? 'estimated-count-error' : undefined}
                  onChange={(event) => {
                    setForm({ ...form, estimatedCount: event.target.value });
                    clearFieldError('estimatedCount');
                  }}
                />
                {fieldErrors.estimatedCount && <small id="estimated-count-error" className="fieldError" role="alert">{fieldErrors.estimatedCount}</small>}
              </div>

              <div className="field full createDescriptionField">
                <label htmlFor="point-description">คำอธิบาย <span aria-hidden="true">*</span></label>
                <textarea
                  id="point-description"
                  value={form.description}
                  maxLength={2000}
                  aria-invalid={fieldErrors.description ? 'true' : undefined}
                  aria-describedby="point-description-help"
                  onChange={(event) => {
                    setForm({ ...form, description: event.target.value });
                    clearFieldError('description');
                  }}
                  placeholder="เช่น สุนัขสีน้ำตาล 2 ตัว อยู่ใกล้ร้านสะดวกซื้อข้างซอย"
                />
                <div className="fieldMetaRow">
                  <small id="point-description-help" className={fieldErrors.description ? 'fieldError' : 'fieldHint'}>
                    {fieldErrors.description || 'ใส่ลักษณะสัตว์และจุดสังเกตที่ช่วยให้หาเจอ'}
                  </small>
                  <small>{form.description.length}/2000</small>
                </div>
              </div>

              <div className="field full createTimeField">
                <div className="fieldLabelRow">
                  <label>ช่วงเวลาที่มักพบ</label>
                  <span>ไม่บังคับ</span>
                </div>
                <div className="timeRangeFields">
                  <label className="timeRangeField" htmlFor="usual-start"><span>เริ่ม</span><input id="usual-start" type="time" value={usualStart} aria-invalid={fieldErrors.usualTime ? 'true' : undefined} onChange={(event) => { setUsualStart(event.target.value); clearFieldError('usualTime'); }} /></label>
                  <span className="timeRangeDivider" aria-hidden="true">—</span>
                  <label className="timeRangeField" htmlFor="usual-end"><span>ถึง</span><input id="usual-end" type="time" value={usualEnd} aria-invalid={fieldErrors.usualTime ? 'true' : undefined} onChange={(event) => { setUsualEnd(event.target.value); clearFieldError('usualTime'); }} /></label>
                </div>
                {fieldErrors.usualTime && <small className="fieldError" role="alert">{fieldErrors.usualTime}</small>}
              </div>
            </div>
          </section>

          <div className="formActions createFormActions">
            <button type="button" className="button" disabled={loading} onClick={() => router.push('/')}>ยกเลิก</button>
            <button className="button primary" disabled={loading}>{loading ? 'กำลังสร้างจุด...' : 'สร้างจุดบนแผนที่'}</button>
          </div>
        </form>
      </main>

      {mapOpen && (
        <div
          ref={mapDialogRef}
          className="locationPickerOverlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="location-picker-title"
        >
          <div className="locationPickerTopbar">
            <button ref={mapBackRef} type="button" className="locationPickerBack" onClick={closeMap} aria-label="กลับไปหน้าสร้างจุด">
              <span aria-hidden="true">←</span><span>กลับ</span>
            </button>
            <div>
              <strong id="location-picker-title">เลือกตำแหน่งที่พบสัตว์</strong>
              <span>แตะบนแผนที่เพื่อวางหมุด แล้วกดยืนยัน</span>
            </div>
            <button type="button" className="locationPickerGps" onClick={() => useCurrentPosition({ openPicker: false })} disabled={locating}>
              {locating ? 'กำลังหา...' : 'ตำแหน่งฉัน'}
            </button>
          </div>

          {mapError && (
            <div className="locationPickerNotice" role="alert">
              <span>{mapError}</span>
              <button type="button" onClick={() => setMapError('')} aria-label="ปิดข้อความ">×</button>
            </div>
          )}

          <div className="locationPickerMap" aria-label="แผนที่สำหรับเลือกตำแหน่ง">
            <MapPicker value={draftPosition} onChange={(position) => { setDraftPosition(position); setMapError(''); }} />
            <div className="locationPickerCoords" aria-live="polite">
              <span>ตำแหน่งที่เลือก</span>
              <strong>{Number(draftPosition.latitude).toFixed(5)}, {Number(draftPosition.longitude).toFixed(5)}</strong>
            </div>
          </div>

          <div className="locationPickerFooter">
            <button type="button" className="button primary" onClick={confirmPosition}>ยืนยันตำแหน่งนี้</button>
          </div>
        </div>
      )}
    </Protected>
  );
}
