import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useConsultingOffice } from '@/hooks/useConsultingOffice';
import {
  Wallet, FileText, Calendar, AlertTriangle,
} from 'lucide-react';
import { differenceInDays, format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';

const OfficeFinancePanel = memo(() => {
  const { clients } = useConsultingOffice();

  const activeContracts = clients.filter((c: any) => c.is_active && c.contract_end);
  const noContract = clients.filter((c: any) => !c.contract_reference);
  const expiringContracts = activeContracts.filter((c: any) => {
    if (!c.contract_end) return false;
    return differenceInDays(parseISO(c.contract_end), new Date()) <= 30;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Wallet className="w-5 h-5 text-primary" />المالية والعقود</CardTitle>
        <CardDescription>عقود الخدمة ومتابعة المستحقات</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg border border-border">
            <p className="text-2xl font-bold">{clients.length}</p>
            <p className="text-xs text-muted-foreground">إجمالي العملاء</p>
          </div>
          <div className="text-center p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
            <p className="text-2xl font-bold text-emerald-600">{activeContracts.length}</p>
            <p className="text-xs text-muted-foreground">عقود نشطة</p>
          </div>
          <div className="text-center p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
            <p className="text-2xl font-bold text-amber-600">{expiringContracts.length}</p>
            <p className="text-xs text-muted-foreground">تنتهي قريباً</p>
          </div>
          <div className="text-center p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
            <p className="text-2xl font-bold text-destructive">{noContract.length}</p>
            <p className="text-xs text-muted-foreground">بدون عقد</p>
          </div>
        </div>

        {clients.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">لا توجد عقود بعد</p>
          </div>
        ) : (
          <div className="space-y-2">
            {clients.map((client: any, i: number) => {
              const isExpiring = client.contract_end && differenceInDays(parseISO(client.contract_end), new Date()) <= 30 && differenceInDays(parseISO(client.contract_end), new Date()) >= 0;
              const isExpired = client.contract_end && differenceInDays(parseISO(client.contract_end), new Date()) < 0;
              return (
                <motion.div key={client.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/30 ${isExpired ? 'border-destructive/30 bg-destructive/5' : isExpiring ? 'border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-950/10' : 'border-border'}`}>
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
                  <div className="text-left text-[10px] text-muted-foreground flex items-center gap-1.5">
                    {client.contract_start && client.contract_end ? (
                      <>
                        <Calendar className="w-3 h-3" />
                        <span>{format(parseISO(client.contract_start), 'MM/yyyy')} - {format(parseISO(client.contract_end), 'MM/yyyy')}</span>
                        {isExpired && <Badge variant="destructive" className="text-[8px]">منتهي</Badge>}
                        {isExpiring && <Badge variant="secondary" className="text-[8px] text-amber-600">ينتهي قريباً</Badge>}
                      </>
                    ) : (
                      <Badge variant="outline" className="text-[9px]"><AlertTriangle className="w-2.5 h-2.5 ml-1" />بدون عقد</Badge>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

OfficeFinancePanel.displayName = 'OfficeFinancePanel';
export default OfficeFinancePanel;
