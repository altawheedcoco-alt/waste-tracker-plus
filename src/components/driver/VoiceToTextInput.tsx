import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VoiceToTextInputProps {
  onTranscription: (text: string) => void;
  className?: string;
  label?: string;
}

const VoiceToTextInput = ({ onTranscription, className, label = 'تسجيل صوتي' }: VoiceToTextInputProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info('🎙️ جاري التسجيل... اضغط مرة أخرى للإيقاف');
    } catch (err) {
      toast.error('تعذر الوصول للميكروفون');
      console.error('Microphone error:', err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', 'ar');

      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-to-text`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: formData,
        }
      );

      if (!response.ok) throw new Error('فشل تحويل الصوت');
      const result = await response.json();

      if (result.text) {
        onTranscription(result.text);
        toast.success('✅ تم تحويل الصوت لنص بنجاح');
      } else {
        toast.error('لم يتم التعرف على الصوت');
      }
    } catch (err) {
      console.error('Voice processing error:', err);
      toast.error('حدث خطأ في معالجة الصوت');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      type="button"
      variant={isRecording ? 'destructive' : 'outline'}
      size="lg"
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isProcessing}
      className={cn(
        'gap-2 w-full h-14 text-base',
        isRecording && 'animate-pulse',
        className
      )}
    >
      {isProcessing ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          جاري التحويل...
        </>
      ) : isRecording ? (
        <>
          <MicOff className="h-5 w-5" />
          إيقاف التسجيل
        </>
      ) : (
        <>
          <Mic className="h-5 w-5" />
          {label}
        </>
      )}
    </Button>
  );
};

export default VoiceToTextInput;
