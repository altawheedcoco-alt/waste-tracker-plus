import { useState, useEffect, useMemo, memo } from 'react';
import { StickyNote, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MentionRendererNote from '@/components/notes/MentionRenderer';

interface ConversationNote {
  id: string;
  content: string;
  created_at: string;
  author_name?: string;
}

const ChatNotesPanel = memo(({ 
  conversationId,
  organizationId,
  targetOrganizationId,
}: {
  conversationId: string;
  organizationId?: string;
  targetOrganizationId?: string | null;
}) => {
  const [noteText, setNoteText] = useState('');
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: convoNotes = [], isLoading: loadingConvo } = useQuery({
    queryKey: ['conversation-notes', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select(`id, content, created_at, author:profiles!notes_author_id_fkey(full_name)`)
        .eq('resource_type', 'conversation')
        .eq('resource_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []).map((note: any) => ({
        id: note.id, content: note.content, created_at: note.created_at,
        author_name: note.author?.full_name || 'مجهول', source: 'conversation' as const,
      })) as (ConversationNote & { source: string })[];
    },
    enabled: !!conversationId,
    refetchInterval: 5000,
  });

  const { data: shipmentNotes = [], isLoading: loadingShipment } = useQuery({
    queryKey: ['shared-shipment-notes', organizationId, targetOrganizationId],
    queryFn: async () => {
      if (!organizationId || !targetOrganizationId) return [];
      const { data: shipments } = await supabase
        .from('shipments')
        .select('id, shipment_number')
        .or(
          `and(generator_id.eq.${organizationId},transporter_id.eq.${targetOrganizationId}),` +
          `and(generator_id.eq.${organizationId},recycler_id.eq.${targetOrganizationId}),` +
          `and(transporter_id.eq.${organizationId},generator_id.eq.${targetOrganizationId}),` +
          `and(transporter_id.eq.${organizationId},recycler_id.eq.${targetOrganizationId}),` +
          `and(recycler_id.eq.${organizationId},generator_id.eq.${targetOrganizationId}),` +
          `and(recycler_id.eq.${organizationId},transporter_id.eq.${targetOrganizationId})`
        )
        .order('created_at', { ascending: false })
        .limit(20);
      if (!shipments?.length) return [];
      const shipmentIds = shipments.map(s => s.id);
      const shipmentMap = new Map(shipments.map(s => [s.id, s.shipment_number]));
      const { data: notes } = await supabase
        .from('notes')
        .select(`id, content, created_at, resource_id, author:profiles!notes_author_id_fkey(full_name)`)
        .eq('resource_type', 'shipment')
        .in('resource_id', shipmentIds)
        .order('created_at', { ascending: false })
        .limit(30);
      return (notes || []).map((note: any) => ({
        id: note.id, content: note.content, created_at: note.created_at,
        author_name: note.author?.full_name || 'مجهول', source: 'shipment',
        shipment_number: shipmentMap.get(note.resource_id) || '',
      }));
    },
    enabled: !!organizationId && !!targetOrganizationId,
    refetchInterval: 10000,
  });

  const notes = useMemo(() => {
    return [
      ...convoNotes.map(n => ({ ...n, source: 'conversation' })),
      ...shipmentNotes,
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [convoNotes, shipmentNotes]);

  const isLoading = loadingConvo || loadingShipment;

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`conversation-notes-${conversationId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `resource_id=eq.${conversationId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['conversation-notes', conversationId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, queryClient]);

  const addNote = useMutation({
    mutationFn: async (content: string) => {
      if (!profile?.id || !organizationId) throw new Error('Missing profile or org');
      const { error } = await supabase.from('notes').insert({
        resource_type: 'conversation', resource_id: conversationId, content,
        author_id: profile.id, organization_id: organizationId,
        target_organization_id: targetOrganizationId || null,
        visibility: targetOrganizationId ? 'partner' : 'internal',
        note_type: 'comment', priority: 'normal',
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-notes', conversationId] });
      setNoteText('');
      toast.success('تم إضافة الملاحظة');
    },
  });

  return (
    <div className="flex flex-col h-full border-s border-border bg-card">
      <div className="p-3 border-b border-border flex items-center gap-2">
        <StickyNote className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-semibold">الملاحظات</span>
        <Badge variant="outline" className="text-[10px]">{notes.length}</Badge>
      </div>
      
      <ScrollArea className="flex-1 p-3">
        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="animate-spin text-muted-foreground" size={20} /></div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">لا توجد ملاحظات</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notes.map((note: any) => (
              <div key={note.id} className={cn(
                'p-2.5 rounded-lg border',
                note.source === 'shipment'
                  ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200/30 dark:border-blue-800/30'
                  : 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/30 dark:border-amber-800/30'
              )}>
                {note.source === 'shipment' && note.shipment_number && (
                  <Badge variant="outline" className="text-[9px] mb-1 text-blue-600 border-blue-300">
                    شحنة #{note.shipment_number}
                  </Badge>
                )}
                <p className="text-sm whitespace-pre-wrap"><MentionRendererNote content={note.content} /></p>
                <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground">
                  <span>{note.author_name}</span>
                  <span>{format(new Date(note.created_at), 'dd/MM HH:mm')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-2 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="إضافة ملاحظة..."
            className="text-sm h-9"
            onKeyDown={e => { if (e.key === 'Enter' && noteText.trim()) addNote.mutate(noteText.trim()); }}
          />
          <Button
            size="sm"
            onClick={() => noteText.trim() && addNote.mutate(noteText.trim())}
            disabled={!noteText.trim() || addNote.isPending}
            className="h-9 px-3"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});
ChatNotesPanel.displayName = 'ChatNotesPanel';

export default ChatNotesPanel;
