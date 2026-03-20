import { Lock, Sparkles, Construction } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Overlay shown when generator's shipment creation is frozen by admin.
 * Covers the form/dialog content with a "under development" message.
 */
const ShipmentCreationFrozenOverlay = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg"
      dir="rtl"
    >
      <div className="text-center space-y-4 p-8 max-w-sm">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Construction className="w-8 h-8 text-amber-500" />
        </div>
        <h3 className="text-lg font-bold text-foreground">
          قيد التطوير
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          خاصية إنشاء الشحنات للجهات المولدة قيد التطوير حالياً.
          <br />
          سيتم تفعيلها من قبل إدارة المنصة قريباً.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs border">
          <Lock className="w-3 h-3" />
          مجمّد بواسطة مدير النظام
        </div>
      </div>
    </motion.div>
  );
};

export default ShipmentCreationFrozenOverlay;
