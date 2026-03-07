import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Clock, AlertTriangle, MapPin, Package, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Shipment {
  id: string;
  shipment_number?: string;
  status?: string;
  waste_type?: string;
  quantity?: number;
  pickup_location?: string;
  delivery_location?: string;
  scheduled_date?: string;
  created_at?: string;
  generator?: { name?: string };
  recycler?: { name?: string };
}

interface SmartPriorityQueueProps {
  shipments: Shipment[];
}

type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

interface PrioritizedShipment extends Shipment {
  priority: PriorityLevel;
  priorityScore: number;
  reasons: string[];
}

const PRIORITY_CONFIG: Record<PriorityLevel, { labelAr: string; labelEn: string; color: string; icon: typeof Zap }> = {
  critical: { labelAr: 'حرج', labelEn: 'Critical', color: 'bg-red-500/10 text-red-700 border-red-300', icon: AlertTriangle },
  high: { labelAr: 'عاجل', labelEn: 'High', color: 'bg-amber-500/10 text-amber-700 border-amber-300', icon: Zap },
  medium: { labelAr: 'عادي', labelEn: 'Medium', color: 'bg-blue-500/10 text-blue-700 border-blue-300', icon: Clock },
  low: { labelAr: 'منخفض', labelEn: 'Low', color: 'bg-muted text-muted-foreground border-border', icon: Package },
};

const SmartPriorityQueue = ({ shipments }: SmartPriorityQueueProps) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const navigate = useNavigate();

  const prioritized = useMemo((): PrioritizedShipment[] => {
    const now = new Date();

    return shipments
      .map((s) => {
        let score = 0;
        const reasons: string[] = [];

        // 1. Overdue scheduled date
        if (s.scheduled_date) {
          const scheduled = new Date(s.scheduled_date);
          const hoursOverdue = (now.getTime() - scheduled.getTime()) / (1000 * 60 * 60);
          if (hoursOverdue > 24) {
            score += 40;
            reasons.push(isAr ? `متأخر ${Math.floor(hoursOverdue)}س` : `${Math.floor(hoursOverdue)}h overdue`);
          } else if (hoursOverdue > 0) {
            score += 20;
            reasons.push(isAr ? 'تجاوز الموعد' : 'Past due');
          } else if (hoursOverdue > -4) {
            score += 10;
            reasons.push(isAr ? 'قريب الموعد' : 'Due soon');
          }
        }

        // 2. Hazardous waste priority
        const hazardousTypes = ['hazardous', 'medical', 'chemical', 'radioactive', 'خطرة', 'طبية'];
        if (s.waste_type && hazardousTypes.some(t => s.waste_type?.toLowerCase().includes(t))) {
          score += 25;
          reasons.push(isAr ? 'مخلفات خطرة' : 'Hazardous');
        }

        // 3. Large quantity
        if (s.quantity && s.quantity > 5000) {
          score += 15;
          reasons.push(isAr ? 'كمية كبيرة' : 'Large quantity');
        }

        // 4. Status urgency
        if (s.status === 'approved' || s.status === 'registered') {
          score += 10;
          reasons.push(isAr ? 'بانتظار النقل' : 'Awaiting pickup');
        }

        // 5. Age of shipment
        if (s.created_at) {
          const ageHours = (now.getTime() - new Date(s.created_at).getTime()) / (1000 * 60 * 60);
          if (ageHours > 48) {
            score += 15;
            reasons.push(isAr ? `عمرها ${Math.floor(ageHours / 24)} يوم` : `${Math.floor(ageHours / 24)}d old`);
          }
        }

        let priority: PriorityLevel = 'low';
        if (score >= 50) priority = 'critical';
        else if (score >= 30) priority = 'high';
        else if (score >= 15) priority = 'medium';

        return { ...s, priority, priorityScore: score, reasons };
      })
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 10);
  }, [shipments, isAr]);

  const counts = {
    critical: prioritized.filter(p => p.priority === 'critical').length,
    high: prioritized.filter(p => p.priority === 'high').length,
    medium: prioritized.filter(p => p.priority === 'medium').length,
    low: prioritized.filter(p => p.priority === 'low').length,
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="w-5 h-5 text-amber-500" />
          {isAr ? 'الأولويات الذكية' : 'Smart Priority Queue'}
        </CardTitle>
        <div className="flex gap-2 mt-2">
          {(Object.entries(counts) as [PriorityLevel, number][]).map(([level, count]) => {
            if (count === 0) return null;
            const config = PRIORITY_CONFIG[level];
            return (
              <Badge key={level} variant="outline" className={config.color}>
                {count} {isAr ? config.labelAr : config.labelEn}
              </Badge>
            );
          })}
        </div>
      </CardHeader>
      <CardContent>
        {prioritized.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Zap className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>{isAr ? 'لا شحنات تحتاج اهتمام عاجل' : 'No shipments need urgent attention'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {prioritized.map((s, idx) => {
              const config = PRIORITY_CONFIG[s.priority];
              const Icon = config.icon;
              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors ${config.color}`}
                  onClick={() => navigate(`/dashboard/shipments/${s.id}`)}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background/80">
                    <span className="text-xs font-bold">{idx + 1}</span>
                  </div>
                  <Icon className="w-4 h-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{s.shipment_number || s.id.slice(0, 8)}</p>
                      <Badge variant="outline" className="text-[10px] px-1">{s.waste_type}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] opacity-75 mt-0.5">
                      {s.reasons.map((r, i) => (
                        <span key={i}>• {r}</span>
                      ))}
                    </div>
                  </div>
                  <ArrowLeft className="w-4 h-4 opacity-50" />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartPriorityQueue;
