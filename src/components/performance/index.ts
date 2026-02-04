// Virtual Scrolling Components
export { default as VirtualList, type VirtualListRef } from './VirtualList';
export { default as VirtualTable, VirtualTable as VirtualTableComponent } from './VirtualTable';
export { default as VirtualGrid, VirtualGrid as VirtualGridComponent } from './VirtualGrid';

// Prefetching Components
export { default as PrefetchLink } from './PrefetchLink';
export { default as RoutePreloader } from './RoutePreloader';
export { default as DataPreloader, defaultPreloadConfigs } from './DataPreloader';

// Performance Components
export { default as LazyImage } from './LazyImage';
export { default as PerformanceOptimizer } from './PerformanceOptimizer';

// Hooks
export { useVirtualScroll, type VirtualItem } from '@/hooks/useVirtualScroll';
export { usePrefetch, usePredictivePrefetch } from '@/hooks/usePrefetch';
