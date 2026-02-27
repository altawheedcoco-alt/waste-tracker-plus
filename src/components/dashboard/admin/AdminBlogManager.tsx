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
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Plus, Pencil, Trash2, BookOpen, Eye, EyeOff,
  Star, GripVertical, FileText, Layout, Sparkles, Clock,
  Search, CalendarClock, Globe, TrendingUp, Timer,
  Calendar, BarChart3, Target,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ar } from 'date-fns/locale';

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
  scheduled_at: string | null;
  status: string;
  reading_time_minutes: number;
  author_name: string;
  sort_order: number;
  created_at: string;
  meta_description: string | null;
  meta_description_en: string | null;
  focus_keyword: string | null;
  focus_keyword_en: string | null;
  cover_image_alt: string | null;
  cover_image_alt_en: string | null;
  seo_score: number;
  canonical_url: string | null;
  og_image_url: string | null;
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
  { ar: 'أخبار وتشريعات', en: 'News & Legislation' },
  { ar: 'ثقافة التدوير', en: 'Recycling Culture' },
  { ar: 'قطاع الأعمال', en: 'Business Sector' },
  { ar: 'أدلة إرشادية', en: 'Guides' },
  { ar: 'نفايات إلكترونية', en: 'E-Waste' },
  { ar: 'نفايات طبية', en: 'Medical Waste' },
  { ar: 'دراسات حالة', en: 'Case Studies' },
  { ar: 'بيئة', en: 'Environment' },
  { ar: 'تقنية', en: 'Technology' },
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
  meta_description: '', meta_description_en: '',
  focus_keyword: '', focus_keyword_en: '',
  cover_image_alt: '', cover_image_alt_en: '',
  scheduled_at: '', status: 'draft',
  canonical_url: '', og_image_url: '',
};

const SEO_TIPS = [
  { check: (f: typeof emptyForm) => f.title.length >= 10 && f.title.length <= 100, label: 'طول العنوان مناسب (10-100 حرف)' },
  { check: (f: typeof emptyForm) => !!f.meta_description && f.meta_description.length >= 50 && f.meta_description.length <= 160, label: 'وصف تعريفي (50-160 حرف)' },
  { check: (f: typeof emptyForm) => !!f.focus_keyword && f.focus_keyword.length > 2, label: 'كلمة مفتاحية محددة' },
  { check: (f: typeof emptyForm) => !!f.focus_keyword && f.title.includes(f.focus_keyword), label: 'الكلمة المفتاحية في العنوان' },
  { check: (f: typeof emptyForm) => !!f.focus_keyword && f.content.includes(f.focus_keyword), label: 'الكلمة المفتاحية في المحتوى' },
  { check: (f: typeof emptyForm) => f.slug.length >= 5 && f.slug.length <= 80, label: 'رابط دائم نظيف' },
  { check: (f: typeof emptyForm) => !!f.cover_image_alt && f.cover_image_alt.length > 5, label: 'نص بديل للصورة' },
  { check: (f: typeof emptyForm) => f.content.length > 300, label: 'محتوى كافٍ (+300 حرف)' },
];

