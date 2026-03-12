import { Skeleton } from '@/components/ui/skeleton';

/**
 * مكون تحميل مؤقت موحد للتبويبات — يُستخدم في كافة لوحات التحكم
 */
const TabFallback = () => (
  <div className="space-y-4 mt-6">
    <Skeleton className="h-32 w-full rounded-xl" />
    <Skeleton className="h-48 w-full rounded-xl" />
  </div>
);

export default TabFallback;
