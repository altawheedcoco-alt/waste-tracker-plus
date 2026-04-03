import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { CallInfo } from '@/hooks/useWebRTCCall';

interface MiniIncomingCallBannerProps {
  callInfo: CallInfo;
  onAccept: () => void;
  onReject: () => void;
  onExpand: () => void;
}

const MiniIncomingCallBanner = memo(({ callInfo, onAccept, onReject, onExpand }: MiniIncomingCallBannerProps) => {
  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed top-20 start-4 z-[200] w-72 rounded-2xl overflow-hidden shadow-2xl border border-border/50"
      style={{
        background: 'linear-gradient(135deg, hsl(var(--primary) / 0.95), hsl(220 30% 20% / 0.98))',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Pulse indicator */}
      <div className="absolute top-2 end-2">
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-2.5 h-2.5 rounded-full bg-emerald-400"
        />
      </div>

      {/* Content */}
      <div className="p-3 flex items-center gap-3">
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Avatar className="w-11 h-11 border-2 border-white/30">
            <AvatarImage src={callInfo.partnerLogo || undefined} />
            <AvatarFallback className="text-sm bg-white/20 text-white">
              {callInfo.partnerName?.charAt(0) || '؟'}
            </AvatarFallback>
          </Avatar>
        </motion.div>

        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">
            {callInfo.partnerName}
          </p>
          <p className="text-white/60 text-xs flex items-center gap-1">
            {callInfo.callType === 'video' ? (
              <><Video className="w-3 h-3" /> مكالمة فيديو فائتة</>
            ) : (
              <><Phone className="w-3 h-3" /> مكالمة صوتية فائتة</>
            )}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center border-t border-white/10 divide-x divide-white/10 rtl:divide-x-reverse">
        <button
          onClick={onReject}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-red-300 hover:bg-red-500/20 transition-colors text-xs font-medium"
        >
          <PhoneOff className="w-3.5 h-3.5" />
          رفض
        </button>
        <button
          onClick={onExpand}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-white/70 hover:bg-white/10 transition-colors text-xs font-medium"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          توسيع
        </button>
        <button
          onClick={onAccept}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-emerald-300 hover:bg-emerald-500/20 transition-colors text-xs font-medium"
        >
          {callInfo.callType === 'video' ? (
            <Video className="w-3.5 h-3.5" />
          ) : (
            <Phone className="w-3.5 h-3.5" />
          )}
          رد
        </button>
      </div>
    </motion.div>
  );
});

MiniIncomingCallBanner.displayName = 'MiniIncomingCallBanner';
export default MiniIncomingCallBanner;
