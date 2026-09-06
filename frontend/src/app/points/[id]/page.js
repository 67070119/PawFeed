'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, assetUrl, relativeTime } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

const ANIMAL_LABELS = { DOG: 'สุนัข', CAT: 'แมว', OTHER: 'สัตว์อื่น ๆ' };
const STATUS_LABELS = { ACTIVE: 'ยังพบอยู่', INACTIVE: 'ไม่ใช้งาน', CLOSED: 'ปิดแล้ว' };

export default function PointDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [point, setPoint] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [photoOpen, setPhotoOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setPoint(await api(`/api/points/${id}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!photoOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setPhotoOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [photoOpen]);

  async function feed() {
    if (!user) return router.push(`/login?next=/points/${id}`);
    setBusy('feed');
    setError('');
    setMessage('');
    try {
      await api(`/api/points/${id}/feedings`, { method: 'POST', body: JSON.stringify({ note: note || undefined }) });
      setNote('');
      setMessage('บันทึกการให้อาหารแล้ว');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }

  async function report(type) {
    if (!user) return router.push(`/login?next=/points/${id}`);
    setBusy(type);
    setError('');
    setMessage('');
    try {
      await api(`/api/points/${id}/reports`, { method: 'POST', body: JSON.stringify({ type }) });
      setMessage(type === 'STILL_HERE' ? 'ยืนยันว่าพบสัตว์อยู่แล้ว' : 'บันทึกว่าไม่พบสัตว์แล้ว');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }

  const recentFeedings = useMemo(() => {
    if (!point?.feedings?.length) return [];
    return [...point.feedings]
      .sort((a, b) => new Date(b.fedAt).getTime() - new Date(a.fedAt).getTime())
      .slice(0, 5);
  }, [point?.feedings]);

  const recentReports = useMemo(() => {
    if (!point?.reports?.length) return [];
    return [...point.reports]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [point?.reports]);

  if (loading) return <main className="centerState">กำลังโหลดรายละเอียด...</main>;
  if (error && !point) return <main className="page narrow"><div className="errorBox">{error}</div><Link href="/" className="button">← กลับแผนที่</Link></main>;
  if (!point) return null;

  const photo = assetUrl(point.images?.[0]?.imageUrl);
  const animal = ANIMAL_LABELS[point.animalType] || ANIMAL_LABELS.OTHER;
  const status = STATUS_LABELS[point.status] || point.status || 'ไม่ระบุ';

  return (
    <main className="page pointDetailPage">
      <header className="pointDetailHeader">
        <div>
          <span className="eyebrow">รายละเอียดจุด</span>
          <h1>{animal}จรจัด</h1>
          <p>รายงานโดย {point.createdBy?.name || 'ผู้ใช้ PawFeed'} · พบล่าสุด {relativeTime(point.lastSeenAt)}</p>
        </div>
        <Link href="/" className="button pointBackButton">← กลับแผนที่</Link>
      </header>

      {error && <div className="errorBox">{error}</div>}
      {message && <div className="successBox">{message}</div>}

      <section className="card pointHeroCard">
        <div className="pointPhotoPanel">
          {photo ? (
            <button type="button" className="pointPhotoButton" onClick={() => setPhotoOpen(true)} aria-label="เปิดรูปสัตว์แบบเต็มจอ">
              <img className="pointHeroImage" src={photo} alt="รูปสัตว์จรจัด" />
              <span className="pointPhotoHint">ดูรูปเต็ม</span>
            </button>
          ) : (
            <div className="pointHeroFallback"><span>ไม่มีรูปภาพ</span></div>
          )}
        </div>

        <div className="pointHeroContent">
          <div className="pointHeroTopline">
            <span className="pointSeenBadge">พบล่าสุด {relativeTime(point.lastSeenAt)}</span>
            <span className="pointStatusBadge">{status}</span>
          </div>
          <h2>ประมาณ {point.estimatedCount} ตัว</h2>
          <p className="pointDescription">{point.description || 'ไม่มีรายละเอียดเพิ่มเติม'}</p>

          <div className="pointMetaGrid">
            <div className="pointMetaItem"><span>ประเภท</span><strong>{animal}</strong></div>
            <div className="pointMetaItem"><span>ช่วงเวลาที่มักพบ</span><strong>{point.usualTime || 'ไม่ระบุ'}</strong></div>
            <div className="pointMetaItem"><span>ให้อาหารล่าสุด</span><strong>{relativeTime(point.latestFeedingAt)}</strong></div>
          </div>

          <Link href={`/points/${id}/navigate`} className="button primary block pointNavigateButton">นำทางไปจุดนี้</Link>
        </div>
      </section>

      <div className="pointActionGrid">
        <section className="card pointFeedCard">
          <div className="pointSectionHeading">
            <div><span>การช่วยเหลือ</span><h3>บันทึกการให้อาหาร</h3></div>
          </div>
          <div className="field">
            <label>หมายเหตุ (ไม่บังคับ)</label>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="เช่น ให้อาหารเม็ดและเติมน้ำแล้ว" />
          </div>
          <button className="button primary pointFeedButton" disabled={busy === 'feed'} onClick={feed}>{busy === 'feed' ? 'กำลังบันทึก...' : 'ฉันให้อาหารแล้ว'}</button>
        </section>

        <section className="card pointConfirmCard pointConfirmCardRedesign">
          <div className="pointSectionHeading">
            <div><span>อัปเดตข้อมูล</span><h3>ยังพบสัตว์อยู่ไหม?</h3></div>
          </div>
          <p>ช่วยยืนยันสถานะของจุดนี้ เพื่อให้คนในพื้นที่เห็นข้อมูลที่อัปเดตล่าสุด</p>
          <div className="pointConfirmActions">
            <button className="button soft" disabled={!!busy} onClick={() => report('STILL_HERE')}>ยังพบสัตว์อยู่</button>
            <button className="button danger" disabled={!!busy} onClick={() => report('NOT_FOUND')}>ไม่พบแล้ว</button>
          </div>

          <div className="pointReportHistory">
            <div className="pointReportHistoryHeader">
              <strong>รายงานล่าสุด</strong>
              <span>5 รายการล่าสุด</span>
            </div>
            {recentReports.length ? (
              <div className="pointReportHistoryList">
                {recentReports.map((item) => {
                  const stillHere = item.type === 'STILL_HERE';
                  return (
                    <div className={`pointReportHistoryRow${stillHere ? ' isPresent' : ' isMissing'}`} key={item.id}>
                      <span className="pointReportHistoryIcon" aria-hidden="true">{stillHere ? '✓' : '–'}</span>
                      <strong>{stillHere ? 'ยังพบสัตว์อยู่' : 'ไม่พบแล้ว'}</strong>
                      <span>{relativeTime(item.createdAt)}</span>
                    </div>
                  );
                })}
              </div>
            ) : <div className="pointReportEmpty">ยังไม่มีการรายงานสถานะ</div>}
          </div>
        </section>
      </div>

      <section className="card pointHistoryCard">
        <div className="pointHistoryHeader">
          <div><span>กิจกรรมล่าสุด</span><h3>ประวัติการให้อาหาร</h3></div>
          <small>แสดง 5 รายการล่าสุด</small>
        </div>
        {recentFeedings.length ? (
          <div className="pointHistoryList">
            {recentFeedings.map((item) => (
              <article className="pointHistoryRow" key={item.id}>
                <span className="pointHistoryDot" aria-hidden="true" />
                <div className="pointHistoryCopy">
                  <strong>{relativeTime(item.fedAt)}</strong>
                  <span>{item.user?.name || 'ผู้ใช้ PawFeed'}</span>
                  {item.note && <p>{item.note}</p>}
                </div>
              </article>
            ))}
          </div>
        ) : <div className="empty">ยังไม่มีประวัติการให้อาหาร</div>}
      </section>

      {photoOpen && photo && (
        <div className="pointLightbox" role="dialog" aria-modal="true" aria-label="รูปสัตว์แบบเต็มจอ" onMouseDown={(event) => { if (event.target === event.currentTarget) setPhotoOpen(false); }}>
          <button type="button" className="pointLightboxClose" onClick={() => setPhotoOpen(false)} aria-label="ปิดรูป">
            <span className="pointLightboxCloseIcon" aria-hidden="true" />
            <span>ปิด</span>
          </button>
          <img src={photo} alt="รูปสัตว์จรจัดแบบเต็มจอ" />
        </div>
      )}
    </main>
  );
}
