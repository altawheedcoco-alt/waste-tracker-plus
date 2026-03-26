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
  Search as SearchIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

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
import { filterCommands, SLASH_COMMANDS, type SlashCommand } from '@/config/chatSlashCommands';
import { getOrgCommands, filterOrgCommands, type OrgSlashCommand } from '@/config/chatOrgCommands';
import { useAuth } from '@/contexts/AuthContext';
import SlashCommandMenu from './SlashCommandMenu';
import ChatResourcePicker from './ChatResourcePicker';
import { useMentionableUsers } from '@/hooks/useMentionableUsers';
import { useMentionNotifier } from '@/hooks/useMentionNotifier';

interface EnhancedChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  onSendFile: (file: File) => Promise<void>;
  onSendResourceCard?: (resourceType: string, resourceData: any) => Promise<void>;
  sending: boolean;
  uploadProgress?: number;
  disabled?: boolean;
  onTyping?: () => void;
  chatPartnerOrgId?: string;
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
  onSendResourceCard,
  sending, 
  uploadProgress = 0, 
  disabled,
  onTyping,
  chatPartnerOrgId,
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
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPos, setCursorPos] = useState(0);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashSearch, setSlashSearch] = useState('');
  const [slashIndex, setSlashIndex] = useState(0);
  const [showResourcePicker, setShowResourcePicker] = useState(false);
  const [resourcePickerTab, setResourcePickerTab] = useState<'outgoing' | 'incoming'>('outgoing');
  const [isRecordingLocked, setIsRecordingLocked] = useState(false);
  const [recordSlideX, setRecordSlideX] = useState(0);
  
  const { entities: mentionableEntities } = useMentionableEntities();
  const { users: mentionableUsers } = useMentionableUsers();
  const { notify: notifyMentions } = useMentionNotifier();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const micBtnRef = useRef<HTMLButtonElement>(null);
  const recordStartPosRef = useRef<{ x: number; y: number } | null>(null);
  
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
    const msgText = inputValue.trim();
    await onSendMessage(msgText);
    if (msgText.includes('@[')) {
      notifyMentions({ text: msgText, users: mentionableUsers, context: 'دردشة' });
    }
    setInputValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSlashMenu && filteredSlashCommands.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSlashIndex(i => (i + 1) % filteredSlashCommands.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSlashIndex(i => (i - 1 + filteredSlashCommands.length) % filteredSlashCommands.length); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); handleSlashSelect(filteredSlashCommands[slashIndex]); return; }
      if (e.key === 'Escape') { setShowSlashMenu(false); return; }
    }
    if (showMentionDropdown && filteredMentions.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex(i => (i + 1) % filteredMentions.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIndex(i => (i - 1 + filteredMentions.length) % filteredMentions.length); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(filteredMentions[mentionIndex]); return; }
      if (e.key === 'Escape') { setShowMentionDropdown(false); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'image' | 'video') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (files.length > 1) {
      setShowAttachMenu(false);
      clearAudioRecording();
      for (let i = 0; i < files.length; i++) await onSendFile(files[i]);
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
    setIsRecordingLocked(false);
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
      setIsRecordingLocked(false);
      if (recordingIntervalRef.current) { clearInterval(recordingIntervalRef.current); recordingIntervalRef.current = null; }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsRecordingLocked(false);
      if (recordingIntervalRef.current) { clearInterval(recordingIntervalRef.current); recordingIntervalRef.current = null; }
      // Clear the audio immediately
      setTimeout(() => {
        setAudioBlob(null);
        setAudioUrl(null);
        setRecordingTime(0);
      }, 50);
    }
  };

  // Hold-to-record touch handlers
  const handleMicTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    recordStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    startRecording();
  };

  const handleMicTouchMove = (e: React.TouchEvent) => {
    if (!isRecording || !recordStartPosRef.current || isRecordingLocked) return;
    const touch = e.touches[0];
    const dx = recordStartPosRef.current.x - touch.clientX;
    const dy = recordStartPosRef.current.y - touch.clientY;
    
    setRecordSlideX(Math.max(0, dx));
    
    // Slide left to cancel (>120px)
    if (dx > 120) {
      cancelRecording();
      setRecordSlideX(0);
      return;
    }
    
    // Slide up to lock (>60px)
    if (dy > 60) {
      setIsRecordingLocked(true);
      setRecordSlideX(0);
    }
  };

  const handleMicTouchEnd = () => {
    recordStartPosRef.current = null;
    setRecordSlideX(0);
    if (isRecording && !isRecordingLocked) {
      stopRecording();
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
    const newValue = e.target.value;
    const pos = e.target.selectionStart || 0;
    setInputValue(newValue);
    setCursorPos(pos);
    onTyping?.();
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    
    const before = newValue.slice(0, pos);
    if (before === '/' || (before.startsWith('/') && !before.includes(' '))) {
      setSlashSearch(before);
      setShowSlashMenu(true);
      setSlashIndex(0);
      setShowMentionDropdown(false);
      return;
    }
    setShowSlashMenu(false);
    const atIndex = before.lastIndexOf('@');
    if (atIndex !== -1) {
      const afterAt = before.slice(atIndex + 1);
      if ((atIndex === 0 || /[\s\n]/.test(before[atIndex - 1])) && !afterAt.includes(']') && !afterAt.includes('(')) {
        setMentionSearch(afterAt);
        setShowMentionDropdown(true);
        setMentionIndex(0);
        return;
      }
    }
    setShowMentionDropdown(false);
  };

  const filteredSlashCommands = filterCommands(slashSearch);

  const handleSlashSelect = useCallback((cmd: SlashCommand) => {
    setInputValue('');
    setShowSlashMenu(false);
    setResourcePickerTab('outgoing');
    setShowResourcePicker(true);
    textareaRef.current?.focus();
  }, []);

  const handleResourceSelect = useCallback(async (resource: { type: string; data: any }) => {
    setShowResourcePicker(false);
    if (onSendResourceCard) await onSendResourceCard(resource.type, resource.data);
  }, [onSendResourceCard]);

  const contextMentions = chatPartnerOrgId
    ? mentionableEntities.filter(e => {
        if (e.type === 'organization') return e.id === chatPartnerOrgId;
        return !e.is_external || mentionableEntities.some(
          org => org.type === 'organization' && org.id === chatPartnerOrgId && e.subtitle === org.name
        );
      })
    : mentionableEntities;

  const filteredMentions = contextMentions.filter(e =>
    e.name.toLowerCase().includes(mentionSearch.toLowerCase()) ||
    (e.subtitle?.toLowerCase().includes(mentionSearch.toLowerCase()) ?? false)
  ).slice(0, 12);

  const insertMention = useCallback((entity: MentionableEntity) => {
    const before = inputValue.slice(0, cursorPos);
    const atIndex = before.lastIndexOf('@');
    if (atIndex === -1) return;
    const beforeAt = inputValue.slice(0, atIndex);
    const afterCursor = inputValue.slice(cursorPos);
    const mention = `@[${entity.name}](${entity.id}) `;
    const newValue = beforeAt + mention + afterCursor;
    setInputValue(newValue);
    setShowMentionDropdown(false);
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = beforeAt.length + mention.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
        setCursorPos(newPos);
      }
    }, 0);
  }, [inputValue, cursorPos]);

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
    <div className={cn("border-t border-border/20 bg-[hsl(var(--wa-chat-bg))]", isMobile ? "p-1.5" : "p-2")}>
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
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(var(--wa-light-green))]/10 border border-[hsl(var(--wa-light-green))]/20">
              <div className="w-11 h-11 rounded-full bg-[hsl(var(--wa-light-green))]/20 flex items-center justify-center shrink-0">
                <Mic className="w-5 h-5 text-[hsl(var(--wa-teal-green))]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[hsl(var(--wa-teal-green))]">رسالة صوتية</p>
                <p className="text-xs text-[hsl(var(--wa-teal-green))]/70">{formatTime(recordingTime)}</p>
              </div>
              <Button size="icon" variant="ghost" className="h-9 w-9 text-[hsl(var(--wa-teal-green))]" onClick={toggleAudioPreview}>
                {isPlayingPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive hover:bg-destructive/10" onClick={clearAudioRecording}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording UI - WhatsApp slide-to-cancel with live waveform */}
      <AnimatePresence>
        {isRecording && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }} 
            className="mb-2"
          >
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-background border border-border shadow-sm">
              <motion.div 
                animate={{ scale: [1, 1.3, 1] }} 
                transition={{ repeat: Infinity, duration: 1 }} 
                className="w-3 h-3 rounded-full bg-destructive shrink-0" 
              />
              <span className="text-sm font-mono text-destructive font-medium">{formatTime(recordingTime)}</span>
              
              {/* Live Waveform */}
              <div className="flex-1 flex items-center justify-center gap-[2px] h-6 overflow-hidden">
                {Array.from({ length: 24 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-[3px] rounded-full bg-destructive/60"
                    animate={{
                      height: [4, Math.random() * 20 + 4, 4],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.4 + Math.random() * 0.4,
                      delay: i * 0.03,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>

              {!isRecordingLocked ? (
                <motion.span 
                  className="text-xs text-muted-foreground shrink-0"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  ◀ اسحب للإلغاء
                </motion.span>
              ) : (
                <>
                  <span className="text-xs text-muted-foreground shrink-0">🔒 مقفل</span>
                  <Button size="sm" variant="destructive" className="h-8 gap-1.5 rounded-full" onClick={stopRecording}>
                    <Square className="w-3 h-3" />
                    إيقاف
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area - WhatsApp Style */}
      <div className="flex items-end gap-1.5">
        <div className={cn(
          "flex-1 flex items-end gap-1 rounded-[25px] bg-background border border-border/30 shadow-sm",
          isMobile ? "px-1 py-0.5" : "px-2 py-0.5"
        )}>
          {/* Emoji */}
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0 rounded-full" disabled={sending || disabled || isRecording}>
                <Smile className="w-5 h-5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-2" side="top" align="start">
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
          <div className="flex-1 relative">
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
            
            <AnimatePresence>
              {showSlashMenu && filteredSlashCommands.length > 0 && (
                <SlashCommandMenu commands={filteredSlashCommands} selectedIndex={slashIndex} onSelect={handleSlashSelect} onHover={setSlashIndex} />
              )}
            </AnimatePresence>

            <ChatResourcePicker isOpen={showResourcePicker} onClose={() => setShowResourcePicker(false)} onSelect={handleResourceSelect} initialTab={resourcePickerTab} />

            <AnimatePresence>
              {showMentionDropdown && filteredMentions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full mb-1 right-0 left-0 z-50 bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
                >
                  <div className="max-h-48 overflow-y-auto scrollbar-thin">
                    {filteredMentions.map((entity, index) => (
                      <button
                        key={`${entity.type}-${entity.id}`}
                        type="button"
                        className={cn(
                          'w-full flex items-center gap-2.5 px-3 py-2 text-right text-sm transition-colors',
                          index === mentionIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                        )}
                        onClick={() => insertMention(entity)}
                        onMouseEnter={() => setMentionIndex(index)}
                      >
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarImage src={entity.avatar_url || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {entity.type === 'organization' ? <Building2 className="h-3.5 w-3.5" /> : entity.name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 text-right">
                          <p className="font-medium text-xs truncate">{entity.name}</p>
                          {entity.subtitle && (
                            <div className="flex items-center gap-1 justify-end">
                              {entity.type === 'organization' ? <Building2 className="w-2.5 h-2.5 text-muted-foreground" /> : <User className="w-2.5 h-2.5 text-muted-foreground" />}
                              <span className="text-[10px] text-muted-foreground truncate">{entity.subtitle}</span>
                            </div>
                          )}
                        </div>
                        {entity.type === 'organization' && <Badge variant="outline" className="text-[8px] py-0 h-3.5 shrink-0">جهة</Badge>}
                        {entity.is_external && entity.type === 'user' && <Badge variant="outline" className="text-[8px] py-0 h-3.5 shrink-0">خارجي</Badge>}
                      </button>
                    ))}
                  </div>
                  <div className="px-3 py-1 border-t border-border/50 text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
                    <AtSign className="w-3 h-3" />
                    اكتب @ للإشارة لشخص أو جهة
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Resource Search */}
          {onSendResourceCard && (
            <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0 rounded-full" disabled={sending || disabled || isRecording}
              onClick={() => setShowResourcePicker(true)} title="إرفاق مورد">
              <SearchIcon className="w-4.5 h-4.5 text-muted-foreground" />
            </Button>
          )}

          {/* Attachment */}
          <Popover open={showAttachMenu} onOpenChange={setShowAttachMenu}>
            <PopoverTrigger asChild>
              <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0 rounded-full" disabled={sending || disabled || isRecording}>
                <Plus className={cn("w-5 h-5 text-muted-foreground transition-transform", showAttachMenu && "rotate-45")} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" side="top" align="end">
              <div className="grid grid-cols-3 gap-3">
                {attachmentItems.filter(item => !item.mobileOnly || isMobile).map((item) => (
                  <button key={item.label} onClick={() => { item.onClick(); setShowAttachMenu(false); }}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted transition-colors">
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

        {/* Send / Record Button - WhatsApp green circle */}
        {hasContent ? (
          <Button
            size="icon"
            className="shrink-0 rounded-full h-11 w-11 bg-[hsl(var(--wa-light-green))] hover:bg-[hsl(var(--wa-teal-green))] text-white shadow-md"
            onClick={handleSend}
            disabled={sending || disabled}
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        ) : (
          <button
            ref={micBtnRef}
            className={cn(
              "shrink-0 rounded-full h-11 w-11 flex items-center justify-center transition-all shadow-md select-none",
              isRecording 
                ? "bg-destructive text-white animate-pulse scale-110" 
                : "bg-[hsl(var(--wa-light-green))] text-white hover:bg-[hsl(var(--wa-teal-green))]"
            )}
            // Desktop: click to toggle
            onClick={() => {
              if (!isMobile) {
                if (isRecording) stopRecording();
                else startRecording();
              }
            }}
            // Mobile: hold to record
            onTouchStart={isMobile ? handleMicTouchStart : undefined}
            onTouchMove={isMobile ? handleMicTouchMove : undefined}
            onTouchEnd={isMobile ? handleMicTouchEnd : undefined}
            disabled={sending || disabled}
          >
            {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        )}
      </div>
    </div>
  );
};

export default EnhancedChatInput;
