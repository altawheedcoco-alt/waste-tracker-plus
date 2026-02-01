import { useState, useEffect, useCallback } from 'react';

interface PinnedParty {
  id: string;
  name: string;
  type: 'generator' | 'recycler';
  address?: string;
  city?: string;
  isManual?: boolean;
}

interface PinnedPartiesData {
  generator: PinnedParty | null;
  recycler: PinnedParty | null;
  lastUpdated: string;
}

const STORAGE_KEY = 'pinned_shipment_parties';

export const usePinnedParties = () => {
  const [pinnedParties, setPinnedParties] = useState<PinnedPartiesData>({
    generator: null,
    recycler: null,
    lastUpdated: '',
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPinnedParties(parsed);
      }
    } catch (error) {
      console.error('Error loading pinned parties:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever pinnedParties changes
  const saveToStorage = useCallback((data: PinnedPartiesData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving pinned parties:', error);
    }
  }, []);

  // Pin a generator
  const pinGenerator = useCallback((party: Omit<PinnedParty, 'type'>) => {
    const newData: PinnedPartiesData = {
      ...pinnedParties,
      generator: { ...party, type: 'generator' },
      lastUpdated: new Date().toISOString(),
    };
    setPinnedParties(newData);
    saveToStorage(newData);
  }, [pinnedParties, saveToStorage]);

  // Pin a recycler
  const pinRecycler = useCallback((party: Omit<PinnedParty, 'type'>) => {
    const newData: PinnedPartiesData = {
      ...pinnedParties,
      recycler: { ...party, type: 'recycler' },
      lastUpdated: new Date().toISOString(),
    };
    setPinnedParties(newData);
    saveToStorage(newData);
  }, [pinnedParties, saveToStorage]);

  // Pin both parties at once
  const pinBothParties = useCallback((
    generator: Omit<PinnedParty, 'type'> | null,
    recycler: Omit<PinnedParty, 'type'> | null
  ) => {
    const newData: PinnedPartiesData = {
      generator: generator ? { ...generator, type: 'generator' } : pinnedParties.generator,
      recycler: recycler ? { ...recycler, type: 'recycler' } : pinnedParties.recycler,
      lastUpdated: new Date().toISOString(),
    };
    setPinnedParties(newData);
    saveToStorage(newData);
  }, [pinnedParties, saveToStorage]);

  // Unpin generator
  const unpinGenerator = useCallback(() => {
    const newData: PinnedPartiesData = {
      ...pinnedParties,
      generator: null,
      lastUpdated: new Date().toISOString(),
    };
    setPinnedParties(newData);
    saveToStorage(newData);
  }, [pinnedParties, saveToStorage]);

  // Unpin recycler
  const unpinRecycler = useCallback(() => {
    const newData: PinnedPartiesData = {
      ...pinnedParties,
      recycler: null,
      lastUpdated: new Date().toISOString(),
    };
    setPinnedParties(newData);
    saveToStorage(newData);
  }, [pinnedParties, saveToStorage]);

  // Clear all pinned parties
  const clearAll = useCallback(() => {
    const newData: PinnedPartiesData = {
      generator: null,
      recycler: null,
      lastUpdated: new Date().toISOString(),
    };
    setPinnedParties(newData);
    saveToStorage(newData);
  }, [saveToStorage]);

  // Check if has any pinned parties
  const hasPinnedParties = Boolean(pinnedParties.generator || pinnedParties.recycler);

  return {
    pinnedParties,
    isLoaded,
    hasPinnedParties,
    pinGenerator,
    pinRecycler,
    pinBothParties,
    unpinGenerator,
    unpinRecycler,
    clearAll,
  };
};
