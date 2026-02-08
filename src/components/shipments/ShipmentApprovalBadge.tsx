import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Timer,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ShipmentApprovalBadgeProps {
  status: 'pending' | 'approved' | 'rejected' | 'auto_approved' | null | undefined;
  approvalAt?: string | null;
  rejectionReason?: string | null;
  deadline?: string | null;
  type: 'generator' | 'recycler';
  compact?: boolean;
}

export default function ShipmentApprovalBadge({
  status,
  approvalAt,
  rejectionReason,
  deadline,
  type,
  compact = false,
}: ShipmentApprovalBadgeProps) {
  if (!status || status === 'pending') {
    // Check if deadline is set and show pending status
    if (deadline) {
      const isExpired = new Date(deadline) < new Date();
      
      if (isExpired) {
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300 gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {compact ? 'تلقائي' : `موافقة تلقائية (${type === 'generator' ? 'المولد' : 'المدور'})`}
          </Badge>
        );
      }

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                className="bg-amber-100 text-amber-700 border-amber-300 gap-1 cursor-help"
                variant="outline"
              >
                <Clock className="w-3 h-3" />
                {compact ? 'معلق' : `بانتظار موافقة ${type === 'generator' ? 'المولد' : 'المدور'}`}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>الموافقة التلقائية في: {format(new Date(deadline), 'PPp', { locale: ar })}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return null;
  }

  if (status === 'approved') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              className="bg-green-100 text-green-700 border-green-300 gap-1 cursor-help"
              variant="outline"
            >
              <CheckCircle2 className="w-3 h-3" />
              {compact ? 'موافق' : `تمت الموافقة (${type === 'generator' ? 'المولد' : 'المدور'})`}
            </Badge>
          </TooltipTrigger>
          {approvalAt && (
            <TooltipContent>
              <p>تاريخ الموافقة: {format(new Date(approvalAt), 'PPp', { locale: ar })}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (status === 'auto_approved') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              className="bg-blue-100 text-blue-700 border-blue-300 gap-1 cursor-help"
              variant="outline"
            >
              <Timer className="w-3 h-3" />
              {compact ? 'تلقائي' : `موافقة تلقائية (${type === 'generator' ? 'المولد' : 'المدور'})`}
            </Badge>
          </TooltipTrigger>
          {approvalAt && (
            <TooltipContent>
              <p>تمت الموافقة تلقائياً بعد انقضاء 6 ساعات</p>
              <p>التاريخ: {format(new Date(approvalAt), 'PPp', { locale: ar })}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (status === 'rejected') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              className="bg-red-100 text-red-700 border-red-300 gap-1 cursor-help"
              variant="outline"
            >
              <XCircle className="w-3 h-3" />
              {compact ? 'مرفوض' : `مرفوض (${type === 'generator' ? 'المولد' : 'المدور'})`}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            {rejectionReason && (
              <div>
                <p className="font-semibold mb-1">سبب الرفض:</p>
                <p className="text-sm">{rejectionReason}</p>
              </div>
            )}
            {approvalAt && (
              <p className="text-xs mt-2 text-muted-foreground">
                {format(new Date(approvalAt), 'PPp', { locale: ar })}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return null;
}
