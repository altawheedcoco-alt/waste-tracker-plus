import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Link2, CheckCircle, XCircle, Loader2, Search, MapPin, Scale, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CustodyEvent {
  id: string;
  block_number: number;
  custody_hash: string;
  previous_hash: string;
  event_type: string;
  event_description: string;
  actor_name: string;
  actor_role: string;
  location_name: string;
  weight_at_event: number;
  waste_type: string;
  created_at: string;
  verified: boolean;
}

const eventTypeLabels: Record<string, string> = {
  pickup: 'استلام',
  in_transit: 'نقل',
  checkpoint: 'نقطة تفتيش',
  weighing: 'وزن',
  delivery: 'تسليم',
  disposal: 'تخلص',
  recycling: 'تدوير',
};

const eventTypeColors: Record<string, string> = {
  pickup: 'bg-blue-500',
  in_transit: 'bg-amber-500',
  checkpoint: 'bg-purple-500',
  weighing: 'bg-cyan-500',
  delivery: 'bg-emerald-500',
  disposal: 'bg-red-500',
  recycling: 'bg-green-500',
};

const ChainOfCustodyPanel = () => {
  const [shipmentId, setShipmentId] = useState('');
  const [chain, setChain] = useState<CustodyEvent[]>([]);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadChain = async () => {
    if (!shipmentId.trim()) return;
    setIsLoading(true);
    try {
      const { data } = await supabase.functions.invoke('chain-of-custody', {
        body: { action: 'get_chain', shipmentId: shipmentId.trim() },
      });
      if (data?.success) {
        setChain(data.chain || []);
        setIsValid(data.isValid);
        if (data.chain?.length === 0) toast.info('لا توجد سجلات لهذه الشحنة');
      }
    } catch {
      toast.error('فشل في تحميل سلسلة الحفظ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link2 className="w-5 h-5 text-primary" />
            سلسلة الحفظ (Chain of Custody)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="أدخل رقم الشحنة..."
              value={shipmentId}
              onChange={(e) => setShipmentId(e.target.value)}
              className="flex-1"
              dir="ltr"
            />
            <Button onClick={loadChain} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>

          {isValid !== null && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${isValid ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
              {isValid ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              <span className="font-medium">
                {isValid ? 'سلسلة الحفظ سليمة ومتسلسلة' : 'تم اكتشاف كسر في سلسلة الحفظ!'}
              </span>
              <Badge variant="outline" className="mr-auto">{chain.length} سجل</Badge>
            </div>
          )}

          {chain.length > 0 && (
            <div className="relative">
              <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-border" />
              <div className="space-y-4">
                {chain.map((event, idx) => (
                  <div key={event.id} className="relative pr-10">
                    <div className={`absolute right-2.5 w-3 h-3 rounded-full ${eventTypeColors[event.event_type] || 'bg-muted'} ring-2 ring-background`} />
                    <Card className="border">
                      <CardContent className="pt-3 pb-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              #{event.block_number}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {eventTypeLabels[event.event_type] || event.event_type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {new Date(event.created_at).toLocaleString('ar-SA')}
                          </div>
                        </div>

                        {event.event_description && (
                          <p className="text-sm">{event.event_description}</p>
                        )}

                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {event.actor_name && <span>👤 {event.actor_name} ({event.actor_role})</span>}
                          {event.location_name && (
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location_name}</span>
                          )}
                          {event.weight_at_event && (
                            <span className="flex items-center gap-1"><Scale className="w-3 h-3" />{event.weight_at_event} طن</span>
                          )}
                        </div>

                        <div className="text-[10px] text-muted-foreground/50 font-mono" dir="ltr">
                          Hash: {event.custody_hash}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChainOfCustodyPanel;
