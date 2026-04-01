import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LinkPreviewProps {
  url: string;
  className?: string;
}

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

export function extractUrls(text: string): string[] {
  return text.match(URL_REGEX) || [];
}

const LinkPreview = memo(({ url, className }: LinkPreviewProps) => {
  const [meta, setMeta] = useState<{ title?: string; description?: string; image?: string; domain?: string } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    try {
      const parsed = new URL(url);
      const domain = parsed.hostname.replace('www.', '');
      
      // Set basic info immediately
      if (!cancelled) {
        setMeta({ domain, title: domain });
      }
    } catch {
      setError(true);
    }
    return () => { cancelled = true; };
  }, [url]);

  if (error || !meta) return null;

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-2.5 mt-1.5 p-2 rounded-lg border border-border/50 bg-background/30 hover:bg-background/50 transition-colors no-underline cursor-pointer",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
        <Globe className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate text-foreground">{meta.domain}</p>
        <p className="text-[10px] text-muted-foreground truncate">{url}</p>
      </div>
      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
    </motion.a>
  );
});

LinkPreview.displayName = 'LinkPreview';
export default LinkPreview;
