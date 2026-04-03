import { useState, memo, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  LayoutDashboard, Eye, EyeOff, GripVertical, Plus, Trash2, Edit3,
  Image, Video, Link2, Type, Globe, Palette, ExternalLink, Monitor,
  Megaphone, Sparkles, Save, Loader2, ArrowUp, ArrowDown, Settings2,
  LayoutGrid, Layers, PanelTop,
} from 'lucide-react';
import {
  useHomepageSections, useHomepageCustomBlocks,
  type HomepageSection, type HomepageCustomBlock,
} from '@/hooks/useHomepageSections';

const SECTION_ICONS: Record<string, typeof LayoutDashboard> = {
  header: PanelTop, ticker: Megaphone, hero: Sparkles, ads: Megaphone,
  partners: Globe, stats: LayoutGrid, verify: Settings2, consultants: Globe,
  initiative: Globe, features: Layers, 'features-list': Layers,
  'doc-ai': Sparkles, 'smart-agent': Sparkles, services: Settings2,
  omaluna: Globe, testimonials: Type, cta: Megaphone, footer: PanelTop,
};

const BLOCK_TYPES = [
  { value: 'banner', label: 'بانر إعلاني', icon: Image },
  { value: 'announcement', label: 'إعلان نصي', icon: Megaphone },
  { value: 'promo', label: 'عرض ترويجي', icon: Sparkles },
  { value: 'html', label: 'محتوى HTML', icon: Type },
  { value: 'image', label: 'صورة', icon: Image },
  { value: 'video', label: 'فيديو', icon: Video },
  { value: 'partner_logo', label: 'شعار شريك', icon: Globe },
  { value: 'external_link', label: 'رابط خارجي', icon: ExternalLink },
];

const POSITIONS = [
  { value: 'top', label: 'أعلى الصفحة' },
  { value: 'after_hero', label: 'بعد القسم الرئيسي' },
  { value: 'before_footer', label: 'قبل التذييل' },
  { value: 'custom', label: 'موضع مخصص' },
];

