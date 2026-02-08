import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCustomerAssistant } from '@/hooks/useCustomerAssistant';
import { useSupportTickets } from '@/hooks/useSupportTickets';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReactMarkdown from 'react-markdown';
import ConversationRatingDialog from './ConversationRatingDialog';
import CreateTicketDialog from '@/components/support/CreateTicketDialog';
import TicketDetailDialog from '@/components/support/TicketDetailDialog';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
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
  PhoneCall,
  Ticket,
  Navigation,
  Plus,
  Clock,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

interface UnifiedSupportWidgetProps {
  context?: {
    shipmentId?: string;
    ticketId?: string;
  };
}

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: 'مفتوحة', color: 'bg-blue-500' },
  in_progress: { label: 'قيد المعالجة', color: 'bg-yellow-500' },
  waiting_response: { label: 'انتظار الرد', color: 'bg-orange-500' },
  resolved: { label: 'تم الحل', color: 'bg-green-500' },
  closed: { label: 'مغلقة', color: 'bg-gray-500' },
};

const UnifiedSupportWidget = ({ context }: UnifiedSupportWidgetProps) => {
  const { roles } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'tickets'>('chat');
  const [input, setInput] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { 
    isLoading, 
    messages, 
    suggestions, 
    shouldEscalate, 
    showRating,
    sendMessage, 
    clearChat,
    submitRating,
    setShowRating
  } = useCustomerAssistant();
  
  const { tickets, isLoading: ticketsLoading, refetch } = useSupportTickets();
  
  const isAdmin = roles.includes('admin');
  const activeTickets = tickets.filter(t => t.status !== 'closed' && t.status !== 'resolved');
  const hasNotifications = activeTickets.length > 0 || messages.length > 0;

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input
  useEffect(() => {
    if (isOpen && activeTab === 'chat' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, activeTab]);

  // Don't show for admins
  if (isAdmin) return null;

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

  const handleAction = (action: { type: string; label: string; data?: any }) => {
    switch (action.type) {
      case 'call_support':
        window.open('tel:+201500045579', '_blank');
        break;
      case 'create_ticket':
        setShowCreateDialog(true);
        break;
      case 'navigate':
        if (action.data?.path) {
          window.location.href = action.data.path;
        }
        break;
      case 'track_shipment':
        window.location.href = '/dashboard/shipments';
        break;
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'call_support': return PhoneCall;
      case 'create_ticket': return Ticket;
      case 'navigate': return Navigation;
      case 'track_shipment': return Navigation;
      default: return Navigation;
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-emerald-500 text-white shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
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
              <Headphones className="h-6 w-6" />
              {hasNotifications && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">
                  {activeTickets.length + (messages.length > 0 ? 1 : 0)}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Widget Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 left-6 z-50 w-[380px] bg-background border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-emerald-500 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Headphones className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold flex items-center gap-1">
                      مركز المساعدة
                      <Sparkles className="h-3 w-3 text-amber-300" />
                    </h3>
                    <p className="text-xs opacity-80">AI + دعم بشري</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => {
                    if (activeTab === 'chat') clearChat();
                    else refetch();
                  }}
                  title={activeTab === 'chat' ? 'محادثة جديدة' : 'تحديث'}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Call Button */}
              <a 
                href="tel:+201500045579"
                className="mt-3 flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-sm font-medium"
              >
                <PhoneCall className="h-4 w-4" />
                اتصل الآن: 01500045579
              </a>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'chat' | 'tickets')}>
              <TabsList className="w-full rounded-none border-b bg-background h-10">
                <TabsTrigger value="chat" className="flex-1 gap-1 text-xs">
                  <Bot className="h-3 w-3" />
                  المساعد الذكي
                  {messages.length > 0 && (
                    <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                      {messages.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="tickets" className="flex-1 gap-1 text-xs">
                  <Ticket className="h-3 w-3" />
                  تذاكري
                  {activeTickets.length > 0 && (
                    <Badge variant="destructive" className="h-4 px-1 text-[10px]">
                      {activeTickets.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Chat Tab */}
              <TabsContent value="chat" className="m-0">
                <ScrollArea className="h-[280px] p-4" ref={scrollRef}>
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <Bot className="h-12 w-12 mx-auto mb-3 text-primary" />
                      <p className="font-medium">مرحباً! 👋</p>
                      <p className="text-sm text-muted-foreground">
                        كيف يمكنني مساعدتك اليوم؟
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center mt-4">
                        {['كيف أتتبع شحنتي؟', 'مشكلة تقنية', 'استفسار عام'].map((q, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleSuggestionClick(q)}
                          >
                            {q}
                          </Button>
                        ))}
                      </div>
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
                            
                            {/* Actions */}
                            {msg.role === 'assistant' && msg.actions && msg.actions.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-border/50">
                                {msg.actions.map((action, actionIdx) => {
                                  const Icon = getActionIcon(action.type);
                                  return (
                                    <Button
                                      key={actionIdx}
                                      size="sm"
                                      variant="secondary"
                                      className="h-6 text-xs"
                                      onClick={() => handleAction(action)}
                                    >
                                      <Icon className="w-3 h-3 ml-1" />
                                      {action.label}
                                    </Button>
                                  );
                                })}
                              </div>
                            )}
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
                      <span className="text-xs text-amber-700 dark:text-amber-300">
                        تم تصعيد طلبك للدعم
                      </span>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-6 text-xs"
                        onClick={() => setActiveTab('tickets')}
                      >
                        <Ticket className="h-3 w-3 ml-1" />
                        عرض التذكرة
                      </Button>
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {suggestions.length > 0 && messages.length > 0 && !isLoading && (
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
                <div className="p-3 border-t bg-background">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      placeholder="اكتب رسالتك..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      disabled={isLoading}
                      className="flex-1 h-9"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      size="icon"
                      className="h-9 w-9"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Tickets Tab */}
              <TabsContent value="tickets" className="m-0">
                <div className="p-3 border-b">
                  <Button
                    className="w-full h-9"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    إنشاء تذكرة دعم
                  </Button>
                </div>
                
                <ScrollArea className="h-[280px]">
                  {ticketsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">لا توجد تذاكر</p>
                      <p className="text-xs">المساعد الذكي سينشئ تذكرة تلقائياً عند الحاجة</p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-2">
                      {tickets.slice(0, 10).map((ticket) => (
                        <button
                          key={ticket.id}
                          onClick={() => setSelectedTicketId(ticket.id)}
                          className="w-full text-right p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge 
                                  className={`${statusConfig[ticket.status]?.color || 'bg-gray-500'} text-white text-[10px] px-1.5 py-0`}
                                >
                                  {statusConfig[ticket.status]?.label || ticket.status}
                                </Badge>
                                {ticket.priority === 'urgent' && (
                                  <AlertTriangle className="h-3 w-3 text-destructive" />
                                )}
                                {ticket.title?.includes('تصعيد من المساعد') && (
                                  <Badge variant="outline" className="text-[10px] py-0">
                                    <Bot className="h-2 w-2 ml-1" />
                                    تصعيد AI
                                  </Badge>
                                )}
                              </div>
                              <p className="font-medium text-sm line-clamp-1">{ticket.title}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {format(new Date(ticket.created_at), 'dd/MM HH:mm', { locale: ar })}
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialogs */}
      <ConversationRatingDialog
        open={showRating}
        onOpenChange={setShowRating}
        onSubmit={submitRating}
      />

      <CreateTicketDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          setShowCreateDialog(false);
          refetch();
          setActiveTab('tickets');
        }}
      />

      {selectedTicketId && (
        <TicketDetailDialog
          ticketId={selectedTicketId}
          open={!!selectedTicketId}
          onOpenChange={(open) => !open && setSelectedTicketId(null)}
          onUpdate={refetch}
        />
      )}
    </>
  );
};

export default UnifiedSupportWidget;
