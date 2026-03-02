import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import {
  FileSignature, Plus, Search, Filter, Trash2, Edit, Copy, Eye, Users,
  Package, Building2, CheckCircle, Clock, AlertTriangle, XCircle,
  ArrowUpDown, Link2, Send, MessageCircle, AtSign, Loader2,
  Shield, Zap, FileText, BarChart3, Settings, Tag, CalendarDays,
} from 'lucide-react';

const TEMPLATE_TYPES = [
  { value: 'shipment_release', label: 'إذن خروج شحنة' },
  { value: 'shipment_receive', label: 'إقرار استلام شحنة' },
  { value: 'waste_manifest', label: 'مانيفست مخلفات' },
  { value: 'recycling_cert', label: 'شهادة تدوير' },
  { value: 'disposal_cert', label: 'شهادة تخلص' },
  { value: 'contract_approval', label: 'اعتماد عقد' },
  { value: 'invoice_approval', label: 'اعتماد فاتورة' },
  { value: 'safety_clearance', label: 'تصريح سلامة' },
  { value: 'environmental_report', label: 'تقرير بيئي' },
  { value: 'custom', label: 'مخصص' },
];

const CATEGORIES = [
  { value: 'operational', label: 'تشغيلي' },
  { value: 'financial', label: 'مالي' },
  { value: 'compliance', label: 'امتثال' },
  { value: 'safety', label: 'سلامة' },
  { value: 'legal', label: 'قانوني' },
];

const APPROVAL_MODES = [
  { value: 'all', label: 'الكل (جميع الموقعين)', description: 'يجب توقيع الجميع' },
  { value: 'joint', label: 'مجتمعين', description: 'عدد محدد من الموقعين' },
  { value: 'individual', label: 'منفردين', description: 'أي موقع واحد يكفي' },
  { value: 'sequential', label: 'تتابعي', description: 'بالترتيب المحدد' },
];

const SIGNATORY_ROLES = [
  'مدير عام', 'مدير تشغيل', 'مدير مالي', 'مسؤول بيئي', 'مسؤول سلامة',
  'مسؤول جودة', 'مدير مستودعات', 'مسؤول قانوني', 'مشرف ميداني', 'مراقب فني',
  'مفوض بالتوقيع', 'رئيس قسم', 'مدقق داخلي', 'مخصص',
];

const PRIORITIES = [
  { value: 'low', label: 'منخفض', color: 'bg-blue-100 text-blue-700' },
  { value: 'normal', label: 'عادي', color: 'bg-green-100 text-green-700' },
  { value: 'high', label: 'مرتفع', color: 'bg-orange-100 text-orange-700' },
  { value: 'urgent', label: 'عاجل', color: 'bg-red-100 text-red-700' },
];