const AdminHomepageManager = () => {
  const { sections, isLoading, updateSection, reorderSections } = useHomepageSections();
  const { blocks, addBlock, updateBlock, deleteBlock, isAdding } = useHomepageCustomBlocks();
  const [activeTab, setActiveTab] = useState('sections');
  const [addBlockOpen, setAddBlockOpen] = useState(false);
  const [editBlock, setEditBlock] = useState<HomepageCustomBlock | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sectionOrder, setSectionOrder] = useState<HomepageSection[]>([]);

  // Sync section order when data loads
  if (sections.length > 0 && sectionOrder.length === 0) {
    setSectionOrder(sections);
  }

  const handleReorder = useCallback((newOrder: HomepageSection[]) => {
    setSectionOrder(newOrder);
  }, []);

  const saveOrder = () => {
    reorderSections(sectionOrder.map(s => s.id));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...sectionOrder];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newOrder.length) return;
    [newOrder[index], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[index]];
    setSectionOrder(newOrder);
  };

  if (isLoading) {
    return (
              <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
    <div className="space-y-6" dir="rtl">
      <BackButton />
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => window.open('/', '_blank')} className="gap-2">
          <Monitor className="h-4 w-4" /> معاينة الصفحة
        </Button>
        <div className="text-right">
          <h1 className="text-2xl font-bold flex items-center gap-2 justify-end">
            إدارة الصفحة الرئيسية
            <LayoutDashboard className="w-6 h-6 text-primary" />
          </h1>
          <p className="text-muted-foreground text-sm">تحكم كامل في أقسام ومحتوى الصفحة الرئيسية</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold">{sections.length}</p>
          <p className="text-xs text-muted-foreground">قسم</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold">{sections.filter(s => s.is_visible).length}</p>
          <p className="text-xs text-muted-foreground">مرئي</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold">{sections.filter(s => !s.is_visible).length}</p>
          <p className="text-xs text-muted-foreground">مخفي</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold">{blocks.length}</p>
          <p className="text-xs text-muted-foreground">بلوك مخصص</p>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="sections" className="gap-2">
            <Layers className="h-4 w-4" /> الأقسام الأساسية
          </TabsTrigger>
          <TabsTrigger value="blocks" className="gap-2">
            <Plus className="h-4 w-4" /> البلوكات المخصصة
          </TabsTrigger>
        </TabsList>

        {/* Sections Tab */}
        <TabsContent value="sections" className="space-y-4">
          <div className="flex items-center justify-between">
            <Button onClick={saveOrder} variant="default" className="gap-2">
              <Save className="h-4 w-4" /> حفظ الترتيب
            </Button>
            <p className="text-sm text-muted-foreground">اسحب لإعادة الترتيب أو استخدم الأسهم</p>
          </div>

          <div className="space-y-2">
            {sectionOrder.map((section, index) => {
              const Icon = SECTION_ICONS[section.id] || LayoutDashboard;
              return (
                <motion.div
                  key={section.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className={`transition-all ${!section.is_visible ? 'opacity-50' : ''}`}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab shrink-0" />

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => moveSection(index, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => moveSection(index, 'down')}
                          disabled={index === sectionOrder.length - 1}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className={`p-2 rounded-lg ${section.is_visible ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{section.title}</span>
                          {section.title_en && (
                            <span className="text-xs text-muted-foreground">({section.title_en})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px]">#{section.sort_order}</Badge>
                          <Badge variant={section.is_visible ? 'default' : 'secondary'} className="text-[10px]">
                            {section.is_visible ? 'مرئي' : 'مخفي'}
                          </Badge>
                        </div>
                      </div>

                      <Switch
                        checked={section.is_visible}
                        onCheckedChange={(checked) => {
                          updateSection({ id: section.id, updates: { is_visible: checked } });
                          setSectionOrder(prev => prev.map(s => s.id === section.id ? { ...s, is_visible: checked } : s));
                        }}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        {/* Custom Blocks Tab */}
        <TabsContent value="blocks" className="space-y-4">
          <div className="flex items-center justify-between">
            <Button onClick={() => setAddBlockOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> إضافة بلوك جديد
            </Button>
            <p className="text-sm text-muted-foreground">{blocks.length} بلوك مخصص</p>
          </div>

          {blocks.length === 0 ? (
            <Card className="p-8 text-center">
              <Plus className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="font-medium">لا توجد بلوكات مخصصة</p>
              <p className="text-sm text-muted-foreground">أضف بانرات، إعلانات، أو محتوى مخصص للصفحة الرئيسية</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {blocks.map((block) => (
                <Card key={block.id} className={`transition-all ${!block.is_visible ? 'opacity-50' : ''}`}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${block.is_visible ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {(() => {
                        const bt = BLOCK_TYPES.find(b => b.value === block.block_type);
                        const BIcon = bt?.icon || Type;
                        return <BIcon className="h-4 w-4" />;
                      })()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{block.title}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px]">
                          {BLOCK_TYPES.find(b => b.value === block.block_type)?.label || block.block_type}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {POSITIONS.find(p => p.value === block.position)?.label || block.position}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Switch
                        checked={block.is_visible}
                        onCheckedChange={(checked) => updateBlock({ id: block.id, updates: { is_visible: checked } })}
                      />
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => setEditBlock(block)}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                        onClick={() => setDeleteConfirm(block.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Block Dialog */}
      <BlockFormDialog
        open={addBlockOpen || !!editBlock}
        onOpenChange={(open) => {
          if (!open) { setAddBlockOpen(false); setEditBlock(null); }
        }}
        block={editBlock}
        sections={sections}
        onSave={(data) => {
          if (editBlock) {
            updateBlock({ id: editBlock.id, updates: data });
          } else {
            addBlock(data as any);
          }
          setAddBlockOpen(false);
          setEditBlock(null);
        }}
        isSaving={isAdding}
      />

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف البلوك؟</AlertDialogTitle>
            <AlertDialogDescription>سيتم حذف هذا البلوك نهائياً من الصفحة الرئيسية.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteConfirm) deleteBlock(deleteConfirm); setDeleteConfirm(null); }}
              className="bg-destructive text-destructive-foreground"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

/* ─── Block Form Dialog ─── */
interface BlockFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  block: HomepageCustomBlock | null;
  sections: HomepageSection[];
  onSave: (data: Partial<HomepageCustomBlock>) => void;
  isSaving: boolean;
}

const BlockFormDialog = memo(({ open, onOpenChange, block, sections, onSave, isSaving }: BlockFormDialogProps) => {
  const [form, setForm] = useState<Partial<HomepageCustomBlock>>({
    block_type: 'banner',
    title: '',
    content: '',
    media_url: '',
    link_url: '',
    link_text: '',
    background_color: '',
    text_color: '',
    position: 'after_hero',
    custom_position_after: '',
    sort_order: 0,
    is_visible: true,
  });

  // Reset form when dialog opens
  const isEdit = !!block;
  if (open && block && form.title !== block.title) {
    setForm({
      block_type: block.block_type,
      title: block.title,
      title_en: block.title_en,
      content: block.content,
      content_en: block.content_en,
      media_url: block.media_url,
      link_url: block.link_url,
      link_text: block.link_text,
      background_color: block.background_color,
      text_color: block.text_color,
      position: block.position,
      custom_position_after: block.custom_position_after,
      sort_order: block.sort_order,
      is_visible: block.is_visible,
      starts_at: block.starts_at,
      ends_at: block.ends_at,
    });
  }

  const handleSave = () => {
    if (!form.title?.trim()) return;
    onSave(form);
    setForm({ block_type: 'banner', title: '', content: '', position: 'after_hero', sort_order: 0, is_visible: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-end">
            {isEdit ? 'تعديل البلوك' : 'إضافة بلوك جديد'}
            <Plus className="h-5 w-5 text-primary" />
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-1">
          <div className="space-y-4 p-1">
            {/* Block Type */}
            <div>
              <Label>نوع البلوك</Label>
              <Select value={form.block_type || 'banner'} onValueChange={v => setForm({ ...form, block_type: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BLOCK_TYPES.map(bt => (
                    <SelectItem key={bt.value} value={bt.value}>
                      <span className="flex items-center gap-2">
                        <bt.icon className="h-3.5 w-3.5" />
                        {bt.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div>
              <Label>العنوان (عربي) *</Label>
              <Input value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>العنوان (إنجليزي)</Label>
              <Input value={form.title_en || ''} onChange={e => setForm({ ...form, title_en: e.target.value })} className="mt-1" dir="ltr" />
            </div>

            {/* Content */}
            <div>
              <Label>المحتوى</Label>
              <Textarea value={form.content || ''} onChange={e => setForm({ ...form, content: e.target.value })} rows={3} className="mt-1 resize-none" />
            </div>

            {/* Media */}
            <div>
              <Label className="flex items-center gap-1"><Image className="h-3 w-3" /> رابط الوسائط</Label>
              <Input value={form.media_url || ''} onChange={e => setForm({ ...form, media_url: e.target.value })} className="mt-1" dir="ltr" placeholder="https://..." />
            </div>

            {/* Link */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="flex items-center gap-1"><Link2 className="h-3 w-3" /> رابط</Label>
                <Input value={form.link_url || ''} onChange={e => setForm({ ...form, link_url: e.target.value })} className="mt-1" dir="ltr" />
              </div>
              <div>
                <Label>نص الرابط</Label>
                <Input value={form.link_text || ''} onChange={e => setForm({ ...form, link_text: e.target.value })} className="mt-1" />
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="flex items-center gap-1"><Palette className="h-3 w-3" /> لون الخلفية</Label>
                <Input type="color" value={form.background_color || '#ffffff'} onChange={e => setForm({ ...form, background_color: e.target.value })} className="mt-1 h-10" />
              </div>
              <div>
                <Label>لون النص</Label>
                <Input type="color" value={form.text_color || '#000000'} onChange={e => setForm({ ...form, text_color: e.target.value })} className="mt-1 h-10" />
              </div>
            </div>

            <Separator />

            {/* Position */}
            <div>
              <Label>الموضع</Label>
              <Select value={form.position || 'after_hero'} onValueChange={v => setForm({ ...form, position: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {POSITIONS.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.position === 'custom' && (
              <div>
                <Label>بعد قسم</Label>
                <Select value={form.custom_position_after || ''} onValueChange={v => setForm({ ...form, custom_position_after: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                  <SelectContent>
                    {sections.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Sort & Schedule */}
            <div>
              <Label>ترتيب العرض</Label>
              <Input type="number" value={form.sort_order || 0} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>يبدأ من</Label>
                <Input type="datetime-local" value={form.starts_at || ''} onChange={e => setForm({ ...form, starts_at: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>ينتهي في</Label>
                <Input type="datetime-local" value={form.ends_at || ''} onChange={e => setForm({ ...form, ends_at: e.target.value })} className="mt-1" />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Switch checked={form.is_visible ?? true} onCheckedChange={v => setForm({ ...form, is_visible: v })} />
              <Label>مرئي فوراً</Label>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleSave} disabled={isSaving || !form.title?.trim()} className="gap-2">
            <Save className="h-4 w-4" />
            {isEdit ? 'تحديث' : 'إضافة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}  );
BlockFormDialog.displayName = 'BlockFormDialog';

export default AdminHomepageManager;
// Note: DashboardLayout closing tag added in the main return
