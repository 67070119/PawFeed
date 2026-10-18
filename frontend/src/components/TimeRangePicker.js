'use client';

import { useState, useRef, useEffect } from 'react';
import { ClockCircleOutlined, CloseOutlined, CheckOutlined } from '@ant-design/icons';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

const PRESETS = [
  { id: 'morning', label: 'ช่วงเช้า', range: ['06:00', '09:00'], desc: '06:00 - 09:00' },
  { id: 'noon', label: 'กลางวัน', range: ['11:00', '14:00'], desc: '11:00 - 14:00' },
  { id: 'evening', label: 'ช่วงเย็น', range: ['16:00', '19:00'], desc: '16:00 - 19:00' },
  { id: 'night', label: 'ช่วงค่ำ', range: ['19:00', '22:00'], desc: '19:00 - 22:00' },
  { id: 'allDay', label: 'ตลอดวัน', range: ['06:00', '18:00'], desc: '06:00 - 18:00' },
];

function parseTime(val) {
  if (!val || typeof val !== 'string' || !val.includes(':')) {
    return { hour: '08', minute: '00' };
  }
  const [h, m] = val.split(':');
  return {
    hour: String(h || '08').padStart(2, '0').slice(-2),
    minute: String(m || '00').padStart(2, '0').slice(-2),
  };
}

