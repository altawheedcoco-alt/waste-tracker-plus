import { useState, useEffect, useMemo, memo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  StickyNote, Search, Loader2, Plus, Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import NoteItem from '@/components/notes/NoteItem';
import AddNoteDialog from '@/components/notes/AddNoteDialog';
import { type Note } from '@/hooks/useNotes';
import { getTabChannelName } from '@/lib/tabSession';
import { cn } from '@/lib/utils';

const resourceTypeLabels: Record<string, string> = {
  shipment: 'شحنة',
  contract: 'عقد',
  invoice: 'فاتورة',
  deposit: 'إيداع',
  receipt: 'إيصال',
  vehicle: 'مركبة',
  driver: 'سائق',
  customer: 'عميل',
  award_letter: 'خطاب ترسية',
  signing_request: 'طلب توقيع',
  conversation: 'محادثة',
  general: 'عام',
};

interface NotesTabProps {
  className?: string;
}

const NotesTab = memo(({ className }: NotesTabProps) => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [tab, setTab] = useState<'all' | 'pinned' | 'unresolved'>('all');
  const [addNoteOpen, setAddNoteOpen] = useState(false);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['all-notes-tab', organization?.id, filterType],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from('notes')
        .select(`
          *,
          author:profiles!notes_author_id_fkey(full_name, avatar_url)
        `)
        .is('parent_note_id', null)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100);

      if (filterType !== 'all') {
        query = query.eq('resource_type', filterType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as Note[]) || [];
    },
    enabled: !!organization?.id,
  });

  // Realtime subscription for notes
  useEffect(() => {
    if (!organization?.id) return;

    const channel = supabase
      .channel(getTabChannelName('all-notes-realtime'))
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notes',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['all-notes-tab', organization?.id, filterType] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [organization?.id, filterType, queryClient]);

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      if (search && !n.content.includes(search)) return false;
      if (tab === 'pinned') return n.is_pinned;
      if (tab === 'unresolved') return !n.is_resolved;
      return true;
    });
  }, [notes, search, tab]);

  const stats = useMemo(() => ({
    total: notes.length,
    pinned: notes.filter((n) => n.is_pinned).length,
    unresolved: notes.filter((n) => !n.is_resolved).length,
  }), [notes]);

  return (
    <div className={cn("flex flex-col h-full", className)} dir="rtl">
      {/* Header */}
      <div className="p-3 border-b border-border bg-card shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <Button size="sm" onClick={() => setAddNoteOpen(true)} className="gap-1">
            <Plus className="w-4 h-4" />
            ملاحظة جديدة
          </Button>
          <div className="flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-sm">الملاحظات</h3>
            <Badge variant="secondary" className="text-xs">{stats.total}</Badge>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <Filter className="w-3 h-3 ml-1" />
              <SelectValue placeholder="نوع المورد" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأنواع</SelectItem>
              {Object.entries(resourceTypeLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث..."
              className="pr-8 h-8 text-xs"
            />
          </div>
        </div>

        {/* Quick Tabs */}
        <div className="flex rounded-lg bg-muted/50 p-0.5">
          {([
            { key: 'all' as const, label: 'الكل', count: stats.total },
            { key: 'pinned' as const, label: 'المثبتة', count: stats.pinned },
            { key: 'unresolved' as const, label: 'غير محلولة', count: stats.unresolved },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-md transition-colors",
                tab === t.key ? "bg-background shadow-sm font-semibold" : "text-muted-foreground"
              )}
            >
              {t.label}
              {t.count > 0 && (
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 rounded-full">{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notes List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <StickyNote className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">لا توجد ملاحظات</p>
            <p className="text-xs mt-1">ابدأ بإضافة ملاحظات من أي مكان في النظام</p>
          </div>
        ) : (
          <div className="space-y-2 p-3">
            {filteredNotes.map((note) => (
              <div key={note.id} className="relative">
                <Badge variant="outline" className="absolute top-2 left-2 text-[10px] z-10">
                  {resourceTypeLabels[note.resource_type] || note.resource_type}
                </Badge>
                <NoteItem
                  note={note}
                  resourceType={note.resource_type}
                  resourceId={note.resource_id}
                />
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Add Note Dialog */}
      <AddNoteDialog
        open={addNoteOpen}
        onOpenChange={setAddNoteOpen}
        resourceType="general"
        resourceId={organization?.id || 'general'}
      />
    </div>
  );
});
NotesTab.displayName = 'NotesTab';

export default NotesTab;
