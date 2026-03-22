import { Button } from '@/components/ui/button';
import { Loader2, FileText, FileWarning, ExternalLink, Gavel } from 'lucide-react';
import GoogleDocsPdfViewer from '@/components/shared/GoogleDocsPdfViewer';
import { OrganizationDocument } from './types';
import SecureImage from '@/components/ui/SecureImage';

interface DocumentPreviewPanelProps {
  document: OrganizationDocument;
  previewUrl: string | null;
  previewLoading: boolean;
  previewError: string | null;
  analyzing: boolean;
  onDownload: (doc: OrganizationDocument) => void;
  onAnalyze: (doc: OrganizationDocument) => void;
  onPreviewError: (error: string) => void;
}

const DocumentPreviewPanel = ({
  document,
  previewUrl,
  previewLoading,
  previewError,
  analyzing,
  onDownload,
  onAnalyze,
  onPreviewError,
}: DocumentPreviewPanelProps) => {
  return (
    <div className="border rounded-lg p-4 bg-muted/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownload(document)}
            className="gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            فتح المستند
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAnalyze(document)}
            disabled={analyzing}
            className="gap-2"
          >
            {analyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Gavel className="w-4 h-4" />
            )}
            تحليل قانوني
          </Button>
        </div>
        <h3 className="font-medium">{document.file_name}</h3>
      </div>
      
      <div className="aspect-video bg-background rounded-lg border flex items-center justify-center overflow-hidden">
        {previewLoading ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p>جاري تحميل المستند...</p>
          </div>
        ) : previewError ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <FileWarning className="w-12 h-12" />
            <p>{previewError}</p>
            <Button variant="outline" size="sm" onClick={() => onDownload(document)}>
              فتح المستند مباشرة
            </Button>
          </div>
        ) : previewUrl ? (
          document.file_path.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
            <SecureImage 
              src={document.file_path}
              bucket="organization-documents"
              alt={document.file_name}
              className="max-w-full max-h-full object-contain"
              zoomable={true}
            />
          ) : document.file_path.match(/\.pdf$/i) ? (
            <iframe
              src={previewUrl}
              className="w-full h-full min-h-[400px]"
              title={document.file_name}
            />
          ) : (
            <div className="text-center text-muted-foreground">
              <FileText className="w-16 h-16 mx-auto mb-2" />
              <p>انقر لفتح المستند</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => onDownload(document)}
              >
                فتح المستند
              </Button>
            </div>
          )
        ) : (
          <div className="text-center text-muted-foreground">
            <FileText className="w-16 h-16 mx-auto mb-2" />
            <p>انقر لفتح المستند</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentPreviewPanel;
