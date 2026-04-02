import { useEffect, useRef, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  Monitor,
  MonitorOff,
  Circle,
  MessageSquare,
  Send,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { CallInfo, CallMessage } from '@/hooks/useWebRTCCall';
import { soundEngine } from '@/lib/soundEngine';
import { useAuth } from '@/contexts/AuthContext';

interface CallScreenProps {
  callInfo: CallInfo;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callMessages?: CallMessage[];
  onAnswer: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleSpeaker: () => void;
  onToggleScreenShare?: () => void;
  onToggleRecording?: () => void;
  onSendMessage?: (content: string) => void;
}

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const CallScreen = memo(({
  callInfo,
  localStream,
  remoteStream,
  callMessages = [],
  onAnswer,
  onEnd,
  onToggleMute,
  onToggleVideo,
  onToggleSpeaker,
  onToggleScreenShare,
  onToggleRecording,
  onSendMessage,
}: CallScreenProps) => {
  const { user } = useAuth();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [showChat, setShowChat] = useState(false);
  const [messageText, setMessageText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [callMessages]);

  const isVideo = callInfo.callType === 'video';
  const isActive = callInfo.state === 'connected';
  const isRinging = callInfo.state === 'ringing' || callInfo.state === 'calling';

  // Play call sounds based on state
  useEffect(() => {
    if (isRinging) {
      soundEngine.play('call_ring');
      const interval = setInterval(() => soundEngine.play('call_ring'), 3000);
      return () => clearInterval(interval);
    }
    if (callInfo.state === 'ended') {
      soundEngine.play('call_end');
    }
  }, [callInfo.state, isRinging]);

  const getStatusText = () => {
    switch (callInfo.state) {
      case 'calling': return 'جاري الاتصال...';
      case 'ringing': return 'مكالمة واردة...';
      case 'connecting': return 'جاري الربط...';
      case 'connected': return formatDuration(callInfo.duration);
      case 'ended': return 'انتهت المكالمة';
      default: return '';
    }
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !onSendMessage) return;
    onSendMessage(messageText.trim());
    setMessageText('');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
      >
        {/* Backdrop */}
        <div className={cn(
          "absolute inset-0",
          isVideo && isActive
            ? "bg-black"
            : "bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-950"
        )} />

        {/* Animated circles for voice call */}
        {!isVideo && isRinging && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                className="absolute rounded-full border border-white/10"
                initial={{ width: 120, height: 120, opacity: 0.5 }}
                animate={{ width: 120 + i * 80, height: 120 + i * 80, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }}
              />
            ))}
          </div>
        )}

        {/* Remote video (full screen) */}
        {isVideo && isActive && (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Local video (PiP) */}
        {isVideo && localStream && (
          <motion.div
            drag
            dragMomentum={false}
            className={cn(
              "absolute top-16 z-10 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20",
              callInfo.isScreenSharing ? "left-4 w-48 h-32" : "left-4 w-32 h-44"
            )}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: callInfo.isScreenSharing ? 'none' : 'scaleX(-1)' }}
            />
            {callInfo.isScreenSharing && (
              <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                📺 مشاركة الشاشة
              </div>
            )}
          </motion.div>
        )}

        {/* Recording indicator */}
        {callInfo.isRecording && (
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-red-600/80 backdrop-blur-sm px-3 py-1.5 rounded-full"
          >
            <Circle className="w-3 h-3 fill-white text-white" />
            <span className="text-white text-xs font-medium">تسجيل</span>
          </motion.div>
        )}

        {/* In-call chat panel */}
        <AnimatePresence>
          {showChat && isActive && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="absolute top-0 right-0 bottom-0 w-80 max-w-[85vw] z-20 bg-black/70 backdrop-blur-xl flex flex-col border-l border-white/10"
            >
              {/* Chat header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <h3 className="text-white font-medium text-sm">رسائل المكالمة</h3>
                <button onClick={() => setShowChat(false)} className="text-white/60 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 px-3 py-2">
                <div className="space-y-2">
                  {callMessages.length === 0 && (
                    <p className="text-white/40 text-xs text-center py-8">لا توجد رسائل بعد</p>
                  )}
                  {callMessages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    const isSystem = msg.senderName === 'النظام';
                    return (
                      <div key={msg.id} className={cn(
                        "flex flex-col",
                        isSystem ? "items-center" : isMe ? "items-end" : "items-start"
                      )}>
                        {isSystem ? (
                          <div className="bg-white/10 text-white/60 text-[10px] px-3 py-1 rounded-full">
                            {msg.content}
                          </div>
                        ) : (
                          <>
                            {!isMe && (
                              <span className="text-white/40 text-[10px] mb-0.5 px-1">{msg.senderName}</span>
                            )}
                            <div className={cn(
                              "max-w-[85%] rounded-2xl px-3 py-1.5 text-sm",
                              isMe
                                ? "bg-emerald-600 text-white rounded-br-sm"
                                : "bg-white/15 text-white rounded-bl-sm"
                            )}>
                              {msg.content}
                            </div>
                            <span className="text-white/30 text-[9px] mt-0.5 px-1">
                              {new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </>
                        )}
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>

              {/* Message input */}
              <div className="p-3 border-t border-white/10">
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                  className="flex gap-2"
                >
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="اكتب رسالة..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 text-sm"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    variant="ghost"
                    disabled={!messageText.trim()}
                    className="text-white hover:bg-white/10 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content overlay */}
        <div className="relative z-10 flex flex-col items-center justify-between h-full py-16 px-6 w-full max-w-sm mx-auto">
          {/* Top: Partner info */}
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center text-center"
          >
            {(!isVideo || !isActive) && (
              <>
                <div className="relative mb-5">
                  <Avatar className={cn(
                    "h-28 w-28 ring-4",
                    isActive ? "ring-emerald-400/50" : "ring-white/20"
                  )}>
                    {callInfo.partnerLogo && <AvatarImage src={callInfo.partnerLogo} />}
                    <AvatarFallback className="bg-white/10 text-white text-3xl font-bold">
                      {callInfo.partnerName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {isRinging && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg"
                    >
                      {isVideo ? <Video className="w-4 h-4 text-white" /> : <Phone className="w-4 h-4 text-white" />}
                    </motion.div>
                  )}
                </div>

                <h2 className="text-white text-2xl font-bold mb-1">{callInfo.partnerName}</h2>
                <motion.p
                  key={callInfo.state}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    "text-base",
                    isActive ? "text-emerald-300 font-mono text-xl" : "text-white/70"
                  )}
                >
                  {getStatusText()}
                </motion.p>

                {callInfo.callType === 'video' && !isActive && (
                  <p className="text-white/50 text-sm mt-1">مكالمة فيديو</p>
                )}
              </>
            )}

            {/* Duration overlay for video calls */}
            {isVideo && isActive && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-1.5 rounded-full">
                <p className="text-white font-mono text-lg">{formatDuration(callInfo.duration)}</p>
              </div>
            )}
          </motion.div>

          {/* Bottom: Controls */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full"
          >
            {/* Incoming call: Answer/Reject */}
            {callInfo.isIncoming && callInfo.state === 'ringing' ? (
              <div className="flex items-center justify-center gap-16">
                <div className="flex flex-col items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={onEnd}
                    className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-xl shadow-red-500/30"
                  >
                    <PhoneOff className="w-7 h-7 text-white" />
                  </motion.button>
                  <span className="text-white/70 text-xs">رفض</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    onClick={onAnswer}
                    className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/30"
                  >
                    <Phone className="w-7 h-7 text-white" />
                  </motion.button>
                  <span className="text-white/70 text-xs">رد</span>
                </div>
              </div>
            ) : (
              /* Active/Calling controls */
              <div className="flex flex-col items-center gap-6">
                {/* Primary row */}
                <div className="flex items-center justify-center gap-4">
                  <ControlButton
                    active={callInfo.isMuted}
                    onClick={onToggleMute}
                    icon={callInfo.isMuted ? MicOff : Mic}
                    label={callInfo.isMuted ? 'إلغاء الكتم' : 'كتم'}
                  />

                  <ControlButton
                    active={callInfo.isSpeaker}
                    onClick={onToggleSpeaker}
                    icon={Volume2}
                    label="السماعة"
                  />

                  {isVideo && (
                    <ControlButton
                      active={!callInfo.isVideoEnabled}
                      onClick={onToggleVideo}
                      icon={callInfo.isVideoEnabled ? Video : VideoOff}
                      label={callInfo.isVideoEnabled ? 'إخفاء' : 'إظهار'}
                    />
                  )}
                </div>

                {/* Secondary row - only when connected */}
                {isActive && (
                  <div className="flex items-center justify-center gap-4">
                    {/* Screen share */}
                    {onToggleScreenShare && (
                      <ControlButton
                        active={callInfo.isScreenSharing}
                        onClick={onToggleScreenShare}
                        icon={callInfo.isScreenSharing ? MonitorOff : Monitor}
                        label={callInfo.isScreenSharing ? 'إيقاف المشاركة' : 'مشاركة الشاشة'}
                        activeColor="blue"
                      />
                    )}

                    {/* Recording */}
                    {onToggleRecording && (
                      <ControlButton
                        active={callInfo.isRecording}
                        onClick={onToggleRecording}
                        icon={Circle}
                        label={callInfo.isRecording ? 'إيقاف التسجيل' : 'تسجيل'}
                        activeColor="red"
                      />
                    )}

                    {/* Chat */}
                    {onSendMessage && (
                      <ControlButton
                        active={showChat}
                        onClick={() => setShowChat(!showChat)}
                        icon={MessageSquare}
                        label="رسائل"
                        badge={callMessages.filter(m => m.sender_id !== user?.id && m.senderName !== 'النظام').length || undefined}
                      />
                    )}
                  </div>
                )}

                {/* End call */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onEnd}
                  className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-xl shadow-red-500/30"
                >
                  <PhoneOff className="w-7 h-7 text-white" />
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

CallScreen.displayName = 'CallScreen';

// Control button subcomponent
function ControlButton({ active, onClick, icon: Icon, label, activeColor, badge }: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
  activeColor?: 'red' | 'blue';
  badge?: number;
}) {
  const getActiveClass = () => {
    if (!active) return "bg-white/15 text-white";
    if (activeColor === 'red') return "bg-red-500 text-white";
    if (activeColor === 'blue') return "bg-blue-500 text-white";
    return "bg-white text-emerald-900";
  };

  return (
    <div className="flex flex-col items-center gap-1.5 relative">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
        className={cn(
          "w-13 h-13 rounded-full flex items-center justify-center transition-colors",
          getActiveClass()
        )}
      >
        <Icon className="w-5 h-5" />
      </motion.button>
      {badge && badge > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
          {badge}
        </span>
      )}
      <span className="text-white/60 text-[10px] max-w-[60px] text-center leading-tight">{label}</span>
    </div>
  );
}

export default CallScreen;
