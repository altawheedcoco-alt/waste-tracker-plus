import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Building2, Plus, Search, Upload, Eye, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import CompanyDetailsDialog from '@/components/regulated-companies/CompanyDetailsDialog';
import EditCompanyDialog from '@/components/regulated-companies/EditCompanyDialog';
import ExpiryAlerts from '@/components/regulated-companies/ExpiryAlerts';
import ExportButtons from '@/components/regulated-companies/ExportButtons';

const LICENSE_TYPES = [
  { value: 'medical', label: 'نفايات طبية' },
  { value: 'solid', label: 'نفايات صلبة' },
  { value: 'electronic', label: 'نفايات إلكترونية' },
  { value: 'hazardous', label: 'نفايات خطرة' },
  { value: 'construction', label: 'مخلفات بناء' },
  { value: 'other', label: 'أخرى' },
];

const GOVERNORATES = ['القاهرة', 'الجيزة', 'الإسكندرية', 'الشرقية', 'الدقهلية', 'البحيرة', 'المنوفية', 'القليوبية', 'الغربية', 'كفر الشيخ', 'دمياط', 'بورسعيد', 'الإسماعيلية', 'السويس', 'شمال سيناء', 'جنوب سيناء', 'البحر الأحمر', 'الوادي الجديد', 'مطروح', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان'];

const RegulatedCompanies = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState({
    company_name: '', company_name_ar: '', license_type: 'solid', license_number: '',
    license_expiry_date: '', governorate: 'القاهرة', city: '', address: '',
    contact_person: '', contact_phone: '', contact_email: '', activity_description: '',
  });

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['regulated-companies', search, filterType],
    queryFn: async () => {
      let query = supabase.from('regulated_companies').select('*').order('created_at', { ascending: false });
      if (search) query = query.or(`company_name.ilike.%${search}%,company_name_ar.ilike.%${search}%`);
      if (filterType !== 'all') query = query.eq('license_type', filterType);
      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (newCompany: typeof form) => {
      const { error } = await supabase.from('regulated_companies').insert([newCompany as any]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم إضافة الشركة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['regulated-companies'] });
      setShowAdd(false);
      setForm({ company_name: '', company_name_ar: '', license_type: 'solid', license_number: '', license_expiry_date: '', governorate: 'القاهرة', city: '', address: '', contact_person: '', contact_phone: '', contact_email: '', activity_description: '' });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('regulated_companies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم حذف الشركة');
      queryClient.invalidateQueries({ queryKey: ['regulated-companies'] });
      setDeleteTarget(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) { toast.error('ملف فارغ'); return; }
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows = lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim());
      const obj: any = {};
      headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
      return {
        company_name: obj.company_name || obj.name || '',
        company_name_ar: obj.company_name_ar || obj.name_ar || '',
        license_type: obj.license_type || 'other',
        license_number: obj.license_number || '',
        license_expiry_date: obj.license_expiry_date || null,
        governorate: obj.governorate || 'القاهرة',
        city: obj.city || '',
        contact_phone: obj.contact_phone || obj.phone || '',
        contact_email: obj.contact_email || obj.email || '',
      };
    }).filter(r => r.company_name);
    const { error } = await supabase.from('regulated_companies').insert(rows as any);
    if (error) { toast.error('خطأ في الاستيراد: ' + error.message); }
    else { toast.success(`تم استيراد ${rows.length} شركة`); queryClient.invalidateQueries({ queryKey: ['regulated-companies'] }); }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'expired': return 'destructive';
      case 'suspended': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6">
        <BackButton />
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-7 h-7 text-primary" />
            <div>
              <h1 className="text-xl font-bold">سجل الشركات المنظمة</h1>
              <p className="text-sm text-muted-foreground">إدارة بيانات الشركات وتراخيصها</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ExportButtons companies={companies} />
            <label className="cursor-pointer">
              <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
              <Button variant="outline" size="sm" asChild><span><Upload className="w-4 h-4 ml-1" />CSV</span></Button>
            </label>
            <Dialog open={showAdd} onOpenChange={setShowAdd}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 ml-1" />إضافة</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader><DialogTitle>إضافة شركة جديدة</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div><Label>اسم الشركة (إنجليزي)</Label><Input fieldContext="company_name" value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))} /></div>
                  <div><Label>اسم الشركة (عربي)</Label><Input fieldContext="company_name_ar" value={form.company_name_ar} onChange={e => setForm(p => ({ ...p, company_name_ar: e.target.value }))} /></div>
                  <div><Label>نوع الترخيص</Label>
                    <Select value={form.license_type} onValueChange={v => setForm(p => ({ ...p, license_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{LICENSE_TYPES.map(lt => <SelectItem key={lt.value} value={lt.value}>{lt.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>رقم الترخيص</Label><Input fieldContext="license_number" value={form.license_number} onChange={e => setForm(p => ({ ...p, license_number: e.target.value }))} /></div>
                  <div><Label>تاريخ انتهاء الترخيص</Label><Input type="date" value={form.license_expiry_date} onChange={e => setForm(p => ({ ...p, license_expiry_date: e.target.value }))} /></div>
                  <div><Label>المحافظة</Label>
                    <Select value={form.governorate} onValueChange={v => setForm(p => ({ ...p, governorate: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{GOVERNORATES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>المدينة</Label><Input fieldContext="city" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} /></div>
                  <div><Label>جهة الاتصال</Label><Input fieldContext="contact_person" value={form.contact_person} onChange={e => setForm(p => ({ ...p, contact_person: e.target.value }))} /></div>
                  <div><Label>الهاتف</Label><Input fieldContext="contact_phone" value={form.contact_phone} onChange={e => setForm(p => ({ ...p, contact_phone: e.target.value }))} /></div>
                  <div><Label>البريد الإلكتروني</Label><Input fieldContext="contact_email" value={form.contact_email} onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))} /></div>
                  <Button onClick={() => addMutation.mutate(form)} disabled={!form.company_name || addMutation.isPending}>
                    {addMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Expiry Alerts */}
        <ExpiryAlerts companies={companies} />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="بحث بالاسم..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48"><SelectValue placeholder="نوع الترخيص" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              {LICENSE_TYPES.map(lt => <SelectItem key={lt.value} value={lt.value}>{lt.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-right p-3">اسم الشركة</th>
                    <th className="text-right p-3">نوع الترخيص</th>
                    <th className="text-right p-3">رقم الترخيص</th>
                    <th className="text-right p-3">المحافظة</th>
                    <th className="text-right p-3">تاريخ الانتهاء</th>
                    <th className="text-right p-3">الحالة</th>
                    <th className="text-right p-3">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={7} className="text-center p-8 text-muted-foreground">جاري التحميل...</td></tr>
                  ) : companies.length === 0 ? (
                    <tr><td colSpan={7} className="text-center p-8 text-muted-foreground">لا توجد شركات مسجلة بعد</td></tr>
                  ) : (
                    companies.map((c: any) => (
                      <tr key={c.id} className="border-b hover:bg-muted/30">
                        <td className="p-3 font-medium">{c.company_name_ar || c.company_name}</td>
                        <td className="p-3"><Badge variant="outline">{LICENSE_TYPES.find(l => l.value === c.license_type)?.label || c.license_type}</Badge></td>
                        <td className="p-3">{c.license_number || '-'}</td>
                        <td className="p-3">{c.governorate}</td>
                        <td className="p-3">{c.license_expiry_date || '-'}</td>
                        <td className="p-3"><Badge variant={statusColor(c.license_status)}>{c.license_status === 'active' ? 'ساري' : c.license_status === 'expired' ? 'منتهي' : c.license_status}</Badge></td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedCompany(c); setShowDetails(true); }}><Eye className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedCompany(c); setShowEdit(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(c)}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <CompanyDetailsDialog company={selectedCompany} open={showDetails} onOpenChange={setShowDetails} />
      <EditCompanyDialog company={selectedCompany} open={showEdit} onOpenChange={setShowEdit} />
      <AlertDialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف "{deleteTarget?.company_name_ar || deleteTarget?.company_name}"؟ لا يمكن التراجع.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} className="bg-destructive text-destructive-foreground">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default RegulatedCompanies;
