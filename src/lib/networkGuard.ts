export class RequestTimeoutError extends Error {
  constructor(operation: string, timeoutMs: number) {
    super(`${operation} timed out after ${timeoutMs}ms`);
    this.name = 'RequestTimeoutError';
  }
}

/**
 * Detect if the current connection is slow (2G/3G or low bandwidth)
 */
const isSlowNetwork = (): boolean => {
  const conn = (navigator as any).connection;
  if (!conn) return false;
  const type = conn.effectiveType;
  return type === '2g' || type === 'slow-2g' || type === '3g' || (conn.downlink && conn.downlink < 1);
};

/**
 * Get adaptive timeout based on network conditions
 */
const getAdaptiveTimeout = (baseTimeout: number): number => {
  if (!navigator.onLine) return baseTimeout * 4;
  if (isSlowNetwork()) return baseTimeout * 3;
  return baseTimeout;
};

export const withTimeout = async <T>(
  operation: string,
  request: () => Promise<T>,
  timeoutMs: number = 15000
): Promise<T> => {
  const adaptiveMs = getAdaptiveTimeout(timeoutMs);
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new RequestTimeoutError(operation, adaptiveMs)), adaptiveMs);
  });

  return Promise.race([request(), timeoutPromise]);
};

/**
 * Retry with exponential backoff — essential for ultra-slow networks
 */
export const withRetry = async <T>(
  operation: string,
  request: () => Promise<T>,
  options: { maxRetries?: number; baseDelay?: number; timeoutMs?: number } = {}
): Promise<T> => {
  const { maxRetries = 3, baseDelay = 1000, timeoutMs = 15000 } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await withTimeout(operation, request, timeoutMs);
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

export const logNetworkError = (operation: string, error: unknown) => {
  console.error(`[Network] ${operation} failed`, error);
};
