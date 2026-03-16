import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, FileText, Download, Printer, Eye, Trash2, Share2,
  BookmarkPlus, Calendar, Filter, Loader2, FolderOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { useDocumentService } from '@/hooks/useDocumentService';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface AIDocument {
  id: string;
  title: string;
  document_type: string;
  html_content: string;
  tags: string[];
  status: string;
  shared_count: number;
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

const DOC_TYPES: Record<string, { label: string; icon: string }> = {
  quotation: { label: 'عرض سعر', icon: '💰' },
  letter: { label: 'خطاب رسمي', icon: '📄' },
  contract: { label: 'عقد', icon: '📋' },
  report: { label: 'تقرير', icon: '📊' },
  announcement: { label: 'إعلان', icon: '📢' },
  invoice: { label: 'فاتورة', icon: '🧾' },
  certificate: { label: 'شهادة', icon: '🏆' },
  memo: { label: 'مذكرة', icon: '📝' },
  general: { label: 'عام', icon: '📁' },
};

interface Props {
  onPreview: (html: string) => void;
  onEdit: (doc: AIDocument) => void;
}

export default function DocumentArchiveTab({ onPreview, onEdit }: Props) {
  const { profile } = useAuth();
  const [documents, setDocuments] = useState<AIDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const { downloadPDF, print } = useDocumentService({ filename: 'document', orientation: 'portrait' });

  const fetchDocuments = async () => {
    if (!profile?.organization_id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('ai_documents')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('is_template', false)
        .order('created_at', { ascending: false });

      if (filterType !== 'all') {
        query = query.eq('document_type', filterType);
      }

      const { data, error } = await query;
      if (error) throw error;
      setDocuments((data || []) as unknown as AIDocument[]);
    } catch (err) {
      console.error(err);
      toast.error('خطأ في تحميل المستندات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocuments(); }, [profile?.organization_id, filterType]);

  const filtered = documents.filter(d =>
    !searchQuery || d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('ai_documents').delete().eq('id', id);
    if (error) { toast.error('خطأ في الحذف'); return; }
    toast.success('تم حذف المستند');
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const handleSaveAsTemplate = async (doc: AIDocument) => {
    const { error } = await supabase.from('ai_documents').update({
      is_template: true,
      template_category: doc.document_type,
      template_description: doc.title,
    }).eq('id', doc.id);
    if (error) { toast.error('خطأ في الحفظ كقالب'); return; }
    toast.success('تم حفظ المستند كقالب');
    fetchDocuments();
  };

  const handlePrint = (html: string) => {
    const c = document.createElement('div');
    c.innerHTML = html;
    c.style.position = 'fixed';
    c.style.left = '-9999px';
    document.body.appendChild(c);
    try { print(c); } finally { setTimeout(() => document.body.removeChild(c), 1000); }
  };

  const handleDownload = async (html: string, title: string) => {
    const c = document.createElement('div');
    c.innerHTML = html;
    c.style.position = 'fixed';
    c.style.left = '-9999px';
    c.style.width = '794px';
    document.body.appendChild(c);
    try {
      await downloadPDF(c, { customFilename: title });
      toast.success('تم التحميل');
    } finally { document.body.removeChild(c); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث في المستندات..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 ml-2" />
            <SelectValue placeholder="نوع المستند" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            {Object.entries(DOC_TYPES).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.icon} {v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Documents List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FolderOpen className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm">لا توجد مستندات محفوظة</p>
          <p className="text-xs mt-1">ابدأ محادثة جديدة لإنشاء مستندات</p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <div className="space-y-2">
            {filtered.map(doc => {
              const typeInfo = DOC_TYPES[doc.document_type] || DOC_TYPES.general;
              return (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <span className="text-2xl mt-0.5">{typeInfo.icon}</span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm truncate">{doc.title}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="secondary" className="text-[10px]">{typeInfo.label}</Badge>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(doc.created_at), 'dd MMM yyyy', { locale: ar })}
                            </span>
                            {doc.shared_count > 0 && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Share2 className="w-3 h-3" /> {doc.shared_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onPreview(doc.html_content)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(doc)}>
                          <FileText className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handlePrint(doc.html_content)}>
                          <Printer className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDownload(doc.html_content, doc.title)}>
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSaveAsTemplate(doc)}>
                          <BookmarkPlus className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(doc.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
