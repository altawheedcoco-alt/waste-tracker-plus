import { useState, useRef, useEffect, useCallback } from 'react';
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
  Camera,
  Plus,
  Building2,
  User,
  AtSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useMentionableEntities } from '@/hooks/useMentionableEntities';
import type { MentionableEntity } from '@/components/ui/mentionable-field';

interface EnhancedChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  onSendFile: (file: File) => Promise<void>;
  sending: boolean;
  uploadProgress?: number;
  disabled?: boolean;
  onTyping?: () => void;
}

const EMOJI_QUICK = ['😀', '😂', '❤️', '👍', '🙏', '😊', '😍', '🔥', '✅', '📦', '🚛', '♻️'];
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
  disabled,
  onTyping,
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
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  
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

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [audioUrl, previewUrl]);

  const handleSend = async () => {
    if (sending || disabled) return;
    if (audioBlob) {
      const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
      await onSendFile(audioFile);
      clearAudioRecording();
      return;
    }
    if (selectedFile) {
      await onSendFile(selectedFile);
      clearSelectedFile();
      return;
    }
    if (!inputValue.trim()) return;
    await onSendMessage(inputValue.trim());
    setInputValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'image' | 'video') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // If multiple files, send each one directly
    if (files.length > 1) {
      setShowAttachMenu(false);
      clearAudioRecording();
      for (let i = 0; i < files.length; i++) {
        await onSendFile(files[i]);
      }
      e.target.value = '';
      return;
    }

    const file = files[0];
    setSelectedFile(file);
    setShowAttachMenu(false);
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
    [fileInputRef, imageInputRef, videoInputRef, cameraInputRef].forEach(ref => {
      if (ref.current) ref.current.value = '';
    });
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
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
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
      recordingIntervalRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch {
      toast({ title: 'تعذر الوصول للميكروفون', description: 'تأكد من السماح بالوصول للميكروفون', variant: 'destructive' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) { clearInterval(recordingIntervalRef.current); recordingIntervalRef.current = null; }
    }
  };

  const toggleAudioPreview = () => {
    if (!audioPreviewRef.current && audioUrl) {
      audioPreviewRef.current = new Audio(audioUrl);
      audioPreviewRef.current.onended = () => setIsPlayingPreview(false);
    }
    if (audioPreviewRef.current) {
      if (isPlayingPreview) { audioPreviewRef.current.pause(); setIsPlayingPreview(false); }
      else { audioPreviewRef.current.play(); setIsPlayingPreview(true); }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    onTyping?.();
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

  const attachmentItems = [
    { icon: ImageIcon, label: 'صورة', color: 'bg-violet-500', onClick: () => imageInputRef.current?.click() },
    { icon: Camera, label: 'كاميرا', color: 'bg-rose-500', onClick: () => cameraInputRef.current?.click(), mobileOnly: true },
    { icon: Video, label: 'فيديو', color: 'bg-pink-500', onClick: () => videoInputRef.current?.click() },
    { icon: FileText, label: 'مستند', color: 'bg-indigo-500', onClick: () => fileInputRef.current?.click() },
  ];

  return (
    <div className={cn("border-t border-border bg-background", isMobile ? "p-2" : "p-3")}>
      {/* Hidden File Inputs */}
      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar,.csv,.pptx,.ppt" multiple onChange={(e) => handleFileSelect(e, 'file')} className="hidden" />
      <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={(e) => handleFileSelect(e, 'image')} className="hidden" />
      <input ref={videoInputRef} type="file" accept="video/*" multiple onChange={(e) => handleFileSelect(e, 'video')} className="hidden" />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={(e) => handleFileSelect(e, 'image')} className="hidden" />

      {/* Upload Progress */}
      <AnimatePresence>
        {sending && uploadProgress > 0 && uploadProgress < 100 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-2">
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
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-2">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-muted border border-border">
              {previewUrl && selectedFile.type.startsWith('image/') ? (
                <img src={previewUrl} alt="Preview" className="w-14 h-14 rounded-lg object-cover" />
              ) : previewUrl && selectedFile.type.startsWith('video/') ? (
                <video src={previewUrl} className="w-14 h-14 rounded-lg object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">{getFileIcon()}</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={clearSelectedFile}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio Recording Preview */}
      <AnimatePresence>
        {audioBlob && audioUrl && !isRecording && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-11 h-11 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Mic className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">رسالة صوتية</p>
                <p className="text-xs text-emerald-600/70">{formatTime(recordingTime)}</p>
              </div>
              <Button size="icon" variant="ghost" className="h-9 w-9 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10" onClick={toggleAudioPreview}>
                {isPlayingPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={clearAudioRecording}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording Indicator */}
      <AnimatePresence>
        {isRecording && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-3 h-3 rounded-full bg-destructive shrink-0" />
              <span className="text-sm font-medium text-destructive">جاري التسجيل</span>
              <span className="text-sm font-mono text-destructive/70">{formatTime(recordingTime)}</span>
              <div className="flex-1" />
              <Button size="sm" variant="destructive" className="h-8 gap-1.5" onClick={stopRecording}>
                <Square className="w-3.5 h-3.5" />
                إيقاف
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area - WhatsApp Style */}
      <div className="flex items-end gap-1.5">
        {/* Main Input Row */}
        <div className={cn(
          "flex-1 flex items-end gap-1 rounded-3xl bg-muted/50 border border-border/50",
          isMobile ? "px-1 py-0.5" : "px-2 py-1"
        )}>
          {/* Emoji */}
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0 rounded-full" disabled={sending || disabled || isRecording}>
                <Smile className="w-5 h-5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-2" side="top" align="start">
              {/* Quick access */}
              <div className="flex flex-wrap gap-0.5 pb-2 mb-2 border-b border-border/50">
                {EMOJI_QUICK.map((emoji, i) => (
                  <button key={i} onClick={() => insertEmoji(emoji)} className="w-9 h-9 flex items-center justify-center hover:bg-muted rounded-lg transition-colors text-lg">
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
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
                        <button key={i} onClick={() => insertEmoji(emoji)} className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded-md transition-colors text-lg">
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Text Input */}
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? "جاري التسجيل..." : "اكتب رسالة..."}
            className="min-h-[36px] max-h-[120px] resize-none py-2 px-1 border-0 shadow-none bg-transparent focus-visible:ring-0 text-sm"
            disabled={sending || disabled || isRecording}
            dir="rtl"
            rows={1}
          />

          {/* Attachment Plus Button */}
          <Popover open={showAttachMenu} onOpenChange={setShowAttachMenu}>
            <PopoverTrigger asChild>
              <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0 rounded-full" disabled={sending || disabled || isRecording}>
                <Plus className={cn("w-5 h-5 text-muted-foreground transition-transform", showAttachMenu && "rotate-45")} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" side="top" align="end">
              <div className="grid grid-cols-3 gap-3">
                {attachmentItems
                  .filter(item => !item.mobileOnly || isMobile)
                  .map((item) => (
                    <button
                      key={item.label}
                      onClick={() => { item.onClick(); setShowAttachMenu(false); }}
                      className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted transition-colors"
                    >
                      <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white", item.color)}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] text-muted-foreground font-medium">{item.label}</span>
                    </button>
                  ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Send / Record Button */}
        {hasContent ? (
          <Button
            size="icon"
            className={cn("shrink-0 rounded-full bg-emerald-600 hover:bg-emerald-700", isMobile ? "h-10 w-10" : "h-11 w-11")}
            onClick={handleSend}
            disabled={sending || disabled}
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        ) : (
          <Button
            size="icon"
            variant={isRecording ? "destructive" : "default"}
            className={cn(
              "shrink-0 rounded-full transition-all",
              isMobile ? "h-10 w-10" : "h-11 w-11",
              !isRecording && "bg-emerald-600 hover:bg-emerald-700",
              isRecording && "animate-pulse"
            )}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={sending || disabled}
          >
            {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
        )}
      </div>
    </div>
  );
};

export default EnhancedChatInput;
