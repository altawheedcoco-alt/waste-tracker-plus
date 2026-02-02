import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldX, ShieldAlert, Clock } from 'lucide-react';

export const getDocumentTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    commercial_register: 'السجل التجاري',
    environmental_license: 'الترخيص البيئي',
    tax_card: 'البطاقة الضريبية',
    id_card: 'بطاقة الهوية',
    delegation_letter: 'خطاب تفويض',
    contract: 'عقد',
    certificate: 'شهادة',
    license: 'ترخيص',
    other: 'مستند آخر',
  };
  return labels[type] || type;
};

export const getOrgTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    generator: 'جهة مولدة',
    transporter: 'جهة ناقلة',
    recycler: 'جهة مدورة',
  };
  return labels[type] || type;
};

export const getStatusBadge = (status: string | null) => {
  switch (status) {
    case 'verified':
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1">
          <ShieldCheck className="w-3 h-3" />
          موثق
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="destructive" className="gap-1">
          <ShieldX className="w-3 h-3" />
          مرفوض
        </Badge>
      );
    case 'requires_review':
      return (
        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1">
          <ShieldAlert className="w-3 h-3" />
          يتطلب مراجعة
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="w-3 h-3" />
          معلق
        </Badge>
      );
  }
};

export const getRiskBadge = (riskLevel: 'low' | 'medium' | 'high') => {
  switch (riskLevel) {
    case 'low':
      return <Badge className="bg-emerald-500/10 text-emerald-600">مخاطر منخفضة</Badge>;
    case 'medium':
      return <Badge className="bg-amber-500/10 text-amber-600">مخاطر متوسطة</Badge>;
    case 'high':
      return <Badge className="bg-red-500/10 text-red-600">مخاطر عالية</Badge>;
  }
};

export const formatFileSize = (bytes: number | null) => {
  if (!bytes) return 'غير محدد';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};
