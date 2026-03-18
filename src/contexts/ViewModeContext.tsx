import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

export type ContentDensity = 'compact' | 'comfortable' | 'spacious';
export type ListStyle = 'grid' | 'list';

interface ViewModeState {
  density: ContentDensity;
  listStyle: ListStyle;
  fullWidth: boolean;
}

interface ViewModeContextType extends ViewModeState {
  setDensity: (d: ContentDensity) => void;
  setListStyle: (s: ListStyle) => void;
  toggleFullWidth: () => void;
  // Utility getters
  spacing: { card: string; gap: string; padding: string; text: string };
  gridCols: string;
}

const STORAGE_KEY = 'irecycle-view-mode';

const defaults: ViewModeState = {
  density: 'comfortable',
  listStyle: 'grid',
  fullWidth: false,
};

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export const useViewMode = () => {
  const ctx = useContext(ViewModeContext);
  if (!ctx) throw new Error('useViewMode must be used within ViewModeProvider');
  return ctx;
};

const loadState = (): ViewModeState => {
  if (typeof window === 'undefined') return defaults;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  } catch {
    return defaults;
  }
};

export const ViewModeProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<ViewModeState>(loadState);

  const persist = useCallback((newState: ViewModeState) => {
    setState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  }, []);

  const setDensity = useCallback((density: ContentDensity) => {
    persist({ ...state, density });
  }, [state, persist]);

  const setListStyle = useCallback((listStyle: ListStyle) => {
    persist({ ...state, listStyle });
  }, [state, persist]);

  const toggleFullWidth = useCallback(() => {
    persist({ ...state, fullWidth: !state.fullWidth });
  }, [state, persist]);

  const spacing = useMemo(() => {
    switch (state.density) {
      case 'compact':
        return { card: 'p-3', gap: 'gap-2', padding: 'p-2', text: 'text-xs' };
      case 'spacious':
        return { card: 'p-6', gap: 'gap-6', padding: 'p-6', text: 'text-base' };
      default:
        return { card: 'p-4', gap: 'gap-4', padding: 'p-4', text: 'text-sm' };
    }
  }, [state.density]);

  const gridCols = useMemo(() => {
    if (state.listStyle === 'list') return 'grid-cols-1';
    switch (state.density) {
      case 'compact': return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
      case 'spacious': return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      default: return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    }
  }, [state.listStyle, state.density]);

  const value = useMemo<ViewModeContextType>(() => ({
    ...state,
    setDensity,
    setListStyle,
    toggleFullWidth,
    setSidebarMode,
    cycleSidebarMode,
    spacing,
    gridCols,
  }), [state, setDensity, setListStyle, toggleFullWidth, setSidebarMode, cycleSidebarMode, spacing, gridCols]);

  return (
    <ViewModeContext.Provider value={value}>
      {children}
    </ViewModeContext.Provider>
  );
};
