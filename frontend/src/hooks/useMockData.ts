import { useState, useEffect } from 'react';

/**
 * Simulates async data loading with a delay.
 * Displays loading placeholder, then returns data.
 * Ready to swap with real fetch when backend is added.
 */
export function useMockData<T>(fetcher: () => T, delay = 400) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(() => {
      if (!cancelled) {
        setData(fetcher());
        setLoading(false);
      }
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [fetcher, delay]);

  return { data, loading };
}