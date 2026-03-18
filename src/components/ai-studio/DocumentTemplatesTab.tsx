import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, Copy, Trash2, Loader2, LayoutTemplate } from 'lucide-react';
import { toast } from 'sonner';
import { sanitizeHtml } from '@/lib/sanitizeHtml';

interface Template {
  id: string;
  title: string;
  document_type: string;
  html_content: string;
  template_category: string | null;
  template_description: string | null;
  created_at: string;
}

const CATEGORIES: Record<string, { label: string; icon: string }> = {
  quotation: { label: 'عروض أسعار', icon: '💰' },
  letter: { label: 'خطابات', icon: '📄' },
  contract: { label: 'عقود', icon: '📋' },
  report: { label: 'تقارير', icon: '📊' },
  announcement: { label: 'إعلانات', icon: '📢' },
  invoice: { label: 'فواتير', icon: '🧾' },
  general: { label: 'عام', icon: '📁' },
};

interface Props {
  onPreview: (html: string) => void;
  onUseTemplate: (html: string, title: string) => void;
}

export default function DocumentTemplatesTab({ onPreview, onUseTemplate }: Props) {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    if (!profile?.organization_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_documents')
        .select('*')
        .eq('is_template', true)
        .or(`organization_id.eq.${profile.organization_id},status.eq.published`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates((data || []) as unknown as Template[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, [profile?.organization_id]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('ai_documents').delete().eq('id', id);
    if (error) { toast.error('خطأ في الحذف'); return; }
    toast.success('تم حذف القالب');
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <LayoutTemplate className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm">لا توجد قوالب محفوظة</p>
        <p className="text-xs mt-1">يمكنك حفظ أي مستند كقالب من الأرشيف</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-14rem)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {templates.map(tmpl => {
          const cat = CATEGORIES[tmpl.template_category || tmpl.document_type] || CATEGORIES.general;
          return (
            <Card key={tmpl.id} className="hover:shadow-md transition-shadow overflow-hidden">
              {/* Mini preview */}
              <div
                className="relative w-full bg-white overflow-hidden cursor-pointer"
                style={{ height: '120px' }}
                onClick={() => onPreview(tmpl.html_content)}
              >
                <div
                  style={{
                    transform: 'scale(0.2)',
                    transformOrigin: 'top center',
                    width: '794px',
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    marginLeft: '-397px',
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(tmpl.html_content) }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/80" />
              </div>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <h3 className="text-sm font-semibold truncate flex-1">{tmpl.title}</h3>
                </div>
                {tmpl.template_description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{tmpl.template_description}</p>
                )}
                <div className="flex items-center gap-1 pt-1">
                  <Button size="sm" variant="default" className="flex-1 gap-1.5 h-8 text-xs"
                    onClick={() => onUseTemplate(tmpl.html_content, tmpl.title)}>
                    <Copy className="w-3.5 h-3.5" />
                    استخدام القالب
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onPreview(tmpl.html_content)}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(tmpl.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}
