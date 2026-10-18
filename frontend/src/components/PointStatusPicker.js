'use client';

import { CheckOutlined } from '@ant-design/icons';

const STATUS_OPTIONS = [
  {
    value: 'ACTIVE',
    title: 'ยังพบอยู่ (ACTIVE)',
    desc: 'แสดงบนแผนที่ เพื่อให้คนอื่นค้นหา นำทาง และเข้าช่วยเหลือได้',
    theme: 'active',
  },
  {
    value: 'INACTIVE',
    title: 'ไม่ใช้งานแล้ว (INACTIVE)',
    desc: 'สัตว์ได้รับการช่วยเหลือ ย้ายที่ หรือมีคนรับเลี้ยงแล้ว (ซ่อนจากแผนที่หลัก)',
    theme: 'inactive',
  },
];

export default function PointStatusPicker({
  value = 'ACTIVE',
  onChange,
}) {
  return (
    <div className="pointStatusPickerContainer">
      <div className="pointStatusGrid" role="radiogroup" aria-label="สถานะจุดสัตว์จรจัด">
        {STATUS_OPTIONS.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`pointStatusCard ${opt.theme} ${isSelected ? 'selected' : ''}`}
              onClick={() => onChange?.(opt.value)}
            >
              <div className="pointStatusCardHeader">
                <div className="pointStatusIndicator">
                  <span className={`statusDot ${opt.theme}`} />
                  <span className="statusTitleText">{opt.title}</span>
                </div>
                {isSelected && (
                  <span className="statusCheckIcon" aria-hidden="true">
                    <CheckOutlined />
                  </span>
                )}
              </div>
              <p className="pointStatusDesc">{opt.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
