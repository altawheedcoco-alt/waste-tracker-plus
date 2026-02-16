import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Building2, Phone, Mail, MapPin, Calendar, FileText, User } from 'lucide-react';

const LICENSE_TYPES: Record<string, string> = {
  medical: 'نفايات طبية',
  solid: 'نفايات صلبة',
  electronic: 'نفايات إلكترونية',
  hazardous: 'نفايات خطرة',
  construction: 'مخلفات بناء',
  other: 'أخرى',
};

interface Props {
  company: any;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const CompanyDetailsDialog = ({ company, open, onOpenChange }: Props) => {
  if (!company) return null;

  const statusLabel = company.license_status === 'active' ? 'ساري' : company.license_status === 'expired' ? 'منتهي' : company.license_status === 'suspended' ? 'موقوف' : company.license_status;
  const statusVariant = company.license_status === 'active' ? 'default' : company.license_status === 'expired' ? 'destructive' : 'secondary';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            تفاصيل الشركة
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <h3 className="font-bold text-lg">{company.company_name_ar || company.company_name}</h3>
            {company.company_name_ar && company.company_name && (
              <p className="text-sm text-muted-foreground">{company.company_name}</p>
            )}
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <InfoRow icon={<FileText className="w-4 h-4" />} label="نوع الترخيص" value={LICENSE_TYPES[company.license_type] || company.license_type} />
            <InfoRow icon={<FileText className="w-4 h-4" />} label="رقم الترخيص" value={company.license_number || '-'} />
            <InfoRow icon={<Calendar className="w-4 h-4" />} label="تاريخ الانتهاء" value={company.license_expiry_date || '-'} />
            <InfoRow icon={<MapPin className="w-4 h-4" />} label="المحافظة" value={company.governorate || '-'} />
            <InfoRow icon={<MapPin className="w-4 h-4" />} label="المدينة" value={company.city || '-'} />
            <InfoRow icon={<MapPin className="w-4 h-4" />} label="العنوان" value={company.address || '-'} />
            <InfoRow icon={<User className="w-4 h-4" />} label="جهة الاتصال" value={company.contact_person || '-'} />
            <InfoRow icon={<Phone className="w-4 h-4" />} label="الهاتف" value={company.contact_phone || '-'} />
            <InfoRow icon={<Mail className="w-4 h-4" />} label="البريد" value={company.contact_email || '-'} />
          </div>

          {company.activity_description && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs font-semibold text-muted-foreground mb-1">وصف النشاط</p>
              <p className="text-sm">{company.activity_description}</p>
            </div>
          )}

          <div className="text-xs text-muted-foreground pt-2 border-t">
            <p>تاريخ الإضافة: {new Date(company.created_at).toLocaleDateString('ar-EG')}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-2 p-2 rounded bg-background border">
    <span className="text-muted-foreground mt-0.5">{icon}</span>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  </div>
);

export default CompanyDetailsDialog;
