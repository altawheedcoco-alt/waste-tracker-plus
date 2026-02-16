import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import {
  Package, Truck, CheckCircle2, Clock, MapPin, Search,
  ArrowLeft, Phone, Mail, Building2, Scale, Leaf
} from 'lucide-react';

interface TrackingData {
  shipment: {
    id: string;
    status: string;
    waste_type: string;
    quantity: number;
    unit: string;
    pickup_location: string;
    delivery_location: string;
    created_at: string;
    updated_at: string;
    estimated_arrival: string | null;
  };
  organization: {
    name: string;
    phone: string | null;
  };
  timeline: Array<{
    status: string;
    timestamp: string;
    label: string;
    icon: string;
  }>;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'قيد المراجعة', color: 'bg-yellow-500', icon: Clock },
  approved: { label: 'تمت الموافقة', color: 'bg-blue-500', icon: CheckCircle2 },
  in_transit: { label: 'في الطريق', color: 'bg-indigo-500', icon: Truck },
  picked_up: { label: 'تم الاستلام', color: 'bg-cyan-500', icon: Package },
  delivered: { label: 'تم التسليم', color: 'bg-green-500', icon: CheckCircle2 },
  completed: { label: 'مكتمل', color: 'bg-emerald-600', icon: CheckCircle2 },
  cancelled: { label: 'ملغي', color: 'bg-red-500', icon: Clock },
};

const statusOrder = ['pending', 'approved', 'picked_up', 'in_transit', 'delivered', 'completed'];

