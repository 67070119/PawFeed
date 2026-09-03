'use client';

import { useState } from 'react';

const MIN_RADIUS = 0.5;
const MAX_RADIUS = 10;

function formatRadius(value) {
  return value < 1 ? `${Math.round(value * 1000)} ม.` : `${Number(value).toFixed(value % 1 ? 1 : 0)} กม.`;
}

export default function RadiusFilter({ value, onChange, disabled = false, locating = false }) {
  const [dragging, setDragging] = useState(false);
  const progress = ((value - MIN_RADIUS) / (MAX_RADIUS - MIN_RADIUS)) * 100;

  return (
    <section className={`radiusFilter${dragging ? ' isDragging' : ''}${disabled ? ' isDisabled' : ''}`} aria-label="ปรับรัศมีค้นหาจุดใกล้ฉัน">
      <div className="radiusFilterHeader">
        <div>
          <strong>จุดใกล้ฉัน</strong>
          <span>{disabled ? (locating ? 'กำลังหาตำแหน่ง...' : 'เปิดตำแหน่งเพื่อค้นหาใกล้คุณ') : 'ปรับระยะที่ต้องการดู'}</span>
        </div>
        <output className="radiusFilterValue" aria-live="polite">{formatRadius(value)}</output>
      </div>

      <div className="radiusSliderWrap" style={{ '--radius-progress': `${progress}%` }}>
        <input
          className="radiusSlider"
          type="range"
          min={MIN_RADIUS}
          max={MAX_RADIUS}
          step="0.5"
          value={value}
          disabled={disabled}
          aria-label="รัศมีค้นหา"
          aria-valuetext={formatRadius(value)}
          onChange={(event) => onChange(Number(event.target.value))}
          onPointerDown={() => setDragging(true)}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
          onBlur={() => setDragging(false)}
        />
        <div className="radiusSliderLabels" aria-hidden="true"><span>500 ม.</span><span>10 กม.</span></div>
      </div>
    </section>
  );
}
