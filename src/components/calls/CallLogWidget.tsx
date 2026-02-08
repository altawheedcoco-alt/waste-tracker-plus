import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Phone, Plus } from 'lucide-react';
import CallLogDialog from './CallLogDialog';

const CallLogWidget = () => {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <motion.button
        className="fixed bottom-44 left-6 z-40 w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
        onClick={() => setShowDialog(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="تسجيل مكالمة"
      >
        <div className="relative">
          <Phone className="h-5 w-5" />
          <Plus className="h-3 w-3 absolute -top-1 -right-1 bg-white text-blue-500 rounded-full" />
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
