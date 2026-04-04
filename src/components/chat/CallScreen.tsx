import { useEffect, useRef, useState, memo, useCallback } from 'react';
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
  CameraIcon,
  Minimize2,
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
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
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
  const [pipPosition, setPipPosition] = useState<'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'>('top-right');
  const [showControls, setShowControls] = useState(true);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [callMessages]);

  const isVideo = callInfo.callType === 'video';
  const isActive = callInfo.state === 'connected';
  const isRinging = callInfo.state === 'ringing' || callInfo.state === 'calling';
  const isConnecting = callInfo.state === 'connecting';

  // Auto-hide controls in video calls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (isVideo && isActive) {
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 4000);
    }
  }, [isVideo, isActive]);

  useEffect(() => {
    resetControlsTimer();
    return () => { if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current); };
  }, [isActive]);

  // Play call sounds
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
      case 'calling': 
        if (callInfo.isReceiverOnline === false) {
          return 'المستقبل غير متصل بالإنترنت... سيصله إشعار';
        }
        return 'جاري الاتصال...';
      case 'ringing': return 'مكالمة واردة';
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

  const cyclePipPosition = () => {
    const positions: typeof pipPosition[] = ['top-right', 'top-left', 'bottom-right', 'bottom-left'];
    const idx = positions.indexOf(pipPosition);
    setPipPosition(positions[(idx + 1) % positions.length]);
  };

  const pipPositionClass = {
    'top-right': 'top-14 right-4',
    'top-left': 'top-14 left-4',
    'bottom-right': 'bottom-40 right-4',
    'bottom-left': 'bottom-40 left-4',
  }[pipPosition];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col"
        onClick={isVideo && isActive ? resetControlsTimer : undefined}
      >
        {/* Background */}
        {isVideo && isActive ? (
          <div className="absolute inset-0 bg-black" />
        ) : (
          <div className="absolute inset-0">
            {/* WhatsApp-style gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#075E54] via-[#128C7E] to-[#25D366] opacity-90" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.1),transparent_60%)]" />
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            }} />
          </div>
        )}

        {/* Animated pulse rings for calling/ringing state */}
        {(isRinging || callInfo.state === 'calling') && !isVideo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: '-10%' }}>
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                className="absolute rounded-full border-2 border-white/10"
                initial={{ width: 140, height: 140, opacity: 0.6 }}
                animate={{ width: 140 + i * 100, height: 140 + i * 100, opacity: 0 }}
                transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
              />
            ))}
          </div>
        )}

        {/* Remote video (fullscreen) */}
        {isVideo && isActive && remoteStream && (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Local video PiP - WhatsApp style rounded card */}
        {isVideo && localStream && isActive && (
          <motion.div
            layout
            onClick={cyclePipPosition}
            className={cn(
              "absolute z-30 rounded-2xl overflow-hidden shadow-2xl cursor-pointer",
              "border-2 border-white/30 backdrop-blur-sm",
              callInfo.isScreenSharing ? "w-44 h-28" : "w-28 h-40",
              pipPositionClass
            )}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.3 }}
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
              <div className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                <Monitor className="w-2.5 h-2.5" />
                مشاركة الشاشة
              </div>
            )}
            {!callInfo.isVideoEnabled && (
              <div className="absolute inset-0 bg-card/90 flex items-center justify-center">
                <VideoOff className="w-5 h-5 text-white/60" />
              </div>
            )}
          </motion.div>
        )}

        {/* Recording indicator - WhatsApp style */}
        {callInfo.isRecording && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-red-600/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg"
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="w-2.5 h-2.5 rounded-full bg-white"
            />
            <span className="text-white text-xs font-semibold tracking-wide">تسجيل</span>
            <span className="text-white/70 text-xs font-mono">{formatDuration(callInfo.duration)}</span>
          </motion.div>
        )}

        {/* Encryption badge - WhatsApp style */}
        {isActive && !callInfo.isRecording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full"
          >
            <svg className="w-3 h-3 text-white/70" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
            </svg>
            <span className="text-white/60 text-[10px]">مشفرة من الطرف إلى الطرف</span>
          </motion.div>
        )}

        {/* In-call Chat Panel - Messenger style slide-in */}
        <AnimatePresence>
          {showChat && isActive && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute top-0 right-0 bottom-0 w-80 max-w-[85vw] z-40 bg-black/80 backdrop-blur-2xl flex flex-col"
            >
              {/* Chat header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-white font-semibold text-sm">رسائل المكالمة</h3>
                  {callMessages.length > 0 && (
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                      {callMessages.length}
                    </span>
                  )}
                </div>
                <button onClick={() => setShowChat(false)} className="text-white/50 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 px-3 py-3">
                <div className="space-y-2.5">
                  {callMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-3">
                        <MessageSquare className="w-6 h-6 text-white/20" />
                      </div>
                      <p className="text-white/30 text-xs">ابدأ المحادثة أثناء المكالمة</p>
                    </div>
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
                          <div className="bg-white/10 text-white/50 text-[10px] px-3 py-1 rounded-full">
                            {msg.content}
                          </div>
                        ) : (
                          <>
                            {!isMe && (
                              <span className="text-emerald-400/70 text-[10px] mb-0.5 px-2 font-medium">{msg.senderName}</span>
                            )}
                            <div className={cn(
                              "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                              isMe
                                ? "bg-emerald-600 text-white rounded-br-md"
                                : "bg-white/15 text-white rounded-bl-md"
                            )}>
                              {msg.content}
                            </div>
                            <span className="text-white/25 text-[9px] mt-0.5 px-2">
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

              {/* Message input - WhatsApp style */}
              <div className="p-3 border-t border-white/10">
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                  className="flex gap-2 items-center"
                >
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="اكتب رسالة..."
                    className="bg-white/10 border-0 text-white placeholder:text-white/30 text-sm rounded-full h-10 px-4 focus-visible:ring-1 focus-visible:ring-emerald-500/50"
                  />
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.85 }}
                    disabled={!messageText.trim()}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all",
                      messageText.trim()
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                        : "bg-white/10 text-white/30"
                    )}
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content area */}
        <div className="relative z-10 flex flex-col items-center justify-between h-full w-full">

          {/* Top section: Partner info */}
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="flex flex-col items-center text-center pt-16 px-6"
          >
            {(!isVideo || !isActive) && (
              <>
                {/* Avatar with status ring */}
                <div className="relative mb-6">
                  <motion.div
                    animate={isRinging || callInfo.state === 'calling' ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Avatar className={cn(
                      "h-32 w-32 shadow-2xl",
                      isActive ? "ring-4 ring-emerald-400/60" : "ring-4 ring-white/20"
                    )}>
                      {callInfo.partnerLogo && <AvatarImage src={callInfo.partnerLogo} />}
                      <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white text-4xl font-bold">
                        {callInfo.partnerName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>

                  {/* Call type indicator */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.3 }}
                    className={cn(
                      "absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg",
                      isActive ? "bg-emerald-500" : "bg-white/20 backdrop-blur-sm"
                    )}
                  >
                    {isVideo ? <Video className="w-5 h-5 text-white" /> : <Phone className="w-5 h-5 text-white" />}
                  </motion.div>

                  {/* Active call glow */}
                  {isActive && (
                    <motion.div
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full bg-emerald-400/20 blur-xl -z-10 scale-150"
                    />
                  )}

                  {/* Offline indicator */}
                  {callInfo.state === 'calling' && callInfo.isReceiverOnline === false && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -left-1 bg-amber-500 text-white text-[9px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                      غير متصل
                    </motion.div>
                  )}
                </div>

                {/* Partner name */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-white text-2xl font-bold mb-1.5 drop-shadow-lg"
                >
                  {callInfo.partnerName}
                </motion.h2>

                {/* Status text */}
                <motion.div
                  key={callInfo.state + callInfo.duration}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  {isActive && (
                    <motion.div
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-2 h-2 rounded-full bg-emerald-400"
                    />
                  )}
                  {(isRinging || callInfo.state === 'calling' || isConnecting) && (
                    <motion.div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                          className="w-1.5 h-1.5 rounded-full bg-white/60"
                        />
                      ))}
                    </motion.div>
                  )}
                  <p className={cn(
                    "text-base",
                    isActive ? "text-emerald-300 font-mono text-xl font-semibold" : "text-white/70"
                  )}>
                    {getStatusText()}
                  </p>
                </motion.div>

                {isVideo && !isActive && (
                  <p className="text-white/40 text-sm mt-1">مكالمة فيديو</p>
                )}
              </>
            )}

            {/* Duration overlay for active video call */}
            {isVideo && isActive && (
              <AnimatePresence>
                {showControls && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-black/50 backdrop-blur-md px-5 py-2 rounded-full shadow-lg"
                  >
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-emerald-400"
                      />
                      <p className="text-white font-mono text-lg font-semibold">{formatDuration(callInfo.duration)}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </motion.div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bottom: Controls */}
          <AnimatePresence>
            {(showControls || !isVideo || !isActive) && (
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                className="w-full pb-12 pt-6 px-6"
              >
                {/* Glass background for controls */}
                <div className={cn(
                  "mx-auto max-w-md rounded-3xl p-6",
                  isVideo && isActive ? "bg-black/40 backdrop-blur-xl" : ""
                )}>
                  {/* Incoming call: Answer/Reject - WhatsApp style */}
                  {callInfo.isIncoming && callInfo.state === 'ringing' ? (
                    <div className="flex items-center justify-center gap-20">
                      {/* Reject */}
                      <div className="flex flex-col items-center gap-3">
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={onEnd}
                          className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-2xl shadow-red-500/40"
                        >
                          <PhoneOff className="w-7 h-7 text-white" />
                        </motion.button>
                        <span className="text-white/80 text-xs font-medium">رفض</span>
                      </div>

                      {/* Answer */}
                      <div className="flex flex-col items-center gap-3">
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          animate={{ scale: [1, 1.08, 1] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                          onClick={onAnswer}
                          className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/40"
                        >
                          {isVideo ? <Video className="w-7 h-7 text-white" /> : <Phone className="w-7 h-7 text-white" />}
                        </motion.button>
                        <span className="text-white/80 text-xs font-medium">رد</span>
                      </div>
                    </div>
                  ) : (
                    /* Active/Calling controls */
                    <div className="flex flex-col items-center gap-5">
                      {/* Primary controls row */}
                      <div className="flex items-center justify-center gap-3">
                        <CallControlBtn
                          active={callInfo.isMuted}
                          onClick={onToggleMute}
                          icon={callInfo.isMuted ? MicOff : Mic}
                          label={callInfo.isMuted ? 'إلغاء الكتم' : 'كتم'}
                        />

                        {isVideo && (
                          <CallControlBtn
                            active={!callInfo.isVideoEnabled}
                            onClick={onToggleVideo}
                            icon={callInfo.isVideoEnabled ? Video : VideoOff}
                            label={callInfo.isVideoEnabled ? 'إخفاء' : 'إظهار'}
                          />
                        )}

                        <CallControlBtn
                          active={callInfo.isSpeaker}
                          onClick={onToggleSpeaker}
                          icon={Volume2}
                          label="السماعة"
                        />

                        {/* Screen share - only when connected */}
                        {isActive && onToggleScreenShare && (
                          <CallControlBtn
                            active={callInfo.isScreenSharing}
                            onClick={onToggleScreenShare}
                            icon={callInfo.isScreenSharing ? MonitorOff : Monitor}
                            label={callInfo.isScreenSharing ? 'إيقاف' : 'شاشة'}
                            activeColor="blue"
                          />
                        )}
                      </div>

                      {/* Secondary controls row - only when connected */}
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="flex items-center justify-center gap-3"
                        >
                          {/* Recording */}
                          {onToggleRecording && (
                            <CallControlBtn
                              active={callInfo.isRecording}
                              onClick={onToggleRecording}
                              icon={Circle}
                              label={callInfo.isRecording ? 'إيقاف' : 'تسجيل'}
                              activeColor="red"
                              small
                            />
                          )}

                          {/* Chat */}
                          {onSendMessage && (
                            <CallControlBtn
                              active={showChat}
                              onClick={() => setShowChat(!showChat)}
                              icon={MessageSquare}
                              label="رسائل"
                              badge={callMessages.filter(m => m.sender_id !== user?.id && m.senderName !== 'النظام').length || undefined}
                              small
                            />
                          )}
                        </motion.div>
                      )}

                      {/* End call button - prominent red */}
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={onEnd}
                        className={cn(
                          "w-16 h-16 rounded-full bg-red-500 flex items-center justify-center",
                          "shadow-2xl shadow-red-500/40 mt-2",
                          "active:bg-red-600 transition-colors"
                        )}
                      >
                        <PhoneOff className="w-7 h-7 text-white" />
                      </motion.button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

CallScreen.displayName = 'CallScreen';

// Enhanced control button - WhatsApp/Messenger style
function CallControlBtn({ active, onClick, icon: Icon, label, activeColor, badge, small }: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
  activeColor?: 'red' | 'blue';
  badge?: number;
  small?: boolean;
}) {
  const getStyle = () => {
    if (!active) return "bg-white/15 hover:bg-white/25 text-white";
    if (activeColor === 'red') return "bg-red-500 text-white shadow-lg shadow-red-500/30";
    if (activeColor === 'blue') return "bg-blue-500 text-white shadow-lg shadow-blue-500/30";
    return "bg-white dark:bg-card text-foreground dark:text-foreground shadow-lg";
  };

  const size = small ? "w-12 h-12" : "w-14 h-14";
  const iconSize = small ? "w-5 h-5" : "w-5.5 h-5.5";

  return (
    <div className="flex flex-col items-center gap-1.5 relative">
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={onClick}
        className={cn(
          "rounded-full flex items-center justify-center transition-all duration-200",
          size,
          getStyle()
        )}
      >
        <Icon className={iconSize} />
      </motion.button>
      {badge && badge > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-emerald-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold shadow-md"
        >
          {badge}
        </motion.span>
      )}
      <span className="text-white/60 text-[10px] max-w-[56px] text-center leading-tight">{label}</span>
    </div>
  );
}

export default CallScreen;
