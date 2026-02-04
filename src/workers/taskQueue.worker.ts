type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

interface Task {
  id: string;
  status: TaskStatus;
  progress: number;
  result?: unknown;
  error?: string;
}

interface QueuedTask {
  id: string;
  type: string;
  payload: unknown;
  priority: number;
  callback?: (result: unknown) => void;
  errorCallback?: (error: Error) => void;
}

// طابور المهام
const taskQueue: QueuedTask[] = [];
const activeTasks = new Map<string, Task>();
const maxConcurrent = 2;
let activeCount = 0;

// معالجة المهمة
async function processTask(task: QueuedTask): Promise<void> {
  const { id, type, payload, callback, errorCallback } = task;
  
  activeTasks.set(id, {
    id,
    status: 'running',
    progress: 0,
  });
  
  activeCount++;
  
  try {
    let result: unknown;
    
    // إرسال تحديث البدء
    self.postMessage({ type: 'task-started', taskId: id });
    
    switch (type) {
      case 'heavy-computation':
        result = await heavyComputation(payload as { iterations: number }, id);
        break;
      case 'data-analysis':
        result = await dataAnalysis(payload as { data: unknown[] }, id);
        break;
      case 'batch-process':
        result = await batchProcess(payload as { items: unknown[]; operation: string }, id);
        break;
      default:
        throw new Error(`Unknown task type: ${type}`);
    }
    
    activeTasks.set(id, {
      id,
      status: 'completed',
      progress: 100,
      result,
    });
    
    self.postMessage({ type: 'task-completed', taskId: id, result });
    
    if (callback) {
      callback(result);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    activeTasks.set(id, {
      id,
      status: 'failed',
      progress: 0,
      error: errorMessage,
    });
    
    self.postMessage({ type: 'task-failed', taskId: id, error: errorMessage });
    
    if (errorCallback) {
      errorCallback(new Error(errorMessage));
    }
  } finally {
    activeCount--;
    processNextTask();
  }
}

// معالجة المهمة التالية في الطابور
function processNextTask(): void {
  while (activeCount < maxConcurrent && taskQueue.length > 0) {
    // فرز حسب الأولوية
    taskQueue.sort((a, b) => b.priority - a.priority);
    const nextTask = taskQueue.shift();
    
    if (nextTask) {
      processTask(nextTask);
    }
  }
}

// حساب ثقيل
async function heavyComputation(
  payload: { iterations: number },
  taskId: string
): Promise<{ result: number; duration: number }> {
  const startTime = Date.now();
  const { iterations } = payload;
  let result = 0;
  
  const chunkSize = Math.ceil(iterations / 100);
  
  for (let i = 0; i < iterations; i++) {
    result += Math.sqrt(i) * Math.sin(i);
    
    // تحديث التقدم كل chunk
    if (i % chunkSize === 0) {
      const progress = Math.floor((i / iterations) * 100);
      self.postMessage({ type: 'task-progress', taskId, progress });
      
      // السماح للـ event loop بالتنفيذ
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  return {
    result,
    duration: Date.now() - startTime,
  };
}

// تحليل البيانات
async function dataAnalysis(
  payload: { data: unknown[] },
  taskId: string
): Promise<{
  count: number;
  stats: Record<string, { min: number; max: number; avg: number; sum: number }>;
}> {
  const { data } = payload;
  const stats: Record<string, { min: number; max: number; avg: number; sum: number }> = {};
  
  // البحث عن الحقول الرقمية
  if (data.length > 0) {
    const firstItem = data[0] as Record<string, unknown>;
    const numericFields = Object.keys(firstItem).filter(
      key => typeof firstItem[key] === 'number'
    );
    
    const chunkSize = Math.ceil(data.length / 100);
    
    for (let i = 0; i < data.length; i++) {
      const item = data[i] as Record<string, number>;
      
      numericFields.forEach(field => {
        const value = item[field];
        if (typeof value !== 'number') return;
        
        if (!stats[field]) {
          stats[field] = { min: value, max: value, avg: 0, sum: 0 };
        }
        
        stats[field].min = Math.min(stats[field].min, value);
        stats[field].max = Math.max(stats[field].max, value);
        stats[field].sum += value;
      });
      
      if (i % chunkSize === 0) {
        const progress = Math.floor((i / data.length) * 100);
        self.postMessage({ type: 'task-progress', taskId, progress });
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    // حساب المتوسطات
    numericFields.forEach(field => {
      if (stats[field]) {
        stats[field].avg = stats[field].sum / data.length;
      }
    });
  }
  
  return { count: data.length, stats };
}

// معالجة دفعية
async function batchProcess(
  payload: { items: unknown[]; operation: string },
  taskId: string
): Promise<unknown[]> {
  const { items, operation } = payload;
  const results: unknown[] = [];
  const chunkSize = Math.ceil(items.length / 100);
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    // تنفيذ العملية
    let result: unknown;
    switch (operation) {
      case 'double':
        result = typeof item === 'number' ? item * 2 : item;
        break;
      case 'stringify':
        result = JSON.stringify(item);
        break;
      case 'hash':
        result = simpleHash(JSON.stringify(item));
        break;
      default:
        result = item;
    }
    
    results.push(result);
    
    if (i % chunkSize === 0) {
      const progress = Math.floor((i / items.length) * 100);
      self.postMessage({ type: 'task-progress', taskId, progress });
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  return results;
}

// دالة hash بسيطة
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// معالجة الرسائل الواردة
self.onmessage = (event: MessageEvent) => {
  const { type, taskId, payload, priority = 0 } = event.data;
  
  switch (type) {
    case 'add-task':
      taskQueue.push({
        id: taskId,
        type: payload.type,
        payload: payload.data,
        priority,
      });
      
      activeTasks.set(taskId, {
        id: taskId,
        status: 'pending',
        progress: 0,
      });
      
      self.postMessage({ type: 'task-queued', taskId });
      processNextTask();
      break;
      
    case 'cancel-task':
      // حذف من الطابور
      const queueIndex = taskQueue.findIndex(t => t.id === taskId);
      if (queueIndex !== -1) {
        taskQueue.splice(queueIndex, 1);
        activeTasks.set(taskId, {
          id: taskId,
          status: 'cancelled',
          progress: 0,
        });
        self.postMessage({ type: 'task-cancelled', taskId });
      }
      break;
      
    case 'get-status':
      const task = activeTasks.get(taskId);
      self.postMessage({ type: 'task-status', taskId, task });
      break;
      
    case 'get-queue-status':
      self.postMessage({
        type: 'queue-status',
        pending: taskQueue.length,
        active: activeCount,
        total: activeTasks.size,
      });
      break;
  }
};

export {};
