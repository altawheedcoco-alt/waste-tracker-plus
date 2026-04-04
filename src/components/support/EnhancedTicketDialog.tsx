import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSupportTickets, useTicketMessages, SupportTicket, TicketStatus, TicketPriority } from '@/hooks/useSupportTickets';
import { useQuickReplies } from '@/hooks/useQuickReplies';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Send,
  Clock,
  CheckCircle2,
  User,
  Building2,
  Shield,
  Star,
  Loader2,
  MessageCircle,
  Lock,
  Zap,
  Paperclip,
  Image,
} from 'lucide-react';
import QuickReplySelector from './QuickReplySelector';

interface EnhancedTicketDialogProps {
  ticketId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

const statusConfig: Record<TicketStatus, { label: string; color: string }> = {
  open: { label: 'مفتوحة', color: 'bg-blue-500' },
  in_progress: { label: 'قيد المعالجة', color: 'bg-yellow-500' },
  waiting_response: { label: 'في انتظار الرد', color: 'bg-orange-500' },
  resolved: { label: 'تم الحل', color: 'bg-green-500' },
  closed: { label: 'مغلقة', color: 'bg-muted-foreground' },
};

const priorityConfig: Record<TicketPriority, { label: string; color: string }> = {
  low: { label: 'منخفضة', color: 'bg-muted-foreground' },
  medium: { label: 'متوسطة', color: 'bg-blue-500' },
  high: { label: 'عالية', color: 'bg-orange-500' },
  urgent: { label: 'عاجلة', color: 'bg-red-500' },
};

const EnhancedTicketDialog = ({ ticketId, open, onOpenChange, onUpdate }: EnhancedTicketDialogProps) => {
  const { profile, roles } = useAuth();
  const isAdmin = roles.includes('admin');
  const { updateTicket, resolveTicket } = useSupportTickets();
  const { messages, isLoading: messagesLoading, sendMessage } = useTicketMessages(ticketId);
  const { findByShortcut } = useQuickReplies();
  
  const [newMessage, setNewMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch ticket details
  const { data: ticket, refetch: refetchTicket } = useQuery({
    queryKey: ['support-ticket', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          organization:organizations!support_tickets_organization_id_fkey(name, organization_type),
          partner_organization:organizations!support_tickets_partner_organization_id_fkey(name),
          creator:profiles!support_tickets_created_by_fkey(full_name),
          assignee:profiles!support_tickets_assigned_to_fkey(full_name)
        `)
        .eq('id', ticketId)
        .single();

      if (error) throw error;
      return data as SupportTicket;
    },
    enabled: !!ticketId && open,
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle shortcut expansion
  const handleMessageChange = (value: string) => {
    // Check for shortcut pattern
    const match = value.match(/^(\/\w+)\s*$/);
    if (match) {
      const shortcut = match[1];
      const reply = findByShortcut(shortcut);
      if (reply) {
        setNewMessage(reply.content);
        return;
      }
    }
    setNewMessage(value);
  };

  const handleQuickReplySelect = (content: string) => {
    setNewMessage(content);
    inputRef.current?.focus();
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    await sendMessage.mutateAsync({
      message: newMessage,
      isInternalNote,
    });
    
    setNewMessage('');
    setIsInternalNote(false);
  };

  const handleStatusChange = async (status: TicketStatus) => {
    await updateTicket.mutateAsync({
      id: ticketId,
      updates: { status },
    });
    refetchTicket();
    onUpdate();
  };

  const handleResolve = async () => {
    await resolveTicket.mutateAsync({
      id: ticketId,
      resolution_notes: resolutionNotes,
    });
    setShowResolveForm(false);
    refetchTicket();
    onUpdate();
  };

  const handleRating = async () => {
    await updateTicket.mutateAsync({
      id: ticketId,
      updates: {
        satisfaction_rating: rating,
        satisfaction_feedback: feedback,
      },
    });
    refetchTicket();
    onUpdate();
  };

  if (!ticket) return null;

  const canRate = ticket.status === 'resolved' && !ticket.satisfaction_rating && !isAdmin;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                تذكرة {ticket.ticket_number}
              </DialogTitle>
              <Badge className={`${statusConfig[ticket.status].color} text-white`}>
                {statusConfig[ticket.status].label}
              </Badge>
              <Badge className={`${priorityConfig[ticket.priority].color} text-white`}>
                {priorityConfig[ticket.priority].label}
              </Badge>
            </div>
            
            {/* Admin Controls */}
            {isAdmin && ticket.status !== 'closed' && (
              <div className="flex items-center gap-2">
                <Select
                  value={ticket.status}
                  onValueChange={(value) => handleStatusChange(value as TicketStatus)}
                >
                  <SelectTrigger className="w-[150px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">مفتوحة</SelectItem>
                    <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                    <SelectItem value="waiting_response">انتظار الرد</SelectItem>
                    <SelectItem value="resolved">تم الحل</SelectItem>
                    <SelectItem value="closed">مغلقة</SelectItem>
                  </SelectContent>
                </Select>
                
                {!showResolveForm && ticket.status !== 'resolved' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-green-600"
                    onClick={() => setShowResolveForm(true)}
                  >
                    <CheckCircle2 className="w-4 h-4 ml-1" />
                    حل
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Ticket Info Banner */}
            <div className="bg-muted/50 p-3 border-b">
              <h3 className="font-semibold mb-1">{ticket.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {ticket.creator?.full_name || 'غير معروف'}
                </span>
                {ticket.organization && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {ticket.organization.name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(ticket.created_at), 'dd/MM/yyyy hh:mm a', { locale: ar })}
                </span>
              </div>
            </div>

            {/* Resolve Form */}
            {showResolveForm && (
              <div className="bg-green-50 dark:bg-green-950/20 p-4 border-b">
                <h4 className="font-medium mb-2">إغلاق التذكرة</h4>
                <Textarea
                  placeholder="اكتب ملاحظات الحل..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={2}
                />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={handleResolve} disabled={!resolutionNotes.trim()}>
                    حل وإغلاق
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowResolveForm(false)}>
                    إلغاء
                  </Button>
                </div>
              </div>
            )}

            {/* Rating Form */}
            {canRate && (
              <div className="bg-amber-50 dark:bg-amber-950/20 p-4 border-b">
                <h4 className="font-medium mb-2">قيّم تجربتك</h4>
                <div className="flex items-center gap-2 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button key={i} onClick={() => setRating(i + 1)} className="focus:outline-none">
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 hover:text-yellow-400'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <Input
                  placeholder="ملاحظاتك (اختياري)..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
                <Button size="sm" onClick={handleRating} disabled={rating === 0} className="mt-2">
                  إرسال التقييم
                </Button>
              </div>
            )}

            {/* Satisfaction Display */}
            {ticket.satisfaction_rating && (
              <div className="bg-amber-50 dark:bg-amber-950/20 p-3 border-b">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">تقييم العميل:</span>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < ticket.satisfaction_rating! ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                      }`}
                    />
                  ))}
                  {ticket.satisfaction_feedback && (
                    <span className="text-sm text-muted-foreground mr-2">
                      - {ticket.satisfaction_feedback}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Resolution Notes */}
            {ticket.resolution_notes && (
              <div className="bg-green-50 dark:bg-green-950/20 p-3 border-b">
                <div className="flex items-center gap-2 text-green-700 font-medium text-sm mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  ملاحظات الحل
                </div>
                <p className="text-sm text-green-600">{ticket.resolution_notes}</p>
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>لا توجد رسائل بعد</p>
                  <p className="text-sm">ابدأ المحادثة الآن</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.is_from_admin ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl p-3 ${
                          message.is_internal_note
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300'
                            : message.is_from_admin
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {message.is_from_admin ? (
                            <Shield className="w-3 h-3" />
                          ) : (
                            <User className="w-3 h-3" />
                          )}
                          <span className="text-xs font-medium">
                            {message.sender?.full_name || 'مستخدم'}
                          </span>
                          {message.is_internal_note && (
                            <Badge variant="outline" className="text-[10px] py-0 bg-yellow-200">
                              <Lock className="w-2 h-2 ml-1" />
                              داخلي
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        <span className="text-[10px] opacity-70 mt-1 block">
                          {format(new Date(message.created_at), 'hh:mm a', { locale: ar })}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            {ticket.status !== 'closed' && (
              <div className="p-4 border-t bg-background">
                {isAdmin && (
                  <label className="flex items-center gap-2 text-xs mb-2">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="rounded"
                    />
                    <Lock className="w-3 h-3" />
                    ملاحظة داخلية (لن تظهر للعميل)
                  </label>
                )}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      placeholder={isAdmin ? "اكتب رسالتك أو استخدم /اختصار..." : "اكتب رسالتك..."}
                      value={newMessage}
                      onChange={(e) => handleMessageChange(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      className="pl-20"
                    />
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {isAdmin && (
                        <QuickReplySelector onSelect={handleQuickReplySelect} />
                      )}
                    </div>
                  </div>
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!newMessage.trim() || sendMessage.isPending}
                  >
                    {sendMessage.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedTicketDialog;
