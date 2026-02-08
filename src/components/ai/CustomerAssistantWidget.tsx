import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCustomerAssistant } from '@/hooks/useCustomerAssistant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  Headphones,
  RefreshCw,
} from 'lucide-react';

interface CustomerAssistantWidgetProps {
  context?: {
    shipmentId?: string;
    ticketId?: string;
  };
}

const CustomerAssistantWidget = ({ context }: CustomerAssistantWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { isLoading, messages, suggestions, shouldEscalate, sendMessage, clearChat } = useCustomerAssistant();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const message = input;
    setInput('');
    await sendMessage(message, context);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setInput('');
    await sendMessage(suggestion, context);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        className="fixed bottom-24 left-6 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              className="relative"
            >
              <Bot className="h-6 w-6" />
              <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-amber-300" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-44 left-6 z-40 w-[360px] bg-background border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold flex items-center gap-1">
                      المساعد الذكي
                      <Sparkles className="h-3 w-3 text-amber-300" />
                    </h3>
                    <p className="text-xs opacity-80">هنا لمساعدتك 24/7</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={clearChat}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="h-[300px] p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
                  <p className="font-medium">مرحباً! 👋</p>
                  <p className="text-sm text-muted-foreground">
                    كيف يمكنني مساعدتك اليوم؟
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-3 ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted rounded-bl-md'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {msg.role === 'user' ? (
                            <User className="h-3 w-3" />
                          ) : (
                            <Bot className="h-3 w-3" />
                          )}
                          <span className="text-[10px] opacity-70">
                            {msg.role === 'user' ? 'أنت' : 'المساعد'}
                          </span>
                        </div>
                        <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-muted rounded-2xl rounded-bl-md p-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">جاري الكتابة...</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Escalation Alert */}
            {shouldEscalate && (
              <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-amber-700">
                    هل تحتاج مساعدة بشرية؟
                  </span>
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    <Headphones className="h-3 w-3 ml-1" />
                    تحدث مع الدعم
                  </Button>
                </div>
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && messages.length > 0 && (
              <div className="px-4 py-2 border-t">
                <div className="flex flex-wrap gap-1">
                  {suggestions.slice(0, 3).map((suggestion, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10 text-xs"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t bg-background">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  placeholder="اكتب رسالتك..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CustomerAssistantWidget;
