import { useState, useCallback, useRef, useEffect } from 'react';

type WorkerStatus = 'idle' | 'processing' | 'error' | 'terminated';

interface UseWebWorkerOptions {
  terminateOnUnmount?: boolean;
  timeout?: number;
}

interface UseWebWorkerResult<TInput, TOutput> {
  execute: (input: TInput) => Promise<TOutput>;
  status: WorkerStatus;
  error: Error | null;
  terminate: () => void;
  isProcessing: boolean;
}

/**
 * Hook لإنشاء واستخدام Web Worker
 */
export function useWebWorker<TInput = unknown, TOutput = unknown>(
  workerFactory: () => Worker,
  options: UseWebWorkerOptions = {}
): UseWebWorkerResult<TInput, TOutput> {
  const { terminateOnUnmount = true, timeout = 30000 } = options;
  
  const workerRef = useRef<Worker | null>(null);
  const [status, setStatus] = useState<WorkerStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const pendingRequests = useRef<Map<string, {
    resolve: (value: TOutput) => void;
    reject: (error: Error) => void;
    timeoutId: NodeJS.Timeout;
  }>>(new Map());

  // إنشاء Worker عند الطلب
  const getWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = workerFactory();
      
      workerRef.current.onmessage = (event) => {
        const { id, result, error: workerError } = event.data;
        const request = pendingRequests.current.get(id);
        
        if (request) {
          clearTimeout(request.timeoutId);
          pendingRequests.current.delete(id);
          
          if (workerError) {
            request.reject(new Error(workerError));
          } else {
            request.resolve(result);
          }
          
          if (pendingRequests.current.size === 0) {
            setStatus('idle');
          }
        }
      };
      
      workerRef.current.onerror = (event) => {
        setStatus('error');
        setError(new Error(event.message));
        
        // رفض جميع الطلبات المعلقة
        pendingRequests.current.forEach((request) => {
          clearTimeout(request.timeoutId);
          request.reject(new Error(event.message));
        });
        pendingRequests.current.clear();
      };
    }
    
    return workerRef.current;
  }, [workerFactory]);

  // تنفيذ عملية
  const execute = useCallback(
    (input: TInput): Promise<TOutput> => {
      return new Promise((resolve, reject) => {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const worker = getWorker();
        
        setStatus('processing');
        setError(null);
        
        const timeoutId = setTimeout(() => {
          const request = pendingRequests.current.get(id);
          if (request) {
            pendingRequests.current.delete(id);
            reject(new Error('Worker timeout'));
            
            if (pendingRequests.current.size === 0) {
              setStatus('idle');
            }
          }
        }, timeout);
        
        pendingRequests.current.set(id, { resolve, reject, timeoutId });
        
        worker.postMessage({ ...input, id });
      });
    },
    [getWorker, timeout]
  );

  // إنهاء Worker
  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      setStatus('terminated');
      
      // رفض جميع الطلبات المعلقة
      pendingRequests.current.forEach((request) => {
        clearTimeout(request.timeoutId);
        request.reject(new Error('Worker terminated'));
      });
      pendingRequests.current.clear();
    }
  }, []);

  // تنظيف عند الخروج
  useEffect(() => {
    return () => {
      if (terminateOnUnmount) {
        terminate();
      }
    };
  }, [terminateOnUnmount, terminate]);

  return {
    execute,
    status,
    error,
    terminate,
    isProcessing: status === 'processing',
  };
}

export default useWebWorker;
