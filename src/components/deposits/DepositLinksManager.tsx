import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Link2,
  Plus,
  Copy,
  Trash2,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Share2,
  Settings2,
  Building2,
  Package,
  Lock,
  Unlock,
  FileText,
  Pin,
  PinOff,
  BarChart3,
  Clock,
  StickyNote,
  User,
} from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  type: 'organization' | 'external';
}

interface DepositLink {
  id: string;
  organization_id: string;
  token: string;
  title: string | null;
  description: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  preset_partner_id: string | null;
  preset_external_partner_id: string | null;
  preset_waste_type: string | null;
  preset_category: string | null;
  preset_notes: string | null;
  allow_amount_edit: boolean;
  allow_date_edit: boolean;
  allow_partner_edit: boolean;
  require_receipt: boolean;
  // New enhanced fields
  is_pinned: boolean;
  usage_count: number;
  last_used_at: string | null;
  notes: string | null;
}

const wasteTypes = [
  { value: 'wood', label: 'أخشاب' },
  { value: 'plastic', label: 'بلاستيك' },
  { value: 'paper', label: 'ورق' },
  { value: 'metal', label: 'معادن' },
  { value: 'glass', label: 'زجاج' },
  { value: 'organic', label: 'عضوي' },
  { value: 'electronic', label: 'إلكتروني' },
  { value: 'hazardous', label: 'خطر' },
  { value: 'mixed', label: 'مختلط' },
  { value: 'other', label: 'أخرى' },
];

const generateToken = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

