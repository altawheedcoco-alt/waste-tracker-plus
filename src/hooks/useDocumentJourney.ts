import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface JourneyEvent {
  id: string;
  document_id: string;
  document_type: string;
  event_type: string;
  event_title: string;
  event_description: string | null;
  actor_user_id: string | null;
  actor_org_id: string | null;
  actor_name: string | null;
  metadata: any;
  created_at: string;
}

const eventTypeIcons: Record<string, string> = {
  created: '📄',
  sent: '📤',
  viewed: '👁',
  signed: '✍️',
  stamped: '🔏',
  rejected: '❌',
  chain_created: '🔗',
  step_signed: '✅',
  approved: '👍',
  archived: '🗄',
  shared: '🔗',
  downloaded: '⬇️',
  printed: '🖨',
};

export function useDocumentJourney(documentId: string, documentType?: string) {
  return useQuery({
    queryKey: ['document-journey', documentId],
    queryFn: async () => {
      const query = supabase
        .from('document_journey_events')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: true });

      if (documentType) query.eq('document_type', documentType);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as JourneyEvent[];
    },
    enabled: !!documentId,
  });
}

export function getEventIcon(eventType: string): string {
  return eventTypeIcons[eventType] || '📌';
}

/** Log a journey event from the frontend */
export async function logJourneyEvent(params: {
  documentId: string;
  documentType: string;
  eventType: string;
  eventTitle: string;
  eventDescription?: string;
  actorUserId?: string;
  actorOrgId?: string;
  actorName?: string;
  metadata?: any;
}) {
  const { error } = await supabase.from('document_journey_events').insert({
    document_id: params.documentId,
    document_type: params.documentType,
    event_type: params.eventType,
    event_title: params.eventTitle,
    event_description: params.eventDescription || null,
    actor_user_id: params.actorUserId || null,
    actor_org_id: params.actorOrgId || null,
    actor_name: params.actorName || null,
    metadata: params.metadata || {},
  });
  if (error) console.warn('Journey event log failed:', error);
}
