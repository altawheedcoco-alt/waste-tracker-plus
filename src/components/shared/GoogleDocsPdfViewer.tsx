/**
 * Google Docs PDF Viewer — عارض PDF موحد يعمل على الموبايل والديسكتوب
 * يستخدم Google Docs Viewer لعرض ملفات PDF مباشرة داخل أي مكان
 */
import { memo } from 'react';
import { ExternalLink, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoogleDocsPdfViewerProps {
  url: string;
  title?: string;
  height?: string;
  className?: string;
  showFooter?: boolean;
}

const GoogleDocsPdfViewer = memo(({ url, title = 'PDF', height = '500px', className, showFooter = true }: GoogleDocsPdfViewerProps) => {
  const googleViewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;

  return (
    <div className={cn('rounded-xl border border-border/50 overflow-hidden', className)}>
      <iframe
        src={googleViewerUrl}
        className="w-full border-0"
        style={{ height }}
        title={title}
        allow="autoplay"
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
      {showFooter && (
        <div className="flex items-center justify-between p-2 bg-muted/20 border-t border-border/30">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            فتح في نافذة جديدة
          </a>
          <a
            href={url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download className="w-3 h-3" />
            تحميل
          </a>
        </div>
      )}
    </div>
  );
});

GoogleDocsPdfViewer.displayName = 'GoogleDocsPdfViewer';
export default GoogleDocsPdfViewer;
