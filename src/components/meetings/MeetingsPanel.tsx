import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Video, Phone, Users, Clock, Play, Calendar, 
  ArrowLeft, Loader2, PhoneOff, CheckCircle2, Brain
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import CreateMeetingDialog from './CreateMeetingDialog';
import WebRTCMeetingRoom from './WebRTCMeetingRoom';
import MeetingSummaryPanel from './MeetingSummaryPanel';

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  room_id: string;
  meeting_type: string;
  status: string;
  created_by: string;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  allow_chat: boolean;
  creator?: { full_name: string };
  participant_count?: number;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: 'جارٍ الآن', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: Play },
  scheduled: { label: 'مجدول', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Calendar },
  ended: { label: 'انتهى', color: 'bg-muted-foreground/10 text-muted-foreground border-gray-500/20', icon: CheckCircle2 },
  cancelled: { label: 'ملغي', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: PhoneOff },
};

const MeetingsPanel = () => {
  const { user, profile, organization } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [tab, setTab] = useState('active');
  const [summaryMeeting, setSummaryMeeting] = useState<{ id: string; title: string } | null>(null);

  const fetchMeetings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('video_meetings')
      .select('*, creator:profiles!video_meetings_created_by_fkey(full_name)')
      .eq('organization_id', organization?.id || '')
      .order('created_at', { ascending: false });

    if (data) setMeetings(data as any);
    setLoading(false);
  };

  useEffect(() => {
    if (organization?.id) fetchMeetings();
  }, [organization?.id]);

  const joinMeeting = async (meeting: Meeting) => {
    // Add as participant if not already
    await supabase.from('video_meeting_participants').upsert({
      meeting_id: meeting.id,
      user_id: user?.id || '',
      role: meeting.created_by === user?.id ? 'host' : 'participant',
      status: 'joined',
      joined_at: new Date().toISOString(),
    }, { onConflict: 'meeting_id,user_id' });

    // If scheduled meeting, set to active
    if (meeting.status === 'scheduled' && meeting.created_by === user?.id) {
      await supabase.from('video_meetings')
        .update({ status: 'active', started_at: new Date().toISOString() })
        .eq('id', meeting.id);
    }

    setActiveMeeting(meeting);
    setActiveMeetingId(meeting.id);
  };

  const leaveMeeting = async () => {
    if (!activeMeetingId || !user?.id) return;

    await supabase.from('video_meeting_participants')
      .update({ status: 'left', left_at: new Date().toISOString() })
      .eq('meeting_id', activeMeetingId)
      .eq('user_id', user.id);

    // If host, end the meeting
    if (activeMeeting?.created_by === user.id) {
      await supabase.from('video_meetings')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', activeMeetingId);
    }

    setActiveMeetingId(null);
    setActiveMeeting(null);
    fetchMeetings();
    toast.success('تم مغادرة الاجتماع');
  };

  const endMeeting = async (meetingId: string) => {
    await supabase.from('video_meetings')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', meetingId);
    fetchMeetings();
    toast.success('تم إنهاء الاجتماع');
  };

  // If viewing summary
  if (summaryMeeting) {
    return (
      <MeetingSummaryPanel
        meetingId={summaryMeeting.id}
        meetingTitle={summaryMeeting.title}
        onBack={() => setSummaryMeeting(null)}
      />
    );
  }

  // If in an active meeting, show the room
  if (activeMeetingId && activeMeeting) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={leaveMeeting} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            مغادرة
          </Button>
          <h2 className="text-lg font-bold">{activeMeeting.title}</h2>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">
            <Play className="w-3 h-3 me-1" /> جارٍ الآن
          </Badge>
        </div>
        <WebRTCMeetingRoom
          roomId={activeMeeting.room_id}
          meetingId={activeMeetingId}
          displayName={profile?.full_name || 'مستخدم'}
          isHost={activeMeeting.created_by === user?.id}
          meetingType={activeMeeting.meeting_type as 'video' | 'audio'}
          onLeave={leaveMeeting}
        />
      </div>
    );
  }

  const filtered = meetings.filter(m => {
    if (tab === 'active') return m.status === 'active';
    if (tab === 'scheduled') return m.status === 'scheduled';
    if (tab === 'ended') return m.status === 'ended' || m.status === 'cancelled';
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Video className="w-5 h-5 text-emerald-500" />
            الاجتماعات المرئية
          </h2>
          <p className="text-sm text-muted-foreground">اجتماعات فيديو وصوتية مع فريقك وشركائك</p>
        </div>
        <CreateMeetingDialog onCreated={(id) => {
          fetchMeetings();
          const meeting = meetings.find(m => m.id === id);
          if (meeting) joinMeeting(meeting);
          else {
            // Fetch the new meeting and join
            supabase.from('video_meetings').select('*, creator:profiles!video_meetings_created_by_fkey(full_name)').eq('id', id).single().then(({ data }) => {
              if (data) joinMeeting(data as any);
            });
          }
        }} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="active" className="gap-1.5">
            <Play className="w-3.5 h-3.5" /> جارية
            {meetings.filter(m => m.status === 'active').length > 0 && (
              <Badge variant="destructive" className="h-4 px-1 text-[10px]">
                {meetings.filter(m => m.status === 'active').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> مجدولة
          </TabsTrigger>
          <TabsTrigger value="ended" className="gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> منتهية
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Video className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">لا توجد اجتماعات {tab === 'active' ? 'جارية' : tab === 'scheduled' ? 'مجدولة' : 'منتهية'}</p>
                {tab !== 'ended' && (
                  <CreateMeetingDialog
                    onCreated={(id) => {
                      supabase.from('video_meetings').select('*, creator:profiles!video_meetings_created_by_fkey(full_name)').eq('id', id).single().then(({ data }) => {
                        if (data) joinMeeting(data as any);
                      });
                    }}
                    trigger={<Button variant="outline" size="sm" className="mt-3 gap-1.5"><Plus className="w-3.5 h-3.5" /> إنشاء اجتماع</Button>}
                  />
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map(meeting => {
                const statusInfo = STATUS_MAP[meeting.status] || STATUS_MAP.ended;
                const StatusIcon = statusInfo.icon;
                return (
                  <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm font-semibold leading-tight">{meeting.title}</CardTitle>
                        <Badge variant="outline" className={cn("text-[10px] shrink-0", statusInfo.color)}>
                          <StatusIcon className="w-3 h-3 me-1" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {meeting.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{meeting.description}</p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          {meeting.meeting_type === 'video' ? <Video className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                          {meeting.meeting_type === 'video' ? 'فيديو' : 'صوتي'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {meeting.creator?.full_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(meeting.scheduled_at || meeting.created_at), 'dd MMM hh:mm a', { locale: ar })}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {(meeting.status === 'active' || meeting.status === 'scheduled') && (
                          <Button
                            size="sm"
                            onClick={() => joinMeeting(meeting)}
                            className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs h-8"
                          >
                            <Play className="w-3 h-3" />
                            {meeting.status === 'active' ? 'انضمام' : 'بدء'}
                          </Button>
                        )}
                        {(meeting.status === 'ended' || meeting.status === 'cancelled') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSummaryMeeting({ id: meeting.id, title: meeting.title })}
                            className="flex-1 gap-1.5 text-xs h-8 text-purple-600 border-purple-500/20 hover:bg-purple-500/10"
                          >
                            <Brain className="w-3 h-3" />
                            ملخص AI
                          </Button>
                        )}
                        {meeting.created_by === user?.id && meeting.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => endMeeting(meeting.id)}
                            className="text-xs h-8 text-red-500 border-red-500/20 hover:bg-red-500/10"
                          >
                            <PhoneOff className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Fix missing import
import { Plus } from 'lucide-react';

export default MeetingsPanel;
