import { useMemo } from 'react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import {
  type SavedPatternRef,
  generateGuillocheBackgroundHTML,
  GUILLOCHE_COLOR_PALETTES,
} from '@/lib/guillochePatternUtils';

const PREF_KEY = 'guilloche_document_background';
const TEMPLATE_KEY = 'guilloche_active_template';
const TEMPLATE_HTML_KEY = 'guilloche_active_template_html';
const TEMPLATE_BG_KEY = 'guilloche_active_template_bg';

/**
 * Hook to access the user's saved guilloche document background.
 * Supports both: legacy pattern refs AND template-based backgrounds.
 * Template takes priority when set.
 */
export function useGuillocheBackground() {
  const { getPref, setPref } = useUserPreferences();

  const savedPatterns: SavedPatternRef[] = getPref(PREF_KEY, []);
  const activeTemplateId: string | null = getPref(TEMPLATE_KEY, null);
  const activeTemplateHTML: string | null = getPref(TEMPLATE_HTML_KEY, null);
  const activeTemplateBg: string | null = getPref(TEMPLATE_BG_KEY, null);

  const hasTemplate = !!activeTemplateId && !!activeTemplateHTML;

  const backgroundHTML = useMemo(() => {
    if (hasTemplate && activeTemplateHTML) {
      return activeTemplateHTML;
    }
    return generateGuillocheBackgroundHTML(savedPatterns);
  }, [hasTemplate, activeTemplateHTML, savedPatterns]);

  const bgColor = useMemo(() => {
    if (hasTemplate && activeTemplateBg) {
      return activeTemplateBg;
    }
    if (!savedPatterns.length) return undefined;
    return GUILLOCHE_COLOR_PALETTES.find(c => c.id === savedPatterns[0].colorPaletteId)?.bg;
  }, [hasTemplate, activeTemplateBg, savedPatterns]);

  const setDocumentBackground = (patterns: SavedPatternRef[]) => {
    setPref(TEMPLATE_KEY, null);
    setPref(TEMPLATE_HTML_KEY, null);
    setPref(TEMPLATE_BG_KEY, null);
    setPref(PREF_KEY, patterns);
  };

  /** Set a template as document background (pre-rendered HTML) */
  const setTemplateBackground = (templateId: string, html: string, bgColorVal: string) => {
    setPref(PREF_KEY, []);
    setPref(TEMPLATE_KEY, templateId);
    setPref(TEMPLATE_HTML_KEY, html);
    setPref(TEMPLATE_BG_KEY, bgColorVal);
  };

  const clearDocumentBackground = () => {
    setPref(PREF_KEY, []);
    setPref(TEMPLATE_KEY, null);
    setPref(TEMPLATE_HTML_KEY, null);
    setPref(TEMPLATE_BG_KEY, null);
  };

  return {
    savedPatterns,
    backgroundHTML,
    bgColor,
    setDocumentBackground,
    setTemplateBackground,
    clearDocumentBackground,
    hasBackground: hasTemplate || savedPatterns.length > 0,
    isTemplateBased: hasTemplate,
    activeTemplateId,
  };
}
