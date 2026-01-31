import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  X, 
  Loader2,
  Smile,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  onSendFile: (file: File) => Promise<void>;
  sending: boolean;
  disabled?: boolean;
}

const ChatInput = ({ onSendMessage, onSendFile, sending, disabled }: ChatInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isMobile } = useDisplayMode();
  const { toast } = useToast();

  const handleSend = async () => {
    if (sending || disabled) return;

    if (selectedFile) {
      await onSendFile(selectedFile);
      clearSelectedFile();
      return;
    }

    if (!inputValue.trim()) return;
    await onSendMessage(inputValue.trim());
    setInputValue('');
    
    // Reset textarea height
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'خطأ',
          description: 'حجم الملف يجب أن يكون أقل من 10 ميجابايت',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  return (
    <div className={cn(
      "border-t border-border bg-background/80 backdrop-blur-sm",
      isMobile ? "p-2" : "p-3"
    )}>
      {/* File Preview */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2"
          >
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted border border-border">
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
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

      {/* Input Area */}
      <div className="flex items-end gap-2">
        {/* File Input (hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Attachment Button */}
        <Button
          size="icon"
          variant="ghost"
          className={cn("shrink-0", isMobile ? "h-9 w-9" : "h-10 w-10")}
          onClick={() => fileInputRef.current?.click()}
          disabled={sending || disabled}
        >
          <Paperclip className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
        </Button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="اكتب رسالتك..."
            disabled={sending || disabled}
            className={cn(
              "resize-none min-h-[40px] max-h-[120px] py-2.5 px-4 pr-4 rounded-2xl",
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
            (inputValue.trim() || selectedFile) && !sending 
              ? "bg-primary hover:bg-primary/90" 
              : "bg-muted text-muted-foreground"
          )}
          onClick={handleSend}
          disabled={sending || disabled || (!inputValue.trim() && !selectedFile)}
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
