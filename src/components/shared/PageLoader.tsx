import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  message?: string;
}

/**
 * Unified full-page loading spinner — consistent across all pages.
 */
const PageLoader = ({ message }: PageLoaderProps) => (
  <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
    <div className="text-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-3" />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  </div>
);

export default PageLoader;
