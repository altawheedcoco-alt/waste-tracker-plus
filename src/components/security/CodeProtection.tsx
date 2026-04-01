/**
 * CodeProtection - حماية الكود المصدري للمشروع
 * يمنع النسخ، النقر بالزر الأيمن، أدوات المطور، وتحديد النصوص
 */
import { memo, useEffect } from 'react';

const CodeProtection = memo(() => {
  useEffect(() => {
    // Only in production
    if (import.meta.env.DEV) return;

    const handlers: Array<[string, EventListener]> = [];
    const addHandler = (event: string, handler: EventListener) => {
      document.addEventListener(event, handler, true);
      handlers.push([event, handler]);
    };

    // 1. منع النقر بالزر الأيمن
    addHandler('contextmenu', (e) => e.preventDefault());

    // 2. منع اختصارات لوحة المفاتيح (DevTools + نسخ + حفظ)
    addHandler('keydown', (e: Event) => {
      const ke = e as KeyboardEvent;
      // F12
      if (ke.key === 'F12') { ke.preventDefault(); return; }
      // Ctrl+Shift+I/J/C (DevTools)
      if (ke.ctrlKey && ke.shiftKey && ['I','J','C','i','j','c'].includes(ke.key)) { ke.preventDefault(); return; }
      // Ctrl+U (View Source)
      if (ke.ctrlKey && (ke.key === 'u' || ke.key === 'U')) { ke.preventDefault(); return; }
      // Ctrl+S (Save)
      if (ke.ctrlKey && (ke.key === 's' || ke.key === 'S')) { ke.preventDefault(); return; }
      // Ctrl+A (Select All) - only outside inputs
      if (ke.ctrlKey && (ke.key === 'a' || ke.key === 'A')) {
        const tag = (ke.target as HTMLElement)?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') { ke.preventDefault(); return; }
      }
      // Ctrl+C (Copy) - only outside inputs
      if (ke.ctrlKey && (ke.key === 'c' || ke.key === 'C')) {
        const tag = (ke.target as HTMLElement)?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') { ke.preventDefault(); return; }
      }
    });

    // 3. منع السحب والإفلات (مع استثناء تفاعلات الخرائط)
    addHandler('dragstart', (e) => {
      const target = e.target as HTMLElement | null;
      // Leaflet يعتمد على السحب للحركة داخل الخريطة
      if (target?.closest('.leaflet-container')) return;
      e.preventDefault();
    });

    // 4. منع تحديد النصوص (CSS)
    const style = document.createElement('style');
    style.id = 'code-protection-styles';
    style.textContent = `
      body {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      input, textarea, [contenteditable="true"], .select-text {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
    `;
    document.head.appendChild(style);

    // 5. اكتشاف أدوات المطور (DevTools)
    let devtoolsOpen = false;
    const threshold = 160;
    const checkDevTools = () => {
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      if ((widthDiff || heightDiff) && !devtoolsOpen) {
        devtoolsOpen = true;
        console.clear();
        console.log(
          '%c⚠️ تحذير أمني',
          'color:red;font-size:40px;font-weight:bold;'
        );
        console.log(
          '%cهذا الموقع محمي بموجب قوانين حقوق الملكية الفكرية المصرية. أي محاولة لنسخ أو سرقة الكود تعرضك للمساءلة القانونية.',
          'color:red;font-size:16px;'
        );
      } else if (!widthDiff && !heightDiff) {
        devtoolsOpen = false;
      }
    };
    const devToolsInterval = setInterval(checkDevTools, 1000);

    // 6. منع console access override
    const noop = () => {};
    if (!import.meta.env.DEV) {
      // Keep console.error for real bugs but clear periodically
      const clearId = setInterval(() => {
        if (devtoolsOpen) console.clear();
      }, 3000);

      return () => {
        handlers.forEach(([event, handler]) => document.removeEventListener(event, handler, true));
        clearInterval(devToolsInterval);
        clearInterval(clearId);
        const el = document.getElementById('code-protection-styles');
        if (el) el.remove();
      };
    }

    return () => {
      handlers.forEach(([event, handler]) => document.removeEventListener(event, handler, true));
      clearInterval(devToolsInterval);
      const el = document.getElementById('code-protection-styles');
      if (el) el.remove();
    };
  }, []);

  return null;
});

CodeProtection.displayName = 'CodeProtection';

export default CodeProtection;
