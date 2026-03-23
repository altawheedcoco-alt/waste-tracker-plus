import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Plus, Pencil, Trash2, FileText, Eye, EyeOff,
  Star, Clock, CalendarClock, Image
} from 'lucide-react';

interface PostItem {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  category: string;
  author_name: string;
  badge: string | null;
  tags: string[] | null;
  is_published: boolean;
  is_featured: boolean;
  published_at: string | null;
  sort_order: number;
  views_count: number;
  created_at: string;
}

const CATEGORIES = ['عام', 'تحديثات', 'بيئة', 'تقنية', 'شراكات', 'إنجازات', 'نصائح', 'قوانين'];

type PublishMode = 'draft' | 'now' | 'scheduled';

const emptyForm = {
  title: '',
  excerpt: '',
  content: '',
  cover_image_url: '',
  category: 'عام',
  author_name: 'فريق المنصة',
  badge: 'جديد',
  is_featured: false,
  sort_order: 0,
  publishMode: 'draft' as PublishMode,
  scheduledDate: '',
};

const AdminPlatformPosts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['admin-platform-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_posts' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as PostItem[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (item: typeof form) => {
      const now = new Date().toISOString();
      let is_published = false;
      let published_at: string | null = null;

      if (item.publishMode === 'now') {
        is_published = true;
        published_at = now;
      } else if (item.publishMode === 'scheduled' && item.scheduledDate) {
        published_at = new Date(item.scheduledDate).toISOString();
      }

      const payload = {
        title: item.title,
        excerpt: item.excerpt || null,
        content: item.content,
        cover_image_url: item.cover_image_url || null,
        category: item.category,
        author_name: item.author_name,
        badge: item.badge || null,
        is_featured: item.is_featured,
        sort_order: item.sort_order,
        is_published,
        published_at,
      };

      if (editingId) {
        const { error } = await supabase
          .from('platform_posts' as any)
          .update(payload as any)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('platform_posts' as any)
          .insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-platform-posts'] });
      queryClient.invalidateQueries({ queryKey: ['platform-posts-public'] });
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      toast({ title: 'تم الحفظ بنجاح' });
    },
    onError: (err: any) => {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('platform_posts' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-platform-posts'] });
      toast({ title: 'تم الحذف' });
    },
  });

  const togglePublish = async (item: PostItem) => {
    await supabase
      .from('platform_posts' as any)
      .update({ is_published: !item.is_published, published_at: !item.is_published ? new Date().toISOString() : null } as any)
      .eq('id', item.id);
    queryClient.invalidateQueries({ queryKey: ['admin-platform-posts'] });
    queryClient.invalidateQueries({ queryKey: ['platform-posts-public'] });
  };

  const openEdit = (item: PostItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      excerpt: item.excerpt || '',
      content: item.content,
      cover_image_url: item.cover_image_url || '',
      category: item.category,
      author_name: item.author_name,
      badge: item.badge || '',
      is_featured: item.is_featured,
      sort_order: item.sort_order,
      publishMode: item.is_published ? 'now' : 'draft',
      scheduledDate: '',
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    setForm({ ...emptyForm, sort_order: posts.length + 1 });
    setDialogOpen(true);
  };

  const publishedCount = posts.filter(p => p.is_published).length;

  return (
    <div className="space-y-4" dir="rtl">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button onClick={openNew} className="gap-2">
              <Plus className="w-4 h-4" />
              منشور جديد
            </Button>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-primary" />
              إدارة منشورات المنصة
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 justify-end text-sm">
            <span className="flex items-center gap-1">
              <Badge variant="outline" className="bg-primary/10">{posts.length}</Badge>
              إجمالي
            </span>
            <span className="flex items-center gap-1">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">{publishedCount}</Badge>
              منشور
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {posts.map((item) => (
          <Card key={item.id} className={`transition-all ${!item.is_published ? 'opacity-60 border-dashed' : ''}`}>
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-3">
                {item.cover_image_url ? (
                  <img src={item.cover_image_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Image className="w-5 h-5 text-primary/50" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-sm truncate">{item.title}</h3>
                    {item.is_featured && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{item.excerpt || item.content.slice(0, 80)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px]">{item.category}</Badge>
                    <Badge variant={item.is_published ? 'default' : 'outline'} className="text-[10px]">
                      {item.is_published ? 'منشور' : 'مسودة'}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">👁 {item.views_count}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => togglePublish(item)}>
                    {item.is_published ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(item.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {posts.length === 0 && !isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد منشورات بعد</p>
              <Button onClick={openNew} variant="outline" className="mt-3 gap-2">
                <Plus className="w-4 h-4" />
                أضف أول منشور
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'تعديل المنشور' : 'منشور جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>العنوان *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>المقتطف</Label>
              <Input value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} placeholder="ملخص قصير يظهر في البطاقة..." />
            </div>
            <div className="space-y-2">
              <Label>المحتوى *</Label>
              <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={6} />
            </div>
            <div className="space-y-2">
              <Label>رابط صورة الغلاف</Label>
              <Input value={form.cover_image_url} onChange={e => setForm(f => ({ ...f, cover_image_url: e.target.value }))} dir="ltr" placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>التصنيف</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>اسم الكاتب</Label>
                <Input value={form.author_name} onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الشارة</Label>
              <Input value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} placeholder="جديد، مهم..." />
            </div>

            {/* وضع النشر */}
            <div className="space-y-3 p-3 rounded-lg border border-border bg-muted/30">
              <Label className="flex items-center gap-2 text-sm font-bold">
                <CalendarClock className="w-4 h-4 text-primary" />
                وضع النشر
              </Label>
              <div className="flex gap-2 flex-wrap">
                {([
                  { value: 'draft' as PublishMode, label: 'مسودة', icon: '📝' },
                  { value: 'now' as PublishMode, label: 'نشر فوري', icon: '🚀' },
                  { value: 'scheduled' as PublishMode, label: 'جدولة', icon: '⏰' },
                ]).map(opt => (
                  <Button
                    key={opt.value}
                    type="button"
                    variant={form.publishMode === opt.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setForm(f => ({ ...f, publishMode: opt.value }))}
                    className="gap-1.5"
                  >
                    <span>{opt.icon}</span>
                    {opt.label}
                  </Button>
                ))}
              </div>
              {form.publishMode === 'scheduled' && (
                <div className="space-y-2 mt-2">
                  <Label className="text-xs">تاريخ ووقت النشر</Label>
                  <Input
                    type="datetime-local"
                    value={form.scheduledDate}
                    onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))}
                    dir="ltr"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Switch checked={form.is_featured} onCheckedChange={v => setForm(f => ({ ...f, is_featured: v }))} />
              <Label>منشور مميز</Label>
            </div>

            <Button
              className="w-full"
              onClick={() => saveMutation.mutate(form)}
              disabled={!form.title.trim() || !form.content.trim() || saveMutation.isPending}
            >
              {saveMutation.isPending ? 'جاري الحفظ...' : editingId ? 'تحديث' : 'إضافة'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPlatformPosts;
