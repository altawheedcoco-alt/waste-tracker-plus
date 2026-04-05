/**
 * نظام الشكاوى والتذاكر
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquareWarning, Plus, Send, Clock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const ComplaintTicketSystem = () => {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: tickets = [] } = useQuery({
    queryKey: ['generator-tickets', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const handleSubmit = async () => {
    if (!subject.trim() || !organization?.id) {
      toast.error('يرجى كتابة موضوع الشكوى');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('support_tickets').insert([{
        organization_id: organization.id,
        created_by: user?.id,
        subject,
        description: details,
        status: 'open',
        priority: 'medium',
      }]);
      if (error) throw error;
      toast.success('✅ تم إرسال الشكوى بنجاح');
      setShowForm(false);
      setSubject('');
      setDetails('');
      queryClient.invalidateQueries({ queryKey: ['generator-tickets'] });
    } catch (err: any) {
      toast.error(`خطأ: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
    open: { label: 'مفتوحة', variant: 'destructive' },
    in_progress: { label: 'قيد المعالجة', variant: 'default' },
    resolved: { label: 'تم الحل', variant: 'secondary' },
    closed: { label: 'مغلقة', variant: 'secondary' },
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-3 w-3 ml-1" />
            شكوى جديدة
          </Button>
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquareWarning className="h-4 w-4 text-primary" />
            الشكاوى والتذاكر
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2" dir="rtl">
        {showForm && (
          <div className="space-y-2 p-3 rounded-lg bg-muted/30 border">
            <div>
              <Label className="text-xs">الموضوع *</Label>
              <Input className="h-8 text-xs" value={subject} onChange={e => setSubject(e.target.value)} placeholder="مثال: تأخر في جمع النفايات" />
            </div>
            <div>
              <Label className="text-xs">التفاصيل</Label>
              <Textarea className="text-xs min-h-[60px]" value={details} onChange={e => setDetails(e.target.value)} placeholder="وصف المشكلة بالتفصيل..." />
            </div>
            <Button size="sm" onClick={handleSubmit} disabled={isSubmitting} className="w-full gap-1">
              <Send className="h-3 w-3" />
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال الشكوى'}
            </Button>
          </div>
        )}

        {tickets.length === 0 && !showForm ? (
          <p className="text-center text-sm text-muted-foreground py-4">لا توجد تذاكر</p>
        ) : (
          tickets.slice(0, 5).map((t: any) => (
            <div key={t.id} className="flex items-center justify-between p-2 rounded bg-muted/20">
              <div className="flex items-center gap-1">
                <Badge variant={statusMap[t.status]?.variant || 'secondary'} className="text-[10px]">
                  {statusMap[t.status]?.label || t.status}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(t.created_at).toLocaleDateString('ar-EG')}
                </span>
              </div>
              <span className="text-xs font-medium truncate max-w-[160px]">{t.subject}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default ComplaintTicketSystem;