const DepositLinksManager = () => {
  const { profile } = useAuth();
  const [links, setLinks] = useState<DepositLink[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  
  // Preset fields
  const [presetPartnerId, setPresetPartnerId] = useState('');
  const [presetPartnerType, setPresetPartnerType] = useState<'organization' | 'external' | ''>('');
  const [presetWasteType, setPresetWasteType] = useState('');
  const [presetCategory, setPresetCategory] = useState('');
  const [presetNotes, setPresetNotes] = useState('');
  const [allowAmountEdit, setAllowAmountEdit] = useState(true);
  const [allowDateEdit, setAllowDateEdit] = useState(true);
  const [allowPartnerEdit, setAllowPartnerEdit] = useState(false);
  const [requireReceipt, setRequireReceipt] = useState(false);

  const loadLinks = async () => {
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('organization_deposit_links')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error loading links:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPartners = async () => {
    if (!profile?.organization_id) return;

    try {
      // Load registered partner organizations
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .neq('id', profile.organization_id)
        .order('name');

      // Load external partners
      const { data: externals } = await supabase
        .from('external_partners')
        .select('id, name')
        .eq('organization_id', profile.organization_id)
        .order('name');

      const allPartners: Partner[] = [
        ...(orgs || []).map(o => ({ id: o.id, name: o.name, type: 'organization' as const })),
        ...(externals || []).map(e => ({ id: e.id, name: `${e.name} (خارجي)`, type: 'external' as const })),
      ];

      setPartners(allPartners);
    } catch (error) {
      console.error('Error loading partners:', error);
    }
  };

  useEffect(() => {
    loadLinks();
    loadPartners();
  }, [profile?.organization_id]);

  const resetForm = () => {
    setNewTitle('');
    setNewDescription('');
    setHasExpiry(false);
    setExpiryDate('');
    setPresetPartnerId('');
    setPresetPartnerType('');
    setPresetWasteType('');
    setPresetCategory('');
    setPresetNotes('');
    setAllowAmountEdit(true);
    setAllowDateEdit(true);
    setAllowPartnerEdit(false);
    setRequireReceipt(false);
  };

  const createLink = async () => {
    if (!profile?.organization_id) return;

    setCreating(true);
    try {
      const token = generateToken();
      const selectedPartner = partners.find(p => p.id === presetPartnerId);
      
      const insertData: any = {
        organization_id: profile.organization_id,
        token,
        title: newTitle || 'رابط إيداع سريع',
        description: newDescription || null,
        expires_at: hasExpiry && expiryDate ? new Date(expiryDate).toISOString() : null,
        created_by: profile.id,
        preset_waste_type: presetWasteType || null,
        preset_category: presetCategory || null,
        preset_notes: presetNotes || null,
        allow_amount_edit: allowAmountEdit,
        allow_date_edit: allowDateEdit,
        allow_partner_edit: allowPartnerEdit,
        require_receipt: requireReceipt,
      };

      // Set partner based on type
      if (selectedPartner) {
        if (selectedPartner.type === 'organization') {
          insertData.preset_partner_id = presetPartnerId;
        } else {
          insertData.preset_external_partner_id = presetPartnerId;
        }
      }

      const { error } = await supabase
        .from('organization_deposit_links')
        .insert(insertData);

      if (error) throw error;

      toast.success('✅ تم إنشاء الرابط بنجاح');
      setDialogOpen(false);
      resetForm();
      loadLinks();
    } catch (error) {
      console.error('Error creating link:', error);
      toast.error('فشل في إنشاء الرابط');
    } finally {
      setCreating(false);
    }
  };

  const toggleLink = async (linkId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('organization_deposit_links')
        .update({ is_active: !isActive })
        .eq('id', linkId);

      if (error) throw error;
      
      loadLinks();
      toast.success(isActive ? 'تم إيقاف الرابط' : 'تم تفعيل الرابط');
    } catch (error) {
      console.error('Error toggling link:', error);
      toast.error('فشل في تحديث الرابط');
    }
  };

  const deleteLink = async (linkId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الرابط؟')) return;

    try {
      const { error } = await supabase
        .from('organization_deposit_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;
      
      loadLinks();
      toast.success('تم حذف الرابط');
    } catch (error) {
      console.error('Error deleting link:', error);
      toast.error('فشل في حذف الرابط');
    }
  };

  const togglePin = async (linkId: string, isPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('organization_deposit_links')
        .update({ is_pinned: !isPinned })
        .eq('id', linkId);

      if (error) throw error;
      
      loadLinks();
      toast.success(isPinned ? 'تم إلغاء التثبيت' : 'تم تثبيت الرابط');
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error('فشل في تحديث الرابط');
    }
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/deposit/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('تم نسخ الرابط');
  };

  const shareLink = async (link: DepositLink) => {
    const url = `${window.location.origin}/deposit/${link.token}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: link.title || 'رابط إيداع سريع',
          text: link.description || 'أرسل إيداعك بسهولة',
          url,
        });
      } catch (error) {
        copyLink(link.token);
      }
    } else {
      copyLink(link.token);
    }
  };

  const getPartnerName = (link: DepositLink) => {
    if (link.preset_partner_id) {
      const partner = partners.find(p => p.id === link.preset_partner_id);
      return partner?.name || 'شريك محدد';
    }
    if (link.preset_external_partner_id) {
      const partner = partners.find(p => p.id === link.preset_external_partner_id);
      return partner?.name || 'شريك خارجي';
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Check if user has an organization
  if (!profile?.organization_id) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">لا يوجد جهة مرتبطة</h3>
            <p className="text-muted-foreground">
              هذه الميزة متاحة فقط للشركات المسجلة. يرجى التواصل مع المسؤول لربط حسابك بجهة.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              روابط الإيداع السريع
            </CardTitle>
            <CardDescription>
              أنشئ روابط مخصصة لاستقبال الإيداعات مع بيانات محددة مسبقاً
            </CardDescription>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                إنشاء رابط جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>إنشاء رابط إيداع جديد</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 pt-4">
                {/* Basic Info */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>عنوان الرابط</Label>
                    <Input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="مثال: إيداعات شركة نستلة"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>الوصف (اختياري)</Label>
                    <Textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="تعليمات أو معلومات للمودع..."
                      rows={2}
                    />
                  </div>
                </div>

                <Separator />

                {/* Preset Data Section */}
                <Accordion type="single" collapsible defaultValue="preset">
                  <AccordionItem value="preset" className="border-none">
                    <AccordionTrigger className="py-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Settings2 className="h-4 w-4 text-primary" />
                        البيانات الثابتة (محددة مسبقاً)
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                      {/* Partner Selection */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          الجهة المرتبطة
                        </Label>
                        <Select value={presetPartnerId} onValueChange={(val) => {
                          setPresetPartnerId(val);
                          const partner = partners.find(p => p.id === val);
                          if (partner) setPresetPartnerType(partner.type);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الجهة المرتبطة بالإيداع..." />
                          </SelectTrigger>
                          <SelectContent>
                            {partners.map((partner) => (
                              <SelectItem key={partner.id} value={partner.id}>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {partner.type === 'external' ? 'خارجي' : 'مسجل'}
                                  </Badge>
                                  {partner.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          سيتم ربط جميع الإيداعات عبر هذا الرابط بهذه الجهة
                        </p>
                      </div>

                      {/* Waste Type */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          نوع المخلفات
                        </Label>
                        <Select value={presetWasteType} onValueChange={setPresetWasteType}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر نوع المخلفات..." />
                          </SelectTrigger>
                          <SelectContent>
                            {wasteTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Category */}
                      <div className="space-y-2">
                        <Label>التصنيف / الوصف</Label>
                        <Input
                          value={presetCategory}
                          onChange={(e) => setPresetCategory(e.target.value)}
                          placeholder="مثال: مخلفات الأخشاب - مصنع بنها"
                        />
                      </div>

                      {/* Preset Notes */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          ملاحظات ثابتة
                        </Label>
                        <Textarea
                          value={presetNotes}
                          onChange={(e) => setPresetNotes(e.target.value)}
                          placeholder="ملاحظات تظهر مع كل إيداع..."
                          rows={2}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="permissions" className="border-none">
                    <AccordionTrigger className="py-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Lock className="h-4 w-4 text-amber-600" />
                        صلاحيات المستخدم
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-2">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          {allowAmountEdit ? <Unlock className="h-4 w-4 text-emerald-600" /> : <Lock className="h-4 w-4 text-amber-600" />}
                          <Label className="cursor-pointer">السماح بتعديل المبلغ</Label>
                        </div>
                        <Switch checked={allowAmountEdit} onCheckedChange={setAllowAmountEdit} />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          {allowDateEdit ? <Unlock className="h-4 w-4 text-emerald-600" /> : <Lock className="h-4 w-4 text-amber-600" />}
                          <Label className="cursor-pointer">السماح بتعديل التاريخ</Label>
                        </div>
                        <Switch checked={allowDateEdit} onCheckedChange={setAllowDateEdit} />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          {allowPartnerEdit ? <Unlock className="h-4 w-4 text-emerald-600" /> : <Lock className="h-4 w-4 text-amber-600" />}
                          <Label className="cursor-pointer">السماح بتغيير الجهة</Label>
                        </div>
                        <Switch checked={allowPartnerEdit} onCheckedChange={setAllowPartnerEdit} />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          {requireReceipt ? <Lock className="h-4 w-4 text-amber-600" /> : <Unlock className="h-4 w-4 text-emerald-600" />}
                          <Label className="cursor-pointer">إلزام رفع صورة الإيصال</Label>
                        </div>
                        <Switch checked={requireReceipt} onCheckedChange={setRequireReceipt} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <Separator />

                {/* Expiry */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>تحديد تاريخ انتهاء</Label>
                    <Switch checked={hasExpiry} onCheckedChange={setHasExpiry} />
                  </div>
                  
                  {hasExpiry && (
                    <div className="space-y-2">
                      <Label>تاريخ الانتهاء</Label>
                      <Input
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={createLink} 
                  disabled={creating}
                  className="w-full"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  ) : (
                    <Plus className="h-4 w-4 ml-2" />
                  )}
                  إنشاء الرابط
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {links.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Link2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد روابط حتى الآن</p>
            <p className="text-sm">أنشئ رابطاً جديداً لاستقبال الإيداعات</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Pinned links first */}
            {links
              .sort((a, b) => {
                if (a.is_pinned && !b.is_pinned) return -1;
                if (!a.is_pinned && b.is_pinned) return 1;
                return 0;
              })
              .map((link, index) => {
              const isExpired = link.expires_at && new Date(link.expires_at) < new Date();
              const url = `${window.location.origin}/deposit/${link.token}`;
              const partnerName = getPartnerName(link);
              const wasteType = wasteTypes.find(w => w.value === link.preset_waste_type)?.label;
              
              return (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-lg border ${
                    link.is_pinned
                      ? 'bg-amber-50/50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-700'
                      : link.is_active && !isExpired 
                      ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' 
                      : 'bg-muted/30 border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {link.is_pinned && (
                          <Pin className="h-4 w-4 text-amber-600 shrink-0" />
                        )}
                        <h4 className="font-medium truncate">{link.title || 'رابط إيداع'}</h4>
                        {link.is_active && !isExpired ? (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            نشط
                          </Badge>
                        ) : isExpired ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            منتهي
                          </Badge>
                        ) : (
                          <Badge variant="secondary">معطل</Badge>
                        )}
                        {/* Usage stats badge */}
                        {(link.usage_count > 0) && (
                          <Badge variant="outline" className="gap-1 text-xs">
                            <BarChart3 className="h-3 w-3" />
                            {link.usage_count} استخدام
                          </Badge>
                        )}
                      </div>
                      
                      {/* Last used info */}
                      {link.last_used_at && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            آخر استخدام: {new Date(link.last_used_at).toLocaleDateString('ar-EG')}
                          </Badge>
                        </div>
                      )}
                      
                      {link.description && (
                        <p className="text-sm text-muted-foreground mb-2">{link.description}</p>
                      )}

                      {/* Preset Info */}
                      {(partnerName || wasteType || link.preset_category) && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {partnerName && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Building2 className="h-3 w-3" />
                              {partnerName}
                            </Badge>
                          )}
                          {wasteType && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Package className="h-3 w-3" />
                              {wasteType}
                            </Badge>
                          )}
                          {link.preset_category && (
                            <Badge variant="outline" className="text-xs">
                              {link.preset_category}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <code className="bg-muted px-2 py-1 rounded truncate max-w-[200px]">
                          {url}
                        </code>
                        {link.expires_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            ينتهي: {new Date(link.expires_at).toLocaleDateString('ar-EG')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => shareLink(link)}
                        title="مشاركة"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyLink(link.token)}
                        title="نسخ"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(`/deposit/${link.token}`, '_blank')}
                        title="فتح"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePin(link.id, link.is_pinned)}
                        title={link.is_pinned ? 'إلغاء التثبيت' : 'تثبيت'}
                        className={link.is_pinned ? 'text-amber-600' : ''}
                      >
                        {link.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                      </Button>
                      <Switch
                        checked={link.is_active}
                        onCheckedChange={() => toggleLink(link.id, link.is_active)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteLink(link.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DepositLinksManager;
