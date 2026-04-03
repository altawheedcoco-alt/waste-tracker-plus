import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useWebRTCCall, type CallInfo, type CallType, type CallMessage } from '@/hooks/useWebRTCCall';
import IncomingCallOverlay from '@/components/chat/IncomingCallOverlay';
import CallScreen from '@/components/chat/CallScreen';

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

export default function GlobalCallProvider({ children }: { children: ReactNode }) {
  const webrtc = useWebRTCCall();

  const rejectWithMessage = useCallback((message: string) => {
    // End the call with busy reason and pass the message
    webrtc.endCall('busy', message);
  }, [webrtc.endCall]);

  const value: GlobalCallContextType = {
    ...webrtc,
    rejectWithMessage,
  };

  return (
    <GlobalCallContext.Provider value={value}>
      {children}

      {/* Incoming call overlay — shows when ringing and incoming */}
      {webrtc.callInfo?.isIncoming && webrtc.callInfo.state === 'ringing' && (
        <IncomingCallOverlay
          callInfo={webrtc.callInfo}
          onAccept={webrtc.answerCall}
          onReject={() => webrtc.endCall('user_ended')}
          onBusy={rejectWithMessage}
        />
      )}

      {/* Active call screen — shows when call is active (not ringing incoming) */}
      {webrtc.callInfo && !(webrtc.callInfo.isIncoming && webrtc.callInfo.state === 'ringing') && (
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
