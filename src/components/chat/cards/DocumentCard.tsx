import { memo } from 'react';
import { FileText, Download, FileSignature, Stamp } from 'lucide-react';
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
  onAction?: (action: string, id: string, data?: any) => void;
}

const DocumentCard = memo(({ data, isOwn, onAction }: DocumentCardProps) => {
  return (
    <div className={cn(
      'rounded-xl border p-3 min-w-[240px] max-w-[300px] space-y-2',
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

      {/* Interactive buttons */}
      <div className="grid grid-cols-3 gap-1">
        {data.file_url && (
          <Button
            size="sm"
            variant={isOwn ? 'secondary' : 'outline'}
            className="h-7 text-[10px] gap-0.5"
            asChild
          >
            <a href={data.file_url} target="_blank" rel="noopener noreferrer">
              <Download className="w-3 h-3" /> حمّل
            </a>
          </Button>
        )}
        {onAction && (
          <>
            <Button
              size="sm"
              variant={isOwn ? 'secondary' : 'outline'}
              className="h-7 text-[10px] gap-0.5"
              onClick={() => onAction('sign_doc', data.id, data)}
            >
              <FileSignature className="w-3 h-3" /> وقّع
            </Button>
            <Button
              size="sm"
              variant={isOwn ? 'secondary' : 'outline'}
              className="h-7 text-[10px] gap-0.5"
              onClick={() => onAction('stamp_doc', data.id, data)}
            >
              <Stamp className="w-3 h-3" /> اختم
            </Button>
          </>
        )}
      </div>
    </div>
  );
});

DocumentCard.displayName = 'DocumentCard';
export default DocumentCard;
