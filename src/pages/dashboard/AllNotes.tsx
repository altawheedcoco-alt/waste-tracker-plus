import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  StickyNote, Search, Filter, MessageSquare, Send, 
  AlertTriangle, ThumbsUp, ThumbsDown, HelpCircle, CheckCircle2,
  Lock, Users, Globe, Loader2, Pin
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import NoteItem from '@/components/notes/NoteItem';
import AddNoteDialog from '@/components/notes/AddNoteDialog';
import { type Note } from '@/hooks/useNotes';

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
  general: 'عام',
};

const AllNotesPage = () => {
  const { profile, organization } = useAuth();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterVisibility, setFilterVisibility] = useState<string>('all');
  const [tab, setTab] = useState('all');

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['all-notes', organization?.id, filterType, filterVisibility],
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
      if (filterVisibility !== 'all') {
        query = query.eq('visibility', filterVisibility);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as Note[]) || [];
    },
    enabled: !!organization?.id,
  });

  const filteredNotes = notes.filter((n) => {
    if (search && !n.content.includes(search)) return false;
    if (tab === 'pinned') return n.is_pinned;
    if (tab === 'unresolved') return !n.is_resolved;
    if (tab === 'partner') return n.visibility === 'partner' || n.visibility === 'public';
    return true;
  });

  const stats = {
    total: notes.length,
    pinned: notes.filter((n) => n.is_pinned).length,
    partner: notes.filter((n) => n.visibility !== 'internal').length,
    unresolved: notes.filter((n) => !n.is_resolved).length,
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div />
          <div className="text-right">
            <h1 className="text-2xl font-bold flex items-center gap-2 justify-end">
              <StickyNote className="h-7 w-7 text-primary" />
              مركز الملاحظات
            </h1>
            <p className="text-muted-foreground">إدارة جميع الملاحظات والتعليقات عبر النظام</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setTab('all')}>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{stats.total}</p>
              <p className="text-sm text-muted-foreground">إجمالي الملاحظات</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setTab('pinned')}>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-amber-600">{stats.pinned}</p>
              <p className="text-sm text-muted-foreground">مثبتة</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setTab('partner')}>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.partner}</p>
              <p className="text-sm text-muted-foreground">مشتركة مع الجهات المرتبطة</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setTab('unresolved')}>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{stats.unresolved}</p>
              <p className="text-sm text-muted-foreground">غير محلولة</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في الملاحظات..."
              className="pr-9 text-right"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="نوع المورد" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأنواع</SelectItem>
              {Object.entries(resourceTypeLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterVisibility} onValueChange={setFilterVisibility}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="مستوى الرؤية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="internal">داخلي</SelectItem>
              <SelectItem value="partner">مشترك</SelectItem>
              <SelectItem value="public">عام</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-lg mr-auto">
            <TabsTrigger value="all">الكل</TabsTrigger>
            <TabsTrigger value="pinned">المثبتة</TabsTrigger>
            <TabsTrigger value="partner">المشتركة</TabsTrigger>
            <TabsTrigger value="unresolved">غير محلولة</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Notes List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <StickyNote className="h-16 w-16 mx-auto mb-3 opacity-20" />
            <p className="text-lg">لا توجد ملاحظات</p>
            <p className="text-sm">ابدأ بإضافة ملاحظات من أي مكان في النظام</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotes.map((note) => (
              <div key={note.id} className="relative">
                <Badge variant="outline" className="absolute top-2 left-2 text-xs z-10">
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
      </div>
    </DashboardLayout>
  );
};

export default AllNotesPage;
