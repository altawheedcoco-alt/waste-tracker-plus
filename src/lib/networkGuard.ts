export class RequestTimeoutError extends Error {
  constructor(operation: string, timeoutMs: number) {
    super(`${operation} timed out after ${timeoutMs}ms`);
    this.name = 'RequestTimeoutError';
  }
}

/**
 * حساب المهلة المناسبة بناءً على جودة الاتصال
 */
const getAdaptiveTimeout = (baseTimeout: number): number => {
  const connection = (navigator as any).connection;
  if (!connection) return baseTimeout;
  
  const effectiveType = connection.effectiveType;
  if (effectiveType === 'slow-2g' || effectiveType === '2g') return baseTimeout * 3;
  if (effectiveType === '3g') return baseTimeout * 2;
  return baseTimeout;
};

export const withTimeout = async <T>(
  operation: string,
  request: () => Promise<T>,
  timeoutMs: number = 15000
): Promise<T> => {
  const adaptiveTimeout = getAdaptiveTimeout(timeoutMs);
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new RequestTimeoutError(operation, adaptiveTimeout)), adaptiveTimeout);
  });

  return Promise.race([request(), timeoutPromise]);
};

/**
 * إعادة محاولة مع تأخير أسي
 */
export const withRetry = async <T>(
  operation: string,
  request: () => Promise<T>,
  maxRetries: number = 3,
  timeoutMs: number = 15000
): Promise<T> => {
  let lastError: unknown;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await withTimeout(operation, request, timeoutMs);
    } catch (error) {
      lastError = error;
      if (i < maxRetries) {
        const delay = Math.min(1000 * 2 ** i, 10000) + Math.random() * 500;
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
};

export const logNetworkError = (operation: string, error: unknown) => {
  console.error(`[Network] ${operation} failed`, error);
};
