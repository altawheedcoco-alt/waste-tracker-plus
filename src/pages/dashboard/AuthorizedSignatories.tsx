import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Shield, Users, Loader2, Search } from 'lucide-react';
import SignatoryCard from '@/components/signatories/SignatoryCard';
import AutoSignatureSettings from '@/components/signatories/AutoSignatureSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap } from 'lucide-react';

interface Signatory {
  id: string;
  user_id: string;
  organization_id: string;
  full_name: string;
  job_title: string | null;
  national_id: string | null;
  authority_level: string;
  can_sign_shipments: boolean | null;
  can_sign_contracts: boolean | null;
  can_sign_invoices: boolean | null;
  can_sign_certificates: boolean | null;
  is_active: boolean | null;
  signatory_code: string | null;
  signature_image_url: string | null;
  created_at: string;
  activated_at: string | null;
  created_by: string | null;
}

interface OrgMember {
  id: string;
  full_name: string | null;
  email: string | null;
}

const emptyForm = {
  user_id: '',
  full_name: '',
  job_title: '',
  national_id: '',
  authority_level: 'standard',
  can_sign_shipments: false,
  can_sign_contracts: false,
  can_sign_invoices: false,
  can_sign_certificates: false,
};

const AuthorizedSignatories = () => {
  const { user, organization } = useAuth();
  const [signatories, setSignatories] = useState<Signatory[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const orgId = organization?.id;

  const fetchSignatories = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('authorized_signatories')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      toast.error('فشل في تحميل المفوضين');
    } else {
      setSignatories((data || []) as Signatory[]);
    }
    setLoading(false);
  }, [orgId]);

  const fetchMembers = useCallback(async () => {
    if (!orgId) return;
    const { data } = await supabase
      .from('user_organizations')
      .select('user_id, profiles:user_id(id, full_name, email)')
      .eq('organization_id', orgId);

    if (data) {
      const mapped = data.map((d: any) => ({
        id: d.profiles?.id || d.user_id,
        full_name: d.profiles?.full_name || null,
        email: d.profiles?.email || null,
      }));
      setMembers(mapped);
    }
  }, [orgId]);

  useEffect(() => {
    fetchSignatories();
    fetchMembers();
  }, [fetchSignatories, fetchMembers]);

  const handleMemberSelect = (userId: string) => {
    const member = members.find(m => m.id === userId);
    setForm(prev => ({
      ...prev,
      user_id: userId,
      full_name: member?.full_name || '',
    }));
  };

  const handleSave = async () => {
    if (!orgId || !user?.id) return;
    if (!form.user_id || !form.full_name) {
      toast.error('يرجى اختيار الموظف وإدخال الاسم');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        organization_id: orgId,
        user_id: form.user_id,
        full_name: form.full_name,
        job_title: form.job_title || null,
        national_id: form.national_id || null,
        authority_level: form.authority_level,
        can_sign_shipments: form.can_sign_shipments,
        can_sign_contracts: form.can_sign_contracts,
        can_sign_invoices: form.can_sign_invoices,
        can_sign_certificates: form.can_sign_certificates,
        is_active: true,
        created_by: user.id,
      };

      if (editingId) {
        const { error } = await supabase
          .from('authorized_signatories')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('تم تحديث المفوض بنجاح');
      } else {
        const { error } = await supabase
          .from('authorized_signatories')
          .insert(payload);
        if (error) throw error;
        toast.success('تم إضافة المفوض بنجاح');
      }

      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      await fetchSignatories();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'حدث خطأ');
    }
    setSaving(false);
  };

  const handleEdit = (sig: any) => {
    setEditingId(sig.id);
    setForm({
      user_id: sig.user_id,
      full_name: sig.full_name,
      job_title: sig.job_title || '',
      national_id: sig.national_id || '',
      authority_level: sig.authority_level,
      can_sign_shipments: !!sig.can_sign_shipments,
      can_sign_contracts: !!sig.can_sign_contracts,
      can_sign_invoices: !!sig.can_sign_invoices,
      can_sign_certificates: !!sig.can_sign_certificates,
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('authorized_signatories').delete().eq('id', deleteId);
    if (error) {
      toast.error('فشل في حذف المفوض');
    } else {
      toast.success('تم حذف المفوض');
      await fetchSignatories();
    }
    setDeleteId(null);
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('authorized_signatories')
      .update({ is_active: isActive, ...(isActive ? { activated_at: new Date().toISOString() } : { deactivated_at: new Date().toISOString() }) })
      .eq('id', id);
    if (error) {
      toast.error('فشل في تغيير الحالة');
    } else {
      toast.success(isActive ? 'تم تفعيل المفوض' : 'تم تعطيل المفوض');
      await fetchSignatories();
    }
  };

  const verificationBaseUrl = window.location.origin;
  const filtered = signatories.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.signatory_code?.toLowerCase().includes(search.toLowerCase()) ||
    s.job_title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        <BackButton />

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              المفوضون المعتمدون بالتوقيع
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              إدارة صلاحيات التوقيع على المستندات الرسمية مع باركود وكود QR لكل مفوض
            </p>
          </div>
        </div>

        <Tabs defaultValue="signatories" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="signatories" className="gap-2"><Shield className="w-4 h-4" />المفوضون</TabsTrigger>
            <TabsTrigger value="auto-sign" className="gap-2"><Zap className="w-4 h-4" />التوقيع التلقائي</TabsTrigger>
          </TabsList>

          <TabsContent value="signatories" className="space-y-6 mt-4">
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); setForm(emptyForm); } }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                إضافة مفوض
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>{editingId ? 'تعديل مفوض' : 'إضافة مفوض جديد'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>الموظف</Label>
                  <Select value={form.user_id} onValueChange={handleMemberSelect}>
                    <SelectTrigger><SelectValue placeholder="اختر موظفاً" /></SelectTrigger>
                    <SelectContent>
                      {members.map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.full_name || m.email || m.id.slice(0, 8)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>الاسم الكامل</Label>
                  <Input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
                </div>
                <div>
                  <Label>المسمى الوظيفي</Label>
                  <Input value={form.job_title} onChange={e => setForm(p => ({ ...p, job_title: e.target.value }))} />
                </div>
                <div>
                  <Label>الرقم القومي</Label>
                  <Input value={form.national_id} onChange={e => setForm(p => ({ ...p, national_id: e.target.value }))} />
                </div>
                <div>
                  <Label>مستوى السلطة</Label>
                  <Select value={form.authority_level} onValueChange={v => setForm(p => ({ ...p, authority_level: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">عادي</SelectItem>
                      <SelectItem value="senior">أعلى</SelectItem>
                      <SelectItem value="executive">تنفيذي</SelectItem>
                      <SelectItem value="ceo">المدير العام</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">صلاحيات التوقيع</Label>
                  {[
                    { key: 'can_sign_shipments', label: 'توقيع مستندات الشحنات' },
                    { key: 'can_sign_contracts', label: 'توقيع العقود' },
                    { key: 'can_sign_invoices', label: 'توقيع الفواتير' },
                    { key: 'can_sign_certificates', label: 'توقيع الشهادات' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <Checkbox
                        checked={!!(form as any)[key]}
                        onCheckedChange={checked => setForm(p => ({ ...p, [key]: !!checked }))}
                      />
                      <span className="text-sm">{label}</span>
                    </div>
                  ))}
                </div>

                <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'تحديث' : 'إضافة'}
                </Button>
              </div>
            </DialogContent>
           </Dialog>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{signatories.length}</p>
            <p className="text-xs text-muted-foreground">إجمالي المفوضين</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{signatories.filter(s => s.is_active).length}</p>
            <p className="text-xs text-muted-foreground">نشط</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{signatories.filter(s => !s.is_active).length}</p>
            <p className="text-xs text-muted-foreground">غير نشط</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{signatories.filter(s => s.authority_level === 'executive' || s.authority_level === 'ceo').length}</p>
            <p className="text-xs text-muted-foreground">سلطة تنفيذية</p>
          </CardContent></Card>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو الكود..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">لا يوجد مفوضون</h3>
              <p className="text-sm text-muted-foreground mt-1">أضف مفوضين معتمدين لمنحهم صلاحية التوقيع على المستندات</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map(sig => (
              <SignatoryCard
                key={sig.id}
                signatory={sig}
                organizationName={organization?.name || ''}
                verificationBaseUrl={verificationBaseUrl}
                onEdit={handleEdit}
                onDelete={id => setDeleteId(id)}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>
        )}
          </TabsContent>

          <TabsContent value="auto-sign" className="mt-4">
            <AutoSignatureSettings />
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذا المفوض؟ لن يتمكن من التوقيع على أي مستندات بعد الحذف.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default AuthorizedSignatories;
