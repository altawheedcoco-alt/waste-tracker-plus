import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Users, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChat, ChatRoom, ChatMessage } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const ChatWidget = () => {
  const { user, profile } = useAuth();
  const {
    rooms,
    currentRoom,
    setCurrentRoom,
    messages,
    loading,
    sending,
    sendMessage,
    getOrCreateGeneralRoom,
  } = useChat();

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [view, setView] = useState<'rooms' | 'chat'>('rooms');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Join general room on open
  const handleOpen = async () => {
    setIsOpen(true);
    if (rooms.length === 0) {
      await getOrCreateGeneralRoom();
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    await sendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectRoom = (room: ChatRoom) => {
    setCurrentRoom(room);
    setView('chat');
  };

  const handleBack = () => {
    setCurrentRoom(null);
    setView('rooms');
  };

  const handleJoinGeneralChat = async () => {
    const room = await getOrCreateGeneralRoom();
    if (room) {
      setCurrentRoom(room);
      setView('chat');
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Chat Button */}
      <motion.button
        onClick={handleOpen}
        className="fixed bottom-24 left-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <MessageCircle size={24} />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 left-6 z-50 w-80 sm:w-96 h-[500px] bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {view === 'chat' && currentRoom && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                    onClick={handleBack}
                  >
                    <ArrowRight size={18} />
                  </Button>
                )}
                <MessageCircle size={20} />
                <span className="font-semibold">
                  {view === 'rooms' ? 'المحادثات' : currentRoom?.name || 'محادثة'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => setIsOpen(false)}
              >
                <X size={18} />
              </Button>
            </div>

            {/* Content */}
            {view === 'rooms' ? (
              <RoomsList
                rooms={rooms}
                loading={loading}
                onSelectRoom={handleSelectRoom}
                onJoinGeneral={handleJoinGeneralChat}
              />
            ) : (
              <ChatView
                messages={messages}
                currentUserId={user.id}
                messagesEndRef={messagesEndRef}
              />
            )}

            {/* Input (only in chat view) */}
            {view === 'chat' && currentRoom && (
              <div className="p-3 border-t border-border bg-muted/30">
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="اكتب رسالتك..."
                    className="flex-1"
                    disabled={sending}
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={sending || !inputValue.trim()}
                    className="shrink-0"
                  >
                    {sending ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Rooms List Component
const RoomsList = ({
  rooms,
  loading,
  onSelectRoom,
  onJoinGeneral,
}: {
  rooms: ChatRoom[];
  loading: boolean;
  onSelectRoom: (room: ChatRoom) => void;
  onJoinGeneral: () => void;
}) => {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-3 space-y-2">
        {/* Join General Chat Button */}
        <motion.button
          onClick={onJoinGeneral}
          className="w-full p-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors text-right flex items-center gap-3"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
            <Users size={20} />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm">المحادثة العامة</h4>
            <p className="text-xs text-muted-foreground">تواصل مع جميع الجهات</p>
          </div>
        </motion.button>

        {/* Existing Rooms */}
        {rooms.map((room) => (
          <motion.button
            key={room.id}
            onClick={() => onSelectRoom(room)}
            className="w-full p-3 rounded-xl bg-card border border-border hover:bg-muted/50 transition-colors text-right flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/20 text-primary">
                {room.name?.[0] || 'م'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{room.name || 'محادثة'}</h4>
              {room.lastMessage && (
                <p className="text-xs text-muted-foreground truncate">
                  {room.lastMessage.content}
                </p>
              )}
            </div>
            {room.lastMessage && (
              <span className="text-xs text-muted-foreground">
                {format(new Date(room.lastMessage.created_at), 'HH:mm', { locale: ar })}
              </span>
            )}
          </motion.button>
        ))}

        {rooms.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="mx-auto mb-2 opacity-50" size={32} />
            <p className="text-sm">لا توجد محادثات</p>
            <p className="text-xs">انضم للمحادثة العامة للبدء</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

// Chat View Component
const ChatView = ({
  messages,
  currentUserId,
  messagesEndRef,
}: {
  messages: ChatMessage[];
  currentUserId: string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}) => {
  return (
    <ScrollArea className="flex-1">
      <div className="p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="mx-auto mb-2 opacity-50" size={32} />
            <p className="text-sm">لا توجد رسائل</p>
            <p className="text-xs">ابدأ المحادثة الآن</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === currentUserId;
            
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isOwn ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`flex gap-2 max-w-[80%] ${isOwn ? 'flex-row' : 'flex-row-reverse'}`}>
                  {!isOwn && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={message.sender?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {message.sender?.full_name?.[0] || '؟'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    {!isOwn && message.sender && (
                      <p className="text-xs text-muted-foreground mb-1 text-right">
                        {message.sender.full_name}
                      </p>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isOwn
                          ? 'bg-primary text-primary-foreground rounded-tr-sm'
                          : 'bg-muted rounded-tl-sm'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <p className={`text-xs text-muted-foreground mt-1 ${isOwn ? 'text-left' : 'text-right'}`}>
                      {format(new Date(message.created_at), 'HH:mm', { locale: ar })}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};

export default ChatWidget;
