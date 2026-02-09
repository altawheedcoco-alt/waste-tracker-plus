import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Phone, Plus } from 'lucide-react';
import CallLogDialog from './CallLogDialog';

const CallLogWidget = () => {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      {/* Floating Button - Responsive positioning to avoid overlap */}
      <motion.button
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] sm:bottom-36 left-3 sm:left-6 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center touch-manipulation"
        onClick={() => setShowDialog(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="تسجيل مكالمة"
      >
        <div className="relative">
          <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
          <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3 absolute -top-1 -right-1 bg-white text-blue-500 rounded-full" />
        </div>
      </motion.button>

      {/* Dialog */}
      <CallLogDialog
        open={showDialog}
        onOpenChange={setShowDialog}
      />
    </>
  );
};

export default CallLogWidget;
