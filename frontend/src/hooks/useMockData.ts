import { useState, useEffect, useRef } from 'react';

/**
 * Simulates async data loading with a delay.
 * Displays loading placeholder, then returns data.
 * Ready to swap with real fetch when backend is added.
 */
export function useMockData<T>(fetcher: () => T, delay = 400) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(() => {
      if (!cancelled) {
        setData(fetcherRef.current());
        setLoading(false);
      }
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [delay]);

  return { data, loading };
}