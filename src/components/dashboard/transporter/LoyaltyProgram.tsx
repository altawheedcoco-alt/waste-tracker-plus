import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Heart, Star, Gift, Trophy, Crown, Sparkles } from 'lucide-react';

interface LoyaltyClient {
  name: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
  totalShipments: number;
  totalSpent: number;
  memberSince: string;
  nextTierPoints: number;
  benefits: string[];
}

const TIER_INFO: Record<string, { label: string; icon: any; color: string; minPoints: number }> = {
  bronze: { label: 'برونزي', icon: Star, color: 'text-orange-700 bg-orange-100 dark:bg-orange-900', minPoints: 0 },
  silver: { label: 'فضي', icon: Trophy, color: 'text-gray-600 bg-gray-100 dark:bg-gray-800', minPoints: 500 },
  gold: { label: 'ذهبي', icon: Crown, color: 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900', minPoints: 1500 },
  platinum: { label: 'بلاتيني', icon: Sparkles, color: 'text-purple-700 bg-purple-100 dark:bg-purple-900', minPoints: 3000 },
};

const MOCK_CLIENTS: LoyaltyClient[] = [
  {
    name: 'المستشفى الدولي', tier: 'platinum', points: 3850,
    totalShipments: 245, totalSpent: 186000, memberSince: '2024-01',
    nextTierPoints: 5000, benefits: ['خصم 20%', 'أولوية قصوى', 'مدير حساب مخصص'],
  },
  {
    name: 'شركة النيل للصناعات', tier: 'gold', points: 2100,
    totalShipments: 128, totalSpent: 95000, memberSince: '2024-06',
    nextTierPoints: 3000, benefits: ['خصم 15%', 'أولوية في الجدولة'],
  },
  {
    name: 'مصنع الأهرام', tier: 'silver', points: 890,
    totalShipments: 65, totalSpent: 48000, memberSince: '2025-01',
    nextTierPoints: 1500, benefits: ['خصم 10%', 'تقارير شهرية مجانية'],
  },
  {
    name: 'جامعة القاهرة', tier: 'bronze', points: 320,
    totalShipments: 22, totalSpent: 15000, memberSince: '2025-08',
    nextTierPoints: 500, benefits: ['خصم 5%'],
  },
];

export default function LoyaltyProgram() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-500" />
          برنامج ولاء العملاء
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Tier summary */}
        <div className="grid grid-cols-4 gap-1.5 mb-4 text-center text-xs">
          {Object.entries(TIER_INFO).map(([key, info]) => {
            const count = MOCK_CLIENTS.filter(c => c.tier === key).length;
            const Icon = info.icon;
            return (
              <div key={key} className={`p-2 rounded ${info.color}`}>
                <Icon className="w-4 h-4 mx-auto mb-1" />
                <p className="font-bold">{count}</p>
                <p>{info.label}</p>
              </div>
            );
          })}
        </div>

        <ScrollArea className="h-[300px]">
          <div className="space-y-3">
            {MOCK_CLIENTS.map((client, idx) => {
              const tier = TIER_INFO[client.tier];
              const Icon = tier.icon;
              const progress = (client.points / client.nextTierPoints) * 100;

              return (
                <Card key={idx} className="border">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className={tier.color}>
                        <Icon className="w-3 h-3 ml-1" />
                        {tier.label}
                      </Badge>
                      <p className="text-sm font-semibold">{client.name}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <p className="font-bold text-primary">{client.points}</p>
                        <p className="text-muted-foreground">نقطة</p>
                      </div>
                      <div>
                        <p className="font-bold">{client.totalShipments}</p>
                        <p className="text-muted-foreground">شحنة</p>
                      </div>
                      <div>
                        <p className="font-bold">{(client.totalSpent / 1000).toFixed(0)}k</p>
                        <p className="text-muted-foreground">ج.م</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{client.nextTierPoints} للترقية</span>
                        <span>التقدم للمستوى التالي</span>
                      </div>
                      <Progress value={Math.min(progress, 100)} className="h-1.5" />
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {client.benefits.map((b, i) => (
                        <Badge key={i} variant="outline" className="text-[10px]">
                          <Gift className="w-2.5 h-2.5 ml-0.5" />{b}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
