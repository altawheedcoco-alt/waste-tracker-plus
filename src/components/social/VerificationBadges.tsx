import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ShieldCheck, Award, FileCheck, Star, Handshake } from 'lucide-react';
import { cn } from '@/lib/utils';

const VERIFICATION_CONFIG = {
  identity_verified: { icon: ShieldCheck, label: 'هوية موثقة', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  license_verified: { icon: FileCheck, label: 'تراخيص معتمدة', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  iso_certified: { icon: Award, label: 'حاصل على ISO', color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  top_rated: { icon: Star, label: 'أعلى تقييم', color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  trusted_partner: { icon: Handshake, label: 'شريك موثوق', color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
} as const;

interface VerificationBadgesProps {
  organizationId: string;
  compact?: boolean;
  className?: string;
}

const VerificationBadges = memo(({ organizationId, compact = false, className }: VerificationBadgesProps) => {
  const { data: verifications = [] } = useQuery({
    queryKey: ['org-verifications', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_verifications')
        .select('verification_type, is_active, expires_at')
        .eq('organization_id', organizationId)
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  const activeVerifications = verifications.filter(v => {
    if (v.expires_at && new Date(v.expires_at) < new Date()) return false;
    return true;
  });

  if (activeVerifications.length === 0) return null;

  return (
    <div className={cn('flex items-center gap-1 flex-wrap', className)}>
      {activeVerifications.map((v) => {
        const config = VERIFICATION_CONFIG[v.verification_type as keyof typeof VERIFICATION_CONFIG];
        if (!config) return null;
        const Icon = config.icon;

        if (compact) {
          return (
            <Tooltip key={v.verification_type}>
              <TooltipTrigger>
                <Icon className={cn('h-4 w-4', config.color)} />
              </TooltipTrigger>
              <TooltipContent>{config.label}</TooltipContent>
            </Tooltip>
          );
        }

        return (
          <Badge key={v.verification_type} variant="outline" className={cn('gap-1 text-xs', config.bg, config.color)}>
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        );
      })}
    </div>
  );
});

VerificationBadges.displayName = 'VerificationBadges';
export default VerificationBadges;
