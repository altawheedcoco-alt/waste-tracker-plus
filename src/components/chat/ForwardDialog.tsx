import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Send, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { PrivateConversation } from '@/hooks/usePrivateChat';

interface ForwardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  messageContent: string;
  conversations: PrivateConversation[];
  onForward: (conversationIds: string[]) => Promise<void>;
  currentUserId?: string;
}

const ForwardDialog = memo(({ isOpen, onClose, messageContent, conversations, onForward, currentUserId }: ForwardDialogProps) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);

  const filtered = conversations.filter(c =>
    !search || c.partner?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.partner?.organization_name?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleForward = async () => {
    if (selected.size === 0) return;
    setSending(true);
    try {
      await onForward(Array.from(selected));
      toast.success(`تم التوجيه إلى ${selected.size} محادثة`);
      setSelected(new Set());
      setSearch('');
      onClose();
    } catch {
      toast.error('فشل التوجيه');
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed inset-x-4 bottom-4 top-auto z-50 max-h-[70vh] bg-card rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[380px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border">
              <h3 className="font-semibold text-sm">توجيه إلى...</h3>
              <div className="flex items-center gap-2">
                {selected.size > 0 && (
                  <span className="text-xs text-primary font-medium">{selected.size} محادثة</span>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Preview */}
            <div className="px-3 py-2 bg-muted/30 border-b border-border">
              <p className="text-xs text-muted-foreground truncate">
                📩 {messageContent.substring(0, 80)}{messageContent.length > 80 ? '...' : ''}
              </p>
            </div>

            {/* Search */}
            <div className="px-3 py-2">
              <div className="relative">
                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="بحث عن محادثة..."
                  className="h-8 text-xs pr-8"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1 max-h-[300px]">
              <div className="px-1">
                {filtered.map(convo => {
                  const isSelected = selected.has(convo.id);
                  return (
                    <button
                      key={convo.id}
                      onClick={() => toggleSelect(convo.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors",
                        isSelected ? "bg-primary/10" : "hover:bg-muted/50"
                      )}
                    >
                      <div className="relative">
                        <Avatar className="w-9 h-9">
                          {convo.partner?.avatar_url && <AvatarImage src={convo.partner.avatar_url} />}
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {convo.partner?.full_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center"
                          >
                            <Check className="w-2.5 h-2.5 text-primary-foreground" />
                          </motion.div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <p className="text-sm font-medium truncate">{convo.partner?.full_name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{convo.partner?.organization_name}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Send Button */}
            {selected.size > 0 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="p-3 border-t border-border"
              >
                <Button
                  onClick={handleForward}
                  disabled={sending}
                  className="w-full gap-2"
                >
                  <Send className="w-4 h-4" />
                  توجيه إلى {selected.size} محادثة
                </Button>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

ForwardDialog.displayName = 'ForwardDialog';
export default ForwardDialog;
