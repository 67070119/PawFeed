'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Protected from '../../../components/Protected';
import ProfileNav from '../../../components/ProfileNav';
import { api, assetUrl, relativeTime } from '../../../lib/api';

const ANIMAL = {
  DOG: { emoji: '🐕', label: 'สุนัข' },
  CAT: { emoji: '🐈', label: 'แมว' },
  OTHER: { emoji: '🐾', label: 'สัตว์อื่น ๆ' },
};

function groupLabel(value) {
  const date = new Date(value);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const day = 24 * 60 * 60 * 1000;
  if (target === today) return 'วันนี้';
  if (target === today - day) return 'เมื่อวาน';
  return 'ก่อนหน้านี้';
}

function FeedingSkeleton() {
  return (
    <div className="feedingSkeleton" aria-hidden="true">
      <div className="feedingSkeletonImage" />
      <div className="feedingSkeletonBody">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export default function ProfileFeedingsPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await api('/api/profile/feedings'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const groups = useMemo(() => {
    const grouped = [];
    for (const item of items) {
      const label = groupLabel(item.fedAt);
      let group = grouped.find((entry) => entry.label === label);
      if (!group) {
        group = { label, items: [] };
        grouped.push(group);
      }
      group.items.push(item);
    }
    return grouped;
  }, [items]);

  return (
    <Protected>
      <main className="page feedingPage profilePage">
        <div className="pageTitle feedingPageTitle profilePageTitle">
          <div>
            <span className="eyebrow">บัญชีของฉัน</span>
            <h1>ประวัติการให้อาหาร</h1>
            <p>ย้อนดูจุดที่คุณเคยช่วยให้อาหารสัตว์และกลับไปดูข้อมูลของจุดนั้นได้</p>
          </div>
          {!loading && !error && items.length > 0 && (
            <div className="feedingCount" aria-label={`ทั้งหมด ${items.length} ครั้ง`}>
              <strong>{items.length}</strong>
              <span>ครั้ง</span>
            </div>
          )}
        </div>

        {error && (
          <div className="profileErrorBox errorBox" role="alert">
            <span>{error}</span>
            <button type="button" className="button" onClick={load}>ลองอีกครั้ง</button>
          </div>
        )}

        <div className="profileGrid feedingProfileGrid">
          <ProfileNav />

          <section className={`feedingHistoryPanel${error ? ' isUnavailable' : ''}`} aria-label="รายการประวัติการให้อาหาร" aria-busy={loading}>
            {loading && (
              <div className="feedingSkeletonList" role="status" aria-label="กำลังโหลดประวัติการให้อาหาร">
                <FeedingSkeleton />
                <FeedingSkeleton />
                <FeedingSkeleton />
              </div>
            )}

            {!loading && !error && groups.map((group) => (
              <section className="feedingGroup" key={group.label} aria-labelledby={`feeding-group-${group.label}`}>
                <div className="feedingGroupTitle">
                  <span className="feedingTimelineDot" aria-hidden="true" />
                  <h2 id={`feeding-group-${group.label}`}>{group.label}</h2>
                </div>

                <div className="feedingList">
                  {group.items.map((feeding) => {
                    const animal = ANIMAL[feeding.point?.animalType] || ANIMAL.OTHER;
                    const image = assetUrl(feeding.point?.images?.[0]?.imageUrl);
                    const description = feeding.point?.description?.trim();
                    const note = feeding.note?.trim() || 'ให้อาหารแล้ว';

                    return (
                      <article className="feedingCard" key={feeding.id}>
                        <div className="feedingMedia">
                          {image ? (
                            <img src={image} alt={`รูปจุดที่พบ${animal.label}`} />
                          ) : (
                            <div className="feedingMediaFallback" aria-hidden="true">{animal.emoji}</div>
                          )}
                        </div>

                        <div className="feedingCardBody">
                          <div className="feedingCardTopline">
                            <div className="feedingAnimal">
                              <span aria-hidden="true">{animal.emoji}</span>
                              <strong>{animal.label}</strong>
                            </div>
                            <time dateTime={feeding.fedAt}>{relativeTime(feeding.fedAt)}</time>
                          </div>

                          <p className="feedingNote">{note}</p>
                          {description && <p className="feedingPointDescription">{description}</p>}

                          {feeding.point?.id && (
                            <Link className="feedingPointLink" href={`/points/${feeding.point.id}`}>
                              ดูรายละเอียดจุด <span aria-hidden="true">→</span>
                            </Link>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}

            {!loading && !error && items.length === 0 && (
              <div className="feedingEmpty">
                <div className="feedingEmptyIcon" aria-hidden="true">🐾</div>
                <h2>ยังไม่มีประวัติการให้อาหาร</h2>
                <p>เมื่อคุณช่วยให้อาหารสัตว์ ประวัติจะมาแสดงที่นี่</p>
                <Link className="button soft" href="/">กลับไปดูแผนที่</Link>
              </div>
            )}
          </section>
        </div>
      </main>
    </Protected>
  );
}
