import { memo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ShieldCheck, Award, FileCheck, Star, Handshake } from 'lucide-react';
import { cn } from '@/lib/utils';

const VERIFICATION_CONFIG = {
  identity_verified: {
    icon: ShieldCheck,
    label: 'هوية موثقة',
    color: 'text-blue-600',
    bg: 'bg-blue-500/10 border-blue-500/20',
    glow: 'shadow-blue-500/10',
  },
  license_verified: {
    icon: FileCheck,
    label: 'تراخيص معتمدة',
    color: 'text-emerald-600',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    glow: 'shadow-emerald-500/10',
  },
  iso_certified: {
    icon: Award,
    label: 'حاصل على ISO',
    color: 'text-violet-600',
    bg: 'bg-violet-500/10 border-violet-500/20',
    glow: 'shadow-violet-500/10',
  },
  top_rated: {
    icon: Star,
    label: 'أعلى تقييم',
    color: 'text-amber-600',
    bg: 'bg-amber-500/10 border-amber-500/20',
    glow: 'shadow-amber-500/10',
  },
  trusted_partner: {
    icon: Handshake,
    label: 'شريك موثوق',
    color: 'text-teal-600',
    bg: 'bg-teal-500/10 border-teal-500/20',
    glow: 'shadow-teal-500/10',
  },
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
    <div className={cn('flex items-center gap-1.5 flex-wrap', className)}>
      {activeVerifications.map((v, i) => {
        const config = VERIFICATION_CONFIG[v.verification_type as keyof typeof VERIFICATION_CONFIG];
        if (!config) return null;
        const Icon = config.icon;

        if (compact) {
          return (
            <Tooltip key={v.verification_type}>
              <TooltipTrigger>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 500 }}
                  className={cn('p-1 rounded-full', config.bg)}
                >
                  <Icon className={cn('h-3.5 w-3.5', config.color)} />
                </motion.div>
              </TooltipTrigger>
              <TooltipContent className="text-xs font-medium">{config.label}</TooltipContent>
            </Tooltip>
          );
        }

        return (
          <motion.div
            key={v.verification_type}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06, type: 'spring', stiffness: 400 }}
          >
            <Badge
              variant="outline"
              className={cn(
                'gap-1.5 text-xs font-medium py-1 px-2.5 rounded-full shadow-sm',
                config.bg, config.color, config.glow
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {config.label}
            </Badge>
          </motion.div>
        );
      })}
    </div>
  );
});

VerificationBadges.displayName = 'VerificationBadges';
export default VerificationBadges;
