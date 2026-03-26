/**
 * SoundIntegrator — مكون عالمي يربط الأصوات بأحداث التطبيق
 * يُضاف مرة واحدة في App.tsx داخل BrowserRouter
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { soundEngine } from '@/lib/soundEngine';

export default function SoundIntegrator() {
  const location = useLocation();
  const prevPath = useRef(location.pathname);

  // صوت التنقل بين الصفحات
  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      soundEngine.play('navigate');
      prevPath.current = location.pathname;
    }
  }, [location.pathname]);

  // صوت نقرات الأزرار عبر Event Delegation (يغطي كل الأزرار)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest('button, [role="button"], a.btn, [data-sound]');
      if (!button) return;

      const customSound = (button as HTMLElement).dataset.sound;
      if (customSound === 'none') return; // data-sound="none" يلغي الصوت

      if (customSound) {
        soundEngine.play(customSound as any);
      } else if ((button as HTMLElement).closest('[data-destructive], .destructive')) {
        soundEngine.play('delete');
      } else {
        soundEngine.play('click');
      }
    };

    document.addEventListener('click', handler, { passive: true });
    return () => document.removeEventListener('click', handler);
  }, []);

  return null;
}

import { useRef } from 'react';
