/**
 * Worker للعمليات الحسابية الثقيلة
 */

// أنواع الرسائل
interface WorkerMessage {
  type: string;
  payload: unknown;
  id: string;
}

interface SortPayload {
  data: unknown[];
  key?: string;
  order?: 'asc' | 'desc';
}

interface FilterPayload {
  data: unknown[];
  predicate: string; // دالة كنص
}

interface SearchPayload {
  data: unknown[];
  query: string;
  keys: string[];
  fuzzy?: boolean;
}

interface AggregatePayload {
  data: unknown[];
  operations: {
    field: string;
    operation: 'sum' | 'avg' | 'min' | 'max' | 'count';
  }[];
  groupBy?: string;
}

interface TransformPayload {
  data: unknown[];
  transformer: string; // دالة كنص
}

// دالة الفرز
function sortData({ data, key, order = 'asc' }: SortPayload): unknown[] {
  const sorted = [...data].sort((a, b) => {
    const aVal = key ? (a as Record<string, unknown>)[key] : a;
    const bVal = key ? (b as Record<string, unknown>)[key] : b;
    
    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    
    const comparison = aVal < bVal ? -1 : 1;
    return order === 'asc' ? comparison : -comparison;
  });
  
  return sorted;
}

// دالة البحث
function searchData({ data, query, keys, fuzzy = false }: SearchPayload): unknown[] {
  const normalizedQuery = query.toLowerCase().trim();
  
  if (!normalizedQuery) return data;
  
  return data.filter(item => {
    return keys.some(key => {
      const value = (item as Record<string, unknown>)[key];
      if (value === null || value === undefined) return false;
      
      const stringValue = String(value).toLowerCase();
      
      if (fuzzy) {
        // بحث ضبابي بسيط
        return fuzzyMatch(stringValue, normalizedQuery);
      }
      
      return stringValue.includes(normalizedQuery);
    });
  });
}

// مطابقة ضبابية
function fuzzyMatch(str: string, pattern: string): boolean {
  let patternIdx = 0;
  let strIdx = 0;
  
  while (patternIdx < pattern.length && strIdx < str.length) {
    if (pattern[patternIdx] === str[strIdx]) {
      patternIdx++;
    }
    strIdx++;
  }
  
  return patternIdx === pattern.length;
}

// دالة التجميع
function aggregateData({ data, operations, groupBy }: AggregatePayload): unknown {
  if (groupBy) {
    // تجميع حسب الحقل
    const groups = new Map<string, unknown[]>();
    
    data.forEach(item => {
      const key = String((item as Record<string, unknown>)[groupBy] ?? 'undefined');
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });
    
    const result: Record<string, Record<string, number>> = {};
    
    groups.forEach((items, key) => {
      result[key] = {};
      operations.forEach(op => {
        result[key][`${op.operation}_${op.field}`] = calculateAggregate(items, op.field, op.operation);
      });
    });
    
    return result;
  }
  
  // تجميع عام
  const result: Record<string, number> = {};
  operations.forEach(op => {
    result[`${op.operation}_${op.field}`] = calculateAggregate(data, op.field, op.operation);
  });
  
  return result;
}

function calculateAggregate(
  data: unknown[],
  field: string,
  operation: 'sum' | 'avg' | 'min' | 'max' | 'count'
): number {
  const values = data
    .map(item => (item as Record<string, unknown>)[field])
    .filter(v => typeof v === 'number') as number[];
  
  switch (operation) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'avg':
      return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    case 'min':
      return values.length > 0 ? Math.min(...values) : 0;
    case 'max':
      return values.length > 0 ? Math.max(...values) : 0;
    case 'count':
      return values.length;
    default:
      return 0;
  }
}

// Safe predefined transformers (no arbitrary code execution)
const SAFE_TRANSFORMERS: Record<string, (item: Record<string, unknown>, index: number) => unknown> = {
  identity: (item) => item,
  pick_keys: (item) => item, // caller should pre-filter
  stringify: (item) => JSON.stringify(item),
  index_add: (item, index) => ({ ...item, _index: index }),
};

const SAFE_PREDICATES: Record<string, (item: Record<string, unknown>) => boolean> = {
  truthy: (item) => !!item,
  has_id: (item) => !!item.id,
  is_active: (item) => item.is_active === true || item.status === 'active',
  not_null: (item) => item !== null && item !== undefined,
};

// دالة التحويل - آمنة بدون تنفيذ كود عشوائي
function transformData({ data, transformer }: TransformPayload): unknown[] {
  const fn = SAFE_TRANSFORMERS[transformer];
  if (!fn) {
    console.warn('Unknown transformer:', transformer, '- returning data as-is');
    return data;
  }
  return data.map((item, index) => fn(item as Record<string, unknown>, index));
}

// دالة الفلترة - آمنة بدون تنفيذ كود عشوائي
function filterData({ data, predicate }: FilterPayload): unknown[] {
  const fn = SAFE_PREDICATES[predicate];
  if (!fn) {
    console.warn('Unknown predicate:', predicate, '- returning all data');
    return data;
  }
  return data.filter((item) => fn(item as Record<string, unknown>));
}

// معالجة الرسائل
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, payload, id } = event.data;
  
  let result: unknown;
  let error: string | null = null;
  
  try {
    switch (type) {
      case 'sort':
        result = sortData(payload as SortPayload);
        break;
      case 'search':
        result = searchData(payload as SearchPayload);
        break;
      case 'aggregate':
        result = aggregateData(payload as AggregatePayload);
        break;
      case 'transform':
        result = transformData(payload as TransformPayload);
        break;
      case 'filter':
        result = filterData(payload as FilterPayload);
        break;
      default:
        error = `Unknown operation: ${type}`;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unknown error';
  }
  
  self.postMessage({ id, result, error });
};

export {};
