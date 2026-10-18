'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { PlusOutlined, EditOutlined, ArrowRightOutlined, EnvironmentOutlined } from '@ant-design/icons';
import Protected from '../../../components/Protected';
import ProfileNav from '../../../components/ProfileNav';
import AnimalIcon from '../../../components/AnimalIcon';
import { api, assetUrl, relativeTime } from '../../../lib/api';

const ANIMAL = {
  DOG: { label: 'สุนัข' },
  CAT: { label: 'แมว' },
  OTHER: { label: 'สัตว์อื่น ๆ' },
};

const STATUS = {
  ACTIVE: 'ยังพบอยู่',
  INACTIVE: 'ไม่ใช้งาน',
  CLOSED: 'ปิดแล้ว',
};

function PointSkeleton() {
  return (
    <div className="profilePointSkeleton" aria-hidden="true">
      <span /><div><i /><i /><i /></div>
    </div>
  );
}

export default function ProfilePointsPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await api('/api/profile/points'));
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
            <h1>จุดที่ฉันสร้าง</h1>
            <p>จัดการและกลับไปดูจุดสัตว์จรจัดที่คุณเคยรายงาน</p>
          </div>
          {!loading && !error && (
            <div className="profileTitleActions">
              <span className="profileTotalCount" aria-label={`ทั้งหมด ${items.length} จุด`}><strong>{items.length}</strong><small>จุด</small></span>
              <Link className="button primary" href="/points/create">
                <PlusOutlined aria-hidden="true" />
                <span>เพิ่มจุด</span>
              </Link>
            </div>
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

          <section className={`card profilePointsCard${error ? ' isUnavailable' : ''}`} aria-labelledby="my-points-heading" aria-busy={loading}>
            <div className="profileSectionHeader">
              <div>
                <span>รายการของฉัน</span>
                <h2 id="my-points-heading">จุดสัตว์จรจัด</h2>
              </div>
            </div>

            {loading ? (
              <div className="profilePointSkeletonList" aria-label="กำลังโหลดจุดที่สร้าง">
                <PointSkeleton /><PointSkeleton /><PointSkeleton />
              </div>
            ) : items.length > 0 ? (
              <div className="profilePointList">
                {items.map((point) => {
                  const animalBase = ANIMAL[point.animalType] || ANIMAL.OTHER;
                  let animalLabel = animalBase.label;
                  if (point.animalType === 'OTHER' && point.description) {
                    const match = point.description.match(/^\[ชนิดสัตว์:\s*([^\]]+)\]\s*\n*/);
                    if (match) animalLabel = match[1].trim();
                  }
                  const animal = { ...animalBase, label: animalLabel };
                  const image = assetUrl(point.imageUrl);
                  return (
                    <article className="profilePointCard" key={point.id}>
                      <div className="profilePointCardMedia">
                        {image ? (
                          <img src={image} alt={`รูปจุด${animal.label}จรจัด`} />
                        ) : (
                          <AnimalIcon type={point.animalType} size={32} />
                        )}
                      </div>

                      <div className="profilePointCardBody">
                        <div className="profilePointCardTopline">
                          <div className="profileMetaChips">
                            <span>{animal.label}</span>
                            <span className={point.status === 'ACTIVE' ? 'isActive' : ''}>{STATUS[point.status] || point.status}</span>
                          </div>
                          <time dateTime={point.createdAt}>สร้าง {relativeTime(point.createdAt)}</time>
                        </div>

                        <h2>{point.description}</h2>
                        <div className="profilePointFacts">
                          <span><small>จำนวน</small><strong>ประมาณ {point.estimatedCount} ตัว</strong></span>
                          <span><small>ให้อาหารล่าสุด</small><strong>{relativeTime(point.latestFeedingAt)}</strong></span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                          <Link className="button profilePointCardAction" href={`/points/${point.id}`}>
                            <span>ดูรายละเอียด</span>
                            <ArrowRightOutlined aria-hidden="true" />
                          </Link>
                          <Link className="button soft" href={`/points/${point.id}/edit`} style={{ padding: '8px 12px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <EditOutlined aria-hidden="true" />
                            <span>แก้ไข</span>
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="profileEmptyState profileEmptyLarge">
                <span className="profileEmptyIcon" aria-hidden="true"><EnvironmentOutlined /></span>
                <strong>ยังไม่มีจุดที่คุณสร้าง</strong>
                <p>เมื่อพบสัตว์จรจัด คุณสามารถเพิ่มตำแหน่งและรายละเอียดเพื่อให้ชุมชนช่วยกันดูแลได้</p>
                <Link className="button primary" href="/points/create">เพิ่มจุดแรก</Link>
              </div>
            )}
          </section>
        </div>
      </main>
    </Protected>
  );
}
