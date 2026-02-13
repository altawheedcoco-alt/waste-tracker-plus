import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, Loader2, Building2, UserPlus, Search, PenTool, Printer, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { type ContractFormData } from '@/hooks/useContracts';
import { type ContractorType } from '@/lib/contract-logic/contractEntityResolver';
import { type SigningMethod, signingMethodLabels, signingMethodDescriptions } from '@/lib/contract-logic/contractSigningTypes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PartnerOption {
  id: string;
  name: string;
  organization_type: string;
  address?: string;
  phone?: string;
  email?: string;
  commercial_register?: string;
  representative_name?: string;
}

interface ContractFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ContractFormData;
  setFormData: React.Dispatch<React.SetStateAction<ContractFormData>>;
  onSubmit: () => void;
  isEditing: boolean;
  saving: boolean;
  onReset: () => void;
}

const ContractFormDialog = ({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  isEditing,
  saving,
  onReset,
}: ContractFormDialogProps) => {
  const { organization } = useAuth();
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [partnerSearch, setPartnerSearch] = useState('');
  const [loadingPartners, setLoadingPartners] = useState(false);

  useEffect(() => {
    if (open && formData.contractor_type === 'internal') {
      fetchPartners();
    }
  }, [open, formData.contractor_type]);

  const fetchPartners = async () => {
    if (!organization?.id) return;
    setLoadingPartners(true);
    try {
      const { data } = await supabase
        .from('organizations')
        .select('id, name, organization_type, address, phone, email, commercial_register, representative_name')
        .neq('id', organization.id)
        .order('name');
      setPartners(data || []);
    } catch (e) {
      console.error('Error fetching partners:', e);
    } finally {
      setLoadingPartners(false);
    }
  };

  const handleSelectPartner = (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId);
    if (partner) {
      setFormData(p => ({
        ...p,
        partner_organization_id: partner.id,
        partner_name: partner.name,
      }));
    }
  };

  const filteredPartners = partners.filter(p =>
    !partnerSearch || p.name.toLowerCase().includes(partnerSearch.toLowerCase())
  );

  const selectedPartner = partners.find(p => p.id === formData.partner_organization_id);

  const signingIcons: Record<SigningMethod, React.ReactNode> = {
    none: <Ban className="w-4 h-4" />,
    digital: <PenTool className="w-4 h-4" />,
    manual: <Printer className="w-4 h-4" />,
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) onReset(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'تعديل العقد' : 'إضافة عقد جديد'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'تعديل بيانات العقد' : 'إدخال بيانات العقد الجديد'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Contract Title */}
          <div>
            <Label>عنوان العقد *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
              placeholder="عقد خدمات نقل النفايات"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>نوع العقد</Label>
              <Select value={formData.contract_type} onValueChange={(v) => setFormData(p => ({ ...p, contract_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">عقد خدمة</SelectItem>
                  <SelectItem value="supply">عقد توريد</SelectItem>
                  <SelectItem value="partnership">عقد شراكة</SelectItem>
                  <SelectItem value="maintenance">عقد صيانة</SelectItem>
                  <SelectItem value="transport">عقد نقل</SelectItem>
                  <SelectItem value="recycling">عقد تدوير</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>حالة العقد</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="pending">قيد العمل</SelectItem>
                  <SelectItem value="active">ساري</SelectItem>
                  <SelectItem value="expired">منتهي</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* ===== CONTRACTOR IDENTIFICATION ===== */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              تحديد هوية الطرف الآخر
            </Label>

            <Tabs
              value={formData.contractor_type}
              onValueChange={(v) => setFormData(p => ({
                ...p,
                contractor_type: v as ContractorType,
                partner_name: '',
                partner_organization_id: '',
              }))}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="internal" className="gap-2">
                  <Building2 className="w-4 h-4" />
                  جهة داخلية (مسجلة)
                </TabsTrigger>
                <TabsTrigger value="external" className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  جهة خارجية (جديدة)
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Internal: Searchable dropdown */}
            {formData.contractor_type === 'internal' && (
              <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="ابحث عن جهة مسجلة..."
                    value={partnerSearch}
                    onChange={(e) => setPartnerSearch(e.target.value)}
                    className="pr-10"
                  />
                </div>
                {loadingPartners ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {filteredPartners.map(partner => (
                      <div
                        key={partner.id}
                        onClick={() => handleSelectPartner(partner.id)}
                        className={cn(
                          "p-3 rounded-md cursor-pointer transition-all text-sm",
                          formData.partner_organization_id === partner.id
                            ? "bg-primary/10 border border-primary/30"
                            : "hover:bg-muted border border-transparent"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{partner.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {partner.organization_type === 'generator' ? 'مولد' :
                             partner.organization_type === 'recycler' ? 'مدور' :
                             partner.organization_type === 'transporter' ? 'ناقل' : partner.organization_type}
                          </Badge>
                        </div>
                        {partner.address && (
                          <p className="text-xs text-muted-foreground mt-1">{partner.address}</p>
                        )}
                      </div>
                    ))}
                    {filteredPartners.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-4">لا توجد نتائج</p>
                    )}
                  </div>
                )}

                {/* Auto-filled info */}
                {selectedPartner && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm space-y-1">
                    <p className="font-semibold text-primary">✓ تم تحديد: {selectedPartner.name}</p>
                    {selectedPartner.commercial_register && <p>السجل التجاري: {selectedPartner.commercial_register}</p>}
                    {selectedPartner.representative_name && <p>الممثل القانوني: {selectedPartner.representative_name}</p>}
                    {selectedPartner.address && <p>العنوان: {selectedPartner.address}</p>}
                    {selectedPartner.phone && <p>الهاتف: {selectedPartner.phone}</p>}
                  </div>
                )}
              </div>
            )}

            {/* External: Manual form */}
            {formData.contractor_type === 'external' && (
              <div className="space-y-3 p-4 border rounded-lg bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-700 dark:text-amber-400 mb-2">
                  أدخل بيانات الجهة الخارجية يدوياً
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label>الاسم القانوني *</Label>
                    <Input
                      value={formData.external_legal_name}
                      onChange={(e) => setFormData(p => ({ ...p, external_legal_name: e.target.value }))}
                      placeholder="الاسم الرسمي للجهة"
                    />
                  </div>
                  <div>
                    <Label>البطاقة الضريبية</Label>
                    <Input
                      value={formData.external_tax_id}
                      onChange={(e) => setFormData(p => ({ ...p, external_tax_id: e.target.value }))}
                      placeholder="رقم البطاقة الضريبية"
                    />
                  </div>
                  <div>
                    <Label>السجل التجاري</Label>
                    <Input
                      value={formData.external_commercial_register}
                      onChange={(e) => setFormData(p => ({ ...p, external_commercial_register: e.target.value }))}
                      placeholder="رقم السجل التجاري"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>العنوان</Label>
                    <Input
                      value={formData.external_address}
                      onChange={(e) => setFormData(p => ({ ...p, external_address: e.target.value }))}
                      placeholder="عنوان المقر الرئيسي"
                    />
                  </div>
                  <div>
                    <Label>مفوض التوقيع</Label>
                    <Input
                      value={formData.external_representative}
                      onChange={(e) => setFormData(p => ({ ...p, external_representative: e.target.value }))}
                      placeholder="اسم مفوض التوقيع"
                    />
                  </div>
                  <div>
                    <Label>الهاتف</Label>
                    <Input
                      value={formData.external_phone}
                      onChange={(e) => setFormData(p => ({ ...p, external_phone: e.target.value }))}
                      placeholder="رقم الهاتف"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>البريد الإلكتروني</Label>
                    <Input
                      type="email"
                      value={formData.external_email}
                      onChange={(e) => setFormData(p => ({ ...p, external_email: e.target.value }))}
                      placeholder="email@example.com"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Dates & Value */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>تاريخ البداية</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-right font-normal", !formData.start_date && "text-muted-foreground")}>
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {formData.start_date ? format(formData.start_date, 'dd/MM/yyyy') : 'اختر التاريخ'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={formData.start_date} onSelect={(d) => setFormData(p => ({ ...p, start_date: d }))} locale={ar} />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>تاريخ الانتهاء</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-right font-normal", !formData.end_date && "text-muted-foreground")}>
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {formData.end_date ? format(formData.end_date, 'dd/MM/yyyy') : 'اختر التاريخ'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={formData.end_date} onSelect={(d) => setFormData(p => ({ ...p, end_date: d }))} locale={ar} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label>قيمة العقد (EGP)</Label>
            <Input type="number" value={formData.value} onChange={(e) => setFormData(p => ({ ...p, value: e.target.value }))} placeholder="100000" />
          </div>

          <Separator />

          {/* ===== SIGNING METHOD ===== */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <PenTool className="w-4 h-4 text-primary" />
              بوابة التوقيع
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {(['none', 'digital', 'manual'] as SigningMethod[]).map(method => (
                <div
                  key={method}
                  onClick={() => setFormData(p => ({ ...p, signing_method: method }))}
                  className={cn(
                    "p-3 border rounded-lg cursor-pointer transition-all text-center",
                    formData.signing_method === method
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/30"
                  )}
                >
                  <div className="flex justify-center mb-2">{signingIcons[method]}</div>
                  <p className="text-sm font-medium">{signingMethodLabels[method]}</p>
                  <p className="text-xs text-muted-foreground mt-1">{signingMethodDescriptions[method]}</p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Terms & Notes */}
          <div>
            <Label>الوصف</Label>
            <Textarea value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="وصف مختصر..." rows={2} />
          </div>
          <div>
            <Label>الشروط والأحكام</Label>
            <Textarea value={formData.terms} onChange={(e) => setFormData(p => ({ ...p, terms: e.target.value }))} placeholder="شروط وأحكام العقد..." rows={3} />
          </div>
          <div>
            <Label>ملاحظات</Label>
            <Textarea value={formData.notes} onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))} placeholder="ملاحظات إضافية..." rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); onReset(); }}>
            إلغاء
          </Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'حفظ التغييرات' : 'إضافة العقد'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContractFormDialog;
