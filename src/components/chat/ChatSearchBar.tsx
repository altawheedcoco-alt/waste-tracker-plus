import { useState, useMemo } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/hooks/useChat';

interface ChatSearchBarProps {
  messages: ChatMessage[];
  onScrollToMessage: (messageId: string) => void;
  onClose: () => void;
}

const ChatSearchBar = ({ messages, onScrollToMessage, onClose }: ChatSearchBarProps) => {
  const [query, setQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return messages.filter(m => {
      try {
        const parsed = JSON.parse(m.content);
        return (parsed.text || '').toLowerCase().includes(q);
      } catch {
        return m.content.toLowerCase().includes(q);
      }
    });
  }, [messages, query]);

  const navigate = (direction: 'up' | 'down') => {
    if (results.length === 0) return;
    let newIndex = direction === 'up' 
      ? (currentIndex - 1 + results.length) % results.length
      : (currentIndex + 1) % results.length;
    setCurrentIndex(newIndex);
    onScrollToMessage(results[newIndex].id);
  };

  const handleChange = (value: string) => {
    setQuery(value);
    setCurrentIndex(0);
    if (value.trim()) {
      const q = value.toLowerCase();
      const first = messages.find(m => {
        try {
          const parsed = JSON.parse(m.content);
          return (parsed.text || '').toLowerCase().includes(q);
        } catch {
          return m.content.toLowerCase().includes(q);
        }
      });
      if (first) onScrollToMessage(first.id);
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-background border-b border-border">
      <div className="flex-1 relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="بحث في الرسائل..."
          className="pr-9 h-9 text-sm"
          autoFocus
          dir="rtl"
        />
      </div>
      
      {results.length > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {currentIndex + 1}/{results.length}
          </span>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => navigate('up')}>
            <ChevronUp className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => navigate('down')}>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={onClose}>
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default ChatSearchBar;
