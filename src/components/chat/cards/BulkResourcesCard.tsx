import { memo } from 'react';
import { Layers, FileSignature } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface BulkResourcesCardProps {
  data: {
    items?: { type: string; data: any }[];
    count?: number;
    label?: string;
  };
  isOwn: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  shipment: 'شحنة', invoice: 'فاتورة', contract: 'عقد',
  award_letter: 'خطاب ترسية', work_order: 'أمر عمل',
  document: 'مستند', signing_request: 'توقيع',
};

const BulkResourcesCard = memo(({ data, isOwn }: BulkResourcesCardProps) => {
  const navigate = useNavigate();
  const items = data.items || [];
  const typeCounts: Record<string, number> = {};
  items.forEach(i => { typeCounts[i.type] = (typeCounts[i.type] || 0) + 1; });

  return (
    <div className={cn(
      'rounded-xl border p-3 min-w-[220px] max-w-[280px] space-y-2',
      isOwn ? 'bg-white/10 border-white/20' : 'bg-muted/50 border-border'
    )}>
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-[10px] py-0 bg-primary/10 text-primary border-primary/20">
          {data.count || items.length} ملف
        </Badge>
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', isOwn ? 'bg-white/15' : 'bg-primary/10')}>
          <Layers className={cn('w-4 h-4', isOwn ? 'text-white' : 'text-primary')} />
        </div>
      </div>
      <p className={cn('text-xs font-bold', isOwn ? 'text-white' : 'text-foreground')}>
        {data.label || `${items.length} ملفات مجمعة`}
      </p>
      <div className="flex flex-wrap gap-1">
        {Object.entries(typeCounts).map(([type, count]) => (
          <Badge key={type} variant="secondary" className="text-[9px] py-0">
            {count} {TYPE_LABELS[type] || type}
          </Badge>
        ))}
      </div>
      <Button
        size="sm"
        variant={isOwn ? 'secondary' : 'outline'}
        className="w-full h-7 text-[11px] gap-1"
        onClick={() => navigate('/dashboard/bulk-signing')}
      >
        <FileSignature className="w-3 h-3" /> توقيع جماعي
      </Button>
    </div>
  );
});

BulkResourcesCard.displayName = 'BulkResourcesCard';
export default BulkResourcesCard;
