import { createContext, useContext, useCallback, useState, type ReactNode } from 'react';
import { useWebRTCCall, type CallInfo, type CallType, type CallMessage } from '@/hooks/useWebRTCCall';
import IncomingCallOverlay from '@/components/chat/IncomingCallOverlay';
import MiniIncomingCallBanner from '@/components/chat/MiniIncomingCallBanner';
import CallScreen from '@/components/chat/CallScreen';
import { AnimatePresence } from 'framer-motion';

interface GlobalCallContextType {
  callInfo: CallInfo | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callMessages: CallMessage[];
  startCall: (partnerOrgId: string, type: CallType, partnerName: string, partnerLogo?: string | null, receiverUserId?: string) => Promise<void>;
  answerCall: () => Promise<void>;
  endCall: (reason?: string) => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleSpeaker: () => void;
  toggleScreenShare: () => Promise<void>;
  toggleRecording: () => void;
  sendCallMessage: (content: string) => Promise<void>;
  rejectWithMessage: (message: string) => void;
}

const GlobalCallContext = createContext<GlobalCallContextType | null>(null);

export function useGlobalCall() {
  const ctx = useContext(GlobalCallContext);
  if (!ctx) throw new Error('useGlobalCall must be used within GlobalCallProvider');
  return ctx;
}

export function useGlobalCallSafe() {
  return useContext(GlobalCallContext);
}

export default function GlobalCallProvider({ children }: { children: ReactNode }) {
  const webrtc = useWebRTCCall();
  const [expandedRestored, setExpandedRestored] = useState(false);

  const rejectWithMessage = useCallback((message: string) => {
    webrtc.endCall('busy', message);
  }, [webrtc.endCall]);

  const value: GlobalCallContextType = {
    ...webrtc,
    rejectWithMessage,
  };

  const isIncomingRinging = webrtc.callInfo?.isIncoming && webrtc.callInfo.state === 'ringing';
  const isRestored = webrtc.callInfo?.isRestored && !expandedRestored;

  // When call ends, reset expanded state
  const handleExpand = useCallback(() => {
    setExpandedRestored(true);
  }, []);

  // Reset expanded when call ends
  if (!webrtc.callInfo && expandedRestored) {
    setExpandedRestored(false);
  }

  return (
    <GlobalCallContext.Provider value={value}>
      {children}

      <AnimatePresence>
        {/* Restored call → mini banner (unless expanded) */}
        {isIncomingRinging && isRestored && (
          <MiniIncomingCallBanner
            key="mini-banner"
            callInfo={webrtc.callInfo!}
            onAccept={webrtc.answerCall}
            onReject={() => webrtc.endCall('user_ended')}
            onExpand={handleExpand}
          />
        )}
      </AnimatePresence>

      {/* Live call or expanded restored → full overlay */}
      {isIncomingRinging && !isRestored && (
        <IncomingCallOverlay
          callInfo={webrtc.callInfo!}
          onAccept={webrtc.answerCall}
          onReject={() => webrtc.endCall('user_ended')}
          onBusy={rejectWithMessage}
        />
      )}

      {/* Active call screen */}
      {webrtc.callInfo && !isIncomingRinging && (
        <CallScreen
          callInfo={webrtc.callInfo}
          localStream={webrtc.localStream}
          remoteStream={webrtc.remoteStream}
          callMessages={webrtc.callMessages}
          onAnswer={webrtc.answerCall}
          onEnd={() => webrtc.endCall()}
          onToggleMute={webrtc.toggleMute}
          onToggleVideo={webrtc.toggleVideo}
          onToggleSpeaker={webrtc.toggleSpeaker}
          onToggleScreenShare={webrtc.toggleScreenShare}
          onToggleRecording={webrtc.toggleRecording}
          onSendMessage={webrtc.sendCallMessage}
        />
      )}
    </GlobalCallContext.Provider>
  );
}
