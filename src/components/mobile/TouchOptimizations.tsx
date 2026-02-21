/**
 * TouchOptimizations - تحسينات تجربة اللمس للموبايل
 * يضيف CSS وتحسينات JavaScript لتفاعل أفضل باللمس
 */
import { memo, useEffect } from 'react';

const TouchOptimizations = memo(() => {
  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) return;

    const root = document.documentElement;
    root.classList.add('touch-device');

    const style = document.createElement('style');
    style.id = 'touch-optimizations';
    style.textContent = `
      /* === Global touch behavior === */
      .touch-device,
      .touch-device * {
        -webkit-tap-highlight-color: transparent;
      }

      .touch-device body {
        touch-action: auto;
        -webkit-text-size-adjust: 100%;
      }

      /* === Touch targets - minimum 44px for accessibility === */
      .touch-device button,
      .touch-device [role="button"],
      .touch-device [role="tab"],
      .touch-device [role="menuitem"],
      .touch-device [role="option"],
      .touch-device a:not(.inline-link) {
        min-height: 44px;
        min-width: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      /* Small icon-only buttons get padding instead */
      .touch-device button svg:only-child,
      .touch-device [role="button"] svg:only-child {
        pointer-events: none;
      }

      .touch-device input[type="checkbox"],
      .touch-device input[type="radio"] {
        min-height: 24px;
        min-width: 24px;
      }

      /* === Prevent iOS zoom on input focus === */
      .touch-device input[type="text"],
      .touch-device input[type="email"],
      .touch-device input[type="password"],
      .touch-device input[type="number"],
      .touch-device input[type="tel"],
      .touch-device input[type="search"],
      .touch-device input[type="url"],
      .touch-device input[type="date"],
      .touch-device select,
      .touch-device textarea {
        font-size: 16px !important;
      }

      /* === Active state feedback (replaces hover on touch) === */
      .touch-device button:active,
      .touch-device [role="button"]:active,
      .touch-device [role="tab"]:active,
      .touch-device a:active {
        transform: scale(0.97);
        opacity: 0.85;
        transition: transform 0.08s ease-out, opacity 0.08s ease-out;
      }

      /* === Disable hover effects on touch - use @media instead of class === */
      @media (hover: none) and (pointer: coarse) {
        .hover-lift:hover,
        .hover-scale:hover,
        .hover-glow:hover,
        .glass-card-hover:hover,
        .card-interactive:hover {
          transform: none !important;
          box-shadow: inherit !important;
        }
      }

      /* === Prevent text selection on interactive elements === */
      .touch-device button,
      .touch-device [role="button"],
      .touch-device [role="tab"],
      .touch-device nav,
      .touch-device .select-none {
        -webkit-user-select: none;
        user-select: none;
      }

      /* === Momentum scrolling === */
      .touch-device .overflow-auto,
      .touch-device .overflow-y-auto,
      .touch-device .overflow-x-auto,
      .touch-device [data-radix-scroll-area-viewport] {
        -webkit-overflow-scrolling: touch;
      }

      /* === Better spacing between touch targets === */
      .touch-device .space-y-1 > * + * { margin-top: 0.375rem; }
      .touch-device .gap-1 { gap: 0.375rem; }
      .touch-device .gap-2 { gap: 0.625rem; }

      /* === Dialog/Sheet improvements for mobile === */
      .touch-device [data-radix-dialog-content],
      .touch-device [role="dialog"] {
        max-height: calc(100dvh - 2rem);
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }

      /* === Tabs improvements === */
      .touch-device [role="tablist"] {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      .touch-device [role="tablist"]::-webkit-scrollbar {
        display: none;
      }

      /* === Table horizontal scroll === */
      .touch-device .overflow-x-auto {
        scroll-snap-type: x proximity;
      }

      /* === Fix sticky elements on iOS === */
      .touch-device .sticky {
        position: -webkit-sticky;
        position: sticky;
      }

      /* === Bottom navigation safe area === */
      .touch-device .pb-safe {
        padding-bottom: max(env(safe-area-inset-bottom, 16px), 16px);
      }
    `;
    document.head.appendChild(style);

    // Note: removed preventDoubleTapZoom as it was blocking scroll on many devices

    // Fix 300ms click delay on older browsers
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta && !meta.getAttribute('content')?.includes('user-scalable')) {
      // Viewport already set correctly in index.html
    }

    return () => {
      root.classList.remove('touch-device');
      const el = document.getElementById('touch-optimizations');
      if (el) el.remove();
    };
  }, []);

  return null;
});

TouchOptimizations.displayName = 'TouchOptimizations';

export default TouchOptimizations;
