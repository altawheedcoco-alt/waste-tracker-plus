import { memo } from 'react';
import { FileText, Download, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DocumentCardProps {
  data: {
    id: string;
    document_name?: string;
    document_type?: string;
    file_url?: string;
    status?: string;
  };
  isOwn: boolean;
}

const DocumentCard = memo(({ data, isOwn }: DocumentCardProps) => {
  return (
    <div className={cn(
      'rounded-xl border p-3 min-w-[220px] max-w-[280px] space-y-2',
      isOwn ? 'bg-white/10 border-white/20' : 'bg-muted/50 border-border'
    )}>
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-[10px] py-0 bg-violet-500/10 text-violet-600 border-violet-500/20">
          {data.document_type || 'مستند'}
        </Badge>
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', isOwn ? 'bg-white/15' : 'bg-violet-500/10')}>
          <FileText className={cn('w-4 h-4', isOwn ? 'text-white' : 'text-violet-600')} />
        </div>
      </div>
      <p className={cn('text-xs font-bold truncate', isOwn ? 'text-white' : 'text-foreground')}>
        {data.document_name || 'مستند'}
      </p>
      <div className="flex gap-1.5">
        {data.file_url && (
          <Button
            size="sm"
            variant={isOwn ? 'secondary' : 'outline'}
            className="flex-1 h-7 text-[11px] gap-1"
            asChild
          >
            <a href={data.file_url} target="_blank" rel="noopener noreferrer">
              <Download className="w-3 h-3" /> تحميل
            </a>
          </Button>
        )}
        <Button
          size="sm"
          variant={isOwn ? 'secondary' : 'outline'}
          className="flex-1 h-7 text-[11px] gap-1"
          asChild
        >
          <a href={data.file_url || '#'} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-3 h-3" /> معاينة
          </a>
        </Button>
      </div>
    </div>
  );
});

DocumentCard.displayName = 'DocumentCard';
export default DocumentCard;
