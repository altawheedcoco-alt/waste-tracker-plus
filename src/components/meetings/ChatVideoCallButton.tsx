import { useState } from 'react';
import { Video, Phone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { sendDualNotification } from '@/services/unifiedNotifier';
import JitsiMeetingRoom from './JitsiMeetingRoom';

interface ChatVideoCallButtonProps {
  partnerName: string;
  partnerUserId?: string;
}

const ChatVideoCallButton = ({ partnerName, partnerUserId }: ChatVideoCallButtonProps) => {
  const { user, profile, organization } = useAuth();
  const [callType, setCallType] = useState<'video' | 'audio' | null>(null);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const startCall = async (type: 'video' | 'audio') => {
    if (!user?.id || !organization?.id) return;
    setStarting(true);

    const room = `wapilot-call-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const { data: meeting, error } = await supabase
      .from('video_meetings')
      .insert({
        organization_id: organization.id,
        created_by: user.id,
        title: `مكالمة ${type === 'video' ? 'فيديو' : 'صوتية'} مع ${partnerName}`,
        room_id: room,
        meeting_type: type,
        status: 'active',
        started_at: new Date().toISOString(),
        is_private: true,
        allow_chat: true,
      })
      .select()
      .single();

    if (error || !meeting) {
      toast.error('فشل في بدء المكالمة');
      setStarting(false);
      return;
    }

    // Add self as host
    await supabase.from('video_meeting_participants').insert({
      meeting_id: meeting.id,
      user_id: user.id,
      role: 'host',
      status: 'joined',
      joined_at: new Date().toISOString(),
    });

    // Invite partner if userId provided
    if (partnerUserId) {
      await supabase.from('video_meeting_participants').insert({
        meeting_id: meeting.id,
        user_id: partnerUserId,
        role: 'participant',
        status: 'invited',
        invited_by: user.id,
      });

      // Send notification
      const partnerProfile = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', partnerUserId)
        .single();

      if (partnerProfile.data?.organization_id) {
        await sendDualNotification({
          user_id: partnerUserId,
          organization_id: partnerProfile.data.organization_id,
          title: `📞 مكالمة ${type === 'video' ? 'فيديو' : 'صوتية'} واردة`,
          message: `${profile?.full_name || 'مستخدم'} يدعوك للانضمام لمكالمة ${type === 'video' ? 'فيديو' : 'صوتية'}`,
          type: 'general',
          priority: 'high',
          metadata: { meeting_id: meeting.id, call_type: type },
        });
      }
    }

    setCallType(type);
    setMeetingId(meeting.id);
    setRoomId(room);
    setStarting(false);
  };

  const endCall = async () => {
    if (meetingId) {
      await supabase.from('video_meetings')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', meetingId);
    }
    setCallType(null);
    setMeetingId(null);
    setRoomId(null);
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => startCall('audio')}
          disabled={starting}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-emerald-600"
          title="مكالمة صوتية"
        >
          <Phone className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => startCall('video')}
          disabled={starting}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-emerald-600"
          title="مكالمة فيديو"
        >
          <Video className="w-4 h-4" />
        </Button>
      </div>

      <Dialog open={!!callType} onOpenChange={(open) => { if (!open) endCall(); }}>
        <DialogContent className="max-w-5xl h-[85vh] p-0 gap-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>مكالمة {callType === 'video' ? 'فيديو' : 'صوتية'} مع {partnerName}</DialogTitle>
          </DialogHeader>
          {roomId && meetingId && callType && (
            <JitsiMeetingRoom
              roomId={roomId}
              meetingId={meetingId}
              displayName={profile?.full_name || 'مستخدم'}
              isHost={true}
              meetingType={callType}
              onLeave={endCall}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatVideoCallButton;
