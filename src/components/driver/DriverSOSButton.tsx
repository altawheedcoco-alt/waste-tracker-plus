import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertTriangle, Phone, MapPin, Car, HeartPulse,
  Shield, Loader2, CheckCircle2, Siren
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useImpactRecorder } from '@/hooks/useImpactRecorder';
import { notifyAdmins } from '@/services/unifiedNotifier';

interface DriverSOSButtonProps {
  driverId: string;
  organizationId: string;
  currentShipmentId?: string;
}

const emergencyTypes = [
  { type: 'accident', label: 'حادث مروري', icon: Car, color: 'bg-red-500/10 text-red-600 border-red-500/30' },
  { type: 'breakdown', label: 'عطل ميكانيكي', icon: AlertTriangle, color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  { type: 'security', label: 'تهديد أمني', icon: Shield, color: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
  { type: 'medical', label: 'طوارئ طبية', icon: HeartPulse, color: 'bg-pink-500/10 text-pink-600 border-pink-500/30' },
];

const DriverSOSButton = ({ driverId, organizationId, currentShipmentId }: DriverSOSButtonProps) => {
  const { toast } = useToast();
  const { recordEmergencySent } = useImpactRecorder();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSOS = useCallback(async () => {
    if (!selectedType) return;
    setIsSending(true);

    try {
      // Get current location
      let lat: number | undefined, lng: number | undefined, address: string | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        // Location unavailable — proceed without it
      }

      const { data: emergencyRow } = await supabase.from('driver_emergencies').insert({
        driver_id: driverId,
        organization_id: organizationId,
        emergency_type: selectedType,
        description: description || null,
        latitude: lat,
        longitude: lng,
        shipment_id: currentShipmentId || null,
      }).select('id').single();

      // Record impact event
      if (emergencyRow) {
        recordEmergencySent(emergencyRow.id, selectedType, {
          shipmentId: currentShipmentId,
          lat, lng,
        });
      }

      // إرسال مزدوج (داخلي + واتساب) للمشرفين
      const typeLabel = emergencyTypes.find(e => e.type === selectedType)?.label || selectedType;
      await notifyAdmins(
        `🚨 نداء طوارئ: ${typeLabel}`,
        `${description || typeLabel}${currentShipmentId ? `\nالشحنة: ${currentShipmentId}` : ''}${lat ? `\nالموقع: ${lat}, ${lng}` : ''}`,
        { type: 'emergency', organization_id: organizationId }
      );

      setIsSent(true);
      toast({
        title: '🚨 تم إرسال نداء الطوارئ',
        description: 'سيتم التواصل معك في أقرب وقت',
      });

      setTimeout(() => {
        setIsOpen(false);
        setIsSent(false);
        setSelectedType(null);
        setDescription('');
      }, 3000);

    } catch (error) {
      console.error('SOS error:', error);
      toast({ title: 'خطأ في الإرسال', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  }, [selectedType, description, driverId, organizationId, currentShipmentId, toast]);

  return (
    <>
      {/* Floating SOS Button */}
      <motion.div
        className="fixed bottom-24 left-4 z-40"
        whileTap={{ scale: 0.9 }}
      >
        <Button
          size="lg"
          variant="destructive"
          className="rounded-full w-14 h-14 p-0 shadow-lg shadow-red-500/30"
          onClick={() => setIsOpen(true)}
        >
          <Siren className="w-6 h-6" />
        </Button>
      </motion.div>

      {/* SOS Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Siren className="w-5 h-5" />
              نداء طوارئ
            </DialogTitle>
            <DialogDescription>اختر نوع الطوارئ وسنرسل إشعاراً فورياً للإدارة</DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {isSent ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
                <p className="font-bold text-lg">تم الإرسال بنجاح</p>
                <p className="text-sm text-muted-foreground">سيتم التواصل معك قريباً</p>
              </motion.div>
            ) : (
              <motion.div key="form" className="space-y-4">
                {/* Emergency Types */}
                <div className="grid grid-cols-2 gap-3">
                  {emergencyTypes.map((type) => (
                    <button
                      key={type.type}
                      onClick={() => setSelectedType(type.type)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        selectedType === type.type
                          ? `${type.color} border-current ring-2 ring-current/20`
                          : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <type.icon className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm font-semibold">{type.label}</p>
                    </button>
                  ))}
                </div>

                {/* Description */}
                <Textarea
                  placeholder="وصف إضافي (اختياري)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    className="flex-1 gap-2"
                    disabled={!selectedType || isSending}
                    onClick={handleSOS}
                  >
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Siren className="w-4 h-4" />}
                    {isSending ? 'جاري الإرسال...' : 'إرسال نداء الطوارئ'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Call emergency directly
                      window.open('tel:911', '_self');
                    }}
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DriverSOSButton;
