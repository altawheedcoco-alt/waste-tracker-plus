import { useEffect } from 'react';

const BASE_TITLE = 'iRecycle — Waste Management Solution Platform';

/**
 * Sets the document title on mount and restores on unmount.
 */
export const usePageTitle = (title: string) => {
  useEffect(() => {
    document.title = `${title} | ${BASE_TITLE}`;
    return () => {
      document.title = BASE_TITLE;
    };
  }, [title]);
};
