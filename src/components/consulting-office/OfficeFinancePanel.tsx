import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useConsultingOffice } from '@/hooks/useConsultingOffice';
import {
  Wallet, TrendingUp, Building2, FileText, Loader2, Calendar,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

const OfficeFinancePanel = memo(() => {
  const { clients } = useConsultingOffice();

  // Group clients by contract status
  const activeContracts = clients.filter((c: any) => c.is_active && c.contract_end);
  const noContract = clients.filter((c: any) => !c.contract_reference);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Wallet className="w-5 h-5 text-primary" />المالية والعقود</CardTitle>
        <CardDescription>عقود الخدمة ومتابعة المستحقات</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg border border-border">
            <p className="text-2xl font-bold">{clients.length}</p>
            <p className="text-xs text-muted-foreground">إجمالي العملاء</p>
          </div>
          <div className="text-center p-3 rounded-lg border border-border">
            <p className="text-2xl font-bold text-emerald-600">{activeContracts.length}</p>
            <p className="text-xs text-muted-foreground">عقود نشطة</p>
          </div>
          <div className="text-center p-3 rounded-lg border border-border">
            <p className="text-2xl font-bold text-amber-600">{noContract.length}</p>
            <p className="text-xs text-muted-foreground">بدون عقد</p>
          </div>
        </div>

        {clients.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">لا توجد عقود بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clients.map((client: any) => (
              <div key={client.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {client.client_organization?.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{client.client_organization?.name}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[9px]">{client.service_type}</Badge>
                    {client.contract_reference && (
                      <Badge variant="secondary" className="text-[9px] gap-0.5">
                        <FileText className="w-2.5 h-2.5" />{client.contract_reference}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-left text-[10px] text-muted-foreground">
                  {client.contract_start && client.contract_end ? (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(parseISO(client.contract_start), 'MM/yyyy')} - {format(parseISO(client.contract_end), 'MM/yyyy')}
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-[9px]">بدون عقد</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

OfficeFinancePanel.displayName = 'OfficeFinancePanel';
export default OfficeFinancePanel;
