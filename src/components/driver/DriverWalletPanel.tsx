import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Wallet, TrendingUp, Gift, ArrowUpRight, ArrowDownRight,
  Star, Crown, Gem, Medal, Fuel, Wrench, CalendarDays
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const levelConfig = {
  bronze: { name: 'برونزي', icon: '🥉', color: 'text-orange-600', next: 200, multiplier: 1 },
  silver: { name: 'فضي', icon: '🥈', color: 'text-gray-400', next: 500, multiplier: 1.2 },
  gold: { name: 'ذهبي', icon: '🥇', color: 'text-amber-400', next: 1000, multiplier: 1.5 },
  diamond: { name: 'ماسي', icon: '💎', color: 'text-cyan-400', next: null, multiplier: 2 },
};

const rewardOptions = [
  { id: 'fuel', label: 'قسيمة وقود', points: 100, icon: Fuel, description: '50 ج.م بنزين' },
  { id: 'maintenance', label: 'صيانة مجانية', points: 250, icon: Wrench, description: 'فحص شامل للمركبة' },
  { id: 'dayoff', label: 'يوم إجازة', points: 500, icon: CalendarDays, description: 'إجازة مدفوعة' },
];

const DriverWalletPanel = () => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const { data: wallet } = useQuery({
    queryKey: ['driver-wallet', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data: driver } = await supabase
        .from('drivers').select('id').eq('profile_id', profile.id).single();
      if (!driver) return null;

      const { data: w } = await supabase
        .from('driver_wallet').select('*').eq('driver_id', driver.id).single();
      
      if (!w) {
        // Create wallet if not exists
        const { data: newW } = await supabase
          .from('driver_wallet')
          .insert({ driver_id: driver.id })
          .select('*')
          .single();
        return { ...newW, driver_id: driver.id };
      }
      return w;
    },
    enabled: !!profile?.id,
  });

  const { data: transactions } = useQuery({
    queryKey: ['driver-wallet-tx', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data: driver } = await supabase
        .from('drivers').select('id').eq('profile_id', profile.id).single();
      if (!driver) return [];

      const { data } = await supabase
        .from('driver_wallet_transactions')
        .select('*')
        .eq('driver_id', driver.id)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const availablePoints = (wallet?.total_points || 0) - (wallet?.redeemed_points || 0);
  const level = levelConfig[(wallet?.level as keyof typeof levelConfig) || 'bronze'];

  const handleRedeem = async (reward: typeof rewardOptions[0]) => {
    if (availablePoints < reward.points) {
      toast({ title: 'نقاط غير كافية', description: `تحتاج ${reward.points - availablePoints} نقطة إضافية`, variant: 'destructive' });
      return;
    }
    
    if (!wallet?.driver_id) return;

    await supabase.from('driver_wallet_transactions').insert({
      driver_id: wallet.driver_id,
      points: -reward.points,
      transaction_type: 'redeem',
      source: 'redemption',
      description: `استبدال: ${reward.label}`,
    });

    await supabase.from('driver_wallet')
      .update({ redeemed_points: (wallet.redeemed_points || 0) + reward.points })
      .eq('id', wallet.id);

    toast({ title: 'تم الاستبدال! 🎉', description: `حصلت على ${reward.label}` });
  };

  return (
    <div className="space-y-4">
      {/* Wallet Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 overflow-hidden">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              <span className="font-bold text-lg">محفظة النقاط</span>
            </div>
            <Badge className={`${level.color} bg-transparent border`}>
              <span className="ml-1">{level.icon}</span> {level.name}
            </Badge>
          </div>

          <div className="text-center py-4">
            <motion.p
              className="text-4xl font-bold text-primary"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
            >
              {availablePoints}
            </motion.p>
            <p className="text-sm text-muted-foreground">نقطة متاحة</p>
          </div>

          {level.next && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{wallet?.total_points || 0} نقطة</span>
                <span>{level.next} للمستوى التالي</span>
              </div>
              <Progress value={((wallet?.total_points || 0) / level.next) * 100} className="h-2" />
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="text-center p-2 rounded-lg bg-background/50">
              <p className="text-lg font-bold">{wallet?.total_points || 0}</p>
              <p className="text-[10px] text-muted-foreground">إجمالي مكتسب</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/50">
              <p className="text-lg font-bold">{wallet?.redeemed_points || 0}</p>
              <p className="text-[10px] text-muted-foreground">مستبدل</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/50">
              <p className="text-lg font-bold">{wallet?.streak_days || 0}🔥</p>
              <p className="text-[10px] text-muted-foreground">سلسلة أيام</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Redeem Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="w-5 h-5 text-primary" />
            استبدل نقاطك
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rewardOptions.map((reward) => (
            <div
              key={reward.id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${availablePoints >= reward.points ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 opacity-60'}`}
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <reward.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{reward.label}</p>
                <p className="text-xs text-muted-foreground">{reward.description}</p>
              </div>
              <Button
                size="sm"
                variant={availablePoints >= reward.points ? 'default' : 'outline'}
                disabled={availablePoints < reward.points}
                onClick={() => handleRedeem(reward)}
                className="text-xs"
              >
                {reward.points} نقطة
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-5 h-5 text-primary" />
            آخر الحركات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(!transactions || transactions.length === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد حركات بعد</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    {tx.transaction_type === 'earn' ? (
                      <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                    )}
                    <div>
                      <p className="text-xs font-medium">{tx.description || tx.source}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>
                  <Badge variant={tx.transaction_type === 'earn' ? 'default' : 'destructive'} className="text-xs">
                    {tx.transaction_type === 'earn' ? '+' : ''}{tx.points}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverWalletPanel;
