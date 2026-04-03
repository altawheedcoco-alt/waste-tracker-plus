import { useState, useEffect, memo } from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Video, Clock, ArrowLeft, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

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

interface CallHistoryPanelProps {
  partnerOrgId?: string;
  onClose: () => void;
  onCallback?: (type: 'voice' | 'video') => void;
}

const formatDuration = (seconds: number | null) => {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}د ${s}ث` : `${s}ث`;
};

const CallHistoryPanel = memo(({ partnerOrgId, onClose, onCallback }: CallHistoryPanelProps) => {
  const { user, organization } = useAuth();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'outgoing' | 'incoming' | 'missed'>('all');

  useEffect(() => {
    if (!organization?.id) return;
    fetchCalls();
  }, [organization?.id, partnerOrgId]);

  const fetchCalls = async () => {
    if (!organization?.id) return;
    setLoading(true);

    let query = supabase
      .from('call_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (partnerOrgId) {
      query = query.or(
        `and(caller_org_id.eq.${organization.id},receiver_org_id.eq.${partnerOrgId}),and(caller_org_id.eq.${partnerOrgId},receiver_org_id.eq.${organization.id})`
      );
    } else {
      query = query.or(`caller_org_id.eq.${organization.id},receiver_org_id.eq.${organization.id}`);
    }

    const { data } = await query;
    setCalls((data as CallRecord[]) || []);
    setLoading(false);
  };

  const getCallDirection = (call: CallRecord) => {
    if (call.caller_id === user?.id || call.caller_org_id === organization?.id) return 'outgoing';
    return 'incoming';
  };

  const filteredCalls = calls.filter(call => {
    if (filter === 'all') return true;
    const dir = getCallDirection(call);
    if (filter === 'outgoing') return dir === 'outgoing';
    if (filter === 'incoming') return dir === 'incoming';
    if (filter === 'missed') return call.status === 'missed' || call.status === 'rejected' || call.status === 'busy';
    return true;
  });

  const getCallIcon = (call: CallRecord) => {
    const dir = getCallDirection(call);
    if (call.status === 'missed' || call.status === 'rejected' || call.status === 'busy') {
      return <PhoneMissed className="w-4 h-4 text-red-500" />;
    }
    return dir === 'outgoing' 
      ? <PhoneOutgoing className="w-4 h-4 text-emerald-500" /> 
      : <PhoneIncoming className="w-4 h-4 text-blue-500" />;
  };

  const getPartnerInfo = (call: CallRecord) => {
    const dir = getCallDirection(call);
    if (dir === 'outgoing') {
      return { name: call.receiver_name || 'مستخدم', avatar: call.receiver_avatar_url };
    }
    return { name: call.caller_name || 'مستخدم', avatar: call.caller_avatar_url };
  };

  const getStatusText = (call: CallRecord) => {
    switch (call.status) {
      case 'ended': case 'answered': return `مكالمة ${formatDuration(call.duration_seconds)}`;
      case 'missed': return 'مكالمة فائتة';
      case 'rejected': return 'مكالمة مرفوضة';
      case 'busy': return call.busy_message ? `مشغول: ${call.busy_message}` : 'مشغول';
      case 'ringing': return 'جارية...';
      default: return call.status;
    }
  };

  const filters = [
    { key: 'all' as const, label: 'الكل' },
    { key: 'outgoing' as const, label: 'صادرة' },
    { key: 'incoming' as const, label: 'واردة' },
    { key: 'missed' as const, label: 'فائتة' },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <PhoneCall className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-sm">سجل المكالمات</h3>
      </div>

      {/* Filters */}
      <div className="flex gap-1 p-2 border-b border-border">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              filter === f.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Call list */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredCalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Phone className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">لا توجد مكالمات</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredCalls.map(call => {
              const partner = getPartnerInfo(call);
              const isMissed = call.status === 'missed' || call.status === 'rejected' || call.status === 'busy';

              return (
                <div key={call.id} className="flex items-center gap-3 px-3 py-3 hover:bg-muted/50 transition-colors">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={partner.avatar || undefined} />
                    <AvatarFallback className="text-xs bg-muted">
                      {partner.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getCallIcon(call)}
                      <span className={cn('text-sm font-medium truncate', isMissed && 'text-red-500')}>
                        {partner.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                      {call.call_type === 'video' ? <Video className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                      <span>{getStatusText(call)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(call.created_at), { addSuffix: true, locale: ar })}
                    </span>
                    {onCallback && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onCallback(call.call_type === 'video' ? 'video' : 'voice')}
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
});

CallHistoryPanel.displayName = 'CallHistoryPanel';
export default CallHistoryPanel;
