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
  pickupAddress: string | null;
  deliveryAddress: string | null;
  wasteType: string | null;
  wasteDescription: string | null;
  lastUpdated: string;
}

const STORAGE_KEY = 'pinned_shipment_parties';

export const usePinnedParties = () => {
  const [pinnedParties, setPinnedParties] = useState<PinnedPartiesData>({
    generator: null,
    recycler: null,
    pickupAddress: null,
    deliveryAddress: null,
    wasteType: null,
    wasteDescription: null,
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
      ...pinnedParties,
      generator: generator ? { ...generator, type: 'generator' } : pinnedParties.generator,
      recycler: recycler ? { ...recycler, type: 'recycler' } : pinnedParties.recycler,
      lastUpdated: new Date().toISOString(),
    };
    setPinnedParties(newData);
    saveToStorage(newData);
  }, [pinnedParties, saveToStorage]);

  // Pin addresses
  const pinAddresses = useCallback((pickupAddress: string | null, deliveryAddress: string | null) => {
    const newData: PinnedPartiesData = {
      ...pinnedParties,
      pickupAddress: pickupAddress || pinnedParties.pickupAddress,
      deliveryAddress: deliveryAddress || pinnedParties.deliveryAddress,
      lastUpdated: new Date().toISOString(),
    };
    setPinnedParties(newData);
    saveToStorage(newData);
  }, [pinnedParties, saveToStorage]);

  // Pin waste type
  const pinWasteType = useCallback((wasteType: string | null, wasteDescription?: string | null) => {
    const newData: PinnedPartiesData = {
      ...pinnedParties,
      wasteType: wasteType || pinnedParties.wasteType,
      wasteDescription: wasteDescription !== undefined ? wasteDescription : pinnedParties.wasteDescription,
      lastUpdated: new Date().toISOString(),
    };
    setPinnedParties(newData);
    saveToStorage(newData);
  }, [pinnedParties, saveToStorage]);

  // Pin all data at once
  const pinAll = useCallback((data: {
    generator?: Omit<PinnedParty, 'type'> | null;
    recycler?: Omit<PinnedParty, 'type'> | null;
    pickupAddress?: string | null;
    deliveryAddress?: string | null;
    wasteType?: string | null;
    wasteDescription?: string | null;
  }) => {
    const newData: PinnedPartiesData = {
      generator: data.generator !== undefined 
        ? (data.generator ? { ...data.generator, type: 'generator' } : null)
        : pinnedParties.generator,
      recycler: data.recycler !== undefined 
        ? (data.recycler ? { ...data.recycler, type: 'recycler' } : null)
        : pinnedParties.recycler,
      pickupAddress: data.pickupAddress !== undefined ? data.pickupAddress : pinnedParties.pickupAddress,
      deliveryAddress: data.deliveryAddress !== undefined ? data.deliveryAddress : pinnedParties.deliveryAddress,
      wasteType: data.wasteType !== undefined ? data.wasteType : pinnedParties.wasteType,
      wasteDescription: data.wasteDescription !== undefined ? data.wasteDescription : pinnedParties.wasteDescription,
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

  // Clear all pinned data
  const clearAll = useCallback(() => {
    const newData: PinnedPartiesData = {
      generator: null,
      recycler: null,
      pickupAddress: null,
      deliveryAddress: null,
      wasteType: null,
      wasteDescription: null,
      lastUpdated: new Date().toISOString(),
    };
    setPinnedParties(newData);
    saveToStorage(newData);
  }, [saveToStorage]);

  // Check if has any pinned data
  const hasPinnedParties = Boolean(pinnedParties.generator || pinnedParties.recycler);
  const hasPinnedAddresses = Boolean(pinnedParties.pickupAddress || pinnedParties.deliveryAddress);
  const hasPinnedWasteType = Boolean(pinnedParties.wasteType);
  const hasAnyPinned = hasPinnedParties || hasPinnedAddresses || hasPinnedWasteType;

  return {
    pinnedParties,
    isLoaded,
    hasPinnedParties,
    hasPinnedAddresses,
    hasPinnedWasteType,
    hasAnyPinned,
    pinGenerator,
    pinRecycler,
    pinBothParties,
    pinAddresses,
    pinWasteType,
    pinAll,
    unpinGenerator,
    unpinRecycler,
    clearAll,
  };
};