interface Template {
  id: string;
  title: string;
  description: string | null;
  template_type: string;
  category: string;
  approval_mode: string;
  required_signatures_count: number;
  auto_attach_to_shipments: boolean;
  is_active: boolean;
  priority: string;
  content_template: string | null;
  notes: string | null;
  tags: string[] | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface Signatory {
  id: string;
  template_id: string;
  signatory_role: string;
  signatory_title: string | null;
  organization_id: string | null;
  profile_id: string | null;
  sign_order: number;
  is_mandatory: boolean;
  can_delegate: boolean;
  notes: string | null;
}

export default function MultiSignTemplates() {
  const { profile, organization } = useAuth();
  const queryClient = useQueryClient();
  const orgId = organization?.id;

  const [activeTab, setActiveTab] = useState('templates');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentions, setShowMentions] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    template_type: 'shipment_release',
    category: 'operational',
    approval_mode: 'all' as string,
    required_signatures_count: 1,
    auto_attach_to_shipments: false,
    priority: 'normal',
    content_template: '',
    notes: '',
    tags: '' as string,
    is_active: true,
  });

  const [signatories, setSignatories] = useState<Array<{
    signatory_role: string;
    signatory_title: string;
    sign_order: number;
    is_mandatory: boolean;
    can_delegate: boolean;
    notes: string;
  }>>([]);

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['multi-sign-templates', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('multi_sign_templates' as any)
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as any as Template[];
    },
    enabled: !!orgId,
  });

  // Fetch signatories for selected template
  const { data: templateSignatories = [] } = useQuery({
    queryKey: ['multi-sign-signatories', selectedTemplate?.id],
    queryFn: async () => {
      if (!selectedTemplate?.id) return [];
      const { data, error } = await supabase
        .from('multi_sign_signatories' as any)
        .select('*')
        .eq('template_id', selectedTemplate.id)
        .order('sign_order', { ascending: true });
      if (error) throw error;
      return (data || []) as any as Signatory[];
    },
    enabled: !!selectedTemplate?.id,
  });

  // Fetch linked shipments for selected template
  const { data: linkedShipments = [] } = useQuery({
    queryKey: ['multi-sign-shipments', selectedTemplate?.id],
    queryFn: async () => {
      if (!selectedTemplate?.id) return [];
      const { data, error } = await supabase
        .from('multi_sign_shipments' as any)
        .select('*, shipment:shipments(id, shipment_number, status, waste_type)')
        .eq('template_id', selectedTemplate.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedTemplate?.id,
  });

  // Fetch comments
  const { data: comments = [] } = useQuery({
    queryKey: ['multi-sign-comments', selectedTemplate?.id],
    queryFn: async () => {
      if (!selectedTemplate?.id) return [];
      const { data, error } = await supabase
        .from('multi_sign_comments' as any)
        .select('*, author:profiles!multi_sign_comments_author_id_fkey(full_name, avatar_url)')
        .eq('template_id', selectedTemplate.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedTemplate?.id,
  });

  // Fetch org members for mentions
  const { data: orgMembers = [] } = useQuery({
    queryKey: ['org-members-mentions', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, position')
        .eq('organization_id', orgId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  // Fetch available shipments for linking
  const { data: availableShipments = [] } = useQuery({
    queryKey: ['available-shipments-link', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('shipments')
        .select('id, shipment_number, status, waste_type, created_at')
        .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId}`)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId && showLinkDialog,
  });

  // Fetch partner orgs for mentions
  const { data: partnerOrgs = [] } = useQuery({
    queryKey: ['partner-orgs-mentions', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('partner_links')
        .select('partner_organization:organizations!partner_links_partner_organization_id_fkey(id, name, logo_url)')
        .eq('organization_id', orgId)
        .eq('status', 'active');
      if (error) throw error;
      return (data || []).map((d: any) => d.partner_organization).filter(Boolean);
    },
    enabled: !!orgId,
  });

  // Create template mutation
  const createTemplate = useMutation({
    mutationFn: async () => {
      if (!orgId || !profile) throw new Error('No org');
      const { data, error } = await supabase
        .from('multi_sign_templates' as any)
        .insert({
          organization_id: orgId,
          title: formData.title,
          description: formData.description || null,
          template_type: formData.template_type,
          category: formData.category,
          approval_mode: formData.approval_mode,
          required_signatures_count: formData.required_signatures_count,
          auto_attach_to_shipments: formData.auto_attach_to_shipments,
          priority: formData.priority,
          content_template: formData.content_template || null,
          notes: formData.notes || null,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          is_active: formData.is_active,
          created_by: profile.id,
        })
        .select()
        .single();
      if (error) throw error;

      // Insert signatories
      if (signatories.length > 0) {
        const { error: sigError } = await supabase
          .from('multi_sign_signatories' as any)
          .insert(signatories.map(s => ({
            template_id: (data as any).id,
            signatory_role: s.signatory_role,
            signatory_title: s.signatory_title || null,
            sign_order: s.sign_order,
            is_mandatory: s.is_mandatory,
            can_delegate: s.can_delegate,
            notes: s.notes || null,
          })));
        if (sigError) throw sigError;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['multi-sign-templates'] });
      toast.success('تم إنشاء القالب بنجاح');
      setShowCreateDialog(false);
      resetForm();
    },
    onError: () => toast.error('خطأ في إنشاء القالب'),
  });

  // Link shipment mutation
  const linkShipment = useMutation({
    mutationFn: async (shipmentId: string) => {
      if (!selectedTemplate || !profile) throw new Error('No template');
      const { error } = await supabase
        .from('multi_sign_shipments' as any)
        .insert({
          template_id: selectedTemplate.id,
          shipment_id: shipmentId,
          created_by: profile.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['multi-sign-shipments'] });
      toast.success('تم ربط الشحنة');
    },
    onError: () => toast.error('خطأ في ربط الشحنة'),
  });

  // Add comment mutation
  const addComment = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate || !profile) throw new Error('Missing');
      const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
      const mentions: any[] = [];
      let match;
      while ((match = mentionRegex.exec(commentText)) !== null) {
        mentions.push({ name: match[1], id: match[2] });
      }
      const { error } = await supabase
        .from('multi_sign_comments' as any)
        .insert({
          template_id: selectedTemplate.id,
          author_id: profile.id,
          content: commentText,
          mentions: mentions.length > 0 ? mentions : [],
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['multi-sign-comments'] });
      setCommentText('');
      toast.success('تم إضافة التعليق');
    },
  });

  // Toggle active
  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('multi_sign_templates' as any)
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['multi-sign-templates'] });
      toast.success('تم التحديث');
    },
  });

  // Delete template
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('multi_sign_templates' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['multi-sign-templates'] });
      toast.success('تم حذف القالب');
      setSelectedTemplate(null);
      setShowDetailDialog(false);
    },
  });

  const resetForm = () => {
    setFormData({
      title: '', description: '', template_type: 'shipment_release',
      category: 'operational', approval_mode: 'all', required_signatures_count: 1,
      auto_attach_to_shipments: false, priority: 'normal', content_template: '',
      notes: '', tags: '', is_active: true,
    });
    setSignatories([]);
  };

  const addSignatory = () => {
    setSignatories([...signatories, {
      signatory_role: 'مدير عام',
      signatory_title: '',
      sign_order: signatories.length + 1,
      is_mandatory: true,
      can_delegate: false,
      notes: '',
    }]);
  };

  const removeSignatory = (index: number) => {
    setSignatories(signatories.filter((_, i) => i !== index));
  };

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = !searchQuery || t.title.includes(searchQuery) || t.description?.includes(searchQuery);
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    const matchesType = filterType === 'all' || t.template_type === filterType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const stats = {
    total: templates.length,
    active: templates.filter(t => t.is_active).length,
    byMode: {
      all: templates.filter(t => t.approval_mode === 'all').length,
      joint: templates.filter(t => t.approval_mode === 'joint').length,
      individual: templates.filter(t => t.approval_mode === 'individual').length,
      sequential: templates.filter(t => t.approval_mode === 'sequential').length,
    },
  };

  const insertMention = (name: string, id: string) => {
    setCommentText(prev => prev + `@[${name}](${id}) `);
    setShowMentions(false);
    setMentionSearch('');
  };

  const filteredMentions = [...orgMembers.map(m => ({ id: m.id, name: m.full_name, type: 'user' })),
    ...partnerOrgs.map((o: any) => ({ id: o.id, name: o.name, type: 'org' }))
  ].filter(m => !mentionSearch || m.name?.toLowerCase().includes(mentionSearch.toLowerCase()));

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <BackButton />

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileSignature className="w-7 h-7 text-primary" />
              قوالب التوقيع المتعدد
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              إنشاء وإدارة قوالب المستندات التي تتطلب توقيعات من عدة مسؤولين
            </p>
          </div>
          <Button onClick={() => { resetForm(); setShowCreateDialog(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> إنشاء قالب جديد
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileSignature className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">إجمالي القوالب</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">نشطة</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.byMode.all + stats.byMode.sequential}</p>
                <p className="text-xs text-muted-foreground">توقيع كامل</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <ArrowUpDown className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.byMode.joint + stats.byMode.individual}</p>
                <p className="text-xs text-muted-foreground">توقيع جزئي</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-xl">
            <TabsTrigger value="templates" className="gap-1.5">
              <FileText className="w-4 h-4" /> القوالب
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-1.5">
              <Zap className="w-4 h-4" /> المرتبطة
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5">
              <BarChart3 className="w-4 h-4" /> التحليلات
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5">
              <Settings className="w-4 h-4" /> الإعدادات
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="بحث في القوالب..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pr-9"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل التصنيفات</SelectItem>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأنواع</SelectItem>
                  {TEMPLATE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : filteredTemplates.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center space-y-3">
                  <FileSignature className="w-16 h-16 mx-auto text-muted-foreground/20" />
                  <h3 className="text-lg font-semibold">لا توجد قوالب</h3>
                  <p className="text-sm text-muted-foreground">أنشئ قالب توقيع متعدد لبدء إدارة اعتمادات المستندات</p>
                  <Button onClick={() => { resetForm(); setShowCreateDialog(true); }} className="gap-2">
                    <Plus className="w-4 h-4" /> إنشاء أول قالب
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {filteredTemplates.map(template => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelectedTemplate(template); setShowDetailDialog(true); }}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-base">{template.title}</h3>
                            <Badge variant={template.is_active ? 'default' : 'secondary'} className="text-[10px]">
                              {template.is_active ? 'نشط' : 'معطل'}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {TEMPLATE_TYPES.find(t => t.value === template.template_type)?.label}
                            </Badge>
                            <Badge variant="outline" className={`text-[10px] ${PRIORITIES.find(p => p.value === template.priority)?.color}`}>
                              {PRIORITIES.find(p => p.value === template.priority)?.label}
                            </Badge>
                          </div>
                          {template.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{template.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {APPROVAL_MODES.find(m => m.value === template.approval_mode)?.label}
                              {template.approval_mode !== 'all' && ` (${template.required_signatures_count})`}
                            </span>
                            <span className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {CATEGORIES.find(c => c.value === template.category)?.label}
                            </span>
                            {template.auto_attach_to_shipments && (
                              <span className="flex items-center gap-1 text-primary">
                                <Zap className="w-3 h-3" /> ربط تلقائي
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <CalendarDays className="w-3 h-3" />
                              {new Date(template.created_at).toLocaleDateString('ar-EG')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <Switch
                            checked={template.is_active}
                            onCheckedChange={v => toggleActive.mutate({ id: template.id, is_active: v })}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Active/Linked Tab */}
          <TabsContent value="active" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">الشحنات المرتبطة بالقوالب</CardTitle>
              </CardHeader>
              <CardContent>
                {templates.filter(t => t.is_active).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">لا توجد قوالب نشطة مرتبطة بشحنات</p>
                ) : (
                  <div className="space-y-3">
                    {templates.filter(t => t.is_active).map(t => (
                      <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium text-sm">{t.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {APPROVAL_MODES.find(m => m.value === t.approval_mode)?.label}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => {
                          setSelectedTemplate(t);
                          setShowLinkDialog(true);
                        }}>
                          <Link2 className="w-3 h-3" /> ربط بشحنة
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-base">توزيع أنماط الاعتماد</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {APPROVAL_MODES.map(mode => {
                    const count = stats.byMode[mode.value as keyof typeof stats.byMode] || 0;
                    const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
                    return (
                      <div key={mode.value} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{mode.label}</span>
                          <span className="text-muted-foreground">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">توزيع التصنيفات</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {CATEGORIES.map(cat => {
                    const count = templates.filter(t => t.category === cat.value).length;
                    const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
                    return (
                      <div key={cat.value} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{cat.label}</span>
                          <span className="text-muted-foreground">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">إعدادات عامة</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">ربط تلقائي بالشحنات الجديدة</p>
                    <p className="text-xs text-muted-foreground">ربط القوالب المفعّلة تلقائياً بكل شحنة جديدة</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">إشعارات التوقيع</p>
                    <p className="text-xs text-muted-foreground">إرسال إشعارات عند طلب التوقيع</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">التذكير التلقائي</p>
                    <p className="text-xs text-muted-foreground">إرسال تذكيرات للموقعين المتأخرين</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">منع الخروج بدون توقيع</p>
                    <p className="text-xs text-muted-foreground">منع تقدم الشحنة حتى اكتمال التوقيعات المطلوبة</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ═══ Create Template Dialog ═══ */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSignature className="w-5 h-5" /> إنشاء قالب توقيع متعدد
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <Label>عنوان القالب *</Label>
                  <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="مثال: إذن خروج شحنة خطرة" />
                </div>
                <div className="md:col-span-2">
                  <Label>الوصف</Label>
                  <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="وصف مختصر للقالب..." rows={2} />
                </div>
                <div>
                  <Label>نوع المستند</Label>
                  <Select value={formData.template_type} onValueChange={v => setFormData({ ...formData, template_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>التصنيف</Label>
                  <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>الأولوية</Label>
                  <Select value={formData.priority} onValueChange={v => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>الوسوم</Label>
                  <Input value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} placeholder="وسم1, وسم2, وسم3" />
                </div>
              </div>

              <Separator />

              {/* Approval Mode */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">نمط الاعتماد</Label>
                <div className="grid grid-cols-2 gap-2">
                  {APPROVAL_MODES.map(mode => (
                    <div
                      key={mode.value}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.approval_mode === mode.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
                      onClick={() => setFormData({ ...formData, approval_mode: mode.value })}
                    >
                      <p className="text-sm font-medium">{mode.label}</p>
                      <p className="text-xs text-muted-foreground">{mode.description}</p>
                    </div>
                  ))}
                </div>
                {(formData.approval_mode === 'joint') && (
                  <div>
                    <Label>عدد التوقيعات المطلوبة</Label>
                    <Input type="number" min={1} value={formData.required_signatures_count} onChange={e => setFormData({ ...formData, required_signatures_count: parseInt(e.target.value) || 1 })} />
                  </div>
                )}
              </div>

              <Separator />

              {/* Signatories */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">الموقعون المطلوبون</Label>
                  <Button size="sm" variant="outline" onClick={addSignatory} className="gap-1">
                    <Plus className="w-3 h-3" /> إضافة موقع
                  </Button>
                </div>
                {signatories.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">لم يتم إضافة موقعين بعد</p>
                )}
                {signatories.map((sig, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">الموقع #{idx + 1}</Badge>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeSignatory(idx)}>
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">الدور / المنصب</Label>
                          <Select value={sig.signatory_role} onValueChange={v => {
                            const updated = [...signatories];
                            updated[idx].signatory_role = v;
                            setSignatories(updated);
                          }}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {SIGNATORY_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">المسمى الوظيفي</Label>
                          <Input className="h-8 text-xs" value={sig.signatory_title} onChange={e => {
                            const updated = [...signatories];
                            updated[idx].signatory_title = e.target.value;
                            setSignatories(updated);
                          }} placeholder="اختياري" />
                        </div>
                        <div>
                          <Label className="text-xs">ترتيب التوقيع</Label>
                          <Input className="h-8 text-xs" type="number" min={1} value={sig.sign_order} onChange={e => {
                            const updated = [...signatories];
                            updated[idx].sign_order = parseInt(e.target.value) || 1;
                            setSignatories(updated);
                          }} />
                        </div>
                        <div className="flex items-end gap-4">
                          <label className="flex items-center gap-1 text-xs">
                            <Switch checked={sig.is_mandatory} onCheckedChange={v => {
                              const updated = [...signatories];
                              updated[idx].is_mandatory = v;
                              setSignatories(updated);
                            }} />
                            إلزامي
                          </label>
                          <label className="flex items-center gap-1 text-xs">
                            <Switch checked={sig.can_delegate} onCheckedChange={v => {
                              const updated = [...signatories];
                              updated[idx].can_delegate = v;
                              setSignatories(updated);
                            }} />
                            قابل للتفويض
                          </label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Separator />

              {/* Options */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">ربط تلقائي بالشحنات</p>
                    <p className="text-xs text-muted-foreground">ربط القالب آلياً بكل شحنة جديدة</p>
                  </div>
                  <Switch checked={formData.auto_attach_to_shipments} onCheckedChange={v => setFormData({ ...formData, auto_attach_to_shipments: v })} />
                </div>
                <div>
                  <Label>محتوى القالب (اختياري)</Label>
                  <Textarea value={formData.content_template} onChange={e => setFormData({ ...formData, content_template: e.target.value })} placeholder="نص المستند أو النموذج..." rows={4} />
                </div>
                <div>
                  <Label>ملاحظات داخلية</Label>
                  <Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="ملاحظات للاستخدام الداخلي..." rows={2} />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>إلغاء</Button>
              <Button onClick={() => createTemplate.mutate()} disabled={!formData.title || createTemplate.isPending} className="gap-2">
                {createTemplate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                إنشاء القالب
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ═══ Template Detail Dialog ═══ */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedTemplate && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileSignature className="w-5 h-5" /> {selectedTemplate.title}
                  </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="info">
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="info">التفاصيل</TabsTrigger>
                    <TabsTrigger value="signatories">الموقعون</TabsTrigger>
                    <TabsTrigger value="shipments">الشحنات</TabsTrigger>
                    <TabsTrigger value="comments">التعليقات</TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="space-y-3 mt-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-muted-foreground">النوع:</span> <Badge variant="outline">{TEMPLATE_TYPES.find(t => t.value === selectedTemplate.template_type)?.label}</Badge></div>
                      <div><span className="text-muted-foreground">التصنيف:</span> <Badge variant="outline">{CATEGORIES.find(c => c.value === selectedTemplate.category)?.label}</Badge></div>
                      <div><span className="text-muted-foreground">نمط الاعتماد:</span> <Badge>{APPROVAL_MODES.find(m => m.value === selectedTemplate.approval_mode)?.label}</Badge></div>
                      <div><span className="text-muted-foreground">الأولوية:</span> <Badge className={PRIORITIES.find(p => p.value === selectedTemplate.priority)?.color}>{PRIORITIES.find(p => p.value === selectedTemplate.priority)?.label}</Badge></div>
                    </div>
                    {selectedTemplate.description && <p className="text-sm">{selectedTemplate.description}</p>}
                    {selectedTemplate.content_template && (
                      <div className="p-3 bg-muted/30 rounded-lg text-sm whitespace-pre-wrap">{selectedTemplate.content_template}</div>
                    )}
                    {selectedTemplate.tags && selectedTemplate.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {selectedTemplate.tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => { setShowLinkDialog(true); }}>
                        <Link2 className="w-3 h-3" /> ربط بشحنة
                      </Button>
                      <Button size="sm" variant="destructive" className="gap-1" onClick={() => {
                        if (confirm('هل أنت متأكد من حذف هذا القالب؟')) deleteTemplate.mutate(selectedTemplate.id);
                      }}>
                        <Trash2 className="w-3 h-3" /> حذف
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="signatories" className="mt-3">
                    {templateSignatories.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">لا يوجد موقعون محددون</p>
                    ) : (
                      <div className="space-y-2">
                        {templateSignatories.map((sig, idx) => (
                          <div key={sig.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                {sig.sign_order}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{sig.signatory_role}</p>
                                {sig.signatory_title && <p className="text-xs text-muted-foreground">{sig.signatory_title}</p>}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {sig.is_mandatory && <Badge variant="outline" className="text-[10px]">إلزامي</Badge>}
                              {sig.can_delegate && <Badge variant="secondary" className="text-[10px]">قابل للتفويض</Badge>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="shipments" className="mt-3">
                    {linkedShipments.length === 0 ? (
                      <div className="text-center py-6 space-y-2">
                        <Package className="w-10 h-10 mx-auto text-muted-foreground/20" />
                        <p className="text-sm text-muted-foreground">لا توجد شحنات مرتبطة</p>
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowLinkDialog(true)}>
                          <Link2 className="w-3 h-3" /> ربط بشحنة
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {linkedShipments.map((ls: any) => (
                          <div key={ls.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <p className="text-sm font-medium">{ls.shipment?.shipment_number || ls.shipment_id}</p>
                              <p className="text-xs text-muted-foreground">{ls.shipment?.waste_type}</p>
                            </div>
                            <Badge variant={ls.status === 'completed' ? 'default' : ls.status === 'rejected' ? 'destructive' : 'secondary'}>
                              {ls.status === 'pending' ? 'قيد الانتظار' : ls.status === 'completed' ? 'مكتمل' : ls.status === 'rejected' ? 'مرفوض' : ls.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="comments" className="mt-3 space-y-3">
                    {/* Comment Input with @mention */}
                    <div className="relative">
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <Textarea
                            value={commentText}
                            onChange={e => {
                              setCommentText(e.target.value);
                              const lastAt = e.target.value.lastIndexOf('@');
                              if (lastAt >= 0 && lastAt === e.target.value.length - 1) {
                                setShowMentions(true);
                                setMentionSearch('');
                              } else if (lastAt >= 0) {
                                const after = e.target.value.slice(lastAt + 1);
                                if (!after.includes(' ')) {
                                  setShowMentions(true);
                                  setMentionSearch(after);
                                } else {
                                  setShowMentions(false);
                                }
                              }
                            }}
                            placeholder="أضف تعليقاً... استخدم @ للإشارة"
                            rows={2}
                          />
                          {showMentions && (
                            <Card className="absolute bottom-full mb-1 w-full z-50 max-h-48 overflow-y-auto">
                              <CardContent className="p-1">
                                {filteredMentions.map(m => (
                                  <div
                                    key={m.id}
                                    className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer text-sm"
                                    onClick={() => {
                                      const lastAt = commentText.lastIndexOf('@');
                                      const before = commentText.slice(0, lastAt);
                                      setCommentText(before);
                                      insertMention(m.name, m.id);
                                    }}
                                  >
                                    {m.type === 'user' ? <Users className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                                    <span>{m.name}</span>
                                    <Badge variant="outline" className="text-[9px] mr-auto">{m.type === 'user' ? 'مستخدم' : 'جهة'}</Badge>
                                  </div>
                                ))}
                              </CardContent>
                            </Card>
                          )}
                        </div>
                        <Button size="icon" onClick={() => { if (commentText.trim()) addComment.mutate(); }} disabled={!commentText.trim()}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Comments List */}
                    {(comments as any[]).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">لا توجد تعليقات</p>
                    ) : (
                      <div className="space-y-2">
                        {(comments as any[]).map((c: any) => (
                          <div key={c.id} className="flex gap-2 p-3 rounded-lg border">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={c.author?.avatar_url} />
                              <AvatarFallback className="text-xs">{c.author?.full_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{c.author?.full_name}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(c.created_at).toLocaleDateString('ar-EG')}
                                </span>
                              </div>
                              <p className="text-sm mt-1">{c.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* ═══ Link Shipment Dialog ═══ */}
        <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5" /> ربط بشحنة
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2 p-1">
                {availableShipments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">لا توجد شحنات متاحة</p>
                ) : (
                  availableShipments.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30">
                      <div>
                        <p className="text-sm font-medium">{s.shipment_number}</p>
                        <p className="text-xs text-muted-foreground">{s.waste_type} • {s.status}</p>
                      </div>
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => {
                        linkShipment.mutate(s.id);
                      }} disabled={linkShipment.isPending}>
                        <Link2 className="w-3 h-3" /> ربط
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
