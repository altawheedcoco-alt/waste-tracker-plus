import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, Inbox, Send, Eye, Loader2, Calendar, Weight, MapPin, AlertTriangle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { ar as arLocale, enUS } from 'date-fns/locale';
import WorkOrderResponseDialog from './WorkOrderResponseDialog';
import WorkOrderDetailDialog from './WorkOrderDetailDialog';

const WorkOrderInbox = () => {
  const { profile } = useAuth();
  const { t, language } = useLanguage();
  const dateLocale = language === 'ar' ? arLocale : enUS;
  const queryClient = useQueryClient();

  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [showResponse, setShowResponse] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Incoming orders (where I'm a recipient)
  const { data: incoming = [], isLoading: loadingIncoming } = useQuery({
    queryKey: ['work-orders', 'incoming', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from('work_order_recipients')
        .select('*, work_orders(*)')
        .eq('recipient_organization_id', profile.organization_id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Enrich with sender org name
      const orgIds = [...new Set((data || []).map((r: any) => r.work_orders?.organization_id).filter(Boolean))];
      if (orgIds.length === 0) return data || [];
      const { data: orgs } = await supabase.from('organizations').select('id, name').in('id', orgIds);
      const orgMap = Object.fromEntries((orgs || []).map(o => [o.id, o.name]));
      return (data || []).map((r: any) => ({
        ...r,
        sender_name: orgMap[r.work_orders?.organization_id] || '',
      }));
    },
    enabled: !!profile?.organization_id,
  });

  // Outgoing orders (that I sent)
  const { data: outgoing = [], isLoading: loadingOutgoing } = useQuery({
    queryKey: ['work-orders', 'outgoing', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from('work_orders')
        .select('*, work_order_recipients(*)')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Enrich with recipient names
      const recipientOrgIds = [...new Set((data || []).flatMap((wo: any) =>
        (wo.work_order_recipients || []).map((r: any) => r.recipient_organization_id)
      ).filter(Boolean))];
      if (recipientOrgIds.length === 0) return data || [];
      const { data: orgs } = await supabase.from('organizations').select('id, name').in('id', recipientOrgIds);
      const orgMap = Object.fromEntries((orgs || []).map(o => [o.id, o.name]));
      return (data || []).map((wo: any) => ({
        ...wo,
        work_order_recipients: (wo.work_order_recipients || []).map((r: any) => ({
          ...r,
          recipient_name: orgMap[r.recipient_organization_id] || '',
        })),
      }));
    },
    enabled: !!profile?.organization_id,
  });

  // Mark as viewed
  const markViewed = async (recipient: any) => {
    if (recipient.status === 'pending') {
      await supabase.from('work_order_recipients')
        .update({ status: 'viewed', viewed_at: new Date().toISOString() } as any)
        .eq('id', recipient.id);
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      draft: { label: t('workOrder.statusDraft'), className: 'bg-muted text-muted-foreground' },
      sent: { label: t('workOrder.statusSent'), className: 'bg-blue-500/10 text-blue-600' },
      pending: { label: t('workOrder.statusPending'), className: 'bg-amber-500/10 text-amber-600' },
      viewed: { label: t('workOrder.statusViewed'), className: 'bg-slate-500/10 text-slate-600' },
      accepted: { label: t('workOrder.statusAccepted'), className: 'bg-green-500/10 text-green-600' },
      rejected: { label: t('workOrder.statusRejected'), className: 'bg-red-500/10 text-red-600' },
      counter_offer: { label: t('workOrder.statusCounterOffer'), className: 'bg-purple-500/10 text-purple-600' },
      partially_accepted: { label: t('workOrder.statusPartiallyAccepted'), className: 'bg-amber-500/10 text-amber-600' },
      in_progress: { label: t('workOrder.statusInProgress'), className: 'bg-blue-500/10 text-blue-600' },
      completed: { label: t('workOrder.statusCompleted'), className: 'bg-green-500/10 text-green-600' },
      cancelled: { label: t('workOrder.statusCancelled'), className: 'bg-red-500/10 text-red-600' },
    };
    const s = map[status] || { label: status, className: 'bg-muted text-muted-foreground' };
    return <Badge className={s.className}>{s.label}</Badge>;
  };

  const getUrgencyBadge = (urgency: string) => {
    if (urgency === 'urgent') return <Badge variant="destructive" className="gap-1 text-[10px]"><AlertTriangle className="w-3 h-3" />{t('workOrder.urgencyUrgent')}</Badge>;
    if (urgency === 'high') return <Badge className="bg-amber-500/10 text-amber-600 text-[10px]">{t('workOrder.urgencyHigh')}</Badge>;
    return null;
  };

  const pendingCount = incoming.filter((r: any) => r.status === 'pending' || r.status === 'viewed').length;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="w-5 h-5 text-primary" />
            {t('workOrder.title')}
            {pendingCount > 0 && (
              <Badge variant="destructive" className="text-xs">{pendingCount}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="incoming">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="incoming" className="gap-1.5">
                <Inbox className="w-4 h-4" />
                {t('workOrder.received')}
                {pendingCount > 0 && <Badge variant="secondary" className="text-[10px] px-1.5">{pendingCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="outgoing" className="gap-1.5">
                <Send className="w-4 h-4" />
                {t('workOrder.sent')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="incoming" className="space-y-2">
              {loadingIncoming ? (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : incoming.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">{t('workOrder.noOrdersDesc')}</p>
                </div>
              ) : (
                incoming.map((rec: any) => {
                  const wo = rec.work_orders;
                  if (!wo) return null;
                  return (
                    <div key={rec.id} className={`p-3 rounded-lg border transition-colors ${
                      rec.status === 'pending' ? 'border-primary/30 bg-primary/5' : 'bg-card'
                    }`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-mono text-sm font-bold">{wo.order_number}</span>
                            {getStatusBadge(rec.status)}
                            {getUrgencyBadge(wo.urgency)}
                            {wo.is_hazardous && <Badge variant="destructive" className="text-[10px]">⚠️</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{t('workOrder.from')}: <strong>{rec.sender_name}</strong></p>
                          <p className="text-sm mt-1">{wo.waste_type} — {wo.estimated_quantity} {wo.unit === 'ton' ? t('workOrder.ton') : wo.unit}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            {wo.preferred_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(wo.preferred_date), 'dd/MM/yyyy', { locale: dateLocale })}</span>}
                            {wo.pickup_location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{wo.pickup_location}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => {
                            markViewed(rec);
                            setSelectedOrder({ ...wo, recipient: rec });
                            setShowDetail(true);
                          }}>
                            <Eye className="w-3 h-3" /> {t('workOrder.viewDetails')}
                          </Button>
                          {(rec.status === 'pending' || rec.status === 'viewed') && (
                            <Button size="sm" className="gap-1 text-xs" onClick={() => {
                              markViewed(rec);
                              setSelectedRecipient(rec);
                              setShowResponse(true);
                            }}>
                              {t('workOrder.submitResponse')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="outgoing" className="space-y-2">
              {loadingOutgoing ? (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : outgoing.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Send className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">{t('workOrder.noOrdersSentDesc')}</p>
                </div>
              ) : (
                outgoing.map((wo: any) => (
                  <div key={wo.id} className="p-3 rounded-lg border bg-card" onClick={() => { setSelectedOrder(wo); setShowDetail(true); }}>
                    <div className="flex items-start justify-between gap-2 cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-sm font-bold">{wo.order_number}</span>
                          {getStatusBadge(wo.status)}
                          {getUrgencyBadge(wo.urgency)}
                        </div>
                        <p className="text-sm">{wo.waste_type} — {wo.estimated_quantity} {wo.unit === 'ton' ? t('workOrder.ton') : wo.unit}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {(wo.work_order_recipients || []).map((r: any) => (
                            <div key={r.id} className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">{r.recipient_name}</span>
                              {getStatusBadge(r.status)}
                            </div>
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {format(new Date(wo.created_at), 'dd/MM', { locale: dateLocale })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {selectedRecipient && (
        <WorkOrderResponseDialog
          open={showResponse}
          onOpenChange={setShowResponse}
          recipient={selectedRecipient}
          workOrder={selectedRecipient.work_orders}
        />
      )}

      {selectedOrder && (
        <WorkOrderDetailDialog
          open={showDetail}
          onOpenChange={setShowDetail}
          workOrder={selectedOrder}
        />
      )}
    </>
  );
};

export default WorkOrderInbox;
