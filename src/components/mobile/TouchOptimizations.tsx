/**
 * TouchOptimizations - تحسينات تجربة اللمس للموبايل
 * يضيف CSS classes لتحسين التفاعل باللمس
 */
import { memo, useEffect } from 'react';

const TouchOptimizations = memo(() => {
  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) return;

    const root = document.documentElement;
    root.classList.add('touch-device');

    // Add touch-optimized styles
    const style = document.createElement('style');
    style.id = 'touch-optimizations';
    style.textContent = `
      /* Larger touch targets */
      .touch-device button,
      .touch-device [role="button"],
      .touch-device a,
      .touch-device input,
      .touch-device select,
      .touch-device textarea {
        min-height: 44px;
        min-width: 44px;
      }

      .touch-device input[type="checkbox"],
      .touch-device input[type="radio"] {
        min-height: 24px;
        min-width: 24px;
      }

      /* Remove hover effects on touch */
      .touch-device *:hover {
        transition-duration: 0s !important;
      }

      /* Better tap feedback */
      .touch-device button:active,
      .touch-device [role="button"]:active,
      .touch-device a:active {
        transform: scale(0.97);
        transition: transform 0.1s;
      }

      /* Prevent text selection on interactive elements */
      .touch-device button,
      .touch-device [role="button"] {
        -webkit-user-select: none;
        user-select: none;
      }

      /* Smooth scrolling */
      .touch-device .overflow-auto,
      .touch-device .overflow-y-auto,
      .touch-device .overflow-x-auto {
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
      }

      /* Prevent zoom on input focus (iOS) */
      .touch-device input[type="text"],
      .touch-device input[type="email"],
      .touch-device input[type="password"],
      .touch-device input[type="number"],
      .touch-device input[type="tel"],
      .touch-device select,
      .touch-device textarea {
        font-size: 16px !important;
      }

      /* Better spacing for touch */
      .touch-device .gap-1 { gap: 0.375rem; }
      .touch-device .gap-2 { gap: 0.625rem; }

      /* Pull-to-refresh prevention on main content */
      .touch-device body {
        overscroll-behavior-y: contain;
      }
    `;
    document.head.appendChild(style);

    // Disable double-tap zoom
    let lastTap = 0;
    const preventDoubleTapZoom = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTap < 300) {
        const target = e.target as HTMLElement;
        if (!target.closest('input, textarea, [contenteditable]')) {
          e.preventDefault();
        }
      }
      lastTap = now;
    };
    document.addEventListener('touchend', preventDoubleTapZoom, { passive: false });

    return () => {
      root.classList.remove('touch-device');
      const el = document.getElementById('touch-optimizations');
      if (el) el.remove();
      document.removeEventListener('touchend', preventDoubleTapZoom);
    };
  }, []);

  return null;
});

TouchOptimizations.displayName = 'TouchOptimizations';

export default TouchOptimizations;
