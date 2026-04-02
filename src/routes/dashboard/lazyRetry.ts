import { lazy } from 'react';

export function lazyRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 2
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    for (let i = 0; i <= retries; i++) {
      try {
        return await factory();
      } catch (err) {
        if (i < retries) {
          await new Promise(r => setTimeout(r, 500 * (i + 1)));
        } else {
          window.location.reload();
          throw err;
        }
      }
    }
    throw new Error('lazyRetry exhausted');
  });
}
