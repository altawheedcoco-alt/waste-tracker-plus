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
  isScreenSharing: boolean;
  isRecording: boolean;
}

export interface CallMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  senderName?: string;
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
  const [callMessages, setCallMessages] = useState<CallMessage[]>([]);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const callRecordIdRef = useRef<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const originalVideoTrackRef = useRef<MediaStreamTrack | null>(null);

  // Ringtone
  useEffect(() => {
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
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;
    originalVideoTrackRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setCallMessages([]);
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    // Stop recording
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    recordedChunksRef.current = [];
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
  const setupSignaling = useCallback((callId: string, isInitiator = false) => {
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
      .on('broadcast', { event: 'ready' }, async () => {
        // Receiver joined - re-send offer if we're the caller
        if (isInitiator && pcRef.current?.localDescription) {
          channel.send({ type: 'broadcast', event: 'offer', payload: { sdp: pcRef.current.localDescription } });
        }
      })
      .on('broadcast', { event: 'chat-message' }, ({ payload }) => {
        setCallMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          sender_id: payload.senderId,
          content: payload.content,
          created_at: new Date().toISOString(),
          senderName: payload.senderName,
        }]);
      })
      .subscribe((status) => {
        // When receiver subscribes, signal ready to caller
        if (status === 'SUBSCRIBED' && !isInitiator) {
          channel.send({ type: 'broadcast', event: 'ready', payload: {} });
        }
      });

    channelRef.current = channel;
    return channel;
  }, []);

  // Subscribe to call_messages from DB for persistence
  useEffect(() => {
    if (!callInfo?.callId || callInfo.state === 'idle' || callInfo.state === 'ended') return;

    const channel = supabase.channel(`call-msgs:${callInfo.callId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'call_messages',
        filter: `call_id=eq.${callInfo.callId}`,
      }, (payload) => {
        const msg = payload.new as any;
        if (msg.sender_id !== user?.id) {
          // Already handled by broadcast, but ensure DB persistence
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [callInfo?.callId, callInfo?.state, user?.id]);

  // Start outgoing call
  const startCall = useCallback(async (partnerOrgId: string, type: CallType, partnerName: string, partnerLogo?: string | null, receiverUserId?: string) => {
    if (!user || !organization || callInfo) return;

    try {
      const stream = await getMediaStream(type);
      
      const callerProfile = await getCachedProfile(user.id);
      const insertData: any = {
        caller_id: user.id,
        caller_org_id: organization.id,
        receiver_org_id: partnerOrgId,
        call_type: type,
        status: 'ringing',
        caller_name: callerProfile?.full_name || 'مستخدم',
        caller_avatar_url: callerProfile?.avatar_url,
        receiver_name: partnerName,
        receiver_avatar_url: partnerLogo,
      };
      if (receiverUserId) insertData.receiver_user_id = receiverUserId;
      
      const { data: record } = await supabase.from('call_records').insert(insertData).select('id').single();

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
        isScreenSharing: false,
        isRecording: false,
      });

      playRingtone();
      const pc = setupPeerConnection(stream);
      const channel = setupSignaling(callId, true);

      // Create and send offer after channel is ready
      const createAndSendOffer = async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        channel.send({ type: 'broadcast', event: 'offer', payload: { sdp: offer } });
      };
      
      // Send initial offer after a brief delay, and re-send when receiver joins (handled by 'ready' event)
      setTimeout(createAndSendOffer, 1500);

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
  const endCall = useCallback((reason = 'user_ended', busyMessage?: string) => {
    channelRef.current?.send({ type: 'broadcast', event: 'hangup', payload: { reason } });
    
    const duration = callInfo?.duration || 0;
    if (callRecordIdRef.current) {
      const status = reason === 'busy' ? 'busy' : callInfo?.state === 'connected' ? 'ended' : reason === 'user_ended' && callInfo?.isIncoming ? 'rejected' : 'missed';
      const updateData: any = { 
        status, 
        ended_at: new Date().toISOString(), 
        duration_seconds: duration,
        end_reason: reason,
      };
      if (busyMessage) updateData.busy_message = busyMessage;
      supabase.from('call_records').update(updateData).eq('id', callRecordIdRef.current).then(() => {});
      
      // Send busy message via direct_messages if applicable
      if (busyMessage && callInfo?.isIncoming && callInfo?.partnerOrgId) {
        supabase.from('direct_messages').insert({
          sender_id: user?.id,
          sender_organization_id: organization?.id,
          receiver_organization_id: callInfo.partnerOrgId,
          content: `📞 ${busyMessage}`,
          message_type: 'text',
        }).then(() => {});
      }
    }
    
    cleanup();
    setCallInfo(null);
    callRecordIdRef.current = null;
  }, [callInfo, cleanup, user, organization]);

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

  // Screen sharing
  const toggleScreenShare = useCallback(async () => {
    if (!pcRef.current || !localStream) return;

    if (callInfo?.isScreenSharing) {
      // Stop screen share, restore camera
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;

      if (originalVideoTrackRef.current) {
        const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(originalVideoTrackRef.current);
        }
        // Update local stream
        const newStream = new MediaStream([
          ...localStream.getAudioTracks(),
          originalVideoTrackRef.current,
        ]);
        setLocalStream(newStream);
        originalVideoTrackRef.current = null;
      }
      setCallInfo(prev => prev ? { ...prev, isScreenSharing: false } : null);
    } else {
      // Start screen share
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        screenStreamRef.current = screenStream;

        const screenTrack = screenStream.getVideoTracks()[0];
        const currentVideoTrack = localStream.getVideoTracks()[0];
        if (currentVideoTrack) {
          originalVideoTrackRef.current = currentVideoTrack;
        }

        // Replace video track in peer connection
        const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(screenTrack);
        } else {
          pcRef.current.addTrack(screenTrack, localStream);
        }

        // Update local stream for preview
        const newStream = new MediaStream([
          ...localStream.getAudioTracks(),
          screenTrack,
        ]);
        setLocalStream(newStream);

        // When user stops screen share via browser UI
        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setCallInfo(prev => prev ? { ...prev, isScreenSharing: true } : null);

        // Notify partner
        channelRef.current?.send({
          type: 'broadcast',
          event: 'chat-message',
          payload: {
            senderId: user?.id,
            senderName: 'النظام',
            content: '📺 بدأ مشاركة الشاشة',
          },
        });
      } catch (err) {
        console.error('Screen share failed:', err);
      }
    }
  }, [callInfo?.isScreenSharing, localStream, user?.id]);

  // Call recording
  const toggleRecording = useCallback(() => {
    if (!remoteStream && !localStream) return;

    if (callInfo?.isRecording) {
      // Stop recording
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
      setCallInfo(prev => prev ? { ...prev, isRecording: false } : null);
    } else {
      // Start recording - combine local and remote audio
      try {
        const ctx = new AudioContext();
        const dest = ctx.createMediaStreamDestination();

        if (localStream) {
          const localSource = ctx.createMediaStreamSource(localStream);
          localSource.connect(dest);
        }
        if (remoteStream) {
          const remoteSource = ctx.createMediaStreamSource(remoteStream);
          remoteSource.connect(dest);
        }

        // If video call, add video track
        const tracks = [...dest.stream.getTracks()];
        if (callInfo?.callType === 'video' && remoteStream) {
          const videoTrack = remoteStream.getVideoTracks()[0];
          if (videoTrack) tracks.push(videoTrack);
        }

        const combinedStream = new MediaStream(tracks);
        const mimeType = callInfo?.callType === 'video' 
          ? (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm')
          : (MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm');

        const recorder = new MediaRecorder(combinedStream, { mimeType });
        recordedChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) recordedChunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
          const blob = new Blob(recordedChunksRef.current, { type: mimeType });
          const ext = callInfo?.callType === 'video' ? 'webm' : 'webm';
          const fileName = `call-recording-${callRecordIdRef.current || Date.now()}.${ext}`;

          // Upload to storage
          const { data: uploadData, error } = await supabase.storage
            .from('call-recordings')
            .upload(fileName, blob, { contentType: mimeType });

          if (!error && uploadData && callRecordIdRef.current) {
            const { data: urlData } = supabase.storage.from('call-recordings').getPublicUrl(fileName);
            await (supabase.from('call_records').update as any)({
              recording_url: urlData.publicUrl,
            }).eq('id', callRecordIdRef.current);
          }

          // Also offer download
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.click();
          URL.revokeObjectURL(url);
          ctx.close();
        };

        recorder.start(1000); // Collect data every second
        recorderRef.current = recorder;
        setCallInfo(prev => prev ? { ...prev, isRecording: true } : null);

        // Notify partner
        channelRef.current?.send({
          type: 'broadcast',
          event: 'chat-message',
          payload: {
            senderId: user?.id,
            senderName: 'النظام',
            content: '🔴 بدأ تسجيل المكالمة',
          },
        });
      } catch (err) {
        console.error('Recording failed:', err);
      }
    }
  }, [callInfo?.isRecording, callInfo?.callType, localStream, remoteStream, user?.id]);

  // Send in-call message
  const sendCallMessage = useCallback(async (content: string) => {
    if (!callInfo?.callId || !user) return;

    const profile = await getCachedProfile(user.id);
    const senderName = profile?.full_name || 'أنا';

    // Broadcast via realtime channel (instant)
    channelRef.current?.send({
      type: 'broadcast',
      event: 'chat-message',
      payload: {
        senderId: user.id,
        senderName,
        content,
      },
    });

    // Add locally
    setCallMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      sender_id: user.id,
      content,
      created_at: new Date().toISOString(),
      senderName,
    }]);

    // Persist to DB
    await supabase.from('call_messages').insert({
      call_id: callInfo.callId,
      sender_id: user.id,
      content,
    });
  }, [callInfo?.callId, user]);

  // Handle incoming call record
  const handleIncomingCall = useCallback(async (record: any) => {
    if (record.status !== 'ringing') return;
    // Don't answer own calls
    if (record.caller_id === user?.id) return;
    if (callInfo) {
      await supabase.from('call_records').update({ status: 'busy' }).eq('id', record.id);
      return;
    }

    callRecordIdRef.current = record.id;
    
    playRingtone();
    setCallInfo({
      callId: record.id,
      callType: record.call_type,
      state: 'ringing',
      isIncoming: true,
      partnerName: record.caller_name || 'مستخدم',
      partnerLogo: record.caller_avatar_url,
      partnerOrgId: record.caller_org_id,
      duration: 0,
      isMuted: false,
      isSpeaker: false,
      isVideoEnabled: record.call_type === 'video',
      isScreenSharing: false,
      isRecording: false,
    });
  }, [user?.id, callInfo, playRingtone]);

  // Listen for incoming calls - org level
  useEffect(() => {
    if (!organization?.id) return;

    const channel = supabase.channel(`incoming-calls:${organization.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'call_records',
        filter: `receiver_org_id=eq.${organization.id}`,
      }, async (payload) => {
        await handleIncomingCall(payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [organization?.id, handleIncomingCall]);

  // Listen for incoming calls - user level (1-to-1)
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel(`incoming-calls-user:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'call_records',
        filter: `receiver_user_id=eq.${user.id}`,
      }, async (payload) => {
        await handleIncomingCall(payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, handleIncomingCall]);

  return {
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
  };
}
