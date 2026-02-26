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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Plus, Pencil, Trash2, BookOpen, Eye, EyeOff,
  Star, GripVertical, FileText, Layout, Sparkles, Clock
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  title_en: string | null;
  slug: string;
  excerpt: string;
  excerpt_en: string | null;
  content: string;
  content_en: string | null;
  category: string;
  category_en: string | null;
  tags: string[];
  cover_gradient: string;
  template_style: string;
  is_published: boolean;
  is_featured: boolean;
  published_at: string | null;
  reading_time_minutes: number;
  author_name: string;
  sort_order: number;
  created_at: string;
}

const TEMPLATE_STYLES = [
  { value: 'standard', label: 'قياسي', desc: 'تخطيط بسيط ونظيف', icon: '📄' },
  { value: 'detailed', label: 'تفصيلي', desc: 'مع أقسام وتقسيمات', icon: '📑' },
  { value: 'modern', label: 'عصري', desc: 'تصميم حديث بألوان متدرجة', icon: '✨' },
  { value: 'magazine', label: 'مجلة', desc: 'تخطيط مجلة احترافي', icon: '📰' },
  { value: 'minimal', label: 'بسيط', desc: 'نص فقط بدون زخرفة', icon: '📝' },
];

const GRADIENT_OPTIONS = [
  { value: 'from-emerald-500 to-green-500', label: 'أخضر' },
  { value: 'from-blue-500 to-indigo-500', label: 'أزرق' },
  { value: 'from-amber-500 to-orange-500', label: 'برتقالي' },
  { value: 'from-red-500 to-rose-500', label: 'أحمر' },
  { value: 'from-purple-500 to-violet-500', label: 'بنفسجي' },
  { value: 'from-teal-500 to-cyan-500', label: 'فيروزي' },
  { value: 'from-pink-500 to-rose-500', label: 'وردي' },
  { value: 'from-sky-500 to-blue-500', label: 'سماوي' },
];

const CATEGORIES = [
  { ar: 'نفايات بلدية', en: 'Municipal Waste' },
  { ar: 'نفايات طبية', en: 'Medical Waste' },
  { ar: 'نفايات إلكترونية', en: 'E-Waste' },
  { ar: 'صناعة التدوير', en: 'Recycling Industry' },
  { ar: 'بيئة', en: 'Environment' },
  { ar: 'تقنية', en: 'Technology' },
  { ar: 'تشريعات', en: 'Legislation' },
  { ar: 'عام', en: 'General' },
];

const generateSlug = (title: string) =>
  title.replace(/[^\w\s\u0600-\u06FF-]/g, '').replace(/\s+/g, '-').toLowerCase().slice(0, 80) || 'post-' + Date.now();

const emptyForm = {
  title: '', title_en: '', slug: '', excerpt: '', excerpt_en: '',
  content: '', content_en: '', category: 'عام', category_en: 'General',
  tags: [] as string[], cover_gradient: 'from-emerald-500 to-green-500',
  template_style: 'standard', is_published: false, is_featured: false,
  reading_time_minutes: 3, author_name: 'فريق iRecycle', sort_order: 0,
};

const AdminBlogManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [tagInput, setTagInput] = useState('');

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['admin-blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts' as any)
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as BlogPost[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (item: typeof form) => {
      const slug = item.slug || generateSlug(item.title);
      const payload = {
        ...item,
        slug,
        published_at: item.is_published ? new Date().toISOString() : null,
      };

      if (editingId) {
        const { error } = await supabase.from('blog_posts' as any).update(payload as any).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('blog_posts' as any).insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      toast({ title: 'تم الحفظ بنجاح' });
    },
    onError: (err: any) => toast({ title: 'خطأ', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blog_posts' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast({ title: 'تم الحذف' });
    },
  });

  const togglePublish = async (item: BlogPost) => {
    await supabase.from('blog_posts' as any).update({
      is_published: !item.is_published,
      published_at: !item.is_published ? new Date().toISOString() : null,
    } as any).eq('id', item.id);
    queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
    queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
  };

  const openEdit = (item: BlogPost) => {
    setEditingId(item.id);
    setForm({
      title: item.title, title_en: item.title_en || '', slug: item.slug,
      excerpt: item.excerpt, excerpt_en: item.excerpt_en || '',
      content: item.content, content_en: item.content_en || '',
      category: item.category, category_en: item.category_en || '',
      tags: item.tags || [], cover_gradient: item.cover_gradient,
      template_style: item.template_style, is_published: item.is_published,
      is_featured: item.is_featured, reading_time_minutes: item.reading_time_minutes,
      author_name: item.author_name, sort_order: item.sort_order,
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    setForm({ ...emptyForm, sort_order: posts.length + 1 });
    setDialogOpen(true);
  };

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm(f => ({ ...f, tags: [...f.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));
  };

  const applyTemplate = (style: string) => {
    setForm(f => ({ ...f, template_style: style }));
  };

  const publishedCount = posts.filter(p => p.is_published).length;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button onClick={openNew} className="gap-2">
              <Plus className="w-4 h-4" />
              مقال جديد
            </Button>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="w-5 h-5 text-primary" />
              إدارة المدونة
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

      {/* Posts List */}
      <div className="space-y-2">
        {posts.map((post) => (
          <Card key={post.id} className={`transition-all ${!post.is_published ? 'opacity-60 border-dashed' : ''}`}>
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${post.cover_gradient} flex items-center justify-center shrink-0`}>
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-sm truncate">{post.title}</h3>
                    {post.is_featured && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{post.excerpt}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px]">{post.category}</Badge>
                    <Badge variant="outline" className="text-[10px]">{TEMPLATE_STYLES.find(t => t.value === post.template_style)?.icon} {TEMPLATE_STYLES.find(t => t.value === post.template_style)?.label}</Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />{post.reading_time_minutes} د
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => togglePublish(post)}>
                    {post.is_published ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(post)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                    onClick={() => { if (confirm('هل أنت متأكد من حذف هذا المقال؟')) deleteMutation.mutate(post.id); }}>
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
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد مقالات بعد</p>
              <Button onClick={openNew} variant="outline" className="mt-3 gap-2"><Plus className="w-4 h-4" />أضف أول مقال</Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] p-0" dir="rtl">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              {editingId ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {editingId ? 'تعديل المقال' : 'مقال جديد'}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="content" className="px-6">
            <TabsList className="w-full justify-start mb-4">
              <TabsTrigger value="content" className="gap-1"><FileText className="w-3.5 h-3.5" />المحتوى</TabsTrigger>
              <TabsTrigger value="template" className="gap-1"><Layout className="w-3.5 h-3.5" />القالب</TabsTrigger>
              <TabsTrigger value="settings" className="gap-1"><Sparkles className="w-3.5 h-3.5" />الإعدادات</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[58vh]">
              {/* Content Tab */}
              <TabsContent value="content" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label>العنوان بالعربية *</Label>
                  <Input value={form.title} onChange={e => {
                    setForm(f => ({ ...f, title: e.target.value, slug: generateSlug(e.target.value) }));
                  }} placeholder="عنوان المقال..." />
                </div>
                <div className="space-y-2">
                  <Label>العنوان بالإنجليزية</Label>
                  <Input value={form.title_en} onChange={e => setForm(f => ({ ...f, title_en: e.target.value }))} dir="ltr" placeholder="Article title..." />
                </div>
                <div className="space-y-2">
                  <Label>الرابط (Slug)</Label>
                  <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} dir="ltr" className="font-mono text-xs" />
                </div>
                <div className="space-y-2">
                  <Label>المقتطف بالعربية *</Label>
                  <Textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} rows={2} placeholder="وصف مختصر..." />
                </div>
                <div className="space-y-2">
                  <Label>المقتطف بالإنجليزية</Label>
                  <Textarea value={form.excerpt_en} onChange={e => setForm(f => ({ ...f, excerpt_en: e.target.value }))} rows={2} dir="ltr" placeholder="Short description..." />
                </div>
                <div className="space-y-2">
                  <Label>المحتوى بالعربية * (يدعم Markdown)</Label>
                  <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={10} className="font-mono text-sm" placeholder="## العنوان الرئيسي&#10;&#10;محتوى المقال هنا...&#10;&#10;### عنوان فرعي&#10;- نقطة أولى&#10;- نقطة ثانية" />
                </div>
                <div className="space-y-2">
                  <Label>المحتوى بالإنجليزية (يدعم Markdown)</Label>
                  <Textarea value={form.content_en} onChange={e => setForm(f => ({ ...f, content_en: e.target.value }))} rows={6} dir="ltr" className="font-mono text-sm" />
                </div>
              </TabsContent>

              {/* Template Tab */}
              <TabsContent value="template" className="space-y-4 mt-0">
                <Label className="text-base font-bold">اختر قالب العرض</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TEMPLATE_STYLES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => applyTemplate(t.value)}
                      className={`p-4 rounded-xl border-2 text-right transition-all ${
                        form.template_style === t.value
                          ? 'border-primary bg-primary/10 shadow-md'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{t.icon}</span>
                        <div>
                          <h4 className="font-bold text-sm">{t.label}</h4>
                          <p className="text-xs text-muted-foreground">{t.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="space-y-2 mt-4">
                  <Label>لون الغلاف</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {GRADIENT_OPTIONS.map(g => (
                      <button
                        key={g.value}
                        onClick={() => setForm(f => ({ ...f, cover_gradient: g.value }))}
                        className={`p-2 rounded-lg border-2 transition-all flex items-center gap-2 ${
                          form.cover_gradient === g.value ? 'border-primary shadow-md' : 'border-border'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${g.value}`} />
                        <span className="text-xs">{g.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>التصنيف</Label>
                    <Select value={form.category} onValueChange={v => {
                      const cat = CATEGORIES.find(c => c.ar === v);
                      setForm(f => ({ ...f, category: v, category_en: cat?.en || '' }));
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c.ar} value={c.ar}>{c.ar}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>وقت القراءة (دقائق)</Label>
                    <Input type="number" value={form.reading_time_minutes} onChange={e => setForm(f => ({ ...f, reading_time_minutes: parseInt(e.target.value) || 3 }))} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>اسم الكاتب</Label>
                  <Input value={form.author_name} onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label>الوسوم</Label>
                  <div className="flex gap-2">
                    <Input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="أضف وسم..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
                    <Button type="button" variant="outline" onClick={addTag}>إضافة</Button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {form.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                        {tag} ✕
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>الترتيب</Label>
                  <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <Switch checked={form.is_published} onCheckedChange={v => setForm(f => ({ ...f, is_published: v }))} />
                  <Label>نشر مباشرة</Label>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <Switch checked={form.is_featured} onCheckedChange={v => setForm(f => ({ ...f, is_featured: v }))} />
                  <Label>مقال مميز</Label>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <div className="p-6 pt-3 border-t">
            <Button
              className="w-full"
              onClick={() => saveMutation.mutate(form)}
              disabled={!form.title.trim() || !form.content.trim() || saveMutation.isPending}
            >
              {saveMutation.isPending ? 'جاري الحفظ...' : editingId ? 'تحديث المقال' : 'نشر المقال'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBlogManager;
