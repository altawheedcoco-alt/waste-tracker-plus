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
  Square,
  Play,
  Pause,
  Trash2,
  Smile,
  Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface EnhancedChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  onSendFile: (file: File) => Promise<void>;
  sending: boolean;
  uploadProgress?: number;
  disabled?: boolean;
}

// Common emoji categories
const EMOJI_CATEGORIES = {
  smileys: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛'],
  gestures: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '🤲', '🤝', '🙏', '✍️', '💪'],
  hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️'],
  objects: ['📦', '🚛', '♻️', '📄', '📋', '✅', '❌', '⚠️', '📍', '📞', '💰', '🏭', '🏢', '📊', '📈', '🔔', '⏰', '📅', '💼', '🗂️'],
};

const EnhancedChatInput = ({ 
  onSendMessage, 
  onSendFile, 
  sending, 
  uploadProgress = 0, 
  disabled 
}: EnhancedChatInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
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
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
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
    if (!file) return;

    const maxSize = type === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    const maxSizeLabel = type === 'video' ? '50 ميجابايت' : '10 ميجابايت';
    
    if (file.size > maxSize) {
      toast({
        title: 'حجم الملف كبير',
        description: `الحد الأقصى ${maxSizeLabel}`,
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
  };

  const clearSelectedFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const clearAudioRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
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
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      clearSelectedFile();

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      toast({
        title: 'تعذر الوصول للميكروفون',
        description: 'تأكد من السماح بالوصول للميكروفون',
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
    if (!audioPreviewRef.current && audioUrl) {
      audioPreviewRef.current = new Audio(audioUrl);
      audioPreviewRef.current.onended = () => setIsPlayingPreview(false);
    }

    if (audioPreviewRef.current) {
      if (isPlayingPreview) {
        audioPreviewRef.current.pause();
        setIsPlayingPreview(false);
      } else {
        audioPreviewRef.current.play();
        setIsPlayingPreview(true);
      }
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

  const insertEmoji = (emoji: string) => {
    setInputValue(prev => prev + emoji);
    textareaRef.current?.focus();
  };

  const getFileIcon = () => {
    if (!selectedFile) return <FileText className="w-5 h-5 text-primary" />;
    if (selectedFile.type.startsWith('video/')) return <Video className="w-5 h-5 text-primary" />;
    if (selectedFile.type.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-primary" />;
    return <FileText className="w-5 h-5 text-primary" />;
  };

  const hasContent = inputValue.trim() || selectedFile || audioBlob;

  return (
    <div className={cn(
      "border-t border-border bg-background",
      isMobile ? "p-2" : "p-3"
    )}>
      {/* Upload Progress */}
      <AnimatePresence>
        {sending && uploadProgress > 0 && uploadProgress < 100 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2"
          >
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
              <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium">جاري الرفع...</span>
                  <span className="text-sm font-mono text-primary">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-1.5" />
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
            <div className="flex items-center gap-3 p-2 rounded-xl bg-muted border border-border">
              {previewUrl && selectedFile.type.startsWith('image/') ? (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-14 h-14 rounded-lg object-cover"
                />
              ) : previewUrl && selectedFile.type.startsWith('video/') ? (
                <video 
                  src={previewUrl} 
                  className="w-14 h-14 rounded-lg object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
                  {getFileIcon()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
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
        {audioBlob && audioUrl && !isRecording && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2"
          >
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-11 h-11 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Mic className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-700">رسالة صوتية</p>
                <p className="text-xs text-emerald-600/70">{formatTime(recordingTime)}</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                onClick={toggleAudioPreview}
              >
                {isPlayingPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
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
            <div className="flex items-center gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-3 h-3 rounded-full bg-destructive shrink-0"
              />
              <span className="text-sm font-medium text-destructive">جاري التسجيل</span>
              <span className="text-sm font-mono text-destructive/70">{formatTime(recordingTime)}</span>
              <div className="flex-1" />
              <Button
                size="sm"
                variant="destructive"
                className="h-8 gap-1.5"
                onClick={stopRecording}
              >
                <Square className="w-3.5 h-3.5" />
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
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFileSelect(e, 'image')}
          className="hidden"
        />

        {/* Media Buttons */}
        <div className={cn("flex items-center", isMobile ? "gap-0" : "gap-0.5")}>
          {/* Emoji Picker */}
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className={cn("shrink-0", isMobile ? "h-9 w-9" : "h-10 w-10")}
                disabled={sending || disabled || isRecording}
              >
                <Smile className={isMobile ? "w-5 h-5" : "w-5 h-5"} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-2" side="top" align="start">
              <div className="space-y-2">
                {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                  <div key={category}>
                    <p className="text-[10px] text-muted-foreground mb-1 px-1">
                      {category === 'smileys' && 'وجوه'}
                      {category === 'gestures' && 'إشارات'}
                      {category === 'hearts' && 'قلوب'}
                      {category === 'objects' && 'أيقونات العمل'}
                    </p>
                    <div className="flex flex-wrap gap-0.5">
                      {emojis.map((emoji, i) => (
                        <button
                          key={i}
                          onClick={() => insertEmoji(emoji)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded-md transition-colors text-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className={cn("shrink-0", isMobile ? "h-9 w-9" : "h-10 w-10")}
                onClick={() => fileInputRef.current?.click()}
                disabled={sending || disabled || isRecording}
              >
                <Paperclip className={isMobile ? "w-5 h-5" : "w-5 h-5"} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>ملف</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className={cn("shrink-0", isMobile ? "h-9 w-9" : "h-10 w-10")}
                onClick={() => imageInputRef.current?.click()}
                disabled={sending || disabled || isRecording}
              >
                <ImageIcon className={isMobile ? "w-5 h-5" : "w-5 h-5"} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>صورة</TooltipContent>
          </Tooltip>

          {isMobile && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 shrink-0"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={sending || disabled || isRecording}
                >
                  <Camera className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>الكاميرا</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className={cn("shrink-0", isMobile ? "h-9 w-9" : "h-10 w-10")}
                onClick={() => videoInputRef.current?.click()}
                disabled={sending || disabled || isRecording}
              >
                <Video className={isMobile ? "w-5 h-5" : "w-5 h-5"} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>فيديو</TooltipContent>
          </Tooltip>
        </div>

        {/* Text Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? "جاري التسجيل..." : "اكتب رسالة..."}
            className={cn(
              "min-h-[44px] max-h-[120px] resize-none py-3 pr-4 pl-12 rounded-2xl",
              "bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/30"
            )}
            disabled={sending || disabled || isRecording}
            dir="rtl"
            rows={1}
          />
        </div>

        {/* Send / Record Button */}
        {hasContent ? (
          <Button
            size="icon"
            className={cn(
              "shrink-0 rounded-full",
              isMobile ? "h-10 w-10" : "h-11 w-11"
            )}
            onClick={handleSend}
            disabled={sending || disabled}
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        ) : (
          <Button
            size="icon"
            variant={isRecording ? "destructive" : "default"}
            className={cn(
              "shrink-0 rounded-full transition-all",
              isMobile ? "h-10 w-10" : "h-11 w-11",
              isRecording && "animate-pulse"
            )}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={sending || disabled}
          >
            {isRecording ? (
              <Square className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default EnhancedChatInput;
