'use client';

import { CheckOutlined } from '@ant-design/icons';
import AnimalIcon from './AnimalIcon';

const ANIMAL_OPTIONS = [
  { type: 'DOG', label: 'สุนัข', desc: 'หมาจรจัด' },
  { type: 'CAT', label: 'แมว', desc: 'แมวจรจัด' },
  { type: 'OTHER', label: 'สัตว์อื่น ๆ', desc: 'กระต่าย, นก, ลิง ฯลฯ' },
];

export default function AnimalTypePicker({
  value = 'DOG',
  customValue = '',
  onChange,
  onCustomChange,
  error = '',
  customError = '',
}) {
  return (
    <div className="animalTypePickerContainer">
      <div className="animalTypeGrid" role="radiogroup" aria-label="เลือกประเภทสัตว์">
        {ANIMAL_OPTIONS.map((opt) => {
          const isSelected = value === opt.type;
          return (
            <button
              key={opt.type}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`animalTypeCard ${isSelected ? 'selected' : ''}`}
              onClick={() => onChange?.(opt.type)}
            >
              <div className="animalTypeIconWrapper">
                <AnimalIcon type={opt.type} size={28} />
              </div>
              <div className="animalTypeMeta">
                <span className="animalTypeLabel">{opt.label}</span>
                <span className="animalTypeDesc">{opt.desc}</span>
              </div>
              {isSelected && (
                <span className="animalTypeCheckmark" aria-hidden="true">
                  <CheckOutlined />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && <small className="fieldError" role="alert">{error}</small>}

      {/* Expandable text field for OTHER animals */}
      {value === 'OTHER' && (
        <div className="customAnimalInputRow">
          <label htmlFor="custom-animal-name" className="customAnimalLabel">
            <span>ระบุชนิดสัตว์ที่พบ</span>
            <span className="requiredStar">*</span>
          </label>
          <div className="customAnimalInputWrap">
            <input
              id="custom-animal-name"
              type="text"
              className="customAnimalInput"
              placeholder="เช่น กระต่ายขาว, นกพิราบ, ลิงแสม, กระรอก"
              value={customValue}
              maxLength={50}
              autoFocus
              aria-invalid={customError ? 'true' : undefined}
              aria-describedby={customError ? 'custom-animal-error' : 'custom-animal-hint'}
              onChange={(e) => onCustomChange?.(e.target.value)}
            />
          </div>
          {customError ? (
            <small id="custom-animal-error" className="fieldError" role="alert">
              {customError}
            </small>
          ) : (
            <small id="custom-animal-hint" className="fieldHint">
              ระบุชนิดสัตว์เพื่อช่วยให้อาสาสมัครเตรียมอาหารและยาได้ถูกต้อง
            </small>
          )}
        </div>
      )}
    </div>
  );
}
