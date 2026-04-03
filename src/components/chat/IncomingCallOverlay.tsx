import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, MessageSquare, X, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { CallInfo } from '@/hooks/useWebRTCCall';
import { soundEngine } from '@/lib/soundEngine';

interface IncomingCallOverlayProps {
  callInfo: CallInfo;
  onAccept: () => void;
  onReject: () => void;
  onBusy: (message: string) => void;
}

const BUSY_MESSAGES = [
  { text: 'مشغول الآن', icon: '🔴' },
  { text: 'سأتصل بك لاحقاً', icon: '🔄' },
  { text: 'في اجتماع', icon: '👥' },
  { text: 'أرسل لي رسالة', icon: '💬' },
];

const IncomingCallOverlay = memo(({ callInfo, onAccept, onReject, onBusy }: IncomingCallOverlayProps) => {
  const [showBusyOptions, setShowBusyOptions] = useState(false);

  // Play ringtone sound
  useEffect(() => {
    soundEngine.play('notification');
    const interval = setInterval(() => soundEngine.play('notification'), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, hsl(var(--primary) / 0.95), hsl(220 30% 15% / 0.98))',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Pulse rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border-2 border-white/20"
            initial={{ width: 120, height: 120, opacity: 0.6 }}
            animate={{
              width: [120, 120 + i * 80],
              height: [120, 120 + i * 80],
              opacity: [0.4, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>

      <div className="flex flex-col items-center gap-6 relative z-10 px-6">
        {/* Caller avatar */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Avatar className="w-28 h-28 border-4 border-white/30 shadow-2xl">
            <AvatarImage src={callInfo.partnerLogo || undefined} />
            <AvatarFallback className="text-3xl bg-white/20 text-white">
              {callInfo.partnerName?.charAt(0) || '؟'}
            </AvatarFallback>
          </Avatar>
        </motion.div>

        {/* Caller name */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-1">
            {callInfo.partnerName}
          </h2>
          <p className="text-white/70 text-sm flex items-center gap-2 justify-center">
            {callInfo.callType === 'video' ? (
              <><Video className="w-4 h-4" /> مكالمة فيديو واردة</>
            ) : (
              <><Phone className="w-4 h-4" /> مكالمة صوتية واردة</>
            )}
          </p>
        </div>

        {/* Busy messages */}
        <AnimatePresence>
          {showBusyOptions && (
            <motion.div
              initial={{ opacity: 0, y: 20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: 20, height: 0 }}
              className="flex flex-col gap-2 w-full max-w-xs"
            >
              {BUSY_MESSAGES.map((msg, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => onBusy(msg.text)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm backdrop-blur-sm transition-colors text-right"
                >
                  <span>{msg.icon}</span>
                  <span>{msg.text}</span>
                </motion.button>
              ))}
              <button
                onClick={() => setShowBusyOptions(false)}
                className="text-white/50 text-xs mt-1 hover:text-white/80 transition-colors"
              >
                إلغاء
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        {!showBusyOptions && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-6 mt-6"
          >
            {/* Reject */}
            <div className="flex flex-col items-center gap-2">
              <Button
                onClick={onReject}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30"
                size="icon"
              >
                <PhoneOff className="w-7 h-7 text-white" />
              </Button>
              <span className="text-white/70 text-xs">رفض</span>
            </div>

            {/* Busy */}
            <div className="flex flex-col items-center gap-2">
              <Button
                onClick={() => setShowBusyOptions(true)}
                className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                size="icon"
              >
                <MessageSquare className="w-6 h-6 text-white" />
              </Button>
              <span className="text-white/70 text-xs">مشغول</span>
            </div>

            {/* Accept */}
            <div className="flex flex-col items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Button
                  onClick={onAccept}
                  className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30"
                  size="icon"
                >
                  {callInfo.callType === 'video' ? (
                    <Video className="w-7 h-7 text-white" />
                  ) : (
                    <Phone className="w-7 h-7 text-white" />
                  )}
                </Button>
              </motion.div>
              <span className="text-white/70 text-xs">قبول</span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});

IncomingCallOverlay.displayName = 'IncomingCallOverlay';
export default IncomingCallOverlay;
