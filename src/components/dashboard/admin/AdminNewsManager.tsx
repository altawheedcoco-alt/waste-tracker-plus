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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Plus, Pencil, Trash2, Newspaper, Eye, EyeOff,
  ArrowUp, ArrowDown, Star, Calendar, GripVertical
} from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  category: string;
  badge: string;
  icon_name: string;
  color_gradient: string;
  link: string;
  is_published: boolean;
  is_featured: boolean;
  published_at: string | null;
  sort_order: number;
  created_at: string;
}

const GRADIENT_OPTIONS = [
  { value: 'from-blue-500 to-cyan-500', label: 'أزرق' },
  { value: 'from-emerald-500 to-green-500', label: 'أخضر' },
  { value: 'from-amber-500 to-orange-500', label: 'برتقالي' },
  { value: 'from-purple-500 to-violet-500', label: 'بنفسجي' },
  { value: 'from-rose-500 to-pink-500', label: 'وردي' },
  { value: 'from-indigo-500 to-blue-500', label: 'نيلي' },
  { value: 'from-teal-500 to-cyan-500', label: 'فيروزي' },
  { value: 'from-sky-500 to-blue-500', label: 'سماوي' },
  { value: 'from-orange-500 to-red-500', label: 'أحمر' },
  { value: 'from-green-500 to-teal-500', label: 'أخضر غامق' },
];

const ICON_OPTIONS = [
  'Newspaper', 'Users', 'Award', 'Megaphone', 'ShieldCheck',
  'Recycle', 'Truck', 'BarChart3', 'FileCheck', 'Globe',
  'BookOpen', 'Bell', 'Sparkles', 'Zap', 'Star',
];

const emptyForm = {
  title: '', description: '', category: 'عام', badge: 'جديد',
  icon_name: 'Newspaper', color_gradient: 'from-blue-500 to-cyan-500',
  link: '/', is_published: false, is_featured: false, sort_order: 0,
};

const AdminNewsManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: news = [], isLoading } = useQuery({
    queryKey: ['admin-platform-news'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_news' as any)
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as NewsItem[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (item: typeof form & { id?: string }) => {
      const payload = {
        ...item,
        published_at: item.is_published ? new Date().toISOString() : null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('platform_news' as any)
          .update(payload as any)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('platform_news' as any)
          .insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-platform-news'] });
      queryClient.invalidateQueries({ queryKey: ['platform-news'] });
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
      const { error } = await supabase
        .from('platform_news' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-platform-news'] });
      queryClient.invalidateQueries({ queryKey: ['platform-news'] });
      toast({ title: 'تم الحذف' });
    },
  });

  const togglePublish = async (item: NewsItem) => {
    await supabase
      .from('platform_news' as any)
      .update({
        is_published: !item.is_published,
        published_at: !item.is_published ? new Date().toISOString() : null,
      } as any)
      .eq('id', item.id);
    queryClient.invalidateQueries({ queryKey: ['admin-platform-news'] });
    queryClient.invalidateQueries({ queryKey: ['platform-news'] });
  };

  const openEdit = (item: NewsItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description,
      category: item.category,
      badge: item.badge,
      icon_name: item.icon_name,
      color_gradient: item.color_gradient,
      link: item.link,
      is_published: item.is_published,
      is_featured: item.is_featured,
      sort_order: item.sort_order,
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    setForm({ ...emptyForm, sort_order: news.length + 1 });
    setDialogOpen(true);
  };

  const publishedCount = news.filter(n => n.is_published).length;
  const draftCount = news.filter(n => !n.is_published).length;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button onClick={openNew} className="gap-2">
              <Plus className="w-4 h-4" />
              خبر جديد
            </Button>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Newspaper className="w-5 h-5 text-primary" />
              إدارة أخبار المنصة
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 justify-end text-sm">
            <span className="flex items-center gap-1">
              <Badge variant="outline" className="bg-primary/10">{news.length}</Badge>
              إجمالي
            </span>
            <span className="flex items-center gap-1">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">{publishedCount}</Badge>
              منشور
            </span>
            <span className="flex items-center gap-1">
              <Badge variant="outline" className="bg-muted">{draftCount}</Badge>
              مسودة
            </span>
          </div>
        </CardContent>
      </Card>

      {/* News List */}
      <div className="space-y-2">
        {news.map((item) => (
          <Card key={item.id} className={`transition-all ${!item.is_published ? 'opacity-60 border-dashed' : ''}`}>
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color_gradient} flex items-center justify-center shrink-0`}>
                  <Newspaper className="w-5 h-5 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-sm truncate">{item.title}</h3>
                    {item.is_featured && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px]">{item.category}</Badge>
                    <Badge variant="outline" className="text-[10px]">{item.badge}</Badge>
                    <span className="text-[10px] text-muted-foreground">ترتيب: {item.sort_order}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => togglePublish(item)}
                    title={item.is_published ? 'إلغاء النشر' : 'نشر'}
                  >
                    {item.is_published ? (
                      <Eye className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => deleteMutation.mutate(item.id)}
                  >
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {news.length === 0 && !isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد أخبار بعد</p>
              <Button onClick={openNew} variant="outline" className="mt-3 gap-2">
                <Plus className="w-4 h-4" />
                أضف أول خبر
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'تعديل الخبر' : 'خبر جديد'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>العنوان *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>الوصف *</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>التصنيف</Label>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>الشارة</Label>
                <Input value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} placeholder="جديد، محدّث، هام..." />
              </div>
            </div>

            <div className="space-y-2">
              <Label>الرابط</Label>
              <Input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} dir="ltr" placeholder="/dashboard/..." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>اللون</Label>
                <Select value={form.color_gradient} onValueChange={v => setForm(f => ({ ...f, color_gradient: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADIENT_OPTIONS.map(g => (
                      <SelectItem key={g.value} value={g.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded bg-gradient-to-r ${g.value}`} />
                          {g.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الأيقونة</Label>
                <Select value={form.icon_name} onValueChange={v => setForm(f => ({ ...f, icon_name: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map(icon => (
                      <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>الترتيب</Label>
              <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
            </div>

            <div className="flex items-center justify-between">
              <Switch checked={form.is_published} onCheckedChange={v => setForm(f => ({ ...f, is_published: v }))} />
              <Label>نشر مباشرة</Label>
            </div>

            <div className="flex items-center justify-between">
              <Switch checked={form.is_featured} onCheckedChange={v => setForm(f => ({ ...f, is_featured: v }))} />
              <Label>خبر مميز</Label>
            </div>

            <Button
              className="w-full"
              onClick={() => saveMutation.mutate(form)}
              disabled={!form.title.trim() || !form.description.trim() || saveMutation.isPending}
            >
              {saveMutation.isPending ? 'جاري الحفظ...' : editingId ? 'تحديث' : 'إضافة'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNewsManager;
