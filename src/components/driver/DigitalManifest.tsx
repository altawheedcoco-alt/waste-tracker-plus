import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  QrCode, FileText, CheckCircle2, Clock, Truck,
  MapPin, User, Scale, Shield, Copy, Share2, Printer
} from 'lucide-react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '@/hooks/use-toast';

interface DigitalManifestProps {
  shipment?: {
    id: string;
    shipment_number: string;
    waste_type: string;
    quantity: number;
    unit: string;
    status: string;
    pickup_address: string;
    delivery_address: string;
    generator?: { name: string } | null;
    recycler?: { name: string } | null;
    transporter?: { name: string } | null;
  };
  driverId: string;
}

interface ManifestStep {
  id: string;
  label: string;
  icon: any;
  status: 'completed' | 'current' | 'pending';
  timestamp?: string;
  actor?: string;
  location?: string;
}

const DigitalManifest = ({ shipment, driverId }: DigitalManifestProps) => {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);

  const steps: ManifestStep[] = useMemo(() => {
    if (!shipment) return [];
    const statusOrder = ['new', 'approved', 'in_transit', 'delivered', 'confirmed'];
    const currentIdx = statusOrder.indexOf(shipment.status);

    return [
      {
        id: 'generated',
        label: 'إنشاء المانيفست',
        icon: FileText,
        status: currentIdx >= 0 ? 'completed' : 'pending',
        actor: shipment.generator?.name || 'المولد',
        location: shipment.pickup_address,
      },
      {
        id: 'approved',
        label: 'اعتماد الناقل',
        icon: Shield,
        status: currentIdx >= 1 ? 'completed' : currentIdx === 0 ? 'current' : 'pending',
        actor: shipment.transporter?.name || 'الناقل',
      },
      {
        id: 'pickup',
        label: 'استلام الحمولة',
        icon: Scale,
        status: currentIdx >= 2 ? 'completed' : currentIdx === 1 ? 'current' : 'pending',
        actor: 'السائق',
        location: shipment.pickup_address,
      },
      {
        id: 'transit',
        label: 'في الطريق',
        icon: Truck,
        status: currentIdx >= 2 ? (currentIdx === 2 ? 'current' : 'completed') : 'pending',
      },
      {
        id: 'delivery',
        label: 'تسليم الحمولة',
        icon: MapPin,
        status: currentIdx >= 3 ? 'completed' : currentIdx === 2 ? 'current' : 'pending',
        actor: shipment.recycler?.name || 'المستلم',
        location: shipment.delivery_address,
      },
      {
        id: 'confirmed',
        label: 'تأكيد الاستلام',
        icon: CheckCircle2,
        status: currentIdx >= 4 ? 'completed' : currentIdx === 3 ? 'current' : 'pending',
        actor: shipment.recycler?.name || 'المستلم',
      },
    ];
  }, [shipment]);

  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const progress = (completedSteps / steps.length) * 100;

  const manifestData = shipment ? JSON.stringify({
    id: shipment.id,
    num: shipment.shipment_number,
    type: shipment.waste_type,
    qty: `${shipment.quantity} ${shipment.unit}`,
    from: shipment.generator?.name,
    to: shipment.recycler?.name,
    driver: driverId,
    ts: new Date().toISOString(),
  }) : '';

  const copyManifestId = () => {
    if (shipment) {
      navigator.clipboard.writeText(shipment.shipment_number);
      toast({ title: 'تم نسخ رقم المانيفست ✅' });
    }
  };

  if (!shipment) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <QrCode className="w-16 h-16 mx-auto mb-3 text-muted-foreground/20" />
          <p className="font-semibold">لا توجد شحنة محددة</p>
          <p className="text-sm text-muted-foreground mt-1">اختر شحنة من قائمة المهام لعرض المانيفست الرقمي</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Manifest Header */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <QrCode className="w-5 h-5 text-primary" />
            المانيفست الرقمي الموحد
            <Badge variant="outline" className="text-[10px] mr-auto gap-1">
              <Shield className="w-3 h-3" />
              مشفر
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* QR + Info */}
          <div className="flex gap-4 items-start">
            <div className="bg-white p-2 rounded-lg border shadow-sm">
              <QRCodeSVG value={manifestData} size={100} level="M" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">رقم المانيفست:</span>
                <button onClick={copyManifestId} className="flex items-center gap-1 text-sm font-mono font-bold text-primary hover:underline">
                  {shipment.shipment_number}
                  <Copy className="w-3 h-3" />
                </button>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>🗑️ {shipment.waste_type} — {shipment.quantity} {shipment.unit}</p>
                <p>📤 {shipment.generator?.name || 'المولد'}</p>
                <p>📥 {shipment.recycler?.name || 'المستلم'}</p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>تقدم سلسلة الحيازة</span>
              <span>{completedSteps}/{steps.length}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Chain of Custody Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Truck className="w-4 h-4 text-primary" />
            سلسلة الحيازة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="flex gap-3 pb-4 last:pb-0"
                >
                  {/* Timeline Line + Dot */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      step.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
                      : step.status === 'current' ? 'bg-primary/10 border-primary text-primary animate-pulse'
                      : 'bg-muted border-muted-foreground/20 text-muted-foreground/40'
                    }`}>
                      <StepIcon className="w-4 h-4" />
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`w-0.5 flex-1 my-1 ${
                        step.status === 'completed' ? 'bg-emerald-500/50' : 'bg-muted-foreground/10'
                      }`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <p className={`text-sm font-semibold ${
                      step.status === 'completed' ? '' : step.status === 'current' ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {step.label}
                      {step.status === 'completed' && ' ✓'}
                    </p>
                    {step.actor && <p className="text-xs text-muted-foreground">{step.actor}</p>}
                    {step.location && <p className="text-[10px] text-muted-foreground truncate">{step.location}</p>}
                  </div>

                  {step.status === 'completed' && (
                    <Badge variant="outline" className="text-[10px] self-start mt-1 text-emerald-500 border-emerald-500/30">
                      مكتمل
                    </Badge>
                  )}
                  {step.status === 'current' && (
                    <Badge className="text-[10px] self-start mt-1">
                      حالي
                    </Badge>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={copyManifestId}>
          <Share2 className="w-4 h-4" />
          مشاركة
        </Button>
        <Button variant="outline" size="sm" className="flex-1 gap-2">
          <Printer className="w-4 h-4" />
          طباعة
        </Button>
      </div>
    </div>
  );
};

export default DigitalManifest;
