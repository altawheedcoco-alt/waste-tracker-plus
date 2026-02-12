import { useCallback, startTransition } from 'react';
import { useNavigate, NavigateOptions, To } from 'react-router-dom';

/**
 * A wrapper around useNavigate that automatically wraps navigation
 * in startTransition to prevent "A component suspended while responding
 * to synchronous input" errors with React.lazy routes.
 */
export const useAppNavigate = () => {
  const navigate = useNavigate();

  return useCallback(
    (to: To | number, options?: NavigateOptions) => {
      startTransition(() => {
        if (typeof to === 'number') {
          navigate(to);
        } else {
          navigate(to, options);
        }
      });
    },
    [navigate]
  );
};
