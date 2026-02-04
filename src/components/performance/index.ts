// Virtual Scrolling Components
export { default as VirtualList, type VirtualListRef } from './VirtualList';
export { default as VirtualTable, VirtualTable as VirtualTableComponent } from './VirtualTable';
export { default as VirtualGrid, VirtualGrid as VirtualGridComponent } from './VirtualGrid';

// Prefetching Components
export { default as PrefetchLink } from './PrefetchLink';
export { default as RoutePreloader } from './RoutePreloader';
export { default as DataPreloader, defaultPreloadConfigs } from './DataPreloader';

// Optimized Components
export {
  OptimizedList,
  OptimizedGrid,
  ConditionalRender,
  StableChildren,
  ExpensiveComponent,
} from './OptimizedComponents';

// Performance Components
export { default as LazyImage } from './LazyImage';
export { default as PerformanceOptimizer } from './PerformanceOptimizer';

// Hooks
export { useVirtualScroll, type VirtualItem } from '@/hooks/useVirtualScroll';
export { usePrefetch, usePredictivePrefetch } from '@/hooks/usePrefetch';
export {
  useDeepMemo,
  useDeepCallback,
  usePrevious,
  useHasChanged,
  useStableCallback,
  useDebouncedValue,
  useStableObject,
  useStableArray,
  useMemoizedMap,
  useBatchedUpdates,
} from '@/hooks/useMemoization';

// Web Workers Hooks
export { useWebWorker } from '@/hooks/useWebWorker';
export { useDataProcessor } from '@/hooks/useDataProcessor';
export { useTaskQueue } from '@/hooks/useTaskQueue';

// Memo Utilities
export {
  deepEqual,
  shallowEqual,
  propsAreEqualIgnoringFunctions,
  createPropsComparator,
  withMemo,
  withMemoIgnoringFunctions,
  withMemoIgnoring,
  useRenderCount,
  useWhyDidYouUpdate,
} from '@/lib/memoUtils';
