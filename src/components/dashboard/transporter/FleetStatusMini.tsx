/**
 * ويدجت حالة الأسطول المصغر - عرض سريع لحالة السائقين والمركبات
 */
import { useDriversSummary } from '@/hooks/useTransporterExtended';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Users, Truck, CheckCircle2, XCircle, MapPin, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FleetStatusMini = () => {
  const { data: drivers = [], isLoading } = useDriversSummary();
  const navigate = useNavigate();

  if (isLoading) {
    return <Skeleton className="h-32 w-full rounded-xl" />;
  }

  const available = drivers.filter(d => d.isAvailable);
  const busy = drivers.filter(d => !d.isAvailable);
  const withLocation = drivers.filter(d => d.lastLat && d.lastLng);
  const withActiveShipments = drivers.filter(d => d.activeShipments > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="border border-border/50 bg-card overflow-hidden cursor-pointer hover:border-primary/30 transition-colors"
        onClick={() => navigate('/dashboard/transporter-drivers')}
      >
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <Badge variant="outline" className="text-[10px] gap-1">
              <Activity className="w-3 h-3" />
              {drivers.length} سائق
            </Badge>
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              حالة الأسطول
              <Users className="w-4 h-4 text-primary" />
            </h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-emerald-500/8 rounded-lg p-2.5 text-right border border-emerald-500/10">
              <div className="flex items-center justify-between mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] text-muted-foreground">متاح</span>
              </div>
              <p className="text-xl font-black text-emerald-500 tabular-nums">{available.length}</p>
            </div>
            <div className="bg-amber-500/8 rounded-lg p-2.5 text-right border border-amber-500/10">
              <div className="flex items-center justify-between mb-1">
                <Truck className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[10px] text-muted-foreground">مشغول</span>
              </div>
              <p className="text-xl font-black text-amber-500 tabular-nums">{busy.length}</p>
            </div>
            <div className="bg-primary/8 rounded-lg p-2.5 text-right border border-primary/10">
              <div className="flex items-center justify-between mb-1">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] text-muted-foreground">مُتتبع</span>
              </div>
              <p className="text-xl font-black text-primary tabular-nums">{withLocation.length}</p>
            </div>
            <div className="bg-violet-500/8 rounded-lg p-2.5 text-right border border-violet-500/10">
              <div className="flex items-center justify-between mb-1">
                <Activity className="w-3.5 h-3.5 text-violet-500" />
                <span className="text-[10px] text-muted-foreground">في مهمة</span>
              </div>
              <p className="text-xl font-black text-violet-500 tabular-nums">{withActiveShipments.length}</p>
            </div>
          </div>

          {/* Driver list preview */}
          {drivers.length > 0 && (
            <div className="mt-2.5 flex gap-1.5 flex-wrap justify-end">
              {drivers.slice(0, 8).map((d) => (
                <div
                  key={d.id}
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] border ${
                    d.isAvailable 
                      ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-600' 
                      : 'bg-muted/50 border-border/30 text-muted-foreground'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${d.isAvailable ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
                  <span className="truncate max-w-[60px]">{d.name}</span>
                  {d.activeShipments > 0 && (
                    <span className="font-bold text-amber-500">{d.activeShipments}</span>
                  )}
                </div>
              ))}
              {drivers.length > 8 && (
                <span className="text-[9px] text-muted-foreground self-center">+{drivers.length - 8}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FleetStatusMini;
