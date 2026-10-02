'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import Protected from '../../components/Protected';
import ProfileNav from '../../components/ProfileNav';
import { api, assetUrl, relativeTime } from '../../lib/api';

const ANIMAL = {
  DOG: { label: 'สุนัข', emoji: '🐕' },
  CAT: { label: 'แมว', emoji: '🐈' },
  OTHER: { label: 'สัตว์อื่น ๆ', emoji: '🐾' },
};

const STATUS = {
  ACTIVE: 'ยังพบอยู่',
  INACTIVE: 'ไม่ใช้งาน',
  CLOSED: 'ปิดแล้ว',
};

function OverviewSkeleton() {
  return (
    <div className="profileOverviewSkeleton" aria-hidden="true">
      <div /><div /><div />
    </div>
  );
}

export default function ProfilePage() {
  const [points, setPoints] = useState([]);
  const [feedings, setFeedings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [nextPoints, nextFeedings] = await Promise.all([
        api('/api/profile/points'),
        api('/api/profile/feedings'),
      ]);
      setPoints(nextPoints);
      setFeedings(nextFeedings);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <Protected>
      <main className="page profilePage">
        <div className="pageTitle profilePageTitle">
          <div>
            <span className="eyebrow">บัญชีของฉัน</span>
            <h1>กิจกรรมของฉัน</h1>
            <p>ดูภาพรวมจุดที่คุณสร้างและกิจกรรมการช่วยเหลือล่าสุด</p>
          </div>
          {!loading && !error && (
            <Link className="button primary" href="/points/create">+ เพิ่มจุดใหม่</Link>
          )}
        </div>

        {error && (
          <div className="profileErrorBox errorBox" role="alert">
            <span>{error}</span>
            <button type="button" className="button" onClick={load}>ลองอีกครั้ง</button>
          </div>
        )}

        <div className="profileGrid">
          <ProfileNav />

          <div className={`profileContent${error ? ' isUnavailable' : ''}`} aria-busy={loading}>
            <section className="card profileSummaryCard" aria-labelledby="profile-summary-heading">
              <div className="profileSectionHeader">
                <div>
                  <span>ภาพรวม</span>
                  <h2 id="profile-summary-heading">การช่วยเหลือของคุณ</h2>
                </div>
              </div>

              {loading ? (
                <OverviewSkeleton />
              ) : (
                <div className="stats">
                  <div className="stat"><span>จุดที่สร้าง</span><strong>{points.length}</strong></div>
                  <div className="stat"><span>ครั้งที่ให้อาหาร</span><strong>{feedings.length}</strong></div>
                  <div className="stat"><span>กิจกรรมรวม</span><strong>{points.length + feedings.length}</strong></div>
                </div>
              )}
            </section>

            <section className="card profileActivityCard" aria-labelledby="recent-points-heading">
              <div className="profileSectionHeader">
                <div>
                  <span>ล่าสุด</span>
                  <h2 id="recent-points-heading">จุดที่ฉันสร้าง</h2>
                </div>
                {!loading && points.length > 0 && <Link href="/profile/points">ดูทั้งหมด →</Link>}
              </div>

              {loading ? (
                <div className="profileListSkeleton" aria-label="กำลังโหลดจุดล่าสุด">
                  <span /><span /><span />
                </div>
              ) : points.length > 0 ? (
                <div className="profileRecentList">
                  {points.slice(0, 3).map((point) => {
                    const animal = ANIMAL[point.animalType] || ANIMAL.OTHER;
                    const image = assetUrl(point.imageUrl);
                    return (
                      <article className="profilePointRow" key={point.id}>
                        <div className="profilePointMedia">
                          {image ? <img src={image} alt="" /> : <span aria-hidden="true">{animal.emoji}</span>}
                        </div>
                        <div className="profilePointCopy">
                          <strong>{point.description || `${animal.label}จรจัดประมาณ ${point.estimatedCount} ตัว`}</strong>
                          <div className="profileMetaChips">
                            <span>{animal.label}</span>
                            <span className={point.status === 'ACTIVE' ? 'isActive' : ''}>{STATUS[point.status] || point.status}</span>
                          </div>
                          <small>อัปเดต {relativeTime(point.updatedAt)}</small>
                        </div>
                        <Link className="button profileRowAction" href={`/points/${point.id}`}>ดูรายละเอียด</Link>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="profileEmptyState">
                  <span className="profileEmptyIcon" aria-hidden="true">⌖</span>
                  <strong>ยังไม่มีจุดที่คุณสร้าง</strong>
                  <p>เพิ่มจุดสัตว์จรจัดที่พบเพื่อให้คนในพื้นที่ช่วยกันดูแล</p>
                  <Link className="button soft" href="/points/create">เพิ่มจุดแรก</Link>
                </div>
              )}
            </section>

            <section className="card profileActivityCard" aria-labelledby="recent-feedings-heading">
              <div className="profileSectionHeader">
                <div>
                  <span>ล่าสุด</span>
                  <h2 id="recent-feedings-heading">การให้อาหาร</h2>
                </div>
                {!loading && feedings.length > 0 && <Link href="/profile/feedings">ดูทั้งหมด →</Link>}
              </div>

              {loading ? (
                <div className="profileListSkeleton" aria-label="กำลังโหลดประวัติการให้อาหาร">
                  <span /><span /><span />
                </div>
              ) : feedings.length > 0 ? (
                <div className="profileFeedingList">
                  {feedings.slice(0, 3).map((feeding) => {
                    const animal = ANIMAL[feeding.point?.animalType] || ANIMAL.OTHER;
                    return (
                      <article className="profileFeedingRow" key={feeding.id}>
                        <span className="profileFeedingIcon" aria-hidden="true">{animal.emoji}</span>
                        <div>
                          <strong>{feeding.note?.trim() || 'ให้อาหารแล้ว'}</strong>
                          <small>{animal.label} · {relativeTime(feeding.fedAt)}</small>
                        </div>
                        {feeding.point?.id && <Link href={`/points/${feeding.point.id}`}>ดูจุด →</Link>}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="profileEmptyState">
                  <span className="profileEmptyIcon" aria-hidden="true">🐾</span>
                  <strong>ยังไม่มีประวัติการให้อาหาร</strong>
                  <p>เปิดแผนที่เพื่อค้นหาจุดที่ต้องการความช่วยเหลือใกล้คุณ</p>
                  <Link className="button soft" href="/">ดูแผนที่</Link>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </Protected>
  );
}
