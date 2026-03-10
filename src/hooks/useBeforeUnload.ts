import { useEffect, useCallback } from 'react';

/**
 * Hook to warn users before leaving a page with unsaved changes.
 * @param isDirty - Whether the form has unsaved changes
 * @param message - Optional custom message (browsers may ignore custom messages)
 */
export function useBeforeUnload(isDirty: boolean, message = 'لديك تغييرات غير محفوظة. هل أنت متأكد من المغادرة؟') {
  const handleBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      // Modern browsers ignore custom messages but still show a prompt
      e.returnValue = message;
      return message;
    },
    [isDirty, message]
  );

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [handleBeforeUnload]);
}
