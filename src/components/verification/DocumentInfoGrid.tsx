import { OrganizationDocument } from './types';
import { getDocumentTypeLabel, getOrgTypeLabel, getStatusBadge } from './verificationUtils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface DocumentInfoGridProps {
  document: OrganizationDocument;
}

const DocumentInfoGrid = ({ document }: DocumentInfoGridProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="p-3 rounded-lg border bg-card">
        <p className="text-sm text-muted-foreground">نوع المستند</p>
        <p className="font-medium">{getDocumentTypeLabel(document.document_type)}</p>
      </div>
      <div className="p-3 rounded-lg border bg-card">
        <p className="text-sm text-muted-foreground">الحالة</p>
        {getStatusBadge(document.verification_status)}
      </div>
      <div className="p-3 rounded-lg border bg-card">
        <p className="text-sm text-muted-foreground">الجهة</p>
        <p className="font-medium">{document.organization?.name}</p>
        <p className="text-xs text-muted-foreground">
          {getOrgTypeLabel(document.organization?.organization_type || '')}
        </p>
      </div>
      <div className="p-3 rounded-lg border bg-card">
        <p className="text-sm text-muted-foreground">تاريخ الرفع</p>
        <p className="font-medium">
          {format(new Date(document.created_at), 'dd MMMM yyyy', { locale: ar })}
        </p>
      </div>
    </div>
  );
};

export default DocumentInfoGrid;
