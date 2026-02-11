import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Play,
  QrCode,
  Camera,
  CheckCircle2,
  Truck,
  MapPin,
  Loader2,
  Package,
  Mic,
} from 'lucide-react';
import { mapToDbStatus, getStatusConfig, ShipmentStatus } from '@/lib/shipmentStatusConfig';
import VoiceToTextInput from './VoiceToTextInput';
import ShipmentImageAnalyzer from './ShipmentImageAnalyzer';

interface ShipmentInfo {
  id: string;
  shipment_number: string;
  status: string;
  waste_type?: string;
  quantity?: number;
  pickup_location?: string;
  delivery_location?: string;
  generator_id?: string;
}

interface DriverActionUIProps {
  shipment: ShipmentInfo;
  onActionComplete?: () => void;
  onScanQR?: () => void;
}

interface StageAction {
  key: string;
  nextStatus: string;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
  requiresPhoto?: boolean;
  requiresQR?: boolean;
}

const DriverActionUI = ({ shipment, onActionComplete, onScanQR }: DriverActionUIProps) => {
  const { profile, organization } = useAuth();
  const [loading, setLoading] = useState(false);
  const [voiceNotes, setVoiceNotes] = useState('');
  const [showVoice, setShowVoice] = useState(false);
  const [showImageAI, setShowImageAI] = useState(false);

  const currentAction: StageAction | null = useMemo(() => {
    const statusMap: Record<string, StageAction> = {
      approved: {
        key: 'start_trip',
        nextStatus: 'in_transit',
        label: 'بدء الرحلة',
        icon: Play,
        color: 'bg-emerald-500 hover:bg-emerald-600',
        description: 'ابدأ بمسح كود الاستلام من المولد',
        requiresQR: true,
      },
      in_transit: {
        key: 'arrive',
        nextStatus: 'delivered',
        label: 'تأكيد الوصول والتسليم',
        icon: MapPin,
        color: 'bg-blue-500 hover:bg-blue-600',
        description: 'امسح كود التسليم عند الوصول لموقع الاستلام',
        requiresQR: true,
        requiresPhoto: true,
      },
      delivered: {
        key: 'confirm',
        nextStatus: 'confirmed',
        label: 'تأكيد إتمام التسليم',
        icon: CheckCircle2,
        color: 'bg-purple-500 hover:bg-purple-600',
        description: 'انتظر تأكيد جهة الاستلام',
      },
    };
    return statusMap[shipment.status] || null;
  }, [shipment.status]);

  const statusConfig = getStatusConfig(shipment.status);

  const handleMainAction = async () => {
    if (!currentAction) return;

    if (currentAction.requiresQR && onScanQR) {
      onScanQR();
      return;
    }

    setLoading(true);
    try {
      const dbStatus = mapToDbStatus(currentAction.nextStatus as ShipmentStatus);
      const now = new Date().toISOString();
      const updateData: Record<string, any> = { status: dbStatus };

      const timestamps: Record<string, string> = {
        in_transit: 'in_transit_at',
        delivered: 'delivered_at',
        confirmed: 'confirmed_at',
      };
      if (timestamps[dbStatus]) updateData[timestamps[dbStatus]] = now;

      const { error } = await supabase
        .from('shipments')
        .update(updateData as any)
        .eq('id', shipment.id);

      if (error) throw error;

      // Log the action
      await supabase.from('shipment_logs').insert({
        shipment_id: shipment.id,
        status: dbStatus as any,
        notes: voiceNotes || `تم تنفيذ: ${currentAction.label}`,
        changed_by: profile?.id,
      });

      toast.success(`✅ ${currentAction.label}`);
      onActionComplete?.();
    } catch (err: any) {
      console.error('Action error:', err);
      toast.error(`خطأ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isCompleted = ['confirmed', 'completed', 'cancelled'].includes(shipment.status);

  return (
    <Card className="overflow-hidden border-2" dir="rtl">
      <CardContent className="p-0">
        {/* Status Header */}
        <div className={cn(
          'p-4 text-white',
          isCompleted ? 'bg-emerald-600' :
          shipment.status === 'in_transit' ? 'bg-blue-600' :
          shipment.status === 'approved' ? 'bg-amber-600' :
          'bg-muted-foreground'
        )}>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="bg-white/20 text-white border-0">
              {shipment.shipment_number}
            </Badge>
            <div className="flex items-center gap-2">
              {statusConfig && <statusConfig.icon className="h-5 w-5" />}
              <span className="font-bold text-lg">{statusConfig?.labelAr || shipment.status}</span>
            </div>
          </div>
          {shipment.waste_type && (
            <div className="mt-2 flex items-center gap-2 text-sm text-white/80">
              <Package className="h-4 w-4" />
              <span>{shipment.waste_type}</span>
              {shipment.quantity && <span>• {shipment.quantity} كجم</span>}
            </div>
          )}
        </div>

        {/* Main Action Area */}
        <div className="p-4 space-y-4">
          {currentAction ? (
            <>
              {/* Action Description */}
              <p className="text-sm text-muted-foreground text-center">
                {currentAction.description}
              </p>

              {/* Main Action Button - BIG */}
              <Button
                size="lg"
                onClick={handleMainAction}
                disabled={loading}
                className={cn(
                  'w-full h-20 text-xl font-bold gap-3 rounded-2xl text-white shadow-lg',
                  currentAction.color
                )}
              >
                {loading ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <currentAction.icon className="h-8 w-8" />
                )}
                {currentAction.label}
              </Button>

              {/* Quick tools row */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVoice(!showVoice)}
                  className="gap-2 h-12"
                >
                  <Mic className="h-4 w-4" />
                  ملاحظة صوتية
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImageAI(!showImageAI)}
                  className="gap-2 h-12"
                >
                  <Camera className="h-4 w-4" />
                  تحليل صورة
                </Button>
              </div>

              {/* Voice input */}
              {showVoice && (
                <div className="space-y-2">
                  <VoiceToTextInput
                    onTranscription={(text) => setVoiceNotes(prev => prev ? `${prev}\n${text}` : text)}
                    label="سجل ملاحظاتك صوتياً"
                  />
                  {voiceNotes && (
                    <Textarea
                      value={voiceNotes}
                      onChange={(e) => setVoiceNotes(e.target.value)}
                      placeholder="الملاحظات المحولة من الصوت..."
                      className="text-right min-h-[60px]"
                      dir="rtl"
                    />
                  )}
                </div>
              )}

              {/* Image analyzer */}
              {showImageAI && (
                <ShipmentImageAnalyzer
                  onAnalysis={(result) => {
                    if (result.description) {
                      setVoiceNotes(prev => prev ? `${prev}\n📸 ${result.description}` : `📸 ${result.description}`);
                    }
                  }}
                />
              )}
            </>
          ) : isCompleted ? (
            <div className="text-center py-8 space-y-2">
              <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-500" />
              <p className="text-lg font-bold text-emerald-700">تم إتمام المهمة بنجاح</p>
              <p className="text-sm text-muted-foreground">الشحنة مكتملة</p>
            </div>
          ) : (
            <div className="text-center py-8 space-y-2">
              <Truck className="h-16 w-16 mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground">في انتظار الموافقة</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DriverActionUI;
