export class RequestTimeoutError extends Error {
  constructor(operation: string, timeoutMs: number) {
    super(`${operation} timed out after ${timeoutMs}ms`);
    this.name = 'RequestTimeoutError';
  }
}

export const withTimeout = async <T>(
  operation: string,
  request: () => Promise<T>,
  timeoutMs: number = 15000
): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new RequestTimeoutError(operation, timeoutMs)), timeoutMs);
  });

  return Promise.race([request(), timeoutPromise]);
};

export const logNetworkError = (operation: string, error: unknown) => {
  console.error(`[Network] ${operation} failed`, error);
};
