import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, Plus } from 'lucide-react';
import CallLogDialog from './CallLogDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const CallLogWidget = () => {
  const [showDialog, setShowDialog] = useState(false);
  const { user, organization } = useAuth();
  const [missedCount, setMissedCount] = useState(0);

  // Fetch missed calls count
  useEffect(() => {
    if (!organization?.id || !user?.id) return;

    const fetchMissed = async () => {
      const { count } = await supabase
        .from('call_records')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_org_id', organization.id)
        .neq('caller_id', user.id)
        .in('status', ['missed', 'rejected', 'busy']);

      setMissedCount(count || 0);
    };

    fetchMissed();

    // Realtime subscription for new calls
    const channel = supabase
      .channel('call-log-widget-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'call_records',
        filter: `receiver_org_id=eq.${organization.id}`,
      }, () => {
        fetchMissed();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [organization?.id, user?.id]);

  return (
    <>
      <motion.button
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] sm:bottom-36 left-3 sm:left-6 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center touch-manipulation"
        onClick={() => setShowDialog(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="تسجيل مكالمة"
      >
        <div className="relative">
          <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
          <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3 absolute -top-1 -right-1 bg-white text-blue-500 rounded-full" />
        </div>
        {missedCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full border-2 border-background">
            {missedCount > 99 ? '99+' : missedCount}
          </span>
        )}
      </motion.button>

      <CallLogDialog open={showDialog} onOpenChange={setShowDialog} />
    </>
  );
};

export default CallLogWidget;
