import { useDocumentJourney, getEventIcon } from '@/hooks/useDocumentJourney';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Loader2, Clock, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  documentId: string;
  documentType?: string;
  compact?: boolean;
}

export default function DocumentJourneyTimeline({ documentId, documentType, compact }: Props) {
  const { data: events, isLoading } = useDocumentJourney(documentId, documentType);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!events?.length) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-30" />
        لا توجد أحداث مسجلة بعد
      </div>
    );
  }

  return (
    <div className={cn('relative', compact ? 'space-y-2' : 'space-y-4')} dir="rtl">
      {/* Timeline line */}
      <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-border" />

      {events.map((event, i) => (
        <div key={event.id} className="relative flex items-start gap-3 pr-10">
          {/* Dot */}
          <div className={cn(
            'absolute right-2.5 w-3 h-3 rounded-full border-2 z-10',
            event.event_type === 'signed' || event.event_type === 'step_signed'
              ? 'bg-emerald-500 border-emerald-300'
              : event.event_type === 'rejected'
              ? 'bg-destructive border-red-300'
              : event.event_type === 'chain_created'
              ? 'bg-primary border-primary/30'
              : 'bg-muted-foreground/30 border-background'
          )} style={{ top: compact ? 6 : 8 }} />

          <div className={cn(
            'flex-1 rounded-lg border p-2.5',
            compact ? 'text-xs' : 'text-sm'
          )}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">
                {getEventIcon(event.event_type)} {event.event_title}
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(event.created_at), 'dd MMM yyyy - hh:mm a', { locale: ar })}
              </span>
            </div>
            {event.event_description && (
              <p className="text-muted-foreground mt-1">{event.event_description}</p>
            )}
            {event.actor_name && (
              <p className="text-muted-foreground/70 mt-0.5 text-[10px]">
                بواسطة: {event.actor_name}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