export default function TimeRangePicker({
  startTime = '',
  endTime = '',
  onChange,
  error = '',
  startLabel = 'เวลาเริ่ม',
  endLabel = 'เวลาสิ้นสุด',
}) {
  const [activePicker, setActivePicker] = useState(null); // 'start' | 'end' | null
  const containerRef = useRef(null);
  const hourListRef = useRef(null);
  const minuteListRef = useRef(null);

  // Close on outside click or Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setActivePicker(null);
      }
    }

    function handleMouseDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setActivePicker(null);
      }
    }

    if (activePicker) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleMouseDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [activePicker]);

  // Scroll active hour and minute into view when popover opens
  useEffect(() => {
    if (!activePicker) return;

    const timer = setTimeout(() => {
      const activeHourEl = hourListRef.current?.querySelector('.timePickerItemSelected');
      if (activeHourEl && hourListRef.current) {
        hourListRef.current.scrollTop = activeHourEl.offsetTop - hourListRef.current.offsetTop - 50;
      }

      const activeMinuteEl = minuteListRef.current?.querySelector('.timePickerItemSelected');
      if (activeMinuteEl && minuteListRef.current) {
        minuteListRef.current.scrollTop = activeMinuteEl.offsetTop - minuteListRef.current.offsetTop - 50;
      }
    }, 40);

    return () => clearTimeout(timer);
  }, [activePicker]);

  const activePreset = PRESETS.find(
    (p) => p.range[0] === startTime && p.range[1] === endTime,
  );

  function handlePresetClick(preset) {
    if (activePreset?.id === preset.id) {
      // Toggle off if clicked again
      onChange?.({ startTime: '', endTime: '' });
    } else {
      onChange?.({ startTime: preset.range[0], endTime: preset.range[1] });
    }
    setActivePicker(null);
  }

  function handleClear() {
    onChange?.({ startTime: '', endTime: '' });
    setActivePicker(null);
  }

  const currentTime = activePicker === 'start' ? startTime : endTime;
  const { hour: selectedHour, minute: selectedMinute } = parseTime(currentTime);

  function handleSelectHour(h) {
    const newTime = `${h}:${selectedMinute || '00'}`;
    if (activePicker === 'start') {
      onChange?.({ startTime: newTime, endTime });
    } else {
      onChange?.({ startTime, endTime: newTime });
    }
  }

  function handleSelectMinute(m) {
    const newTime = `${selectedHour || '08'}:${m}`;
    if (activePicker === 'start') {
      onChange?.({ startTime: newTime, endTime });
    } else {
      onChange?.({ startTime, endTime: newTime });
    }
  }

  function handleManualInput(e, type) {
    let val = e.target.value.replace(/[^0-9:]/g, '');
    if (val.length === 2 && !val.includes(':') && e.nativeEvent.inputType !== 'deleteContentBackward') {
      val += ':';
    }
    if (val.length > 5) {
      val = val.slice(0, 5);
    }

    if (type === 'start') {
      onChange?.({ startTime: val, endTime });
    } else {
      onChange?.({ startTime, endTime: val });
    }
  }

  function handleInputBlur(type) {
    const val = type === 'start' ? startTime : endTime;
    if (!val) return;

    // Validate format HH:mm
    const match = val.match(/^([01]?[0-9]|2[0-3]):([0-5]?[0-9])$/);
    if (match) {
      const formatted = `${String(match[1]).padStart(2, '0')}:${String(match[2]).padStart(2, '0')}`;
      if (type === 'start') {
        onChange?.({ startTime: formatted, endTime });
      } else {
        onChange?.({ startTime, endTime: formatted });
      }
    }
  }

  const hasAnyTime = Boolean(startTime || endTime);

  return (
    <div className="customTimeRangeContainer" ref={containerRef}>
      {/* Quick Preset Buttons */}
      <div className="timePresetsRow">
        <span className="timePresetsTitle">ช่วงเวลาแนะนำ:</span>
        <div className="timePresetsList" role="group" aria-label="ช่วงเวลาแนะนำ">
          {PRESETS.map((p) => {
            const isSelected = activePreset?.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className={`timePresetChip ${isSelected ? 'active' : ''}`}
                onClick={() => handlePresetClick(p)}
                aria-pressed={isSelected}
                title={p.desc}
              >
                {isSelected && <CheckOutlined className="presetCheckIcon" aria-hidden="true" />}
                <span>{p.label}</span>
                <span className="presetDesc">{p.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Time Range Inputs */}
      <div className="customTimeInputsRow">
        {/* Start Time Box */}
        <div className={`customTimeBox ${activePicker === 'start' ? 'isFocused' : ''}`}>
          <label className="customTimeLabel" htmlFor="custom-time-start">
            <span>{startLabel}</span>
            {startTime && <span className="customTimeActiveTag">24 ชม.</span>}
          </label>
          <div className="customTimeInputWrapper">
            <span className="customTimeClockIcon" aria-hidden="true">
              <ClockCircleOutlined />
            </span>
            <input
              id="custom-time-start"
              type="text"
              inputMode="numeric"
              placeholder="00:00"
              value={startTime}
              autoComplete="off"
              onChange={(e) => handleManualInput(e, 'start')}
              onBlur={() => handleInputBlur('start')}
              onFocus={() => setActivePicker('start')}
              aria-label={startLabel}
              className="customTimeTextInput"
            />
            <button
              type="button"
              className={`customTimeTriggerBtn ${activePicker === 'start' ? 'active' : ''}`}
              onClick={() => setActivePicker(activePicker === 'start' ? null : 'start')}
              aria-label="เปิดหน้าต่างเลือกเวลาเริ่ม"
              title="เปิดหน้าต่างเลือกเวลา"
            >
              <span className="triggerCaret" />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="customTimeDivider" aria-hidden="true">
          <span>ถึง</span>
          <span className="dividerLine" />
        </div>

        {/* End Time Box */}
        <div className={`customTimeBox ${activePicker === 'end' ? 'isFocused' : ''}`}>
          <label className="customTimeLabel" htmlFor="custom-time-end">
            <span>{endLabel}</span>
            {endTime && <span className="customTimeActiveTag">24 ชม.</span>}
          </label>
          <div className="customTimeInputWrapper">
            <span className="customTimeClockIcon" aria-hidden="true">
              <ClockCircleOutlined />
            </span>
            <input
              id="custom-time-end"
              type="text"
              inputMode="numeric"
              placeholder="00:00"
              value={endTime}
              autoComplete="off"
              onChange={(e) => handleManualInput(e, 'end')}
              onBlur={() => handleInputBlur('end')}
              onFocus={() => setActivePicker('end')}
              aria-label={endLabel}
              className="customTimeTextInput"
            />
            <button
              type="button"
              className={`customTimeTriggerBtn ${activePicker === 'end' ? 'active' : ''}`}
              onClick={() => setActivePicker(activePicker === 'end' ? null : 'end')}
              aria-label="เปิดหน้าต่างเลือกเวลาสิ้นสุด"
              title="เปิดหน้าต่างเลือกเวลา"
            >
              <span className="triggerCaret" />
            </button>
          </div>
        </div>

        {/* Clear Button if time exists */}
        {hasAnyTime && (
          <button
            type="button"
            className="customTimeClearBtn"
            onClick={handleClear}
            title="ล้างช่วงเวลาทั้งหมด"
            aria-label="ล้างช่วงเวลา"
          >
            <CloseOutlined aria-hidden="true" />
            <span>ล้างเวลา</span>
          </button>
        )}
      </div>

      {/* Popover Wheel / Dial (Dark Glassmorphism) */}
      {activePicker && (
        <div
          className={`timePickerPopover ${activePicker === 'end' ? 'alignRight' : 'alignLeft'}`}
          role="dialog"
          aria-label={`เลือก${activePicker === 'start' ? startLabel : endLabel}`}
        >
          <div className="timePickerPopoverHeader">
            <div className="timePickerHeaderInfo">
              <ClockCircleOutlined aria-hidden="true" />
              <span>เลือก{activePicker === 'start' ? startLabel : endLabel} (รูปแบบ 24 ชม.)</span>
            </div>
            <div className="timePickerHeaderDisplay">
              <span className="timeDisplayDigits">{currentTime || '--:--'}</span>
              <button
                type="button"
                className="timePickerCloseBtn"
                onClick={() => setActivePicker(null)}
                aria-label="ปิด"
              >
                <CloseOutlined />
              </button>
            </div>
          </div>

          <div className="timePickerColumnsContainer">
            {/* Hours Column */}
            <div className="timePickerColumn">
              <div className="timePickerColumnHeader">ชั่วโมง</div>
              <div className="timePickerList" ref={hourListRef}>
                {HOURS.map((h) => {
                  const isSelected = selectedHour === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      className={`timePickerItem ${isSelected ? 'timePickerItemSelected' : ''}`}
                      onClick={() => handleSelectHour(h)}
                      aria-pressed={isSelected}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minutes Column */}
            <div className="timePickerColumn">
              <div className="timePickerColumnHeader">นาที</div>
              <div className="timePickerList" ref={minuteListRef}>
                {MINUTES.map((m) => {
                  const isSelected = selectedMinute === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      className={`timePickerItem ${isSelected ? 'timePickerItemSelected' : ''}`}
                      onClick={() => handleSelectMinute(m)}
                      aria-pressed={isSelected}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="timePickerPopoverFooter">
            <button
              type="button"
              className="timePickerSecondaryBtn"
              onClick={() => {
                if (activePicker === 'start') {
                  onChange?.({ startTime: '', endTime });
                } else {
                  onChange?.({ startTime, endTime: '' });
                }
              }}
            >
              ล้างค่านี้
            </button>
            <button
              type="button"
              className="timePickerPrimaryBtn"
              onClick={() => setActivePicker(null)}
            >
              เสร็จสิ้น
            </button>
          </div>
        </div>
      )}

      {error && (
        <small className="fieldError timeRangeError" role="alert">
          {error}
        </small>
      )}
    </div>
  );
}
