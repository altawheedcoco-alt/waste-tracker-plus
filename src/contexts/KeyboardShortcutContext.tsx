import { createContext, useContext, useCallback, useEffect, useMemo, useState, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useKeyboardShortcuts, type KeyboardShortcut } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutContextValue {
  /** Register a print handler for the current view (Ctrl+P intercept) */
  registerPrintHandler: (handler: (() => void) | null) => void;
  /** Register a PDF download handler (Ctrl+D intercept) */
  registerPdfHandler: (handler: (() => void) | null) => void;
  /** Show shortcuts guide */
  showGuide: () => void;
  guideOpen: boolean;
  setGuideOpen: (open: boolean) => void;
}

const Ctx = createContext<KeyboardShortcutContextValue | null>(null);

export function useKeyboardShortcutContext() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useKeyboardShortcutContext must be inside KeyboardShortcutProvider');
  return ctx;
}

export function KeyboardShortcutProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [guideOpen, setGuideOpen] = useState(false);
  const [printHandler, setPrintHandler] = useState<(() => void) | null>(null);
  const [pdfHandler, setPdfHandler] = useState<(() => void) | null>(null);

  const registerPrintHandler = useCallback((h: (() => void) | null) => {
    setPrintHandler(() => h);
  }, []);

  const registerPdfHandler = useCallback((h: (() => void) | null) => {
    setPdfHandler(() => h);
  }, []);

  const showGuide = useCallback(() => setGuideOpen(true), []);

  const shortcuts = useMemo<KeyboardShortcut[]>(() => [
    // Navigation: Go back
    {
      key: 'Backspace',
      handler: () => navigate(-1),
      description: 'الرجوع للصفحة السابقة',
      category: 'تنقل',
    },
    {
      key: 'ArrowLeft',
      alt: true,
      handler: () => navigate(-1),
      description: 'الرجوع للصفحة السابقة',
      category: 'تنقل',
    },
    // Escape: close guide or go back
    {
      key: 'Escape',
      handler: () => {
        if (guideOpen) {
          setGuideOpen(false);
        }
        // Escape for dialogs is handled by Radix natively
      },
      description: 'إغلاق النافذة الحالية',
      category: 'تنقل',
      allowInInput: true,
      priority: -1, // low priority so component-level Escape wins
    },
    // Ctrl+P → print
    {
      key: 'p',
      ctrl: true,
      handler: () => {
        if (printHandler) {
          printHandler();
        } else {
          window.print();
        }
      },
      description: 'طباعة المستند المفتوح',
      category: 'مستندات',
      allowInInput: true,
      priority: 10,
    },
    // Ctrl+D → download PDF
    {
      key: 'd',
      ctrl: true,
      handler: () => {
        if (pdfHandler) pdfHandler();
      },
      description: 'تحميل PDF',
      category: 'مستندات',
      allowInInput: true,
      priority: 10,
    },
    // Ctrl+/ or ? → shortcuts guide
    {
      key: '/',
      ctrl: true,
      handler: () => setGuideOpen(o => !o),
      description: 'عرض دليل الاختصارات',
      category: 'عام',
      allowInInput: true,
    },
    // Alt+1..9 quick nav
    ...([
      '/dashboard',
      '/dashboard/shipments',
      '/dashboard/fleet',
      '/dashboard/partners',
      '/dashboard/settings',
      '/dashboard/reports',
      '/dashboard/chat',
      '/dashboard/documents',
      '/dashboard/notifications',
    ] as const).map((path, i) => ({
      key: `${i + 1}`,
      alt: true,
      handler: () => navigate(path),
      description: `الانتقال للقسم ${i + 1}`,
      category: 'تنقل سريع',
    })),
  ], [navigate, guideOpen, printHandler, pdfHandler]);

  useKeyboardShortcuts(shortcuts);

  const value = useMemo<KeyboardShortcutContextValue>(() => ({
    registerPrintHandler,
    registerPdfHandler,
    showGuide,
    guideOpen,
    setGuideOpen,
  }), [registerPrintHandler, registerPdfHandler, showGuide, guideOpen]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
