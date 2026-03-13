import { useMemo } from 'react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import {
  type SavedPatternRef,
  generateGuillocheBackgroundHTML,
  GUILLOCHE_COLOR_PALETTES,
} from '@/lib/guillochePatternUtils';

const PREF_KEY = 'guilloche_document_background';

/**
 * Hook to access the user's saved guilloche document background.
 * Returns the saved pattern refs and helper functions for print integration.
 */
export function useGuillocheBackground() {
  const { getPref, setPref } = useUserPreferences();

  const savedPatterns: SavedPatternRef[] = getPref(PREF_KEY, []);

  const backgroundHTML = useMemo(
    () => generateGuillocheBackgroundHTML(savedPatterns),
    [savedPatterns]
  );

  const bgColor = useMemo(() => {
    if (!savedPatterns.length) return undefined;
    return GUILLOCHE_COLOR_PALETTES.find(c => c.id === savedPatterns[0].colorPaletteId)?.bg;
  }, [savedPatterns]);

  const setDocumentBackground = (patterns: SavedPatternRef[]) => {
    setPref(PREF_KEY, patterns);
  };

  const clearDocumentBackground = () => {
    setPref(PREF_KEY, []);
  };

  return {
    /** The saved pattern references */
    savedPatterns,
    /** Pre-generated HTML string for print contexts */
    backgroundHTML,
    /** Background color from the first pattern's palette */
    bgColor,
    /** Save patterns as document background */
    setDocumentBackground,
    /** Clear document background */
    clearDocumentBackground,
    /** Whether a background is set */
    hasBackground: savedPatterns.length > 0,
  };
}
