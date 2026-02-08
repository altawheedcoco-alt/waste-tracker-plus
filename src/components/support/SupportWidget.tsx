import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupportTickets, SupportTicket } from '@/hooks/useSupportTickets';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Headphones,
  X,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle2,
  Loader2,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import CreateTicketDialog from './CreateTicketDialog';
import TicketDetailDialog from './TicketDetailDialog';

const statusConfig = {
  open: { label: 'مفتوحة', color: 'bg-blue-500' },
  in_progress: { label: 'قيد المعالجة', color: 'bg-yellow-500' },
  waiting_response: { label: 'انتظار الرد', color: 'bg-orange-500' },
  resolved: { label: 'تم الحل', color: 'bg-green-500' },
  closed: { label: 'مغلقة', color: 'bg-gray-500' },
};

const priorityColors = {
  low: 'text-gray-500',
  medium: 'text-blue-500',
  high: 'text-orange-500',
  urgent: 'text-red-500',
};

const SupportWidget = () => {
  const { roles } = useAuth();
  const isAdmin = roles.includes('admin');
  const { tickets, isLoading, refetch } = useSupportTickets();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Don't show widget for admins (they have full support center)
  if (isAdmin) return null;

  const activeTickets = tickets.filter(t => t.status !== 'closed' && t.status !== 'resolved');
  const hasUnread = activeTickets.some(t => t.status === 'waiting_response');

  return (
    <>
      {/* Floating Button */}
      <motion.button
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
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
              key="support"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              className="relative"
            >
              <Headphones className="h-6 w-6" />
              {activeTickets.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                  {activeTickets.length}
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
            className="fixed bottom-24 left-6 z-50 w-[360px] bg-background border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary text-primary-foreground p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Headphones className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">الدعم الفني</h3>
                  <p className="text-xs opacity-80">نحن هنا لمساعدتك</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <Button
                className="w-full mb-4"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="h-4 w-4 ml-2" />
                إنشاء تذكرة جديدة
              </Button>

              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">تذاكري</span>
                <Badge variant="secondary">{tickets.length}</Badge>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">لا توجد تذاكر</p>
                  <p className="text-xs">أنشئ تذكرة جديدة للتواصل معنا</p>
                </div>
              ) : (
                <ScrollArea className="h-[250px]">
                  <div className="space-y-2">
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
                                className={`${statusConfig[ticket.status].color} text-white text-[10px] px-1.5 py-0`}
                              >
                                {statusConfig[ticket.status].label}
                              </Badge>
                              {ticket.priority === 'urgent' && (
                                <AlertTriangle className="h-3 w-3 text-red-500" />
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
                </ScrollArea>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialogs */}
      <CreateTicketDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          setShowCreateDialog(false);
          refetch();
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

export default SupportWidget;
