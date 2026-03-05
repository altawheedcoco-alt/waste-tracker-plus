/**
 * لوحة الفواتير
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Receipt, ArrowRight, Clock, Banknote, FileText, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ar as arLocale } from 'date-fns/locale';

const InvoicesPanel = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['doc-center-invoices', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('invoices')
        .select('id, invoice_number, total_amount, status, created_at, currency')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const totalAmount = invoices.reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0);
  const paidCount = invoices.filter((i: any) => i.status === 'paid').length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{invoices.length}</p>
            <p className="text-xs text-muted-foreground">إجمالي الفواتير</p>
          </CardContent>
        </Card>
        <Card className="bg-accent/10">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-accent-foreground">{paidCount}</p>
            <p className="text-xs text-muted-foreground">مدفوعة</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold">{totalAmount.toLocaleString()} ج.م</p>
            <p className="text-xs text-muted-foreground">إجمالي القيمة</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : invoices.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">لا توجد فواتير</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {invoices.slice(0, 15).map((inv: any) => (
            <Card key={inv.id} className="hover:bg-muted/30 transition-colors">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Receipt className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm" dir="ltr">{inv.invoice_number || inv.id.slice(0, 8)}</p>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(inv.created_at), { addSuffix: true, locale: arLocale })}
                  </span>
                </div>
                <div className="text-left shrink-0">
                  <p className="font-bold text-sm">{(inv.total_amount || 0).toLocaleString()} {inv.currency || 'ج.م'}</p>
                  <Badge variant={inv.status === 'paid' ? 'default' : 'outline'} className="text-[10px]">
                    {inv.status === 'paid' ? 'مدفوعة' : inv.status === 'pending' ? 'معلقة' : inv.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Button variant="outline" className="w-full gap-2" onClick={() => navigate('/dashboard/e-invoice')}>
        <Receipt className="w-4 h-4" />
        الفاتورة الإلكترونية
        <ArrowRight className="w-4 h-4 mr-auto rtl:rotate-180" />
      </Button>
    </div>
  );
};

export default InvoicesPanel;
