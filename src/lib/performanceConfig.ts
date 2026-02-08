import { QueryClient } from '@tanstack/react-query';

/**
 * Optimized Query Client Configuration
 * تكوين محسّن للـ Query Client لأداء أفضل
 */
export const createOptimizedQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 10 minutes
      staleTime: 10 * 60 * 1000,
      // Keep unused data in cache for 30 minutes
      gcTime: 30 * 60 * 1000,
      // Retry failed requests only once
      retry: 1,
      // Don't refetch on window focus by default
      refetchOnWindowFocus: false,
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
      // Batch network requests
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
});

/**
 * Image optimization settings
 */
export const imageOptimization = {
  // Use lazy loading for images
  loading: 'lazy' as const,
  // Use intersection observer for deferred loading
  threshold: 0.1,
  // Placeholder blur
  placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PC9zdmc+',
};

/**
 * PDF Export optimized settings
 */
export const pdfOptimization = {
  // Lower scale for faster generation
  scale: 1.5,
  // Use JPEG for smaller file size
  imageType: 'JPEG' as const,
  imageQuality: 0.85,
  // Don't log to console
  logging: false,
};

/**
 * Prefetch priorities
 */
export const prefetchPriorities = {
  critical: ['dashboard', 'shipments'],
  high: ['partners', 'reports'],
  low: ['settings', 'contracts'],
};
