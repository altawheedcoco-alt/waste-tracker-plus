import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Smart scroll restoration that saves/restores scroll position per route.
 * Replaces the naive "scroll to top on every navigation" approach.
 * 
 * - Navigating to a NEW route → scrolls to top
 * - Going BACK to a previously visited route → restores saved position
 * - Excluded paths (like /reels) manage their own scroll
 */

const scrollPositions = new Map<string, number>();
const visitedRoutes = new Set<string>();

const EXCLUDED_PATHS = ['/dashboard/reels', '/reels'];

export function useScrollRestoration() {
  const { pathname, key } = useLocation();
  const prevPathname = useRef(pathname);
  const isBack = useRef(false);

  // Detect back/forward via popstate
  useEffect(() => {
    const handlePop = () => {
      isBack.current = true;
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  // Save scroll on route leave, restore on route enter
  useEffect(() => {
    const excluded = EXCLUDED_PATHS.some(p => pathname.startsWith(p));

    // Save previous route's scroll
    if (prevPathname.current !== pathname) {
      scrollPositions.set(prevPathname.current, window.scrollY);
    }

    if (!excluded) {
      if (isBack.current && scrollPositions.has(pathname)) {
        // Restore saved position on back navigation
        const saved = scrollPositions.get(pathname)!;
        requestAnimationFrame(() => {
          window.scrollTo(0, saved);
        });
      } else if (!visitedRoutes.has(pathname)) {
        // New route → scroll to top
        window.scrollTo(0, 0);
      }
    }

    visitedRoutes.add(pathname);
    prevPathname.current = pathname;
    isBack.current = false;
  }, [pathname]);
}

/**
 * Hook to save/restore scroll position for a specific scrollable container.
 * Useful for feeds, lists, etc. that have their own scroll container.
 */
export function useContainerScrollRestore(
  containerRef: React.RefObject<HTMLElement | null>,
  key: string
) {
  const storageKey = `scroll_${key}`;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Restore
    const saved = sessionStorage.getItem(storageKey);
    if (saved) {
      const pos = parseInt(saved, 10);
      requestAnimationFrame(() => el.scrollTo(0, pos));
    }

    // Save on scroll (debounced)
    let timer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        sessionStorage.setItem(storageKey, String(el.scrollTop));
      }, 150);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      el.removeEventListener('scroll', onScroll);
    };
  }, [containerRef, storageKey]);
}
