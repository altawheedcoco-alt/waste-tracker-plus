import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, Download, Check, X, Sparkles, Building2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { OrganizationDocument } from './types';
import { getDocumentTypeLabel, getOrgTypeLabel, getStatusBadge, formatFileSize } from './verificationUtils';

interface DocumentsTableProps {
  documents: OrganizationDocument[];
  loading: boolean;
  onView: (doc: OrganizationDocument) => void;
  onDownload: (doc: OrganizationDocument) => void;
  onVerify: (docId: string, status: 'verified' | 'rejected' | 'requires_review') => void;
}

const DocumentsTable = ({
  documents,
  loading,
  onView,
  onDownload,
  onVerify,
}: DocumentsTableProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center w-32">الإجراءات</TableHead>
            <TableHead className="text-right">الحالة</TableHead>
            <TableHead className="text-right">نسبة الثقة AI</TableHead>
            <TableHead className="text-right">تاريخ الرفع</TableHead>
            <TableHead className="text-right">الحجم</TableHead>
            <TableHead className="text-right">نوع المستند</TableHead>
            <TableHead className="text-right">الجهة</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                لا توجد مستندات
              </TableCell>
            </TableRow>
          ) : (
            documents.map((doc) => (
              <TableRow key={doc.id} className="hover:bg-muted/50">
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(doc)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDownload(doc)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {(doc.verification_status === 'pending' || !doc.verification_status) && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          onClick={() => onVerify(doc.id, 'verified')}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => onView(doc)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {getStatusBadge(doc.verification_status)}
                  {doc.auto_verified && (
                    <Badge variant="outline" className="mr-1 text-xs">
                      <Sparkles className="w-3 h-3 ml-1" />
                      تلقائي
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {doc.ai_confidence_score ? (
                    <div className="flex items-center gap-2 justify-end">
                      <span className={`font-mono text-sm ${
                        doc.ai_confidence_score >= 80 ? 'text-emerald-600' :
                        doc.ai_confidence_score >= 50 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {doc.ai_confidence_score}%
                      </span>
                      <Progress 
                        value={doc.ai_confidence_score} 
                        className="w-16 h-1.5"
                      />
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {format(new Date(doc.created_at), 'dd MMM yyyy', { locale: ar })}
                </TableCell>
                <TableCell className="text-right text-sm font-mono">
                  {formatFileSize(doc.file_size)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline">
                    {getDocumentTypeLabel(doc.document_type)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <div>
                      <p className="font-medium">{doc.organization?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getOrgTypeLabel(doc.organization?.organization_type || '')}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default DocumentsTable;
