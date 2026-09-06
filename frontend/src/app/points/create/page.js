'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Protected from '../../../components/Protected';
import { api } from '../../../lib/api';

const MapPicker = dynamic(() => import('../../../components/MapPicker'), { ssr: false });
const DEFAULT_CENTER = { latitude: 13.7291, longitude: 100.7789 };

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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const hasPosition = form.latitude != null && form.longitude != null && Number.isFinite(Number(form.latitude)) && Number.isFinite(Number(form.longitude));

  useEffect(() => {
    if (!image) {
      setPreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  function openMap() {
    setError('');
    setDraftPosition(hasPosition
      ? { latitude: Number(form.latitude), longitude: Number(form.longitude) }
      : DEFAULT_CENTER);
    setMapOpen(true);
  }

  function confirmPosition() {
    if (!Number.isFinite(Number(draftPosition.latitude)) || !Number.isFinite(Number(draftPosition.longitude))) return;
    setForm((current) => ({ ...current, ...draftPosition }));
    setMapOpen(false);
  }

  function useCurrentPosition() {
    setError('');
    setMapOpen(true);
    if (!window.isSecureContext) {
      setError('การใช้ตำแหน่งปัจจุบันต้องเปิดผ่าน HTTPS หรือ localhost');
      return;
    }
    if (!navigator.geolocation) {
      setError('Browser นี้ไม่รองรับการระบุตำแหน่ง');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const current = { latitude: coords.latitude, longitude: coords.longitude };
        setDraftPosition(current);
        setForm((value) => ({ ...value, ...current }));
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError('ไม่สามารถอ่านตำแหน่งปัจจุบันได้ กรุณาอนุญาต Location แล้วลองอีกครั้ง');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!hasPosition) return setError('กรุณาเลือกตำแหน่งที่พบสัตว์');
    if (!image) return setError('กรุณาเพิ่มรูปอย่างน้อย 1 รูป');
    if ((usualStart && !usualEnd) || (!usualStart && usualEnd)) return setError('กรุณาเลือกเวลาเริ่มและเวลาสิ้นสุดให้ครบ หรือเว้นว่างทั้งคู่');

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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Protected>
      <main className="page createPointPage">
        <div className="pageTitle">
          <div>
            <span className="eyebrow">สร้างหมุดใหม่</span>
            <h1>เพิ่มจุดสัตว์จรจัด</h1>
            <p>เลือกตำแหน่ง เพิ่มรูป และรายละเอียดที่จำเป็น</p>
          </div>
        </div>

        {error && <div className="errorBox">{error}</div>}

        <form onSubmit={submit}>
          <section className="card createLocationCard">
            <div className="createSectionHeading">
              <div>
                <span className="createStep">1</span>
                <h3>ตำแหน่งที่พบสัตว์</h3>
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
            <div className="locationActionGrid">
              <button type="button" className="button locationSelectButton" onClick={openMap}>
                <span aria-hidden="true">⌖</span>
                {hasPosition ? 'เปลี่ยนตำแหน่งบนแผนที่' : 'เลือกตำแหน่งบนแผนที่'}
              </button>
              <button type="button" className="button soft" onClick={useCurrentPosition} disabled={locating}>
                {locating ? 'กำลังหาตำแหน่ง...' : 'ใช้ตำแหน่งปัจจุบัน'}
              </button>
            </div>
          </section>

          <section className="card">
            <div className="createSectionHeading">
              <div><span className="createStep">2</span><h3>รูปสัตว์หรือบริเวณที่พบ</h3></div>
            </div>
            {previewUrl ? (
              <div className="uploadPreview">
                <img src={previewUrl} alt="ตัวอย่างรูปที่เลือก" />
                <div className="uploadPreviewActions">
                  <label className="button soft">
                    เปลี่ยนรูป
                    <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImage(event.target.files?.[0] || null)} />
                  </label>
                  <button type="button" className="button danger" onClick={() => setImage(null)}>ลบรูป</button>
                </div>
              </div>
            ) : (
              <label className="uploadBox uploadBoxClean">
                <div>
                  <span className="uploadSymbol" aria-hidden="true">IMG</span>
                  <strong>เลือกรูปภาพ</strong>
                  <small>JPEG, PNG หรือ WebP</small>
                </div>
                <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImage(event.target.files?.[0] || null)} />
              </label>
            )}
          </section>

          <section className="card">
            <div className="createSectionHeading">
              <div><span className="createStep">3</span><h3>รายละเอียดสัตว์</h3></div>
            </div>
            <div className="formGrid">
              <div className="field">
                <label>ประเภทสัตว์ *</label>
                <select value={form.animalType} onChange={(event) => setForm({ ...form, animalType: event.target.value })}>
                  <option value="DOG">สุนัข</option>
                  <option value="CAT">แมว</option>
                  <option value="OTHER">อื่น ๆ</option>
                </select>
              </div>
              <div className="field">
                <label>จำนวนโดยประมาณ *</label>
                <input type="number" min="1" required value={form.estimatedCount} onChange={(event) => setForm({ ...form, estimatedCount: event.target.value })} />
              </div>
              <div className="field full">
                <label>คำอธิบาย *</label>
                <textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="ลักษณะสัตว์หรือจุดสังเกตที่ช่วยให้หาเจอ" />
              </div>
              <div className="field full">
                <label>ช่วงเวลาที่มักพบ</label>
                <div className="timeRangeFields">
                  <label className="timeRangeField"><span>เริ่ม</span><input type="time" value={usualStart} onChange={(event) => setUsualStart(event.target.value)} /></label>
                  <span className="timeRangeDivider" aria-hidden="true">—</span>
                  <label className="timeRangeField"><span>ถึง</span><input type="time" value={usualEnd} onChange={(event) => setUsualEnd(event.target.value)} /></label>
                </div>
              </div>
            </div>
          </section>

          <div className="formActions createFormActions">
            <button type="button" className="button" onClick={() => router.push('/')}>ยกเลิก</button>
            <button className="button primary" disabled={loading}>{loading ? 'กำลังสร้างจุด...' : 'สร้างจุดบนแผนที่'}</button>
          </div>
        </form>
      </main>

      {mapOpen && (
        <div className="locationPickerOverlay" role="dialog" aria-modal="true" aria-label="เลือกตำแหน่งที่พบสัตว์">
          <div className="locationPickerTopbar">
            <button type="button" className="locationPickerBack" onClick={() => setMapOpen(false)} aria-label="กลับไปหน้าสร้างจุด"><span aria-hidden="true">←</span><span>กลับ</span></button>
            <div><strong>เลือกตำแหน่งที่พบสัตว์</strong><span>แตะบนแผนที่เพื่อวางหมุด</span></div>
            <button type="button" className="locationPickerGps" onClick={useCurrentPosition} disabled={locating}>{locating ? 'กำลังหา...' : 'ตำแหน่งฉัน'}</button>
          </div>
          <div className="locationPickerMap">
            <MapPicker value={draftPosition} onChange={setDraftPosition} />
          </div>
          <div className="locationPickerFooter">
            <button type="button" className="button primary" onClick={confirmPosition}>ยืนยันตำแหน่งนี้</button>
          </div>
        </div>
      )}
    </Protected>
  );
}
