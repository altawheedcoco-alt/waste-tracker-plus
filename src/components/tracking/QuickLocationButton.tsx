import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Send, 
  Loader2, 
  CheckCircle2, 
  MapPin,
  Navigation
} from 'lucide-react';

interface QuickLocationButtonProps {
  driverId: string;
  variant?: 'default' | 'icon' | 'fab';
  onSuccess?: (location: { lat: number; lng: number }) => void;
}

const QuickLocationButton = ({ 
  driverId, 
  variant = 'default',
  onSuccess 
}: QuickLocationButtonProps) => {
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const sendLocation = async () => {
    if (!driverId) {
      toast.error('لم يتم تحديد السائق');
      return;
    }

    setSending(true);
    setSuccess(false);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude, accuracy, speed, heading } = position.coords;

      const { error } = await supabase.from('driver_location_logs').insert({
        driver_id: driverId,
        latitude,
        longitude,
        accuracy,
        speed,
        heading,
        recorded_at: new Date().toISOString(),
      });

      if (error) throw error;

      setSuccess(true);
      toast.success('تم إرسال الموقع بنجاح');
      onSuccess?.({ lat: latitude, lng: longitude });

      // Reset success state after animation
      setTimeout(() => setSuccess(false), 2000);
    } catch (error: any) {
      console.error('Error sending location:', error);
      
      if (error.code === 1) { // PERMISSION_DENIED
        toast.error('يرجى السماح بالوصول للموقع من إعدادات المتصفح');
      } else if (error.code === 2) { // POSITION_UNAVAILABLE
        toast.error('معلومات الموقع غير متوفرة');
      } else if (error.code === 3) { // TIMEOUT
        toast.error('انتهت مهلة تحديد الموقع');
      } else {
        toast.error('فشل في إرسال الموقع');
      }
    } finally {
      setSending(false);
    }
  };

  if (variant === 'fab') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              onClick={sendLocation}
              disabled={sending}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              className={`
                fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] sm:bottom-6 left-[4rem] sm:left-[4.5rem] z-40
                w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-lg
                flex items-center justify-center
                transition-colors duration-200 touch-manipulation
                ${success 
                  ? 'bg-emerald-500 hover:bg-emerald-600' 
                  : 'bg-secondary hover:bg-secondary/90'
                }
                disabled:opacity-50
              `}
            >
              <AnimatePresence mode="wait">
                {sending ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  </motion.div>
                ) : success ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="send"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <Navigation className="h-6 w-6 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>إرسال موقعي</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'icon') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={sendLocation}
              disabled={sending}
              size="icon"
              variant={success ? 'default' : 'outline'}
              className={success ? 'bg-green-500 hover:bg-green-600' : ''}
            >
              <AnimatePresence mode="wait">
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </AnimatePresence>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>إرسال موقعي الحالي</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      onClick={sendLocation}
      disabled={sending}
      variant={success ? 'default' : 'outline'}
      className={`gap-2 ${success ? 'bg-green-500 hover:bg-green-600' : ''}`}
    >
      <AnimatePresence mode="wait">
        {sending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : success ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <MapPin className="h-4 w-4" />
        )}
      </AnimatePresence>
      {sending ? 'جاري الإرسال...' : success ? 'تم الإرسال' : 'إرسال موقعي'}
    </Button>
  );
};

export default QuickLocationButton;
