import { useState, useEffect } from 'react';

export interface CustomWasteType {
  id: string;
  name: string;
  code: string;
  category: 'hazardous' | 'non-hazardous';
  parentCategory: string;
  hazardLevel?: 'low' | 'medium' | 'high' | 'critical';
  recyclable?: boolean;
  createdAt: string;
}

const STORAGE_KEY = 'custom_waste_types';

export const useCustomWasteTypes = () => {
  const [customWasteTypes, setCustomWasteTypes] = useState<CustomWasteType[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setCustomWasteTypes(JSON.parse(stored));
      } catch {
        console.error('Error parsing custom waste types');
      }
    }
  }, []);

  // Save to localStorage whenever customWasteTypes changes
  const saveToStorage = (types: CustomWasteType[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(types));
    setCustomWasteTypes(types);
  };

  const addCustomWasteType = (wasteType: Omit<CustomWasteType, 'id' | 'createdAt'>) => {
    const newType: CustomWasteType = {
      ...wasteType,
      id: `custom-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [...customWasteTypes, newType];
    saveToStorage(updated);
    return newType;
  };

  const removeCustomWasteType = (id: string) => {
    const updated = customWasteTypes.filter(type => type.id !== id);
    saveToStorage(updated);
  };

  const getCustomHazardousTypes = () => 
    customWasteTypes.filter(type => type.category === 'hazardous');

  const getCustomNonHazardousTypes = () => 
    customWasteTypes.filter(type => type.category === 'non-hazardous');

  return {
    customWasteTypes,
    addCustomWasteType,
    removeCustomWasteType,
    getCustomHazardousTypes,
    getCustomNonHazardousTypes,
  };
};

// Static function to get custom waste types (for components that don't use the hook)
export const getStoredCustomWasteTypes = (): CustomWasteType[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
};
