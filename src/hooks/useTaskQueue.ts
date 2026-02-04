import { useCallback, useEffect, useRef, useState, useMemo } from 'react';

type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

interface Task<T = unknown> {
  id: string;
  status: TaskStatus;
  progress: number;
  result?: T;
  error?: string;
}

interface QueueStatus {
  pending: number;
  active: number;
  total: number;
}

interface UseTaskQueueOptions {
  onTaskComplete?: (taskId: string, result: unknown) => void;
  onTaskError?: (taskId: string, error: string) => void;
  onTaskProgress?: (taskId: string, progress: number) => void;
}

/**
 * Hook لإدارة طابور المهام الثقيلة
 */
export function useTaskQueue(options: UseTaskQueueOptions = {}) {
  const { onTaskComplete, onTaskError, onTaskProgress } = options;
  
  const workerRef = useRef<Worker | null>(null);
  const [tasks, setTasks] = useState<Map<string, Task>>(new Map());
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({
    pending: 0,
    active: 0,
    total: 0,
  });
  const callbacksRef = useRef<Map<string, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
  }>>(new Map());

  // إنشاء Worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/taskQueue.worker.ts', import.meta.url),
      { type: 'module' }
    );
    
    workerRef.current.onmessage = (event) => {
      const { type, taskId, result, error, progress, task, ...rest } = event.data;
      
      switch (type) {
        case 'task-queued':
          setTasks(prev => {
            const next = new Map(prev);
            next.set(taskId, { id: taskId, status: 'pending', progress: 0 });
            return next;
          });
          break;
          
        case 'task-started':
          setTasks(prev => {
            const next = new Map(prev);
            const existing = next.get(taskId);
            if (existing) {
              next.set(taskId, { ...existing, status: 'running' });
            }
            return next;
          });
          break;
          
        case 'task-progress':
          setTasks(prev => {
            const next = new Map(prev);
            const existing = next.get(taskId);
            if (existing) {
              next.set(taskId, { ...existing, progress });
            }
            return next;
          });
          onTaskProgress?.(taskId, progress);
          break;
          
        case 'task-completed':
          setTasks(prev => {
            const next = new Map(prev);
            const existing = next.get(taskId);
            if (existing) {
              next.set(taskId, { ...existing, status: 'completed', progress: 100, result });
            }
            return next;
          });
          
          const completeCallback = callbacksRef.current.get(taskId);
          if (completeCallback) {
            completeCallback.resolve(result);
            callbacksRef.current.delete(taskId);
          }
          onTaskComplete?.(taskId, result);
          break;
          
        case 'task-failed':
          setTasks(prev => {
            const next = new Map(prev);
            const existing = next.get(taskId);
            if (existing) {
              next.set(taskId, { ...existing, status: 'failed', error });
            }
            return next;
          });
          
          const errorCallback = callbacksRef.current.get(taskId);
          if (errorCallback) {
            errorCallback.reject(new Error(error));
            callbacksRef.current.delete(taskId);
          }
          onTaskError?.(taskId, error);
          break;
          
        case 'task-cancelled':
          setTasks(prev => {
            const next = new Map(prev);
            const existing = next.get(taskId);
            if (existing) {
              next.set(taskId, { ...existing, status: 'cancelled' });
            }
            return next;
          });
          
          const cancelCallback = callbacksRef.current.get(taskId);
          if (cancelCallback) {
            cancelCallback.reject(new Error('Task cancelled'));
            callbacksRef.current.delete(taskId);
          }
          break;
          
        case 'queue-status':
          setQueueStatus(rest as QueueStatus);
          break;
      }
    };
    
    return () => {
      workerRef.current?.terminate();
    };
  }, [onTaskComplete, onTaskError, onTaskProgress]);

  // إضافة مهمة
  const addTask = useCallback(<T = unknown>(
    taskType: string,
    data: unknown,
    priority: number = 0
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      callbacksRef.current.set(taskId, {
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      
      workerRef.current?.postMessage({
        type: 'add-task',
        taskId,
        payload: { type: taskType, data },
        priority,
      });
    });
  }, []);

  // إلغاء مهمة
  const cancelTask = useCallback((taskId: string) => {
    workerRef.current?.postMessage({
      type: 'cancel-task',
      taskId,
    });
  }, []);

  // الحصول على حالة المهمة
  const getTaskStatus = useCallback((taskId: string): Task | undefined => {
    return tasks.get(taskId);
  }, [tasks]);

  // تحديث حالة الطابور
  const refreshQueueStatus = useCallback(() => {
    workerRef.current?.postMessage({ type: 'get-queue-status' });
  }, []);

  // حساب ثقيل
  const runHeavyComputation = useCallback(
    (iterations: number, priority?: number) => {
      return addTask<{ result: number; duration: number }>(
        'heavy-computation',
        { iterations },
        priority
      );
    },
    [addTask]
  );

  // تحليل بيانات
  const runDataAnalysis = useCallback(
    <T = unknown>(data: T[], priority?: number) => {
      return addTask<{
        count: number;
        stats: Record<string, { min: number; max: number; avg: number; sum: number }>;
      }>('data-analysis', { data }, priority);
    },
    [addTask]
  );

  // معالجة دفعية
  const runBatchProcess = useCallback(
    <T = unknown>(items: T[], operation: string, priority?: number) => {
      return addTask<T[]>('batch-process', { items, operation }, priority);
    },
    [addTask]
  );

  // قائمة المهام كمصفوفة
  const tasksList = useMemo(() => Array.from(tasks.values()), [tasks]);

  return {
    addTask,
    cancelTask,
    getTaskStatus,
    refreshQueueStatus,
    runHeavyComputation,
    runDataAnalysis,
    runBatchProcess,
    tasks: tasksList,
    queueStatus,
  };
}

export default useTaskQueue;
