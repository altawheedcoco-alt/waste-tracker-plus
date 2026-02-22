import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getTabChannelName } from '@/lib/tabSession';
import { playNotificationSound, mapNotificationTypeToSound } from '@/hooks/useNotificationSound';

interface LiveNotification {
  id: string;
  title: string;
  message: string;
  type: string | null;
  created_at: string;
  shipment_id?: string | null;
  request_id?: string | null;
}

const TYPE_ICONS: Record<string, string> = {
  shipment_created: '📦',
  status_update: '🔄',
  recycling_report: '♻️',
  approval_request: '✅',
  partner_post: '📢',
  partner_note: '📝',
  partner_message: '💬',
  document_uploaded: '📄',
};

const TYPE_COLORS: Record<string, string> = {
  shipment_created: 'border-l-blue-500',
  status_update: 'border-l-amber-500',
  recycling_report: 'border-l-green-500',
  approval_request: 'border-l-purple-500',
  partner_post: 'border-l-pink-500',
  partner_note: 'border-l-cyan-500',
  partner_message: 'border-l-indigo-500',
  document_uploaded: 'border-l-orange-500',
};

const LiveEventToast = () => {
  const [events, setEvents] = useState<LiveNotification[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(getTabChannelName('live-event-toast'))
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newEvent = payload.new as LiveNotification;
          setEvents(prev => [newEvent, ...prev].slice(0, 5));

          // Play notification sound based on type
          const soundType = mapNotificationTypeToSound(newEvent.type);
          playNotificationSound(soundType);

          // Auto-dismiss after 8 seconds
          setTimeout(() => {
            setEvents(prev => prev.filter(e => e.id !== newEvent.id));
          }, 8000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const dismissEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const handleClick = (event: LiveNotification) => {
    dismissEvent(event.id);
    if (event.shipment_id) {
      navigate(`/dashboard/shipments/${event.shipment_id}`);
    } else if (event.request_id) {
      navigate(`/dashboard/my-requests`);
    } else {
      navigate('/dashboard/notifications');
    }
  };

  return (
    <div className="fixed top-4 left-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {events.map((event) => {
          const icon = TYPE_ICONS[event.type || ''] || '🔔';
          const borderColor = TYPE_COLORS[event.type || ''] || 'border-l-primary';

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -100, scale: 0.8 }}
              transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
              className={`pointer-events-auto bg-card/95 backdrop-blur-md border border-border ${borderColor} border-l-4 rounded-lg shadow-xl p-3 cursor-pointer hover:shadow-2xl transition-shadow group`}
              onClick={() => handleClick(event)}
            >
              <div className="flex items-start gap-3">
                <div className="text-xl mt-0.5">{icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-foreground truncate">
                      {event.title}
                    </h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissEvent(event.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {event.message}
                  </p>
                  <div className="flex items-center gap-1 mt-1.5 text-[10px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-3 h-3" />
                    <span>عرض التفاصيل</span>
                  </div>
                </div>
              </div>
              {/* Progress bar for auto-dismiss */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 8, ease: 'linear' }}
                className="absolute bottom-0 left-0 h-0.5 bg-primary/40 rounded-b-lg"
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default LiveEventToast;
