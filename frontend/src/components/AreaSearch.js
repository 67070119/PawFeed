'use client';

import { useEffect, useRef, useState } from 'react';
import { searchAreas } from '../lib/geocoding';

const SEARCH_DEBOUNCE_MS = 450;

export default function AreaSearch({ onSelect, resetToken = 0 }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const controllerRef = useRef(null);
  const skipAutoSearchRef = useRef(false);

  useEffect(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    skipAutoSearchRef.current = true;
    setQuery('');
    setResults([]);
    setError('');
    setLoading(false);
  }, [resetToken]);

  useEffect(() => {
    if (skipAutoSearchRef.current) {
      skipAutoSearchRef.current = false;
      return undefined;
    }

    const value = query.trim();
    controllerRef.current?.abort();
    controllerRef.current = null;

    if (value.length < 2) {
      setResults([]);
      setError('');
      setLoading(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      runSearch(value);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  async function runSearch(value) {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError('');

    try {
      const nextResults = await searchAreas(value, { signal: controller.signal });
      setResults(nextResults);
      if (!nextResults.length) setError('ไม่พบพื้นที่ที่ค้นหา ลองระบุเขต จังหวัด หรือชื่อสถานที่เพิ่ม');
    } catch (nextError) {
      if (nextError?.name !== 'AbortError') {
        setResults([]);
        setError(nextError.message);
      }
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setLoading(false);
      }
    }
  }

  function submit(event) {
    event.preventDefault();
    const value = query.trim();
    if (value.length < 2) {
      setResults([]);
      setError('พิมพ์ชื่อพื้นที่อย่างน้อย 2 ตัวอักษร');
      return;
    }
    runSearch(value);
  }

  function selectArea(area) {
    controllerRef.current?.abort();
    controllerRef.current = null;
    skipAutoSearchRef.current = true;
    setQuery(area.label);
    setResults([]);
    setError('');
    setLoading(false);
    onSelect(area);
  }

  function clear() {
    controllerRef.current?.abort();
    controllerRef.current = null;
    skipAutoSearchRef.current = true;
    setQuery('');
    setResults([]);
    setError('');
    setLoading(false);
  }

  const panelVisible = loading || results.length > 0 || Boolean(error);

  return (
    <div className="mapAreaSearch">
      <form className="mapAreaSearchForm" onSubmit={submit} role="search">
        <span className="mapAreaSearchIcon" aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ค้นหาพื้นที่ เช่น บางมด, ลาดกระบัง"
          aria-label="ค้นหาพื้นที่บนแผนที่"
          autoComplete="off"
        />
        {query && (
          <button className="mapAreaSearchClear" type="button" onClick={clear} aria-label="ล้างคำค้นหา">×</button>
        )}
        <button className="mapAreaSearchSubmit" type="submit" disabled={loading}>
          {loading ? '...' : 'ค้นหา'}
        </button>
      </form>

      {panelVisible && (
        <div className="mapAreaSearchPanel" role="status">
          {loading && !results.length && <div className="mapAreaSearchMessage">กำลังค้นหาพื้นที่...</div>}
          {!loading && error && <div className="mapAreaSearchMessage">{error}</div>}
          {results.map((area) => (
            <button key={area.id} className="mapAreaSearchResult" type="button" onClick={() => selectArea(area)}>
              <span className="mapAreaSearchPin" aria-hidden="true" />
              <span>{area.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
