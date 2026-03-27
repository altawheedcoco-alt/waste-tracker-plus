import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  X, 
  Loader2,
  FileText,
  Video,
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { soundEngine } from '@/lib/soundEngine';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  onSendFile: (file: File) => Promise<void>;
  sending: boolean;
  uploadProgress?: number;
  disabled?: boolean;
}

const ChatInput = ({ onSendMessage, onSendFile, sending, uploadProgress = 0, disabled }: ChatInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  
  const { isMobile } = useDisplayMode();
  const { toast } = useToast();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [audioUrl, previewUrl]);

  const handleSend = async () => {
    if (sending || disabled) return;

    // Send audio recording
    if (audioBlob) {
      const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { 
        type: 'audio/webm' 
      });
      await onSendFile(audioFile);
      clearAudioRecording();
      return;
    }

    // Send selected file
    if (selectedFile) {
      await onSendFile(selectedFile);
      clearSelectedFile();
      return;
    }

    // Send text message
    if (!inputValue.trim()) return;
    await onSendMessage(inputValue.trim());
    setInputValue('');
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = type === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      const maxSizeLabel = type === 'video' ? '50 ميجابايت' : '10 ميجابايت';
      
      if (file.size > maxSize) {
        toast({
          title: 'خطأ',
          description: `حجم الملف يجب أن يكون أقل من ${maxSizeLabel}`,
          variant: 'destructive',
        });
        return;
      }
      
      setSelectedFile(file);
      clearAudioRecording();
      
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const clearSelectedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const clearAudioRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlayingPreview(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      clearSelectedFile();

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast({
        title: 'جاري التسجيل',
        description: 'اضغط على زر الإيقاف عند الانتهاء',
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'خطأ',
        description: 'تعذر الوصول للميكروفون. تأكد من السماح بالوصول.',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const toggleAudioPreview = () => {
    if (!audioPreviewRef.current) {
      audioPreviewRef.current = new Audio(audioUrl!);
      audioPreviewRef.current.onended = () => setIsPlayingPreview(false);
    }

    if (isPlayingPreview) {
      audioPreviewRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      audioPreviewRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const getFileIcon = () => {
    if (!selectedFile) return <FileText className="w-6 h-6 text-primary" />;
    if (selectedFile.type.startsWith('video/')) return <Video className="w-6 h-6 text-primary" />;
    if (selectedFile.type.startsWith('image/')) return <ImageIcon className="w-6 h-6 text-primary" />;
    return <FileText className="w-6 h-6 text-primary" />;
  };

  return (
    <div className={cn(
      "border-t border-border bg-background/80 backdrop-blur-sm",
      isMobile ? "p-2" : "p-3"
    )}>
      {/* Upload Progress Indicator */}
      <AnimatePresence>
        {sending && uploadProgress > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2"
          >
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">جاري الرفع...</span>
                  <span className="text-sm font-mono text-primary">{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Preview */}
      <AnimatePresence>
        {selectedFile && !sending && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2"
          >
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted border border-border">
              {previewUrl && selectedFile.type.startsWith('image/') ? (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : previewUrl && selectedFile.type.startsWith('video/') ? (
                <video 
                  src={previewUrl} 
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  {getFileIcon()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} كيلوبايت
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0"
                onClick={clearSelectedFile}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio Recording Preview */}
      <AnimatePresence>
        {audioBlob && audioUrl && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2"
          >
            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Mic className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">رسالة صوتية</p>
                <p className="text-xs text-muted-foreground">
                  {formatTime(recordingTime)}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0 text-emerald-600 hover:text-emerald-700"
                onClick={toggleAudioPreview}
              >
                {isPlayingPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                onClick={clearAudioRecording}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording Indicator */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2"
          >
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-3 h-3 rounded-full bg-red-500"
              />
              <span className="text-sm font-medium text-red-600">جاري التسجيل...</span>
              <span className="text-sm font-mono text-red-500">{formatTime(recordingTime)}</span>
              <div className="flex-1" />
              <Button
                size="sm"
                variant="destructive"
                className="h-8"
                onClick={stopRecording}
              >
                <Square className="w-4 h-4 ml-1" />
                إيقاف
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="flex items-end gap-1.5">
        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
          onChange={(e) => handleFileSelect(e, 'file')}
          className="hidden"
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelect(e, 'image')}
          className="hidden"
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          onChange={(e) => handleFileSelect(e, 'video')}
          className="hidden"
        />

        {/* Media Buttons */}
        <div className={cn("flex items-center", isMobile ? "gap-0.5" : "gap-1")}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className={cn("shrink-0", isMobile ? "h-8 w-8" : "h-9 w-9")}
                onClick={() => fileInputRef.current?.click()}
                disabled={sending || disabled || isRecording}
              >
                <Paperclip className={isMobile ? "w-4 h-4" : "w-4.5 h-4.5"} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">ملف</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className={cn("shrink-0", isMobile ? "h-8 w-8" : "h-9 w-9")}
                onClick={() => imageInputRef.current?.click()}
                disabled={sending || disabled || isRecording}
              >
                <ImageIcon className={isMobile ? "w-4 h-4" : "w-4.5 h-4.5"} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">صورة</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className={cn("shrink-0", isMobile ? "h-8 w-8" : "h-9 w-9")}
                onClick={() => videoInputRef.current?.click()}
                disabled={sending || disabled || isRecording}
              >
                <Video className={isMobile ? "w-4 h-4" : "w-4.5 h-4.5"} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">فيديو</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={isRecording ? "destructive" : "ghost"}
                className={cn(
                  "shrink-0 transition-all",
                  isMobile ? "h-8 w-8" : "h-9 w-9",
                  isRecording && "animate-pulse"
                )}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={sending || disabled}
              >
                {isRecording ? (
                  <MicOff className={isMobile ? "w-4 h-4" : "w-4.5 h-4.5"} />
                ) : (
                  <Mic className={isMobile ? "w-4 h-4" : "w-4.5 h-4.5"} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {isRecording ? 'إيقاف التسجيل' : 'تسجيل صوتي'}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Text Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? "جاري التسجيل..." : "اكتب رسالتك..."}
            disabled={sending || disabled || isRecording}
            className={cn(
              "resize-none min-h-[40px] max-h-[120px] py-2.5 px-4 rounded-2xl",
              isMobile ? "text-sm" : "text-sm"
            )}
            rows={1}
          />
        </div>

        {/* Send Button */}
        <Button
          size="icon"
          className={cn(
            "shrink-0 rounded-full transition-all",
            isMobile ? "h-9 w-9" : "h-10 w-10",
            (inputValue.trim() || selectedFile || audioBlob) && !sending 
              ? "bg-primary hover:bg-primary/90" 
              : "bg-muted text-muted-foreground"
          )}
          onClick={handleSend}
          disabled={sending || disabled || isRecording || (!inputValue.trim() && !selectedFile && !audioBlob)}
        >
          {sending ? (
            <Loader2 className={cn("animate-spin", isMobile ? "w-4 h-4" : "w-5 h-5")} />
          ) : (
            <Send className={cn(isMobile ? "w-4 h-4" : "w-5 h-5")} />
          )}
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
