import { OrganizationDocument } from './types';
import { getDocumentTypeLabel, getOrgTypeLabel, getStatusBadge } from './verificationUtils';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';

interface DocumentInfoGridProps {
  document: OrganizationDocument;
}

const DocumentInfoGrid = ({ document }: DocumentInfoGridProps) => {
  const { t, language } = useLanguage();
  const dateLocale = language === 'ar' ? ar : enUS;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="p-3 rounded-lg border bg-card">
        <p className="text-sm text-muted-foreground">{t('verification.documentType')}</p>
        <p className="font-medium">{getDocumentTypeLabel(document.document_type, t)}</p>
      </div>
      <div className="p-3 rounded-lg border bg-card">
        <p className="text-sm text-muted-foreground">{t('verification.status')}</p>
        {getStatusBadge(document.verification_status, t)}
      </div>
      <div className="p-3 rounded-lg border bg-card">
        <p className="text-sm text-muted-foreground">{t('verification.organization')}</p>
        <p className="font-medium">{document.organization?.name}</p>
        <p className="text-xs text-muted-foreground">
          {getOrgTypeLabel(document.organization?.organization_type || '', t)}
        </p>
      </div>
      <div className="p-3 rounded-lg border bg-card">
        <p className="text-sm text-muted-foreground">{t('verification.uploadDate')}</p>
        <p className="font-medium">
          {format(new Date(document.created_at), 'dd MMMM yyyy', { locale: dateLocale })}
        </p>
      </div>
    </div>
  );
};

export default DocumentInfoGrid;
