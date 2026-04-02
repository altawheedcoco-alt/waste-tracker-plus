import { useEffect, useRef, useState } from 'react';
import { useWebRTCCall } from '@/hooks/useWebRTCCall';
import CallScreen from '@/components/chat/CallScreen';
import MeetingChat from './MeetingChat';
import MeetingParticipants from './MeetingParticipants';
import { Button } from '@/components/ui/button';
import { MessageSquare, Users, Maximize2, Minimize2, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WebRTCMeetingRoomProps {
  roomId: string;
  meetingId: string;
  displayName: string;
  isHost: boolean;
  meetingType?: 'video' | 'audio';
  partnerUserId?: string;
  onLeave: () => void;
}

const WebRTCMeetingRoom = ({
  roomId,
  meetingId,
  displayName,
  isHost,
  meetingType = 'video',
  partnerUserId,
  onLeave,
}: WebRTCMeetingRoomProps) => {
  const {
    callInfo,
    localStream,
    remoteStream,
    callMessages,
    startCall,
    answerCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
    toggleScreenShare,
    toggleRecording,
    sendCallMessage,
  } = useWebRTCCall();

  const [showSidePanel, setShowSidePanel] = useState<'chat' | 'participants' | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  // Auto-start the call using the meeting's room as signaling channel
  useEffect(() => {
    if (initRef.current || callInfo) return;
    initRef.current = true;

    // Use roomId as partner org ID for signaling (meeting context)
    startCall(
      roomId,
      meetingType === 'video' ? 'video' : 'voice',
      `اجتماع: ${displayName}`,
      null
    ).catch(() => {
      // If media access fails, still allow chat/participants
    });
  }, [roomId, meetingType, displayName]);

  const handleLeave = () => {
    endCall('user_ended');
    onLeave();
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // If we have an active WebRTC call, show full CallScreen
  if (callInfo) {
    return (
      <div ref={containerRef} className={cn(
        "relative",
        isFullscreen ? "fixed inset-0 z-[9999]" : "h-[80vh] max-h-[700px] rounded-xl overflow-hidden"
      )}>
        <CallScreen
          callInfo={callInfo}
          localStream={localStream}
          remoteStream={remoteStream}
          callMessages={callMessages}
          onAnswer={answerCall}
          onEnd={handleLeave}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onToggleSpeaker={toggleSpeaker}
          onToggleScreenShare={toggleScreenShare}
          onToggleRecording={toggleRecording}
          onSendMessage={sendCallMessage}
        />

        {/* Meeting-specific side panels overlay */}
        {showSidePanel && (
          <div className="absolute top-0 end-0 bottom-0 w-80 z-[101] bg-[#16213e]/95 backdrop-blur-xl border-s border-white/10 flex flex-col">
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setShowSidePanel('chat')}
                className={cn(
                  "flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors",
                  showSidePanel === 'chat' ? "text-emerald-400 border-b-2 border-emerald-400" : "text-white/50 hover:text-white/80"
                )}
              >
                <MessageSquare className="w-3.5 h-3.5" /> المحادثة
              </button>
              <button
                onClick={() => setShowSidePanel('participants')}
                className={cn(
                  "flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors",
                  showSidePanel === 'participants' ? "text-emerald-400 border-b-2 border-emerald-400" : "text-white/50 hover:text-white/80"
                )}
              >
                <Users className="w-3.5 h-3.5" /> المشاركون
              </button>
            </div>
            <div className="flex-1 min-h-0">
              {showSidePanel === 'chat' && <MeetingChat meetingId={meetingId} />}
              {showSidePanel === 'participants' && <MeetingParticipants meetingId={meetingId} isHost={isHost} />}
            </div>
          </div>
        )}

        {/* Extra meeting controls (participants, meeting chat, fullscreen) */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[101] flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSidePanel(showSidePanel === 'chat' ? null : 'chat')}
            className={cn(
              "rounded-full w-10 h-10 p-0",
              showSidePanel === 'chat' ? "bg-emerald-500/20 text-emerald-400" : "text-white/70 hover:text-white hover:bg-white/10"
            )}
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSidePanel(showSidePanel === 'participants' ? null : 'participants')}
            className={cn(
              "rounded-full w-10 h-10 p-0",
              showSidePanel === 'participants' ? "bg-emerald-500/20 text-emerald-400" : "text-white/70 hover:text-white hover:bg-white/10"
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
        </div>

        {/* Host badge */}
        {isHost && (
          <div className="absolute top-4 start-4 z-[101] flex items-center gap-1.5 bg-amber-500/90 text-white px-2.5 py-1 rounded-full text-xs font-medium">
            <Shield className="w-3 h-3" />
            منشئ الاجتماع
          </div>
        )}
      </div>
    );
  }

  // Fallback: waiting state while media initializes
  return (
    <div ref={containerRef} className={cn(
      "flex flex-col bg-[#1a1a2e] rounded-xl overflow-hidden items-center justify-center",
      isFullscreen ? "fixed inset-0 z-[9999] rounded-none" : "h-[80vh] max-h-[700px]"
    )}>
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-white text-lg font-medium">جاري تهيئة الاتصال...</p>
        <p className="text-white/50 text-sm">يرجى السماح بالوصول للميكروفون والكاميرا</p>
        <Button
          variant="outline"
          onClick={handleLeave}
          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
        >
          إلغاء
        </Button>
      </div>
    </div>
  );
};

export default WebRTCMeetingRoom;
