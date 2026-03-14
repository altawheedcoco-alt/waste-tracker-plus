import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Building2, Truck, Recycle, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChat, ChatMessage } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Partner {
  id: string;
  name: string;
  organization_type: string;
  logo_url: string | null;
}

const ChatWidget = () => {
  const { user, organization } = useAuth();
  const {
    messages,
    loading,
    sending,
    sendMessage,
    fetchMessagesForPartner,
  } = useChat();

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [view, setView] = useState<'partners' | 'chat'>('partners');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch partners on open
  const fetchPartners = async () => {
    if (!organization?.id) return;
    
    setLoadingPartners(true);
    try {
      const { data: shipments } = await supabase
        .from('shipments')
        .select('generator_id, transporter_id, recycler_id')
        .or(`generator_id.eq.${organization.id},transporter_id.eq.${organization.id},recycler_id.eq.${organization.id}`);

      const partnerIds = new Set<string>();
      shipments?.forEach(shipment => {
        if (shipment.generator_id && shipment.generator_id !== organization.id) {
          partnerIds.add(shipment.generator_id);
        }
        if (shipment.transporter_id && shipment.transporter_id !== organization.id) {
          partnerIds.add(shipment.transporter_id);
        }
        if (shipment.recycler_id && shipment.recycler_id !== organization.id) {
          partnerIds.add(shipment.recycler_id);
        }
      });

      if (partnerIds.size > 0) {
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, name, organization_type, logo_url')
          .in('id', Array.from(partnerIds))
          .order('name');
        
        setPartners((orgs || []) as Partner[]);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoadingPartners(false);
    }
  };

  const handleOpen = async () => {
    setIsOpen(true);
    await fetchPartners();
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !selectedPartner) return;
    await sendMessage(inputValue.trim(), selectedPartner.id);
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectPartner = async (partner: Partner) => {
    setSelectedPartner(partner);
    setView('chat');
    await fetchMessagesForPartner(partner.id);
  };

  const handleBack = () => {
    setSelectedPartner(null);
    setView('partners');
  };

  const getOrgTypeIcon = (type: string) => {
    switch (type) {
      case 'generator': return Building2;
      case 'transporter': return Truck;
      case 'recycler': return Recycle;
      default: return Building2;
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Chat Button - Responsive positioning with safe area support */}
      <motion.button
        onClick={handleOpen}
        className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] sm:bottom-4 left-3 sm:left-4 z-40 w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors touch-manipulation"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="فتح المحادثات"
      >
        <MessageCircle className="w-4 h-4 sm:w-6 sm:h-6" />
      </motion.button>

      {/* Chat Window - Full width on mobile with proper spacing */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] sm:bottom-20 left-2 right-2 sm:right-auto sm:left-4 z-50 sm:w-96 h-[50vh] sm:h-[500px] max-h-[500px] bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {view === 'chat' && selectedPartner && (
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
                  {view === 'partners' ? 'المحادثات' : selectedPartner?.name || 'محادثة'}
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
            {view === 'partners' ? (
              <PartnersList
                partners={partners}
                loading={loadingPartners}
                onSelectPartner={handleSelectPartner}
                getOrgTypeIcon={getOrgTypeIcon}
              />
            ) : (
              <ChatView
                messages={messages}
                currentUserId={user.id}
                messagesEndRef={messagesEndRef}
              />
            )}

            {/* Input (only in chat view) */}
            {view === 'chat' && selectedPartner && (
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

// Partners List Component
const PartnersList = ({
  partners,
  loading,
  onSelectPartner,
  getOrgTypeIcon,
}: {
  partners: Partner[];
  loading: boolean;
  onSelectPartner: (partner: Partner) => void;
  getOrgTypeIcon: (type: string) => any;
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
        {partners.map((partner) => {
          const Icon = getOrgTypeIcon(partner.organization_type);
          return (
            <motion.button
              key={partner.id}
              onClick={() => onSelectPartner(partner)}
              className="w-full p-3 rounded-xl bg-card border border-border hover:bg-muted/50 transition-colors text-right flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {partner.logo_url ? (
                  <Avatar className="w-full h-full">
                    <AvatarImage src={partner.logo_url} />
                    <AvatarFallback><Icon size={20} className="text-primary" /></AvatarFallback>
                  </Avatar>
                ) : (
                  <Icon size={20} className="text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">{partner.name}</h4>
              </div>
            </motion.button>
          );
        })}

        {partners.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="mx-auto mb-2 opacity-50" size={32} />
            <p className="text-sm">لا توجد جهات مرتبطة للتواصل</p>
            <p className="text-xs">الجهات المرتبطة تظهر عند إنشاء شحنات مشتركة</p>
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
                      {format(new Date(message.created_at), 'hh:mm a', { locale: ar })}
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
