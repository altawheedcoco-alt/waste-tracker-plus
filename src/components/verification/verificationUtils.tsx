import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldX, ShieldAlert, Clock } from 'lucide-react';

// These functions now accept a translation function parameter
export const getDocumentTypeLabel = (type: string, t?: (key: string) => string) => {
  if (t) {
    const labels: Record<string, string> = {
      commercial_register: t('verification.commercialRegister'),
      environmental_license: t('verification.environmentalLicense'),
      tax_card: t('verification.taxCard'),
      id_card: t('verification.idCard'),
      delegation_letter: t('verification.delegationLetter'),
      contract: t('verification.contract'),
      certificate: t('verification.certificate'),
      license: t('verification.license'),
      other: t('verification.otherDoc'),
    };
    return labels[type] || type;
  }
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

export const getOrgTypeLabel = (type: string, t?: (key: string) => string) => {
  if (t) {
    const labels: Record<string, string> = {
      generator: t('verification.generatorOrg'),
      transporter: t('verification.transporterOrg'),
      recycler: t('verification.recyclerOrg'),
    };
    return labels[type] || type;
  }
  const labels: Record<string, string> = {
    generator: 'جهة مولدة',
    transporter: 'جهة ناقلة',
    recycler: 'جهة مدورة',
  };
  return labels[type] || type;
};

export const getStatusBadge = (status: string | null, t?: (key: string) => string) => {
  const labels = {
    verified: t ? t('verification.verified') : 'موثق',
    rejected: t ? t('verification.rejected') : 'مرفوض',
    requires_review: t ? t('verification.requiresReview') : 'يتطلب مراجعة',
    pending: t ? t('verification.pending') : 'معلق',
  };

  switch (status) {
    case 'verified':
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1">
          <ShieldCheck className="w-3 h-3" />
          {labels.verified}
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="destructive" className="gap-1">
          <ShieldX className="w-3 h-3" />
          {labels.rejected}
        </Badge>
      );
    case 'requires_review':
      return (
        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1">
          <ShieldAlert className="w-3 h-3" />
          {labels.requires_review}
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="w-3 h-3" />
          {labels.pending}
        </Badge>
      );
  }
};

export const getRiskBadge = (riskLevel: 'low' | 'medium' | 'high', t?: (key: string) => string) => {
  const labels = {
    low: t ? t('verification.lowRisk') : 'مخاطر منخفضة',
    medium: t ? t('verification.mediumRisk') : 'مخاطر متوسطة',
    high: t ? t('verification.highRisk') : 'مخاطر عالية',
  };
  switch (riskLevel) {
    case 'low':
      return <Badge className="bg-emerald-500/10 text-emerald-600">{labels.low}</Badge>;
    case 'medium':
      return <Badge className="bg-amber-500/10 text-amber-600">{labels.medium}</Badge>;
    case 'high':
      return <Badge className="bg-red-500/10 text-red-600">{labels.high}</Badge>;
  }
};

export const formatFileSize = (bytes: number | null, t?: (key: string) => string) => {
  if (!bytes) return t ? t('verification.unknownSize') : 'غير محدد';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};
