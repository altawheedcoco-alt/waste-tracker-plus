import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  DollarSign,
  Truck,
  Upload,
  Clock,
  Search,
  FolderOpen,
  Scale,
} from 'lucide-react';
import { useEntityDocuments } from '@/hooks/useEntityDocuments';
import EntityTimeline from './EntityTimeline';
import DocumentSearchEngine from './DocumentSearchEngine';
import EntityDocumentUpload from './EntityDocumentUpload';

interface EntityProfileArchiveProps {
  partnerId?: string;
  externalPartnerId?: string;
  partnerName: string;
}

export default function EntityProfileArchive({
  partnerId,
  externalPartnerId,
  partnerName,
}: EntityProfileArchiveProps) {
  const [activeTab, setActiveTab] = useState('timeline');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<string | undefined>();

  const { documents } = useEntityDocuments({
    partnerId,
    externalPartnerId,
  });

  // Count documents by category
  const categoryCounts = {
    documents: documents.filter(d => d.document_category === 'documents').length,
    financials: documents.filter(d => d.document_category === 'financials').length,
    operations: documents.filter(d => d.document_category === 'operations').length,
    legal: documents.filter(d => d.document_category === 'legal').length,
  };

  const handleUploadWithCategory = (category: string) => {
    setUploadCategory(category);
    setShowUpload(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            أرشيف المستندات
          </CardTitle>
          <Button onClick={() => setShowUpload(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            رفع مستند
          </Button>
        </div>

        {/* Category Quick Stats */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <button
            onClick={() => handleUploadWithCategory('documents')}
            className="p-3 rounded-lg border hover:bg-muted/50 transition-colors text-center"
          >
            <FileText className="h-6 w-6 mx-auto text-blue-500" />
            <p className="text-sm font-medium mt-1">مستندات</p>
            <Badge variant="secondary" className="mt-1">{categoryCounts.documents}</Badge>
          </button>
          
          <button
            onClick={() => handleUploadWithCategory('financials')}
            className="p-3 rounded-lg border hover:bg-muted/50 transition-colors text-center"
          >
            <DollarSign className="h-6 w-6 mx-auto text-green-500" />
            <p className="text-sm font-medium mt-1">ماليات</p>
            <Badge variant="secondary" className="mt-1">{categoryCounts.financials}</Badge>
          </button>
          
          <button
            onClick={() => handleUploadWithCategory('operations')}
            className="p-3 rounded-lg border hover:bg-muted/50 transition-colors text-center"
          >
            <Truck className="h-6 w-6 mx-auto text-amber-500" />
            <p className="text-sm font-medium mt-1">عمليات</p>
            <Badge variant="secondary" className="mt-1">{categoryCounts.operations}</Badge>
          </button>
          
          <button
            onClick={() => handleUploadWithCategory('legal')}
            className="p-3 rounded-lg border hover:bg-muted/50 transition-colors text-center"
          >
            <Scale className="h-6 w-6 mx-auto text-purple-500" />
            <p className="text-sm font-medium mt-1">قانونية</p>
            <Badge variant="secondary" className="mt-1">{categoryCounts.legal}</Badge>
          </button>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="timeline" className="gap-2">
              <Clock className="h-4 w-4" />
              الشريط الزمني
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-2">
              <Search className="h-4 w-4" />
              البحث
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline">
            <EntityTimeline
              partnerId={partnerId}
              externalPartnerId={externalPartnerId}
            />
          </TabsContent>

          <TabsContent value="search">
            <DocumentSearchEngine
              partnerId={partnerId}
              externalPartnerId={externalPartnerId}
            />
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Upload Dialog */}
      <EntityDocumentUpload
        open={showUpload}
        onOpenChange={(open) => {
          setShowUpload(open);
          if (!open) setUploadCategory(undefined);
        }}
        partnerId={partnerId}
        externalPartnerId={externalPartnerId}
        partnerName={partnerName}
        defaultCategory={uploadCategory}
      />
    </Card>
  );
}
