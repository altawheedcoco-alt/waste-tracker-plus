import { useState, useEffect } from 'react';
import { UserPlus, Crown, Shield, User, X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getTabChannelName } from '@/lib/tabSession';

interface Participant {
  id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string | null;
  profile?: { full_name: string; avatar_url?: string };
}

const ROLE_ICONS: Record<string, any> = {
  host: Crown,
  moderator: Shield,
  participant: User,
};

const ROLE_LABELS: Record<string, string> = {
  host: 'المضيف',
  moderator: 'مشرف',
  participant: 'مشارك',
};

const STATUS_COLORS: Record<string, string> = {
  joined: 'bg-emerald-500',
  invited: 'bg-amber-500',
  left: 'bg-muted-foreground',
  declined: 'bg-red-500',
};

const MeetingParticipants = ({ meetingId, isHost }: { meetingId: string; isHost: boolean }) => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [inviting, setInviting] = useState<string | null>(null);

  const fetchParticipants = async () => {
    const { data } = await supabase
      .from('video_meeting_participants')
      .select('*, profile:profiles!video_meeting_participants_user_id_fkey(full_name, avatar_url)')
      .eq('meeting_id', meetingId)
      .order('created_at');

    if (data) setParticipants(data as any);
  };

  useEffect(() => {
    fetchParticipants();

    const channel = supabase
      .channel(getTabChannelName(`meeting-participants-${meetingId}`))
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'video_meeting_participants',
        filter: `meeting_id=eq.${meetingId}`,
      }, () => fetchParticipants())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [meetingId]);

  // Search org members to invite
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }

    const timer = setTimeout(async () => {
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id || '')
        .single();

      if (!myProfile?.organization_id) return;

      const existingUserIds = participants.map(p => p.user_id);

      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('organization_id', myProfile.organization_id)
        .ilike('full_name', `%${searchQuery}%`)
        .not('id', 'in', `(${existingUserIds.length > 0 ? existingUserIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)
        .limit(10);

      setSearchResults(data || []);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, participants, user?.id]);

  const inviteUser = async (userId: string) => {
    setInviting(userId);
    const { error } = await supabase.from('video_meeting_participants').insert({
      meeting_id: meetingId,
      user_id: userId,
      role: 'participant',
      status: 'invited',
      invited_by: user?.id,
    });

    if (error) {
      toast.error('فشل في دعوة المشارك');
    } else {
      toast.success('تم إرسال الدعوة');
      setSearchQuery('');
      setSearchResults([]);
    }
    setInviting(null);
  };

  const kickUser = async (participantId: string) => {
    await supabase.from('video_meeting_participants')
      .update({ status: 'kicked' })
      .eq('id', participantId);
    toast.success('تم إزالة المشارك');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Invite section */}
      {isHost && (
        <div className="p-2 border-b border-white/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInvite(!showInvite)}
            className="w-full text-emerald-400 hover:text-emerald-300 text-xs gap-1.5 h-8"
          >
            <UserPlus className="w-3.5 h-3.5" />
            إضافة مشارك
          </Button>

          {showInvite && (
            <div className="mt-2 space-y-2">
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم..."
                className="bg-white/5 border-white/10 text-white text-xs h-8 placeholder:text-white/30"
              />
              {searchResults.map(u => (
                <div key={u.id} className="flex items-center gap-2 py-1 px-2 rounded bg-white/5">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-[9px] bg-blue-600 text-white">
                      {(u.full_name || '?').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-white/80 flex-1 truncate">{u.full_name}</span>
                  <Button
                    size="sm"
                    onClick={() => inviteUser(u.id)}
                    disabled={inviting === u.id}
                    className="h-6 w-6 p-0 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {inviting === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Participants list */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1.5">
          {participants.map(p => {
            const RoleIcon = ROLE_ICONS[p.role] || User;
            return (
              <div key={p.id} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-white/5">
                <div className="relative">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="text-[10px] bg-emerald-600/50 text-white">
                      {(p.profile?.full_name || '?').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn("absolute -bottom-0.5 -end-0.5 w-2.5 h-2.5 rounded-full border border-[#16213e]", STATUS_COLORS[p.status] || 'bg-muted-foreground')} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/90 truncate">{p.profile?.full_name || 'مستخدم'}</p>
                  <div className="flex items-center gap-1">
                    <RoleIcon className="w-2.5 h-2.5 text-amber-400" />
                    <span className="text-[9px] text-white/40">{ROLE_LABELS[p.role]}</span>
                  </div>
                </div>

                {isHost && p.user_id !== user?.id && p.status !== 'kicked' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => kickUser(p.id)}
                    className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-2 border-t border-white/10 text-center">
        <span className="text-[10px] text-white/30">{participants.filter(p => p.status === 'joined').length} متصل</span>
      </div>
    </div>
  );
};

export default MeetingParticipants;
