import { useMemo } from 'react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import {
  type SavedPatternRef,
  generateGuillocheBackgroundHTML,
  GUILLOCHE_COLOR_PALETTES,
} from '@/lib/guillochePatternUtils';
import { generateTemplateHTML, type GuillocheTemplate } from '@/components/guilloche/GuillocheTemplateDesigns';

const PREF_KEY = 'guilloche_document_background';
const TEMPLATE_KEY = 'guilloche_active_template';
const TEMPLATE_DATA_KEY = 'guilloche_active_template_data';

/**
 * Hook to access the user's saved guilloche document background.
 * Supports both: legacy pattern refs AND template-based backgrounds.
 * Template takes priority when set.
 */
export function useGuillocheBackground() {
  const { getPref, setPref } = useUserPreferences();

  const savedPatterns: SavedPatternRef[] = getPref(PREF_KEY, []);
  const activeTemplateId: string | null = getPref(TEMPLATE_KEY, null);
  const activeTemplateData: GuillocheTemplate | null = getPref(TEMPLATE_DATA_KEY, null);

  const hasTemplate = !!activeTemplateId && !!activeTemplateData;

  const backgroundHTML = useMemo(() => {
    if (hasTemplate && activeTemplateData) {
      return generateTemplateHTML(activeTemplateData, 595, 842);
    }
    return generateGuillocheBackgroundHTML(savedPatterns);
  }, [hasTemplate, activeTemplateData, savedPatterns]);

  const bgColor = useMemo(() => {
    if (hasTemplate && activeTemplateData) {
      return activeTemplateData.colorScheme?.bg;
    }
    if (!savedPatterns.length) return undefined;
    return GUILLOCHE_COLOR_PALETTES.find(c => c.id === savedPatterns[0].colorPaletteId)?.bg;
  }, [hasTemplate, activeTemplateData, savedPatterns]);

  const setDocumentBackground = (patterns: SavedPatternRef[]) => {
    // Clear template when setting pattern-based background
    setPref(TEMPLATE_KEY, null);
    setPref(TEMPLATE_DATA_KEY, null);
    setPref(PREF_KEY, patterns);
  };

  const clearDocumentBackground = () => {
    setPref(PREF_KEY, []);
    setPref(TEMPLATE_KEY, null);
    setPref(TEMPLATE_DATA_KEY, null);
  };

  return {
    /** The saved pattern references (legacy) */
    savedPatterns,
    /** Active template data (if template-based) */
    activeTemplateData,
    /** Pre-generated HTML string for print contexts */
    backgroundHTML,
    /** Background color from the active source */
    bgColor,
    /** Save patterns as document background */
    setDocumentBackground,
    /** Clear document background */
    clearDocumentBackground,
    /** Whether any background is set (template or patterns) */
    hasBackground: hasTemplate || savedPatterns.length > 0,
    /** Whether using a template vs patterns */
    isTemplateBased: hasTemplate,
  };
}
