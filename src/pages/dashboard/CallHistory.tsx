import { useState, useEffect } from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Video, Clock, PhoneCall, ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useGlobalCall } from '@/providers/GlobalCallProvider';
import { toast } from 'sonner';
import BackButton from '@/components/ui/back-button';

interface CallRecord {
  id: string;
  caller_id: string;
  caller_org_id: string;
  receiver_org_id: string;
  receiver_user_id: string | null;
  call_type: string;
  status: string;
  duration_seconds: number | null;
  created_at: string;
  caller_name: string | null;
  caller_avatar_url: string | null;
  receiver_name: string | null;
  receiver_avatar_url: string | null;
  busy_message: string | null;
}

const formatDuration = (seconds: number | null) => {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}س ${m}د`;
  return m > 0 ? `${m}د ${s}ث` : `${s}ث`;
};

const CallHistory = () => {
  const { user, organization } = useAuth();
  const { startCall } = useGlobalCall();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'outgoing' | 'incoming' | 'missed'>('all');

  useEffect(() => {
    fetchCalls();
  }, [organization?.id]);

  const fetchCalls = async () => {
    if (!organization?.id) return;
    setLoading(true);

    const { data } = await supabase
      .from('call_records')
      .select('*')
      .or(`caller_org_id.eq.${organization.id},receiver_org_id.eq.${organization.id}`)
      .order('created_at', { ascending: false })
      .limit(100);

    setCalls((data as CallRecord[]) || []);
    setLoading(false);
  };

  const getCallDirection = (call: CallRecord) => {
    return (call.caller_id === user?.id || call.caller_org_id === organization?.id) ? 'outgoing' : 'incoming';
  };

  const filteredCalls = calls.filter(call => {
    if (filter === 'all') return true;
    const dir = getCallDirection(call);
    if (filter === 'outgoing') return dir === 'outgoing';
    if (filter === 'incoming') return dir === 'incoming';
    if (filter === 'missed') return ['missed', 'rejected', 'busy'].includes(call.status);
    return true;
  });

  const stats = {
    total: calls.length,
    outgoing: calls.filter(c => getCallDirection(c) === 'outgoing').length,
    incoming: calls.filter(c => getCallDirection(c) === 'incoming').length,
    missed: calls.filter(c => ['missed', 'rejected', 'busy'].includes(c.status)).length,
  };

  const getCallIcon = (call: CallRecord) => {
    const dir = getCallDirection(call);
    if (['missed', 'rejected', 'busy'].includes(call.status)) return <PhoneMissed className="w-4 h-4 text-red-500" />;
    return dir === 'outgoing' ? <PhoneOutgoing className="w-4 h-4 text-emerald-500" /> : <PhoneIncoming className="w-4 h-4 text-blue-500" />;
  };

  const getPartnerInfo = (call: CallRecord) => {
    const dir = getCallDirection(call);
    if (dir === 'outgoing') {
      return {
        name: call.receiver_name || 'مستخدم',
        avatar: call.receiver_avatar_url,
        orgId: call.receiver_org_id,
        userId: call.receiver_user_id || undefined,
      };
    }

    return {
      name: call.caller_name || 'مستخدم',
      avatar: call.caller_avatar_url,
      orgId: call.caller_org_id,
      userId: call.caller_id || undefined,
    };
  };

  const getStatusText = (call: CallRecord) => {
    switch (call.status) {
      case 'ended': case 'answered': return formatDuration(call.duration_seconds);
      case 'missed': return 'فائتة';
      case 'rejected': return 'مرفوضة';
      case 'busy': return call.busy_message || 'مشغول';
      default: return call.status;
    }
  };

  const handleCallback = async (call: CallRecord) => {
    const partner = getPartnerInfo(call);
    try {
      await startCall(partner.orgId, call.call_type as any, partner.name, partner.avatar, partner.userId);
    } catch (err: any) {
      toast.error(err.message || 'فشل بدء المكالمة');
    }
  };

  const filters = [
    { key: 'all' as const, label: 'الكل', count: stats.total, icon: Phone },
    { key: 'outgoing' as const, label: 'صادرة', count: stats.outgoing, icon: PhoneOutgoing },
    { key: 'incoming' as const, label: 'واردة', count: stats.incoming, icon: PhoneIncoming },
    { key: 'missed' as const, label: 'فائتة', count: stats.missed, icon: PhoneMissed },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4">
        <BackButton />
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <PhoneCall className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">سجل المكالمات</h1>
            <p className="text-xs text-muted-foreground">جميع المكالمات الصادرة والواردة</p>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-4 gap-2">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'flex flex-col items-center gap-1 p-3 rounded-xl border transition-all',
                filter === f.key
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-card hover:bg-muted/50'
              )}
            >
              <f.icon className={cn('w-4 h-4', filter === f.key ? 'text-primary' : 'text-muted-foreground')} />
              <span className="text-lg font-bold">{f.count}</span>
              <span className="text-[10px] text-muted-foreground">{f.label}</span>
            </button>
          ))}
        </div>

        {/* Call list */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredCalls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Phone className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">لا توجد مكالمات</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredCalls.map(call => {
                  const partner = getPartnerInfo(call);
                  const isMissed = ['missed', 'rejected', 'busy'].includes(call.status);

                  return (
                    <div key={call.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                      <Avatar className="w-11 h-11">
                        <AvatarImage src={partner.avatar || undefined} />
                        <AvatarFallback className="text-sm bg-muted">
                          {partner.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {getCallIcon(call)}
                          <span className={cn('text-sm font-medium truncate', isMissed && 'text-red-500')}>
                            {partner.name}
                          </span>
                          {call.call_type === 'video' && <Video className="w-3.5 h-3.5 text-muted-foreground" />}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                          <span>{getStatusText(call)}</span>
                          <span>•</span>
                          <span>{format(new Date(call.created_at), 'dd MMM, HH:mm', { locale: ar })}</span>
                        </div>
                        {call.busy_message && call.status === 'busy' && (
                          <span className="text-[10px] text-amber-600 mt-0.5 block">💬 {call.busy_message}</span>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                        onClick={() => handleCallback(call)}
                        title="إعادة الاتصال"
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CallHistory;
