import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChatMessage } from '@/hooks/useChat';
import { cn } from '@/lib/utils';

interface ChatSearchProps {
  messages: ChatMessage[];
  isOpen: boolean;
  onClose: () => void;
  onNavigateToMessage: (messageId: string) => void;
}

const ChatSearch = ({ messages, isOpen, onClose, onNavigateToMessage }: ChatSearchProps) => {
  const [query, setQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Search results
  const searchResults = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    
    const lowerQuery = query.toLowerCase();
    return messages
      .filter(m => {
        // Search in text content
        let content = m.content;
        try {
          const parsed = JSON.parse(m.content);
          content = parsed.text || parsed.file_name || m.content;
        } catch {
          // Use original content
        }
        return content.toLowerCase().includes(lowerQuery);
      })
      .reverse(); // Most recent first
  }, [messages, query]);

  // Reset index when results change
  useEffect(() => {
    setCurrentIndex(0);
  }, [searchResults.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        if (e.shiftKey) {
          navigatePrev();
        } else {
          navigateNext();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigatePrev();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, searchResults.length]);

  // Navigate to current result
  useEffect(() => {
    if (searchResults.length > 0 && currentIndex >= 0) {
      onNavigateToMessage(searchResults[currentIndex].id);
    }
  }, [currentIndex, searchResults, onNavigateToMessage]);

  const navigateNext = () => {
    if (searchResults.length === 0) return;
    setCurrentIndex(prev => (prev + 1) % searchResults.length);
  };

  const navigatePrev = () => {
    if (searchResults.length === 0) return;
    setCurrentIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
  };

  const handleClose = () => {
    setQuery('');
    setCurrentIndex(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="absolute top-0 inset-x-0 z-20 bg-background border-b border-border shadow-lg"
      >
        <div className="flex items-center gap-2 p-2">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="البحث في الرسائل..."
              className="pr-9 pl-20"
              autoFocus
            />
            {searchResults.length > 0 && (
              <Badge 
                variant="secondary" 
                className="absolute left-2 top-1/2 -translate-y-1/2 text-xs"
              >
                {currentIndex + 1} / {searchResults.length}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={navigatePrev}
              disabled={searchResults.length === 0}
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={navigateNext}
              disabled={searchResults.length === 0}
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={handleClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* No results message */}
        {query.length >= 2 && searchResults.length === 0 && (
          <div className="px-4 pb-3 text-sm text-muted-foreground text-center">
            لا توجد نتائج للبحث
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default ChatSearch;
