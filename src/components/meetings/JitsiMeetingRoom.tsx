import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, 
  MessageSquare, Users, Maximize2, Minimize2, Shield, ExternalLink, VideoIcon as VideoPlaceholder
} from 'lucide-react';
import { cn } from '@/lib/utils';
import MeetingChat from './MeetingChat';
import MeetingParticipants from './MeetingParticipants';

interface JitsiMeetingRoomProps {
  roomId: string;
  meetingId: string;
  displayName: string;
  isHost: boolean;
  meetingType?: 'video' | 'audio';
  onLeave: () => void;
}

const JitsiMeetingRoom = ({
  roomId,
  meetingId,
  displayName,
  isHost,
  meetingType = 'video',
  onLeave,
}: JitsiMeetingRoomProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(meetingType === 'audio');
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [jitsiWindowOpen, setJitsiWindowOpen] = useState(false);
  const jitsiWindowRef = useRef<Window | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build Jitsi URL with config
  const jitsiUrl = (() => {
    const base = `https://meet.jit.si/${roomId}`;
    const config = [
      `userInfo.displayName=${encodeURIComponent(displayName)}`,
      'config.startWithAudioMuted=false',
      `config.startWithVideoMuted=${meetingType === 'audio'}`,
      'config.prejoinPageEnabled=false',
      'config.disableDeepLinking=true',
      'config.hideConferenceSubject=true',
      'config.hideConferenceTimer=false',
      'config.disableInviteFunctions=true',
      'interfaceConfig.SHOW_JITSI_WATERMARK=false',
      'interfaceConfig.SHOW_BRAND_WATERMARK=false',
      'interfaceConfig.SHOW_POWERED_BY=false',
      'interfaceConfig.DEFAULT_BACKGROUND=#1a1a2e',
      'interfaceConfig.DISABLE_JOIN_LEAVE_NOTIFICATIONS=false',
    ];
    return `${base}#${config.join('&')}`;
  })();

  // Open Jitsi in new window
  const openJitsiWindow = useCallback(() => {
    if (jitsiWindowRef.current && !jitsiWindowRef.current.closed) {
      jitsiWindowRef.current.focus();
      return;
    }
    const w = window.open(jitsiUrl, `jitsi_${roomId}`, 'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no');
    if (w) {
      jitsiWindowRef.current = w;
      setJitsiWindowOpen(true);
    }
  }, [jitsiUrl, roomId]);

  // Auto-open on mount
  useEffect(() => {
    openJitsiWindow();
  }, [openJitsiWindow]);

  // Monitor if window was closed
  useEffect(() => {
    if (!jitsiWindowOpen) return;
    const interval = setInterval(() => {
      if (jitsiWindowRef.current?.closed) {
        setJitsiWindowOpen(false);
        jitsiWindowRef.current = null;
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [jitsiWindowOpen]);

  // Close jitsi window on unmount
  useEffect(() => {
    return () => {
      if (jitsiWindowRef.current && !jitsiWindowRef.current.closed) {
        jitsiWindowRef.current.close();
      }
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  return (
    <div ref={containerRef} className={cn(
      "flex flex-col bg-[#1a1a2e] rounded-xl overflow-hidden",
      isFullscreen ? "fixed inset-0 z-[9999] rounded-none" : "h-[80vh] max-h-[700px]"
    )}>
      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        {/* Video placeholder area */}
        <div className="flex-1 relative flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <VideoPlaceholder className="w-10 h-10 text-emerald-400" />
            </div>
            {jitsiWindowOpen ? (
              <>
                <p className="text-white text-lg font-medium">الاجتماع مفتوح في نافذة منفصلة</p>
                <p className="text-white/50 text-sm">يمكنك استخدام المحادثة والمشاركين من هنا</p>
                <Button
                  onClick={() => jitsiWindowRef.current?.focus()}
                  variant="outline"
                  className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  التركيز على نافذة الاجتماع
                </Button>
              </>
            ) : (
              <>
                <p className="text-white text-lg font-medium">نافذة الاجتماع مغلقة</p>
                <p className="text-white/50 text-sm">اضغط لإعادة فتح الاجتماع</p>
                <Button
                  onClick={openJitsiWindow}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  فتح الاجتماع
                </Button>
              </>
            )}
          </div>
          
          {/* Host badge */}
          {isHost && (
            <div className="absolute top-3 start-3 flex items-center gap-1.5 bg-amber-500/90 text-white px-2.5 py-1 rounded-full text-xs font-medium">
              <Shield className="w-3 h-3" />
              منشئ الاجتماع
            </div>
          )}
        </div>

        {/* Side panels */}
        {(showChat || showParticipants) && (
          <div className="w-80 border-s border-white/10 flex flex-col bg-[#16213e]">
            {/* Panel tabs */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => { setShowChat(true); setShowParticipants(false); }}
                className={cn(
                  "flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors",
                  showChat ? "text-emerald-400 border-b-2 border-emerald-400" : "text-white/50 hover:text-white/80"
                )}
              >
                <MessageSquare className="w-3.5 h-3.5" /> المحادثة
              </button>
              <button
                onClick={() => { setShowParticipants(true); setShowChat(false); }}
                className={cn(
                  "flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors",
                  showParticipants ? "text-emerald-400 border-b-2 border-emerald-400" : "text-white/50 hover:text-white/80"
                )}
              >
                <Users className="w-3.5 h-3.5" /> المشاركون
              </button>
            </div>

            {/* Panel content */}
            <div className="flex-1 min-h-0">
              {showChat && <MeetingChat meetingId={meetingId} />}
              {showParticipants && <MeetingParticipants meetingId={meetingId} isHost={isHost} />}
            </div>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-center gap-2 py-3 px-4 bg-[#0f0f23] border-t border-white/10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setShowChat(!showChat); setShowParticipants(false); }}
          className={cn(
            "rounded-full w-10 h-10 p-0",
            showChat ? "bg-emerald-500/20 text-emerald-400" : "text-white/70 hover:text-white hover:bg-white/10"
          )}
        >
          <MessageSquare className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}
          className={cn(
            "rounded-full w-10 h-10 p-0",
            showParticipants ? "bg-emerald-500/20 text-emerald-400" : "text-white/70 hover:text-white hover:bg-white/10"
          )}
        >
          <Users className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={toggleFullscreen}
          className="rounded-full w-10 h-10 p-0 text-white/70 hover:text-white hover:bg-white/10"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>

        <div className="w-px h-6 bg-white/20 mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={onLeave}
          className="rounded-full bg-red-600 hover:bg-red-700 text-white px-4 h-10 gap-1.5"
        >
          <PhoneOff className="w-4 h-4" />
          مغادرة
        </Button>
      </div>
    </div>
  );
};

export default JitsiMeetingRoom;
