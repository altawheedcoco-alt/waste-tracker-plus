import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useConsultingOffice } from '@/hooks/useConsultingOffice';
import {
  ShieldCheck, Calendar, AlertTriangle, CheckCircle2,
  Clock, Loader2, Users, XCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, parseISO, format } from 'date-fns';
import { ar } from 'date-fns/locale';

const OfficeLicensesPanel = memo(() => {
  const { office, members } = useConsultingOffice();

  // Get all member credentials
  const consultantIds = members.map((m: any) => m.consultant_id);
  const { data: allCredentials = [], isLoading } = useQuery({
    queryKey: ['office-all-credentials', consultantIds],
    queryFn: async () => {
      if (consultantIds.length === 0) return [];
      const { data } = await supabase
        .from('consultant_credentials')
        .select(`*, consultant:environmental_consultants(full_name, consultant_code)`)
        .in('consultant_id', consultantIds)
        .order('expiry_date', { ascending: true });
      return data || [];
    },
    enabled: consultantIds.length > 0,
  });

  const getStatus = (expiryDate: string | null) => {
    if (!expiryDate) return { label: 'بدون تاريخ', variant: 'secondary' as const, icon: Clock };
    const days = differenceInDays(parseISO(expiryDate), new Date());
    if (days < 0) return { label: 'منتهي', variant: 'destructive' as const, icon: XCircle };
    if (days < 30) return { label: `${days} يوم`, variant: 'destructive' as const, icon: AlertTriangle };
    if (days < 90) return { label: `${days} يوم`, variant: 'secondary' as const, icon: Clock };
    return { label: 'ساري', variant: 'default' as const, icon: CheckCircle2 };
  };

  const expired = allCredentials.filter((c: any) => c.expiry_date && differenceInDays(parseISO(c.expiry_date), new Date()) < 0);
  const expiringSoon = allCredentials.filter((c: any) => {
    if (!c.expiry_date) return false;
    const d = differenceInDays(parseISO(c.expiry_date), new Date());
    return d >= 0 && d < 90;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" />تراخيص المكتب والفريق</CardTitle>
        <CardDescription>مراقبة صلاحية تراخيص ومؤهلات الاستشاريين</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Office license */}
        {office && (
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 mb-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-primary" />
              <div className="flex-1">
                <p className="font-bold">ترخيص المكتب</p>
                <p className="text-sm text-muted-foreground">{office.license_number || 'لم يُحدد'} — {office.license_issuer || ''}</p>
              </div>
              {office.license_expiry && (
                <Badge variant={getStatus(office.license_expiry).variant} className="gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(parseISO(office.license_expiry), 'dd MMM yyyy', { locale: ar })}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Alerts */}
        {(expired.length > 0 || expiringSoon.length > 0) && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {expired.length > 0 && (
              <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-bold text-destructive">{expired.length} ترخيص منتهي</span>
                </div>
              </div>
            )}
            {expiringSoon.length > 0 && (
              <div className="p-3 rounded-lg border border-amber-300/30 bg-amber-50 dark:bg-amber-950/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{expiringSoon.length} ينتهي قريباً</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Team credentials */}
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : allCredentials.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">لا توجد تراخيص مسجلة للفريق</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allCredentials.map((cred: any) => {
              const status = getStatus(cred.expiry_date);
              const StatusIcon = status.icon;
              return (
                <div key={cred.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {cred.consultant?.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{cred.document_name}</p>
                    <p className="text-[10px] text-muted-foreground">{cred.consultant?.full_name} — {cred.consultant?.consultant_code}</p>
                  </div>
                  <Badge variant={status.variant} className="text-[9px] gap-0.5">
                    <StatusIcon className="w-2.5 h-2.5" />{status.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

OfficeLicensesPanel.displayName = 'OfficeLicensesPanel';
export default OfficeLicensesPanel;
