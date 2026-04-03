import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Trash2, MessageSquare, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import BackButton from '@/components/ui/back-button';

const TestimonialsManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const { data: testimonials, isLoading } = useQuery({
    queryKey: ['admin-testimonials', filter],
    queryFn: async () => {
      let query = supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status: string; admin_notes?: string }) => {
      const { error } = await supabase
        .from('testimonials')
        .update({
          status,
          admin_notes: admin_notes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      toast({ title: 'تم التحديث بنجاح' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('testimonials').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      toast({ title: 'تم الحذف بنجاح' });
    },
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" /> قيد المراجعة</Badge>;
      case 'approved': return <Badge className="gap-1 bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="w-3 h-3" /> معتمد</Badge>;
      case 'rejected': return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> مرفوض</Badge>;
      default: return null;
    }
  };

  const counts = {
    pending: testimonials?.filter(t => t.status === 'pending').length || 0,
    approved: testimonials?.filter(t => t.status === 'approved').length || 0,
    rejected: testimonials?.filter(t => t.status === 'rejected').length || 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6" dir="rtl">
        <BackButton />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            إدارة التعليقات وقصص النجاح
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            راجع تعليقات الزوار واعتمد ما يناسب للعرض في الصفحة الرئيسية
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === 'pending' && `قيد المراجعة (${counts.pending})`}
            {f === 'approved' && `معتمد (${counts.approved})`}
            {f === 'rejected' && `مرفوض (${counts.rejected})`}
            {f === 'all' && 'الكل'}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
      ) : !testimonials?.length ? (
        <div className="text-center py-12 text-muted-foreground">لا توجد تعليقات</div>
      ) : (
        <div className="grid gap-4">
          {testimonials.map((t) => (
            <Card key={t.id} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {t.author_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{t.author_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(t.created_at), 'dd MMMM yyyy - HH:mm', { locale: ar })}
                        </p>
                      </div>
                      {statusBadge(t.status)}
                    </div>
                    <p className="text-sm text-foreground/80 mt-3 bg-muted/50 rounded-lg p-3">
                      "{t.comment}"
                    </p>
                  </div>

                  <div className="flex gap-2 items-start">
                    {t.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          className="gap-1"
                          onClick={() => updateMutation.mutate({ id: t.id, status: 'approved' })}
                          disabled={updateMutation.isPending}
                        >
                          <Check className="w-4 h-4" /> اعتماد
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1"
                          onClick={() => updateMutation.mutate({ id: t.id, status: 'rejected' })}
                          disabled={updateMutation.isPending}
                        >
                          <X className="w-4 h-4" /> رفض
                        </Button>
                      </>
                    )}
                    {t.status === 'approved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => updateMutation.mutate({ id: t.id, status: 'pending' })}
                        disabled={updateMutation.isPending}
                      >
                        إلغاء الاعتماد
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(t.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
      </DashboardLayout>
  );
};

export default TestimonialsManagement;
