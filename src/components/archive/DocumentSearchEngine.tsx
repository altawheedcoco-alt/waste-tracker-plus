import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Filter,
  Calendar as CalendarIcon,
  X,
  FileText,
  Image,
  File,
  Download,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useEntityDocuments, EntityDocument, DocumentFilters } from '@/hooks/useEntityDocuments';
import DocumentPreviewDialog from './DocumentPreviewDialog';

interface DocumentSearchEngineProps {
  partnerId?: string;
  externalPartnerId?: string;
}

const DOCUMENT_TYPES = [
  { value: 'award_letter', label: 'خطاب ترسية' },
  { value: 'contract', label: 'عقد' },
  { value: 'correspondence', label: 'مراسلة' },
  { value: 'invoice', label: 'فاتورة' },
  { value: 'receipt', label: 'سند قبض' },
  { value: 'deposit_proof', label: 'إثبات إيداع' },
  { value: 'weight_slip', label: 'صورة وزنة' },
  { value: 'certificate', label: 'شهادة' },
  { value: 'license', label: 'رخصة' },
  { value: 'registration', label: 'سجل تجاري' },
  { value: 'other', label: 'أخرى' },
];

const DOCUMENT_CATEGORIES = [
  { value: 'documents', label: 'مستندات' },
  { value: 'financials', label: 'ماليات' },
  { value: 'operations', label: 'عمليات' },
  { value: 'legal', label: 'قانونية' },
  { value: 'other', label: 'أخرى' },
];

export default function DocumentSearchEngine({
  partnerId,
  externalPartnerId,
}: DocumentSearchEngineProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [documentType, setDocumentType] = useState<string>('');
  const [documentCategory, setDocumentCategory] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [showFilters, setShowFilters] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<EntityDocument | null>(null);

  const filters: DocumentFilters = useMemo(() => ({
    partnerId,
    externalPartnerId,
    searchQuery: searchQuery || undefined,
    documentType: documentType || undefined,
    documentCategory: documentCategory || undefined,
    dateFrom: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
    dateTo: dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined,
  }), [partnerId, externalPartnerId, searchQuery, documentType, documentCategory, dateFrom, dateTo]);

  const { documents, isLoading } = useEntityDocuments(filters);

  const hasActiveFilters = documentType || documentCategory || dateFrom || dateTo;

  const clearFilters = () => {
    setDocumentType('');
    setDocumentCategory('');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const getFileIcon = (doc: EntityDocument) => {
    if (doc.file_type?.startsWith('image/')) {
      return <Image className="h-4 w-4 text-blue-500" />;
    }
    if (doc.file_type === 'application/pdf') {
      return <FileText className="h-4 w-4 text-red-500" />;
    }
    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  const getTypeLabel = (type: string) => {
    return DOCUMENT_TYPES.find(t => t.value === type)?.label || type;
  };

  const getCategoryLabel = (category: string) => {
    return DOCUMENT_CATEGORIES.find(c => c.value === category)?.label || category;
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث بالاسم، الوصف، رقم المرجع..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          فلترة
          {hasActiveFilters && (
            <Badge variant="secondary" className="mr-1 h-5 w-5 p-0 justify-center">
              {[documentType, documentCategory, dateFrom, dateTo].filter(Boolean).length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Document Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">نوع المستند</label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">الكل</SelectItem>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Document Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium">التصنيف</label>
                <Select value={documentCategory} onValueChange={setDocumentCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">الكل</SelectItem>
                    {DOCUMENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div className="space-y-2">
                <label className="text-sm font-medium">من تاريخ</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 ml-2" />
                      {dateFrom ? format(dateFrom, 'dd/MM/yyyy') : 'اختر تاريخ'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      locale={ar}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <label className="text-sm font-medium">إلى تاريخ</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 ml-2" />
                      {dateTo ? format(dateTo, 'dd/MM/yyyy') : 'اختر تاريخ'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      locale={ar}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 ml-1" />
                  مسح الفلاتر
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{documents.length} نتيجة</span>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">لا توجد نتائج</p>
            <p className="text-sm">جرب تغيير معايير البحث</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {documents.map((doc) => (
                <Card
                  key={doc.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setPreviewDoc(doc)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded">
                        {getFileIcon(doc)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{doc.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(doc.document_type)}
                          </Badge>
                          <span>{getCategoryLabel(doc.document_category)}</span>
                          {doc.document_date && (
                            <span>{format(new Date(doc.document_date), 'dd/MM/yyyy')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewDoc(doc);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" asChild onClick={(e) => e.stopPropagation()}>
                          <a href={doc.file_url} download target="_blank" rel="noopener">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Preview Dialog */}
      {previewDoc && (
        <DocumentPreviewDialog
          open={!!previewDoc}
          onOpenChange={() => setPreviewDoc(null)}
          document={previewDoc}
        />
      )}
    </div>
  );
}
