import { useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { CallInfo } from '@/hooks/useWebRTCCall';
import { soundEngine } from '@/lib/soundEngine';

interface CallScreenProps {
  callInfo: CallInfo;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onAnswer: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleSpeaker: () => void;
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
  onAnswer,
  onEnd,
  onToggleMute,
  onToggleVideo,
  onToggleSpeaker,
}: CallScreenProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

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
            className="absolute top-16 left-4 z-10 w-32 h-44 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20"
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
              style={{ transform: 'scaleX(-1)' }}
            />
          </motion.div>
        )}

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
                {/* Reject */}
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

                {/* Answer */}
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
                <div className="flex items-center justify-center gap-5">
                  {/* Mute */}
                  <ControlButton
                    active={callInfo.isMuted}
                    onClick={onToggleMute}
                    icon={callInfo.isMuted ? MicOff : Mic}
                    label={callInfo.isMuted ? 'إلغاء الكتم' : 'كتم'}
                  />

                  {/* Speaker */}
                  <ControlButton
                    active={callInfo.isSpeaker}
                    onClick={onToggleSpeaker}
                    icon={Volume2}
                    label="السماعة"
                  />

                  {/* Video toggle */}
                  {isVideo && (
                    <ControlButton
                      active={!callInfo.isVideoEnabled}
                      onClick={onToggleVideo}
                      icon={callInfo.isVideoEnabled ? Video : VideoOff}
                      label={callInfo.isVideoEnabled ? 'إخفاء' : 'إظهار'}
                    />
                  )}
                </div>

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
function ControlButton({ active, onClick, icon: Icon, label }: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center transition-colors",
          active ? "bg-white text-emerald-900" : "bg-white/15 text-white"
        )}
      >
        <Icon className="w-6 h-6" />
      </motion.button>
      <span className="text-white/60 text-[10px]">{label}</span>
    </div>
  );
}

export default CallScreen;
