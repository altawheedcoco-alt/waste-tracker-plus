import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getCachedProfile } from '@/lib/profileCache';

export type CallState = 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended';
export type CallType = 'voice' | 'video';

export interface CallInfo {
  callId: string;
  callType: CallType;
  state: CallState;
  isIncoming: boolean;
  partnerName: string;
  partnerLogo?: string | null;
  partnerOrgId: string;
  startedAt?: number;
  duration: number;
  isMuted: boolean;
  isSpeaker: boolean;
  isVideoEnabled: boolean;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export function useWebRTCCall() {
  const { user, organization } = useAuth();
  const [callInfo, setCallInfo] = useState<CallInfo | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const callRecordIdRef = useRef<string | null>(null);

  // Ringtone
  useEffect(() => {
    // Use a simple oscillator-based ringtone
    return () => {
      stopRingtone();
      cleanup();
    };
  }, []);

  const playRingtone = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 440;
      gain.gain.value = 0.15;
      osc.type = 'sine';
      osc.start();
      
      // Pulsing pattern
      const interval = setInterval(() => {
        gain.gain.value = gain.gain.value > 0 ? 0 : 0.15;
      }, 500);
      
      ringtoneRef.current = { pause: () => { osc.stop(); clearInterval(interval); ctx.close(); } } as any;
    } catch { /* silent */ }
  }, []);

  const stopRingtone = useCallback(() => {
    ringtoneRef.current?.pause();
    ringtoneRef.current = null;
  }, []);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    pcRef.current?.close();
    pcRef.current = null;
    localStream?.getTracks().forEach(t => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    stopRingtone();
  }, [localStream, stopRingtone]);

  // Duration timer
  const startDurationTimer = useCallback(() => {
    const start = Date.now();
    timerRef.current = setInterval(() => {
      setCallInfo(prev => prev ? { ...prev, duration: Math.floor((Date.now() - start) / 1000) } : null);
    }, 1000);
  }, []);

  // Get media stream
  const getMediaStream = useCallback(async (type: CallType) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video' ? { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } : false,
      });
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Failed to get media:', err);
      throw new Error('لا يمكن الوصول للميكروفون/الكاميرا');
    }
  }, []);

  // Setup peer connection
  const setupPeerConnection = useCallback((stream: MediaStream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    const remote = new MediaStream();
    setRemoteStream(remote);

    pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach(track => remote.addTrack(track));
      setRemoteStream(new MediaStream(remote.getTracks()));
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: { candidate: event.candidate.toJSON() },
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setCallInfo(prev => prev ? { ...prev, state: 'connected' } : null);
        stopRingtone();
        startDurationTimer();
        // Update DB
        if (callRecordIdRef.current) {
          supabase.from('call_records').update({ status: 'answered', answered_at: new Date().toISOString() }).eq('id', callRecordIdRef.current).then(() => {});
        }
      }
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        endCall('connection_lost');
      }
    };

    pcRef.current = pc;
    return pc;
  }, [startDurationTimer, stopRingtone]);

  // Setup signaling channel
  const setupSignaling = useCallback((callId: string) => {
    const channel = supabase.channel(`call:${callId}`)
      .on('broadcast', { event: 'offer' }, async ({ payload }) => {
        if (!pcRef.current) return;
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        channel.send({ type: 'broadcast', event: 'answer', payload: { sdp: answer } });
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }) => {
        if (!pcRef.current) return;
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
        if (!pcRef.current) return;
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch { /* ignore */ }
      })
      .on('broadcast', { event: 'hangup' }, () => {
        endCall('partner_ended');
      })
      .subscribe();

    channelRef.current = channel;
    return channel;
  }, []);

  // Start outgoing call
  const startCall = useCallback(async (partnerOrgId: string, type: CallType, partnerName: string, partnerLogo?: string | null) => {
    if (!user || !organization || callInfo) return;

    try {
      const stream = await getMediaStream(type);
      
      // Create call record
      const { data: record } = await supabase.from('call_records').insert({
        caller_id: user.id,
        caller_org_id: organization.id,
        receiver_org_id: partnerOrgId,
        call_type: type,
        status: 'ringing',
      }).select('id').single();

      const callId = record?.id || crypto.randomUUID();
      callRecordIdRef.current = callId;

      setCallInfo({
        callId,
        callType: type,
        state: 'calling',
        isIncoming: false,
        partnerName,
        partnerLogo,
        partnerOrgId,
        duration: 0,
        isMuted: false,
        isSpeaker: false,
        isVideoEnabled: type === 'video',
      });

      playRingtone();
      const pc = setupPeerConnection(stream);
      const channel = setupSignaling(callId);

      // Wait for channel then send offer
      setTimeout(async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        channel.send({ type: 'broadcast', event: 'offer', payload: { sdp: offer } });
      }, 1000);

      // Auto-end after 45 seconds if no answer
      setTimeout(() => {
        setCallInfo(prev => {
          if (prev?.state === 'calling' || prev?.state === 'ringing') {
            endCall('no_answer');
            return null;
          }
          return prev;
        });
      }, 45000);

    } catch (err: any) {
      cleanup();
      setCallInfo(null);
      throw err;
    }
  }, [user, organization, callInfo, getMediaStream, setupPeerConnection, setupSignaling, playRingtone, cleanup]);

  // Answer incoming call
  const answerCall = useCallback(async () => {
    if (!callInfo?.isIncoming) return;

    try {
      stopRingtone();
      setCallInfo(prev => prev ? { ...prev, state: 'connecting' } : null);
      const stream = await getMediaStream(callInfo.callType);
      setupPeerConnection(stream);
      setupSignaling(callInfo.callId);
    } catch (err) {
      cleanup();
      setCallInfo(null);
    }
  }, [callInfo, getMediaStream, setupPeerConnection, setupSignaling, stopRingtone, cleanup]);

  // End/reject call
  const endCall = useCallback((reason = 'user_ended') => {
    channelRef.current?.send({ type: 'broadcast', event: 'hangup', payload: { reason } });
    
    const duration = callInfo?.duration || 0;
    if (callRecordIdRef.current) {
      const status = callInfo?.state === 'connected' ? 'ended' : reason === 'user_ended' && callInfo?.isIncoming ? 'rejected' : 'missed';
      supabase.from('call_records').update({ 
        status, 
        ended_at: new Date().toISOString(), 
        duration_seconds: duration,
        end_reason: reason,
      }).eq('id', callRecordIdRef.current).then(() => {});
    }
    
    cleanup();
    setCallInfo(null);
    callRecordIdRef.current = null;
  }, [callInfo, cleanup]);

  // Toggle controls
  const toggleMute = useCallback(() => {
    localStream?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setCallInfo(prev => prev ? { ...prev, isMuted: !prev.isMuted } : null);
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    localStream?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setCallInfo(prev => prev ? { ...prev, isVideoEnabled: !prev.isVideoEnabled } : null);
  }, [localStream]);

  const toggleSpeaker = useCallback(() => {
    setCallInfo(prev => prev ? { ...prev, isSpeaker: !prev.isSpeaker } : null);
  }, []);

  // Listen for incoming calls
  useEffect(() => {
    if (!organization?.id) return;

    const channel = supabase.channel(`incoming-calls:${organization.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'call_records',
        filter: `receiver_org_id=eq.${organization.id}`,
      }, async (payload) => {
        const record = payload.new as any;
        if (record.status !== 'ringing') return;
        if (callInfo) {
          // Already in a call, mark as busy
          await supabase.from('call_records').update({ status: 'busy' }).eq('id', record.id);
          return;
        }

        callRecordIdRef.current = record.id;
        const profile = await getCachedProfile(record.caller_id);
        
        playRingtone();
        setCallInfo({
          callId: record.id,
          callType: record.call_type,
          state: 'ringing',
          isIncoming: true,
          partnerName: profile?.full_name || 'مستخدم',
          partnerOrgId: record.caller_org_id,
          duration: 0,
          isMuted: false,
          isSpeaker: false,
          isVideoEnabled: record.call_type === 'video',
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [organization?.id, callInfo, playRingtone]);

  return {
    callInfo,
    localStream,
    remoteStream,
    startCall,
    answerCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
  };
}
