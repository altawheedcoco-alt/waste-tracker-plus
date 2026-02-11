/**
 * @deprecated Use MobileOptimizations instead
 */
import { memo, ReactNode } from 'react';

const PerformanceOptimizer = memo(({ children }: { children: ReactNode }) => <>{children}</>);
PerformanceOptimizer.displayName = 'PerformanceOptimizer';
export default PerformanceOptimizer;
