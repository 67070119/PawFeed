'use client';

import { useState } from 'react';

const MIN_RADIUS = 0.5;
const MAX_RADIUS = 500;
const SLIDER_MAX = 100;

function formatRadius(value) {
  return value < 1 ? `${Math.round(value * 1000)} ม.` : `${Number(value).toFixed(value % 1 ? 1 : 0)} กม.`;
}

function sliderPosition(radius) {
  const clamped = Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, radius));
  return (Math.log(clamped / MIN_RADIUS) / Math.log(MAX_RADIUS / MIN_RADIUS)) * SLIDER_MAX;
}

function snapRadius(radius) {
  if (radius < 10) return Math.round(radius * 2) / 2;
  if (radius < 50) return Math.round(radius);
  if (radius < 100) return Math.round(radius / 5) * 5;
  return Math.round(radius / 10) * 10;
}

function radiusFromPosition(position) {
  const raw = MIN_RADIUS * ((MAX_RADIUS / MIN_RADIUS) ** (position / SLIDER_MAX));
  return Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, snapRadius(raw)));
}

export default function RadiusFilter({ value, onChange, disabled = false, locating = false }) {
  const [dragging, setDragging] = useState(false);
  const progress = sliderPosition(value);

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
          min="0"
          max={SLIDER_MAX}
          step="0.25"
          value={progress}
          disabled={disabled}
          aria-label="รัศมีค้นหา"
          aria-valuemin={MIN_RADIUS}
          aria-valuemax={MAX_RADIUS}
          aria-valuenow={value}
          aria-valuetext={formatRadius(value)}
          onChange={(event) => onChange(radiusFromPosition(Number(event.target.value)))}
          onPointerDown={() => setDragging(true)}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
          onBlur={() => setDragging(false)}
        />
        <div className="radiusSliderLabels" aria-hidden="true"><span>500 ม.</span><span>500 กม.</span></div>
      </div>
    </section>
  );
}
