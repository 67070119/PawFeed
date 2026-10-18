'use client';

/**
 * Clean, minimalist SVG animal line icons matching Ant Design icon stroke and aesthetic.
 * Replaces all emoji icons with crisp vector graphics.
 */

export function DogIcon({ size = 16, className = '', style = {}, ariaHidden = true }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
      aria-hidden={ariaHidden}
    >
      {/* Friendly dog outline with floppy ear */}
      <path d="M10 5.5C8 5.5 5 7 4.5 10c-.5 3 .5 6 2 7.5l1.5 1h8l1.5-1c1.5-1.5 2.5-4.5 2-7.5-.5-3-3.5-4.5-5.5-4.5z" />
      <path d="M4.5 10c-.8-1.5-1.2-3.8.5-5.5 1.5-1.5 3.5-.5 4.5.5" />
      <path d="M19.5 10c.8-1.5 1.2-3.8-.5-5.5-1.5-1.5-3.5-.5-4.5.5" />
      <circle cx="9" cy="11.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="11.5" r="1.2" fill="currentColor" stroke="none" />
      <path d="M10.8 14.5c.7.4 1.7.4 2.4 0" />
      <path d="M12 13.2v1.3" />
    </svg>
  );
}

export function CatIcon({ size = 16, className = '', style = {}, ariaHidden = true }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
      aria-hidden={ariaHidden}
    >
      {/* Sleek cat head with pointed ears and whiskers */}
      <path d="M5 9.5 3.5 4l5.5 2.5a11 11 0 0 1 6 0L20.5 4 19 9.5c.8 1.8 1 3.5.5 5.5-1 4-4.5 6-7.5 6s-6.5-2-7.5-6c-.5-2-.3-3.7.5-5.5z" />
      <circle cx="9" cy="13" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="13" r="1.2" fill="currentColor" stroke="none" />
      <path d="M12 15l-1 1h2l-1-1z" fill="currentColor" />
      <path d="M5 14.5H2M5 16H2.5M19 14.5h3M19 16h2.5" />
    </svg>
  );
}

export function PawIcon({ size = 16, className = '', style = {}, ariaHidden = true }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
      aria-hidden={ariaHidden}
    >
      {/* Clean paw print pads */}
      <circle cx="5" cy="10" r="2" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="6.5" r="2.2" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="6.5" r="2.2" fill="currentColor" stroke="none" />
      <circle cx="19" cy="10" r="2" fill="currentColor" stroke="none" />
      <path
        d="M12 12c-3.2 0-5.5 2.2-5.5 4.8 0 2 1.6 3.7 3.5 3.7 1.2 0 1.6-.5 2-.5s.8.5 2 .5c1.9 0 3.5-1.7 3.5-3.7 0-2.6-2.3-4.8-5.5-4.8z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

/**
 * Universal AnimalIcon component
 */
export default function AnimalIcon({ type = 'OTHER', size = 16, className = '', style = {}, ariaHidden = true }) {
  const normType = String(type || '').toUpperCase();
  if (normType === 'DOG') {
    return <DogIcon size={size} className={className} style={style} ariaHidden={ariaHidden} />;
  }
  if (normType === 'CAT') {
    return <CatIcon size={size} className={className} style={style} ariaHidden={ariaHidden} />;
  }
  return <PawIcon size={size} className={className} style={style} ariaHidden={ariaHidden} />;
}

/**
 * Helper to get raw SVG markup string for Leaflet DivIcon HTML
 */
export function getAnimalSvgString(type) {
  const normType = String(type || '').toUpperCase();
  if (normType === 'DOG') {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="mapPinSvg"><path d="M10 5.5C8 5.5 5 7 4.5 10c-.5 3 .5 6 2 7.5l1.5 1h8l1.5-1c1.5-1.5 2.5-4.5 2-7.5-.5-3-3.5-4.5-5.5-4.5z"/><path d="M4.5 10c-.8-1.5-1.2-3.8.5-5.5 1.5-1.5 3.5-.5 4.5.5"/><path d="M19.5 10c.8-1.5 1.2-3.8-.5-5.5-1.5-1.5-3.5-.5-4.5.5"/><circle cx="9" cy="11.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="11.5" r="1.3" fill="currentColor" stroke="none"/><path d="M10.8 14.5c.7.4 1.7.4 2.4 0"/><path d="M12 13.2v1.3"/></svg>`;
  }
  if (normType === 'CAT') {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="mapPinSvg"><path d="M5 9.5 3.5 4l5.5 2.5a11 11 0 0 1 6 0L20.5 4 19 9.5c.8 1.8 1 3.5.5 5.5-1 4-4.5 6-7.5 6s-6.5-2-7.5-6c-.5-2-.3-3.7.5-5.5z"/><circle cx="9" cy="13" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="13" r="1.3" fill="currentColor" stroke="none"/><path d="M12 15l-1 1h2l-1-1z" fill="currentColor"/><path d="M5 14.5H2M5 16H2.5M19 14.5h3M19 16h2.5"/></svg>`;
  }
  return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="mapPinSvg"><circle cx="5" cy="10" r="1.9" fill="currentColor" stroke="none"/><circle cx="9.5" cy="6.5" r="2.1" fill="currentColor" stroke="none"/><circle cx="14.5" cy="6.5" r="2.1" fill="currentColor" stroke="none"/><circle cx="19" cy="10" r="1.9" fill="currentColor" stroke="none"/><path d="M12 12c-3.2 0-5.5 2.2-5.5 4.8 0 2 1.6 3.7 3.5 3.7 1.2 0 1.6-.5 2-.5s.8.5 2 .5c1.9 0 3.5-1.7 3.5-3.7 0-2.6-2.3-4.8-5.5-4.8z" fill="currentColor" stroke="none"/></svg>`;
}
