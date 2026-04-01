/**
 * MobileEnhancements — تحسينات جمالية وتفاعلية لنسخة الموبايل/PWA
 * تُضيف تأثيرات بصرية وتفاعلية متقدمة
 */
import { memo, useEffect } from 'react';

const MobileEnhancements = memo(() => {
  useEffect(() => {
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
    if (!isMobile) return;

    const style = document.createElement('style');
    style.id = 'mobile-enhancements-v4';
    style.textContent = `
      /* ============================================
         v4.0 Mobile Aesthetic Enhancements
         ============================================ */

      /* === Glassmorphism cards on mobile === */
      @media (max-width: 768px) {
        .glass-mobile {
          background: hsl(var(--card) / 0.75) !important;
          backdrop-filter: blur(16px) saturate(1.6);
          -webkit-backdrop-filter: blur(16px) saturate(1.6);
          border: 1px solid hsl(var(--border) / 0.5);
        }

        /* Cards get subtle gradient overlays */
        [data-radix-card],
        .rounded-lg.border.bg-card,
        .rounded-xl.border.bg-card {
          background: linear-gradient(
            145deg,
            hsl(var(--card)) 0%,
            hsl(var(--card) / 0.95) 100%
          );
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }

        /* Active card press effect */
        [data-radix-card]:active,
        .card-interactive:active {
          transform: scale(0.985);
          box-shadow: var(--shadow-sm);
        }

        /* Stat cards — subtle primary tint on border */
        .stat-card, [class*="StatCard"] {
          border-color: hsl(var(--primary) / 0.12) !important;
        }

        /* Better section headers with gradient underline */
        .section-header-mobile {
          position: relative;
          padding-bottom: 0.5rem;
        }
        .section-header-mobile::after {
          content: '';
          position: absolute;
          bottom: 0;
          right: 0;
          width: 3rem;
          height: 2.5px;
          border-radius: 2px;
          background: var(--gradient-eco);
        }

        /* Animated entrance for list items */
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-list-item {
          animation: slideInUp 0.3s ease-out both;
        }
        .animate-list-item:nth-child(1) { animation-delay: 0ms; }
        .animate-list-item:nth-child(2) { animation-delay: 40ms; }
        .animate-list-item:nth-child(3) { animation-delay: 80ms; }
        .animate-list-item:nth-child(4) { animation-delay: 120ms; }
        .animate-list-item:nth-child(5) { animation-delay: 160ms; }
        .animate-list-item:nth-child(6) { animation-delay: 200ms; }

        /* Floating action button glow */
        .fab-glow {
          box-shadow: 
            0 4px 12px hsl(var(--primary) / 0.25),
            0 0 0 1px hsl(var(--primary) / 0.1);
        }
        .fab-glow:active {
          box-shadow: 
            0 2px 6px hsl(var(--primary) / 0.2);
          transform: scale(0.95);
        }

        /* Pull indicator styling */
        .pull-indicator {
          position: fixed;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100;
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
        }
        .pull-indicator.visible {
          opacity: 1;
        }

        /* Better badge styling on mobile */
        .mobile-badge {
          background: var(--gradient-eco);
          color: hsl(var(--primary-foreground));
          font-size: 0.625rem;
          font-weight: 700;
          padding: 0.125rem 0.5rem;
          border-radius: 999px;
          letter-spacing: 0.02em;
          box-shadow: 0 1px 4px hsl(var(--primary) / 0.2);
        }

        /* Improved tab bar on mobile */
        [role="tablist"] {
          background: hsl(var(--muted) / 0.5);
          border-radius: 0.75rem;
          padding: 0.25rem;
          gap: 0.125rem;
        }

        [role="tab"][aria-selected="true"] {
          background: hsl(var(--card));
          box-shadow: var(--shadow-sm);
          border-radius: 0.625rem;
          font-weight: 600;
          color: hsl(var(--primary));
        }

        [role="tab"] {
          border-radius: 0.625rem;
          transition: all 0.2s ease;
        }

        /* Smooth color transitions for interactive elements */
        button, a, [role="button"] {
          transition: color 0.15s ease, background-color 0.15s ease, 
                      transform 0.1s ease, box-shadow 0.15s ease;
        }

        /* Better input focus ring on mobile */
        input:focus, textarea:focus, select:focus,
        [role="combobox"]:focus {
          box-shadow: 0 0 0 3px hsl(var(--primary) / 0.12);
          border-color: hsl(var(--primary) / 0.5) !important;
        }

        /* Notification dot pulse */
        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        .notification-pulse {
          animation: pulseDot 2s ease-in-out infinite;
        }

        /* Swipe hint animation */
        @keyframes swipeHint {
          0% { transform: translateX(0); opacity: 0.6; }
          50% { transform: translateX(-8px); opacity: 1; }
          100% { transform: translateX(0); opacity: 0.6; }
        }
        .swipe-hint {
          animation: swipeHint 2s ease-in-out 1;
        }

        /* Skeleton shimmer enhancement */
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            hsl(var(--muted)) 25%,
            hsl(var(--muted-foreground) / 0.08) 50%,
            hsl(var(--muted)) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }

        /* Status indicator colors — eco-themed */
        .status-dot-success { background: hsl(var(--eco-green)); box-shadow: 0 0 6px hsl(var(--eco-green) / 0.4); }
        .status-dot-warning { background: hsl(var(--eco-gold)); box-shadow: 0 0 6px hsl(var(--eco-gold) / 0.4); }
        .status-dot-error { background: hsl(var(--destructive)); box-shadow: 0 0 6px hsl(var(--destructive) / 0.4); }

        /* Improved scroll shadows for horizontal scrolling */
        .scroll-shadow-x {
          mask-image: linear-gradient(
            to left,
            transparent 0%,
            black 5%,
            black 95%,
            transparent 100%
          );
          -webkit-mask-image: linear-gradient(
            to left,
            transparent 0%,
            black 5%,
            black 95%,
            transparent 100%
          );
        }

        /* Divider with eco accent */
        .divider-eco {
          height: 1px;
          background: linear-gradient(
            to left,
            transparent 0%,
            hsl(var(--primary) / 0.15) 50%,
            transparent 100%
          );
          border: none;
        }

        /* Mobile header gradient bar */
        .header-gradient-bar {
          background: var(--gradient-eco);
          height: 3px;
          width: 100%;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          opacity: 0.7;
        }

        /* Smooth page content fade */
        .page-content-mobile {
          animation: fadeInContent 0.25s ease-out;
        }

        @keyframes fadeInContent {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* === Extra-small screen optimizations (360px) === */
        @media (max-width: 380px) {
          /* Tighter padding on very small screens */
          .p-4, .p-6 { padding: 0.625rem !important; }
          .px-4, .px-6 { padding-inline: 0.625rem !important; }
          .gap-4 { gap: 0.5rem !important; }
          .gap-3 { gap: 0.375rem !important; }
          
          /* Smaller text for cramped screens */
          .text-2xl { font-size: 1.125rem !important; }
          .text-xl { font-size: 1rem !important; }
          .text-lg { font-size: 0.9375rem !important; }
          
          /* Grid columns collapse to single */
          .grid-cols-2 { grid-template-columns: 1fr !important; }
          .grid-cols-3 { grid-template-columns: repeat(2, 1fr) !important; }
          
          /* Tab lists scroll horizontally */
          [role="tablist"] {
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
            flex-wrap: nowrap !important;
          }
          [role="tablist"]::-webkit-scrollbar { display: none; }
          [role="tab"] {
            white-space: nowrap;
            flex-shrink: 0;
            font-size: 0.75rem !important;
            padding: 0.375rem 0.625rem !important;
          }
          
          /* Dialog/modal full width on tiny screens */
          [role="dialog"] > div {
            max-width: calc(100vw - 1rem) !important;
            margin: 0.5rem !important;
          }
          
          /* Tables become card-like */
          table { font-size: 0.75rem !important; }
          th, td { padding: 0.375rem 0.5rem !important; }
        }

        /* === Safe area bottom padding for pages with bottom nav === */
        @media (max-width: 768px) {
          .pb-safe-bottom {
            padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px)) !important;
          }
          
          /* Ensure main content doesn't hide behind bottom nav */
          main, [role="main"], .dashboard-content {
            padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px));
          }

          /* Sticky headers account for notch */
          .sticky-top-safe {
            top: env(safe-area-inset-top, 0px);
          }

          /* Touch-friendly minimum hit targets */
          button:not(.icon-only), a[role="button"] {
            min-height: 44px;
            min-width: 44px;
          }
        }
      }

      /* === Dark mode mobile enhancements === */
      @media (max-width: 768px) {
        .dark [data-radix-card],
        .dark .rounded-lg.border.bg-card,
        .dark .rounded-xl.border.bg-card {
          background: linear-gradient(
            145deg,
            hsl(var(--card)) 0%,
            hsl(var(--card) / 0.9) 100%
          );
          border-color: hsl(var(--border) / 0.6);
        }

        .dark [role="tablist"] {
          background: hsl(var(--muted) / 0.3);
        }

        .dark [role="tab"][aria-selected="true"] {
          background: hsl(var(--card) / 0.8);
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.getElementById('mobile-enhancements-v4')?.remove();
    };
  }, []);

  return null;
});

MobileEnhancements.displayName = 'MobileEnhancements';
export default MobileEnhancements;
