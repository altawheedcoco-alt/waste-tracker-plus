import { useOrganizationImpact } from '@/hooks/useOrganizationImpact';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Award, Leaf, Shield, Truck, Handshake, FileCheck } from 'lucide-react';

interface OrgAchievementBadgesProps {
  orgId: string;
  orgData?: any;
  compact?: boolean;
}

interface AchievementBadge {
  key: string;
  icon: typeof Award;
  label: string;
  description: string;
  color: string;
  earned: boolean;
}

const OrgAchievementBadges = ({ orgId, orgData, compact = false }: OrgAchievementBadgesProps) => {
  const { data: impact } = useOrganizationImpact(orgId);

  const { data: partnerCount = 0 } = useQuery({
    queryKey: ['org-badge-partners', orgId],
    queryFn: async () => {
      const { count } = await supabase
        .from('verified_partnerships')
        .select('id', { count: 'exact', head: true })
        .or(`requester_org_id.eq.${orgId},partner_org_id.eq.${orgId}`)
        .eq('status', 'active');
      return count || 0;
    },
    enabled: !!orgId,
    staleTime: 10 * 60 * 1000,
  });

  const badges: AchievementBadge[] = [
    {
      key: 'gold_eco',
      icon: Award,
      label: 'صديق البيئة الذهبي',
      description: 'دوّر أكثر من 100 طن',
      color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700',
      earned: (impact?.totalTons || 0) >= 100,
    },
    {
      key: 'silver_eco',
      icon: Leaf,
      label: 'صديق البيئة الفضي',
      description: 'دوّر أكثر من 50 طن',
      color: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-600',
      earned: (impact?.totalTons || 0) >= 50 && (impact?.totalTons || 0) < 100,
    },
    {
      key: 'trusted_transporter',
      icon: Truck,
      label: 'ناقل موثوق',
      description: 'أكثر من 50 شحنة مكتملة',
      color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
      earned: (impact?.completedShipments || 0) >= 50,
    },
    {
      key: 'committed_partner',
      icon: Handshake,
      label: 'شريك ملتزم',
      description: 'أكثر من 10 شراكات نشطة',
      color: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700',
      earned: partnerCount >= 10,
    },
    {
      key: 'verified_docs',
      icon: FileCheck,
      label: 'مُوثّق',
      description: 'لديه ختم وتوقيع وسجل تجاري',
      color: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
      earned: !!(orgData?.stamp_url && orgData?.signature_url && orgData?.commercial_register),
    },
    {
      key: 'eco_pioneer',
      icon: Shield,
      label: 'رائد بيئي',
      description: 'وفّر أكثر من 10 طن CO₂',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700',
      earned: (impact?.co2SavedTons || 0) >= 10,
    },
  ];

  const earnedBadges = badges.filter(b => b.earned);
  if (earnedBadges.length === 0) return null;

  return (
    <TooltipProvider>
      <div className={`flex flex-wrap gap-1.5 ${compact ? '' : 'py-2'}`}>
        {earnedBadges.map((badge) => (
          <Tooltip key={badge.key}>
            <TooltipTrigger asChild>
              <Badge variant="outline" className={`gap-1 text-[10px] cursor-default ${badge.color}`}>
                <badge.icon className="w-3 h-3" />
                {!compact && badge.label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="font-semibold">{badge.label}</p>
              <p className="text-xs text-muted-foreground">{badge.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};

export default OrgAchievementBadges;