const PublicShipmentTracker = () => {
  const [trackingCode, setTrackingCode] = useState('');
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  // Check URL for token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || params.get('t');
    if (token) {
      setTrackingCode(token);
      handleTrack(token);
    }
  }, []);

  const handleTrack = async (code?: string) => {
    const token = code || trackingCode.trim();
    if (!token) return;

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      // Look up tracking token
      const { data: tokenData, error: tokenError } = await supabase
        .from('tracking_tokens')
        .select('shipment_id, is_active')
        .eq('token', token)
        .single();

      if (tokenError || !tokenData || !tokenData.is_active) {
        // Try direct shipment ID lookup
        const { data: shipment, error: shipmentError } = await supabase
          .from('shipments')
          .select('id, status, waste_type, quantity, unit, pickup_location, delivery_location, created_at, updated_at, estimated_arrival, organization_id')
          .eq('id', token)
          .single();

        if (shipmentError || !shipment) {
          setError('لم يتم العثور على الشحنة. تأكد من رمز التتبع.');
          setLoading(false);
          return;
        }

        await buildTrackingData(shipment);
      } else {
        // Update view count
        try { await supabase.from('tracking_tokens').update({ views_count: 1 } as any).eq('shipment_id', tokenData.shipment_id); } catch {}

        const { data: shipment } = await supabase
          .from('shipments')
          .select('id, status, waste_type, quantity, unit, pickup_location, delivery_location, created_at, updated_at, estimated_arrival, organization_id')
          .eq('id', tokenData.shipment_id)
          .single();

        if (shipment) await buildTrackingData(shipment);
        else setError('لم يتم العثور على بيانات الشحنة.');
      }
    } catch {
      setError('حدث خطأ. يرجى المحاولة مرة أخرى.');
    }
    setLoading(false);
  };

  const buildTrackingData = async (shipment: any) => {
    const { data: org } = await supabase
      .from('organizations')
      .select('name, phone')
      .eq('id', shipment.organization_id)
      .single();

    const currentStatusIndex = statusOrder.indexOf(shipment.status);
    const timeline = statusOrder.slice(0, Math.max(currentStatusIndex + 1, 1)).map((s, i) => ({
      status: s,
      timestamp: i === currentStatusIndex ? shipment.updated_at : shipment.created_at,
      label: statusConfig[s]?.label || s,
      icon: s,
    }));

    setTrackingData({
      shipment: {
        id: shipment.id,
        status: shipment.status,
        waste_type: shipment.waste_type || 'غير محدد',
        quantity: shipment.quantity || 0,
        unit: shipment.unit || 'طن',
        pickup_location: shipment.pickup_location || 'غير محدد',
        delivery_location: shipment.delivery_location || 'غير محدد',
        created_at: shipment.created_at,
        updated_at: shipment.updated_at,
        estimated_arrival: shipment.estimated_arrival,
      },
      organization: {
        name: org?.name || 'الناقل',
        phone: org?.phone || null,
      },
      timeline,
    });
  };

  const currentConfig = trackingData ? statusConfig[trackingData.shipment.status] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-xl mb-4">
            <Truck className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">تتبع شحنتك</h1>
          <p className="text-muted-foreground text-sm mt-1">أدخل رمز التتبع لمعرفة حالة شحنتك</p>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <Input
                  placeholder="أدخل رمز التتبع أو رقم الشحنة..."
                  value={trackingCode}
                  onChange={e => setTrackingCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTrack()}
                  className="text-center text-lg"
                  dir="ltr"
                />
                <Button
                  onClick={() => handleTrack()}
                  disabled={loading || !trackingCode.trim()}
                  className="gap-2 px-6"
                >
                  <Search className="w-4 h-4" />
                  {loading ? 'جارٍ البحث...' : 'تتبع'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Error */}
        {error && searched && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="pt-6 text-center text-destructive">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{error}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tracking Result */}
        {trackingData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Status Hero */}
            <Card className="overflow-hidden">
              <div className={`${currentConfig?.color} p-6 text-white text-center`}>
                {(() => {
                  const Icon = currentConfig?.icon || Package;
                  return <Icon className="w-12 h-12 mx-auto mb-2" />;
                })()}
                <h2 className="text-2xl font-bold">{currentConfig?.label}</h2>
                <p className="text-sm opacity-80 mt-1 font-mono" dir="ltr">
                  #{trackingData.shipment.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" />
                    <div>
                      <p className="text-muted-foreground text-xs">من</p>
                      <p className="font-medium">{trackingData.shipment.pickup_location}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
                    <div>
                      <p className="text-muted-foreground text-xs">إلى</p>
                      <p className="font-medium">{trackingData.shipment.delivery_location}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <Leaf className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">نوع النفايات</p>
                      <p className="font-medium">{trackingData.shipment.waste_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <Scale className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">الكمية</p>
                      <p className="font-medium">{trackingData.shipment.quantity} {trackingData.shipment.unit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <Building2 className="w-4 h-4 text-purple-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">الناقل</p>
                      <p className="font-medium">{trackingData.organization.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">آخر تحديث</p>
                      <p className="font-medium text-xs" dir="ltr">
                        {new Date(trackingData.shipment.updated_at).toLocaleString('ar-SA')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardContent className="pt-4">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> سجل التتبع
                </h3>
                <div className="space-y-0">
                  {trackingData.timeline.map((event, idx) => {
                    const config = statusConfig[event.status];
                    const Icon = config?.icon || Package;
                    const isLast = idx === trackingData.timeline.length - 1;
                    return (
                      <div key={idx} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full ${isLast ? config?.color : 'bg-muted'} flex items-center justify-center`}>
                            <Icon className={`w-4 h-4 ${isLast ? 'text-white' : 'text-muted-foreground'}`} />
                          </div>
                          {idx < trackingData.timeline.length - 1 && (
                            <div className="w-0.5 h-8 bg-border" />
                          )}
                        </div>
                        <div className="pb-4">
                          <p className={`text-sm font-medium ${isLast ? '' : 'text-muted-foreground'}`}>
                            {event.label}
                          </p>
                          <p className="text-xs text-muted-foreground" dir="ltr">
                            {new Date(event.timestamp).toLocaleString('ar-SA')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            {trackingData.organization.phone && (
              <Card>
                <CardContent className="pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    <span className="text-sm">تواصل مع الناقل</span>
                  </div>
                  <a
                    href={`tel:${trackingData.organization.phone}`}
                    className="text-sm font-mono text-primary hover:underline"
                    dir="ltr"
                  >
                    {trackingData.organization.phone}
                  </a>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PublicShipmentTracker;
