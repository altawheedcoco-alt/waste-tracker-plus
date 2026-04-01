import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ChatSearchBarProps {
  messages: Array<{ id: string; content: string; created_at?: string }>;
  onScrollToMessage: (messageId: string) => void;
  onHighlightMessage?: (messageId: string | null) => void;
  onClose: () => void;
}

const ChatSearchBar = ({ messages, onScrollToMessage, onHighlightMessage, onClose }: ChatSearchBarProps) => {
  const [query, setQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Extract text from message content (handles JSON and plain text)
  const extractText = useCallback((content: string): string => {
    try {
      const parsed = JSON.parse(content);
      return parsed.text || parsed.content || '';
    } catch {
      return content;
    }
  }, []);

  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    return messages.filter(m => extractText(m.content).toLowerCase().includes(q));
  }, [messages, query, extractText]);

  // Navigate to current result
  const goToResult = useCallback((index: number) => {
    if (results.length === 0) return;
    const safeIndex = ((index % results.length) + results.length) % results.length;
    setCurrentIndex(safeIndex);
    const msg = results[safeIndex];
    onScrollToMessage(msg.id);
    onHighlightMessage?.(msg.id);
    // Clear highlight after animation
    setTimeout(() => onHighlightMessage?.(null), 2000);
  }, [results, onScrollToMessage, onHighlightMessage]);

  const navigate = useCallback((direction: 'up' | 'down') => {
    if (results.length === 0) return;
    goToResult(direction === 'up' ? currentIndex - 1 : currentIndex + 1);
  }, [currentIndex, results.length, goToResult]);

  // Auto-jump to first result when query changes
  useEffect(() => {
    if (results.length > 0) {
      goToResult(0);
    } else {
      onHighlightMessage?.(null);
    }
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        navigate(e.shiftKey ? 'up' : 'down');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, onClose]);

  // Auto-focus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden border-b border-border bg-background/95 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCurrentIndex(0);
            }}
            placeholder="بحث في الرسائل..."
            className="pr-9 h-9 text-sm bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/50"
            dir="rtl"
          />
        </div>
        
        {query.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1"
          >
            {results.length > 0 ? (
              <>
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-mono">
                  {currentIndex + 1}/{results.length}
                </Badge>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => navigate('up')}>
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => navigate('down')}>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">لا نتائج</span>
            )}
          </motion.div>
        )}
        
        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default ChatSearchBar;
