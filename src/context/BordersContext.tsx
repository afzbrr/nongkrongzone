import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { BorderItem } from '../types';
import { api } from '../services/api';

interface BordersContextValue {
  allBorders: BorderItem[];
  collectionBorders: BorderItem[];
  bordersById: Map<string, BorderItem>;
  ownedIds: Set<string>;
  loading: boolean;
  error: string | null;
  rlsHint: string | null;
  refreshBorders: () => Promise<void>;
}

const BordersContext = createContext<BordersContextValue>({
  allBorders: [],
  collectionBorders: [],
  bordersById: new Map(),
  ownedIds: new Set(),
  loading: false,
  error: null,
  rlsHint: null,
  refreshBorders: async () => {},
});

export const BordersProvider: React.FC<{
  playerId?: string | null;
  children: React.ReactNode;
}> = ({ playerId, children }) => {
  const [allBorders, setAllBorders] = useState<BorderItem[]>([]);
  const [collectionBorders, setCollectionBorders] = useState<BorderItem[]>([]);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rlsHint, setRlsHint] = useState<string | null>(null);

  const refreshBorders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getBorders();
      setAllBorders(res.borders || []);
      setCollectionBorders(res.collectionBorders || []);
      setOwnedIds(new Set(res.ownedIds || []));
      setRlsHint(res.rlsHint || null);
    } catch (err: any) {
      console.error('[Borders] fetch error:', err);
      setError(err?.message || 'Gagal memuat data border');
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    refreshBorders();
  }, [refreshBorders]);

  const bordersById = useMemo(() => {
    const map = new Map<string, BorderItem>();
    for (const b of allBorders) {
      map.set(String(b.id), b);
    }
    return map;
  }, [allBorders]);

  return (
    <BordersContext.Provider
      value={{
        allBorders,
        collectionBorders,
        bordersById,
        ownedIds,
        loading,
        error,
        rlsHint,
        refreshBorders,
      }}
    >
      {children}
    </BordersContext.Provider>
  );
};

export function useBorders() {
  return useContext(BordersContext);
}