const getStatusInfo = (post: BlogPost) => {
  if (post.status === 'published' || post.is_published) return { label: 'منشور', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300', icon: Eye };
  if (post.status === 'scheduled' && post.scheduled_at) return { label: 'مجدول', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: CalendarClock };
  return { label: 'مسودة', color: 'bg-muted text-muted-foreground', icon: EyeOff };
};

const AdminBlogManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [tagInput, setTagInput] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calendarMonth, setCalendarMonth] = useState(new Date());

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
      let status = item.status;
      let publishedAt = null;

      if (item.is_published) {
        status = 'published';
        publishedAt = new Date().toISOString();
      } else if (item.scheduled_at) {
        status = 'scheduled';
      } else {
        status = 'draft';
      }

      const payload = {
        ...item,
        slug,
        status,
        published_at: publishedAt,
        scheduled_at: item.scheduled_at || null,
        meta_description: item.meta_description || null,
        meta_description_en: item.meta_description_en || null,
        focus_keyword: item.focus_keyword || null,
        focus_keyword_en: item.focus_keyword_en || null,
        cover_image_alt: item.cover_image_alt || null,
        cover_image_alt_en: item.cover_image_alt_en || null,
        canonical_url: item.canonical_url || null,
        og_image_url: item.og_image_url || null,
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
    const newPublished = !item.is_published;
    await supabase.from('blog_posts' as any).update({
      is_published: newPublished,
      status: newPublished ? 'published' : 'draft',
      published_at: newPublished ? new Date().toISOString() : null,
      scheduled_at: null,
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
      meta_description: item.meta_description || '',
      meta_description_en: item.meta_description_en || '',
      focus_keyword: item.focus_keyword || '',
      focus_keyword_en: item.focus_keyword_en || '',
      cover_image_alt: item.cover_image_alt || '',
      cover_image_alt_en: item.cover_image_alt_en || '',
      scheduled_at: item.scheduled_at || '',
      status: item.status || 'draft',
      canonical_url: item.canonical_url || '',
      og_image_url: item.og_image_url || '',
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

  const publishedCount = posts.filter(p => p.is_published).length;
  const scheduledCount = posts.filter(p => p.status === 'scheduled').length;
  const draftCount = posts.filter(p => !p.is_published && p.status !== 'scheduled').length;
  const avgSeo = posts.length > 0 ? Math.round(posts.reduce((s, p) => s + (p.seo_score || 0), 0) / posts.length) : 0;

  // SEO score for current form
  const formSeoScore = SEO_TIPS.filter(t => t.check(form)).length;
  const formSeoPercent = Math.round((formSeoScore / SEO_TIPS.length) * 100);

  // Calendar
  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getPostsForDay = (day: Date) =>
    posts.filter(p => {
      const d = p.scheduled_at || p.published_at;
      return d && isSameDay(new Date(d), day);
    });

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button onClick={openNew} className="gap-2">
                <Plus className="w-4 h-4" />مقال جديد
              </Button>
              <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9" onClick={() => setViewMode('list')}>
                <FileText className="w-4 h-4" />
              </Button>
              <Button variant={viewMode === 'calendar' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9" onClick={() => setViewMode('calendar')}>
                <Calendar className="w-4 h-4" />
              </Button>
            </div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="w-5 h-5 text-primary" />
              إدارة المدونة (CMS)
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 justify-end text-sm flex-wrap">
            <span className="flex items-center gap-1">
              <Badge variant="outline" className="bg-primary/10">{posts.length}</Badge>إجمالي
            </span>
            <span className="flex items-center gap-1">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">{publishedCount}</Badge>منشور
            </span>
            <span className="flex items-center gap-1">
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600">{scheduledCount}</Badge>مجدول
            </span>
            <span className="flex items-center gap-1">
              <Badge variant="outline" className="bg-muted">{draftCount}</Badge>مسودة
            </span>
            <span className="flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">SEO:</span>
              <Badge variant="outline" className={avgSeo >= 70 ? 'bg-emerald-500/10 text-emerald-600' : avgSeo >= 40 ? 'bg-amber-500/10 text-amber-600' : 'bg-destructive/10 text-destructive'}>{avgSeo}%</Badge>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Content Calendar View */}
      {viewMode === 'calendar' && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}>→</Button>
              <h3 className="font-bold">{format(calendarMonth, 'MMMM yyyy', { locale: ar })}</h3>
              <Button variant="ghost" size="sm" onClick={() => setCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}>←</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {['أحد', 'إثن', 'ثلث', 'أربع', 'خمس', 'جمع', 'سبت'].map(d => (
                <div key={d} className="font-bold p-1 text-muted-foreground">{d}</div>
              ))}
              {Array.from({ length: monthStart.getDay() }).map((_, i) => <div key={`e-${i}`} />)}
              {days.map(day => {
                const dayPosts = getPostsForDay(day);
                const isToday = isSameDay(day, new Date());
                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[60px] p-1 rounded border text-right ${isToday ? 'border-primary bg-primary/5' : 'border-border/50'}`}
                  >
                    <span className={`text-[10px] ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                      {day.getDate()}
                    </span>
                    {dayPosts.map(p => {
                      const st = getStatusInfo(p);
                      return (
                        <div
                          key={p.id}
                          className={`mt-0.5 px-1 py-0.5 rounded text-[8px] truncate cursor-pointer ${st.color}`}
                          onClick={() => openEdit(p)}
                          title={p.title}
                        >
                          {p.title.substring(0, 15)}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts List */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {posts.map((post) => {
            const st = getStatusInfo(post);
            const StIcon = st.icon;
            return (
              <Card key={post.id} className={`transition-all ${post.status === 'draft' ? 'opacity-60 border-dashed' : ''}`}>
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
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className={`${st.color} text-[10px] gap-0.5`}>
                          <StIcon className="w-2.5 h-2.5" />{st.label}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">{post.category}</Badge>
                        <Badge variant="outline" className="text-[10px]">{TEMPLATE_STYLES.find(t => t.value === post.template_style)?.icon} {TEMPLATE_STYLES.find(t => t.value === post.template_style)?.label}</Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />{post.reading_time_minutes} د
                        </span>
                        {post.seo_score !== undefined && (
                          <Badge variant="outline" className={`text-[9px] gap-0.5 ${post.seo_score >= 70 ? 'text-emerald-600' : post.seo_score >= 40 ? 'text-amber-600' : 'text-destructive'}`}>
                            <Target className="w-2.5 h-2.5" />SEO {post.seo_score}%
                          </Badge>
                        )}
                        {post.status === 'scheduled' && post.scheduled_at && (
                          <span className="text-[10px] text-blue-600 flex items-center gap-0.5">
                            <Timer className="w-3 h-3" />
                            {format(new Date(post.scheduled_at), 'dd/MM hh:mm a', { locale: ar })}
                          </span>
                        )}
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
            );
          })}

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
      )}

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
              <TabsTrigger value="seo" className="gap-1"><Search className="w-3.5 h-3.5" />SEO</TabsTrigger>
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
                  <Label>الرابط الدائم (Slug)</Label>
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
                  <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={10} className="font-mono text-sm" placeholder="## العنوان الرئيسي&#10;&#10;محتوى المقال هنا..." />
                </div>
                <div className="space-y-2">
                  <Label>المحتوى بالإنجليزية (يدعم Markdown)</Label>
                  <Textarea value={form.content_en} onChange={e => setForm(f => ({ ...f, content_en: e.target.value }))} rows={6} dir="ltr" className="font-mono text-sm" />
                </div>
              </TabsContent>

              {/* SEO Tab */}
              <TabsContent value="seo" className="space-y-4 mt-0">
                {/* SEO Score Card */}
                <Card className="border-2 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={formSeoPercent >= 70 ? 'bg-emerald-500' : formSeoPercent >= 40 ? 'bg-amber-500' : 'bg-destructive'}>
                        {formSeoPercent}%
                      </Badge>
                      <h4 className="font-bold text-sm flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        تقييم SEO المباشر
                      </h4>
                    </div>
                    <Progress value={formSeoPercent} className="h-2 mb-3" />
                    <div className="grid grid-cols-2 gap-1">
                      {SEO_TIPS.map((tip, i) => (
                        <div key={i} className={`text-[11px] flex items-center gap-1.5 ${tip.check(form) ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                          {tip.check(form) ? '✅' : '⬜'} {tip.label}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <Label>الكلمة المفتاحية الرئيسية (Focus Keyword)</Label>
                  <Input value={form.focus_keyword} onChange={e => setForm(f => ({ ...f, focus_keyword: e.target.value }))} placeholder="مثال: إعادة تدوير النفايات الإلكترونية" />
                </div>
                <div className="space-y-2">
                  <Label>Focus Keyword (English)</Label>
                  <Input value={form.focus_keyword_en} onChange={e => setForm(f => ({ ...f, focus_keyword_en: e.target.value }))} dir="ltr" placeholder="e.g. electronic waste recycling" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] ${(form.meta_description?.length || 0) > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {form.meta_description?.length || 0}/160
                    </span>
                    <Label>الوصف التعريفي (Meta Description)</Label>
                  </div>
                  <Textarea value={form.meta_description} onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))} rows={2} placeholder="ملخص يظهر في نتائج البحث (50-160 حرف)..." />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] ${(form.meta_description_en?.length || 0) > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {form.meta_description_en?.length || 0}/160
                    </span>
                    <Label>Meta Description (English)</Label>
                  </div>
                  <Textarea value={form.meta_description_en} onChange={e => setForm(f => ({ ...f, meta_description_en: e.target.value }))} rows={2} dir="ltr" placeholder="Search result summary (50-160 chars)..." />
                </div>

                <div className="space-y-2">
                  <Label>النص البديل لصورة الغلاف (Alt Text)</Label>
                  <Input value={form.cover_image_alt} onChange={e => setForm(f => ({ ...f, cover_image_alt: e.target.value }))} placeholder="وصف الصورة لمحركات البحث..." />
                </div>
                <div className="space-y-2">
                  <Label>Cover Image Alt (English)</Label>
                  <Input value={form.cover_image_alt_en} onChange={e => setForm(f => ({ ...f, cover_image_alt_en: e.target.value }))} dir="ltr" placeholder="Image description for search engines..." />
                </div>

                <div className="space-y-2">
                  <Label>رابط Canonical (اختياري)</Label>
                  <Input value={form.canonical_url} onChange={e => setForm(f => ({ ...f, canonical_url: e.target.value }))} dir="ltr" className="font-mono text-xs" placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>رابط صورة OG (اختياري)</Label>
                  <Input value={form.og_image_url} onChange={e => setForm(f => ({ ...f, og_image_url: e.target.value }))} dir="ltr" className="font-mono text-xs" placeholder="https://..." />
                </div>
              </TabsContent>

              {/* Template Tab */}
              <TabsContent value="template" className="space-y-4 mt-0">
                <Label className="text-base font-bold">اختر قالب العرض</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TEMPLATE_STYLES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setForm(f => ({ ...f, template_style: t.value }))}
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
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>{tag} ✕</Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>الترتيب</Label>
                  <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
                </div>

                {/* Scheduling */}
                <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                  <CardContent className="p-4 space-y-3">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      <CalendarClock className="w-4 h-4 text-blue-600" />
                      جدولة النشر
                    </h4>
                    <div className="space-y-2">
                      <Label className="text-xs">تاريخ ووقت النشر المجدول</Label>
                      <Input
                        type="datetime-local"
                        value={form.scheduled_at}
                        onChange={e => setForm(f => ({
                          ...f,
                          scheduled_at: e.target.value,
                          is_published: false,
                          status: e.target.value ? 'scheduled' : 'draft',
                        }))}
                        dir="ltr"
                        className="font-mono text-xs"
                      />
                      {form.scheduled_at && (
                        <p className="text-[11px] text-blue-600 flex items-center gap-1">
                          <Timer className="w-3 h-3" />
                          سيتم النشر تلقائياً في {format(new Date(form.scheduled_at), 'dd MMMM yyyy - hh:mm a', { locale: ar })}
                        </p>
                      )}
                      {form.scheduled_at && (
                        <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setForm(f => ({ ...f, scheduled_at: '', status: 'draft' }))}>
                          إلغاء الجدولة
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <Switch checked={form.is_published} onCheckedChange={v => setForm(f => ({ ...f, is_published: v, status: v ? 'published' : 'draft', scheduled_at: v ? '' : f.scheduled_at }))} />
                  <Label>نشر مباشرة</Label>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <Switch checked={form.is_featured} onCheckedChange={v => setForm(f => ({ ...f, is_featured: v }))} />
                  <Label>مقال مميز</Label>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <div className="p-6 pt-3 border-t flex items-center gap-3">
            <Button
              className="flex-1"
              onClick={() => saveMutation.mutate(form)}
              disabled={!form.title.trim() || !form.content.trim() || saveMutation.isPending}
            >
              {saveMutation.isPending ? 'جاري الحفظ...' : form.scheduled_at ? '📅 حفظ وجدولة' : form.is_published ? '🚀 نشر الآن' : '💾 حفظ كمسودة'}
            </Button>
            {formSeoPercent < 70 && (
              <Badge variant="outline" className="text-amber-600 text-[10px] gap-0.5 shrink-0">
                <Target className="w-3 h-3" />SEO {formSeoPercent}%
              </Badge>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBlogManager;
