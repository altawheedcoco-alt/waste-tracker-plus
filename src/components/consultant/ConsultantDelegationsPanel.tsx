import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeftRight, Shield, Clock, CheckCircle2, XCircle,
  Loader2, Users, Calendar, Building2,
} from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import { ar } from 'date-fns/locale';

const roleLabels: Record<string, string> = {
  director: 'مدير المكتب', senior_consultant: 'استشاري أول',
  consultant: 'استشاري', assistant: 'مساعد', delegate: 'مفوّض', trainee: 'متدرب',
};

const ConsultantDelegationsPanel = memo(() => {
  const { profile } = useAuth();

  const { data: consultantProfile } = useQuery({
    queryKey: ['my-consultant-profile', profile?.user_id],
    queryFn: async () => {
      if (!profile?.user_id) return null;
      const { data } = await supabase.from('environmental_consultants').select('id')
        .eq('user_id', profile.user_id).maybeSingle();
      return data;
    },
    enabled: !!profile?.user_id,
  });

  // Delegations received (where I'm the delegate)
  const { data: receivedDelegations = [], isLoading: loadingReceived } = useQuery({
    queryKey: ['delegations-received', consultantProfile?.id],
    queryFn: async () => {
      if (!consultantProfile?.id) return [];
      const { data } = await supabase
        .from('office_consultant_memberships')
        .select(`*, office:consulting_offices(id, office_name),
          delegator:environmental_consultants!office_consultant_memberships_delegated_by_fkey(id, full_name, consultant_code)`)
        .eq('consultant_id', consultantProfile.id)
        .not('delegated_by', 'is', null)
        .eq('is_active', true);
      return data || [];
    },
    enabled: !!consultantProfile?.id,
  });

  // Delegations issued (where I delegated someone)
  const { data: issuedDelegations = [], isLoading: loadingIssued } = useQuery({
    queryKey: ['delegations-issued', consultantProfile?.id],
    queryFn: async () => {
      if (!consultantProfile?.id) return [];
      const { data } = await supabase
        .from('office_consultant_memberships')
        .select(`*, office:consulting_offices(id, office_name),
          consultant:environmental_consultants(id, full_name, consultant_code)`)
        .eq('delegated_by', consultantProfile.id)
        .eq('is_active', true);
      return data || [];
    },
    enabled: !!consultantProfile?.id,
  });

  const isLoading = loadingReceived || loadingIssued;
  const totalDelegations = receivedDelegations.length + issuedDelegations.length;

  const getDelegationStatus = (d: any) => {
    if (d.delegation_expires_at && isPast(parseISO(d.delegation_expires_at))) {
      return { label: 'منتهي', variant: 'destructive' as const, icon: XCircle };
    }
    return { label: 'ساري', variant: 'default' as const, icon: CheckCircle2 };
  };

  const DelegationCard = ({ d, type }: { d: any; type: 'received' | 'issued' }) => {
    const status = getDelegationStatus(d);
    const StatusIcon = status.icon;
    const personName = type === 'received' ? d.delegator?.full_name : d.consultant?.full_name;
    const personCode = type === 'received' ? d.delegator?.consultant_code : d.consultant?.consultant_code;

    return (
      <div className="flex items-start gap-3 p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${type === 'received' ? 'bg-emerald-500/10' : 'bg-primary/10'}`}>
          <ArrowLeftRight className={`w-5 h-5 ${type === 'received' ? 'text-emerald-600' : 'text-primary'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium">{personName || 'غير محدد'}</p>
            {personCode && <Badge variant="outline" className="text-[9px] font-mono">{personCode}</Badge>}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {d.office && (
              <Badge variant="outline" className="text-[9px] gap-0.5">
                <Building2 className="w-2.5 h-2.5" />{d.office.office_name}
              </Badge>
            )}
            <Badge variant="secondary" className="text-[9px]">{roleLabels[d.role] || d.role}</Badge>
            {d.delegation_scope && (
              <Badge variant="outline" className="text-[9px]">{d.delegation_scope}</Badge>
            )}
          </div>
          {d.delegation_expires_at && (
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5" />
              ينتهي: {format(parseISO(d.delegation_expires_at), 'dd MMM yyyy', { locale: ar })}
            </p>
          )}
        </div>
        <Badge variant={status.variant} className="text-[9px] gap-0.5">
          <StatusIcon className="w-2.5 h-2.5" />{status.label}
        </Badge>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-primary" />التفويضات
        </CardTitle>
        <CardDescription>التفويضات الصادرة منك والواردة إليك</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : totalDelegations === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">لا توجد تفويضات</p>
            <p className="text-sm mt-1">يمكن لمدير المكتب إصدار تفويضات لك</p>
          </div>
        ) : (
          <div className="space-y-6">
            {receivedDelegations.length > 0 && (
              <div>
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />تفويضات واردة ({receivedDelegations.length})
                </h3>
                <div className="space-y-3">
                  {receivedDelegations.map((d: any) => <DelegationCard key={d.id} d={d} type="received" />)}
                </div>
              </div>
            )}
            {issuedDelegations.length > 0 && (
              <div>
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-primary" />تفويضات صادرة ({issuedDelegations.length})
                </h3>
                <div className="space-y-3">
                  {issuedDelegations.map((d: any) => <DelegationCard key={d.id} d={d} type="issued" />)}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ConsultantDelegationsPanel.displayName = 'ConsultantDelegationsPanel';
export default ConsultantDelegationsPanel;
