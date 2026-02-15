import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSupportTickets, useTicketMessages, SupportTicket, TicketStatus, TicketPriority } from '@/hooks/useSupportTickets';
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
  AlertCircle,
  User,
  Building2,
  Shield,
  Star,
  Loader2,
  MessageCircle,
  Lock,
  Timer,
} from 'lucide-react';

interface TicketDetailDialogProps {
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
  closed: { label: 'مغلقة', color: 'bg-gray-500' },
};

const priorityConfig: Record<TicketPriority, { label: string; color: string }> = {
  low: { label: 'منخفضة', color: 'bg-gray-500' },
  medium: { label: 'متوسطة', color: 'bg-blue-500' },
  high: { label: 'عالية', color: 'bg-orange-500' },
  urgent: { label: 'عاجلة', color: 'bg-red-500' },
};

const TicketDetailDialog = ({ ticketId, open, onOpenChange, onUpdate }: TicketDetailDialogProps) => {
  const { profile, roles } = useAuth();
  const isAdmin = roles.includes('admin');
  const { updateTicket, resolveTicket } = useSupportTickets();
  const { messages, isLoading: messagesLoading, sendMessage } = useTicketMessages(ticketId);
  
  const [newMessage, setNewMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle>تذكرة {ticket.ticket_number}</DialogTitle>
              <Badge className={`${statusConfig[ticket.status].color} text-white`}>
                {statusConfig[ticket.status].label}
              </Badge>
              <Badge className={`${priorityConfig[ticket.priority].color} text-white`}>
                {priorityConfig[ticket.priority].label}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Ticket Info */}
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-lg mb-2">{ticket.title}</h3>
            <p className="text-muted-foreground text-sm mb-3">{ticket.description}</p>
            
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {ticket.creator?.full_name || 'غير معروف'}
              </div>
              {ticket.organization && (
                <div className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {ticket.organization.name}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(ticket.created_at), 'dd/MM/yyyy hh:mm a', { locale: ar })}
              </div>
              {ticket.partner_organization && (
                <div className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  شريك: {ticket.partner_organization.name}
                </div>
              )}
            </div>

            {/* Resolution Notes */}
            {ticket.resolution_notes && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 font-medium mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  ملاحظات الحل
                </div>
                <p className="text-sm text-green-600">{ticket.resolution_notes}</p>
              </div>
            )}
          </div>

          {/* Admin Controls */}
          {isAdmin && ticket.status !== 'closed' && (
            <div className="flex flex-wrap gap-2 mb-4">
              <Select
                value={ticket.status}
                onValueChange={(value) => handleStatusChange(value as TicketStatus)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">مفتوحة</SelectItem>
                  <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                  <SelectItem value="waiting_response">في انتظار الرد</SelectItem>
                  <SelectItem value="resolved">تم الحل</SelectItem>
                  <SelectItem value="closed">مغلقة</SelectItem>
                </SelectContent>
              </Select>

              {!showResolveForm && ticket.status !== 'resolved' && (
                <Button 
                  variant="outline" 
                  className="text-green-600"
                  onClick={() => setShowResolveForm(true)}
                >
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                  حل التذكرة
                </Button>
              )}
            </div>
          )}

          {/* Resolve Form */}
          {showResolveForm && (
            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 mb-4">
              <h4 className="font-medium mb-2">إغلاق التذكرة</h4>
              <Textarea
                placeholder="اكتب ملاحظات الحل..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2 mt-2">
                <Button onClick={handleResolve} disabled={!resolutionNotes.trim()}>
                  حل وإغلاق
                </Button>
                <Button variant="outline" onClick={() => setShowResolveForm(false)}>
                  إلغاء
                </Button>
              </div>
            </div>
          )}

          {/* Rating Form */}
          {canRate && (
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 mb-4">
              <h4 className="font-medium mb-2">قيّم تجربتك</h4>
              <div className="flex items-center gap-2 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setRating(i + 1)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        i < rating
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-gray-300 hover:text-yellow-400'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="ملاحظاتك (اختياري)..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={2}
              />
              <Button onClick={handleRating} disabled={rating === 0} className="mt-2">
                إرسال التقييم
              </Button>
            </div>
          )}

          {/* Satisfaction Display */}
          {ticket.satisfaction_rating && (
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">تقييم العميل:</span>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < ticket.satisfaction_rating!
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              {ticket.satisfaction_feedback && (
                <p className="text-sm text-muted-foreground mt-1">{ticket.satisfaction_feedback}</p>
              )}
            </div>
          )}

          <Separator className="my-2" />

          {/* Messages */}
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-4 h-4" />
            <span className="font-medium">المحادثة</span>
            <span className="text-xs text-muted-foreground">({messages.length} رسالة)</span>
          </div>

          <ScrollArea className="flex-1 min-h-[200px] max-h-[300px] pr-4">
            {messagesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد رسائل بعد
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.is_from_admin ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.is_internal_note
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300'
                          : message.is_from_admin
                          ? 'bg-primary/10'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {message.is_from_admin ? (
                          <Shield className="w-3 h-3 text-primary" />
                        ) : (
                          <User className="w-3 h-3" />
                        )}
                        <span className="text-xs font-medium">
                          {message.sender?.full_name || 'مستخدم'}
                        </span>
                        {message.is_internal_note && (
                          <Badge variant="outline" className="text-[10px] py-0">
                            <Lock className="w-2 h-2 ml-1" />
                            ملاحظة داخلية
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.created_at), 'hh:mm a', { locale: ar })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Message Input */}
          {ticket.status !== 'closed' && (
            <div className="mt-4 space-y-2">
              {isAdmin && (
                <label className="flex items-center gap-2 text-sm">
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
                <Input
                  placeholder="اكتب رسالتك..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                />
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
      </DialogContent>
    </Dialog>
  );
};

export default TicketDetailDialog;
