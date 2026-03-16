import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link2, Eye, Copy, Trash2, Loader2, Share2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface DocumentShare {
  id: string;
  share_code: string;
  share_type: string;
  is_active: boolean;
  views_count: number;
  expires_at: string | null;
  created_at: string;
  document_id: string;
  ai_documents: {
    title: string;
    document_type: string;
  } | null;
}

interface Props {
  onPreviewDocument: (docId: string) => void;
}

export default function DocumentSharesTab({ onPreviewDocument }: Props) {
  const { profile } = useAuth();
  const [shares, setShares] = useState<DocumentShare[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShares = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_document_shares')
        .select('*, ai_documents(title, document_type)')
        .eq('shared_by', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShares((data || []) as unknown as DocumentShare[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShares(); }, [profile?.id]);

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/s/doc/${code}`;
    navigator.clipboard.writeText(url);
    toast.success('تم نسخ الرابط');
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from('ai_document_shares').update({ is_active: !current }).eq('id', id);
    if (error) { toast.error('خطأ'); return; }
    setShares(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s));
    toast.success(!current ? 'تم تفعيل الرابط' : 'تم تعطيل الرابط');
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('ai_document_shares').delete().eq('id', id);
    if (error) { toast.error('خطأ في الحذف'); return; }
    setShares(prev => prev.filter(s => s.id !== id));
    toast.success('تم حذف الرابط');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (shares.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Share2 className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm">لا توجد مستندات مشتركة</p>
        <p className="text-xs mt-1">شارك مستنداتك عبر الروابط أو داخلياً</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-14rem)]">
      <div className="space-y-2">
        {shares.map(share => (
          <Card key={share.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold truncate">
                    {share.ai_documents?.title || 'مستند'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant={share.is_active ? 'default' : 'secondary'} className="text-[10px]">
                      {share.is_active ? 'نشط' : 'معطل'}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <Eye className="w-3 h-3" /> {share.views_count} مشاهدة
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(share.created_at), 'dd MMM yyyy', { locale: ar })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyLink(share.share_code)}>
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7"
                    onClick={() => toggleActive(share.id, share.is_active)}>
                    <Link2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                    onClick={() => handleDelete(share.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
