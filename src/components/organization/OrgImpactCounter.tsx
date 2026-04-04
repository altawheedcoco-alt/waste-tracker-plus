import { Leaf, TreePine, Droplets, Recycle } from 'lucide-react';
import { useOrganizationImpact } from '@/hooks/useOrganizationImpact';
import AnimatedCounter from '@/components/dashboard/shared/AnimatedCounter';

interface OrgImpactCounterProps {
  orgId: string;
}

const OrgImpactCounter = ({ orgId }: OrgImpactCounterProps) => {
  const { data: impact } = useOrganizationImpact(orgId);

  if (!impact || impact.totalTons === 0) return null;

  const metrics = [
    { icon: Recycle, value: impact.totalTons, label: 'طن مُدوّر', suffix: '', color: 'text-emerald-600' },
    { icon: Leaf, value: impact.co2SavedTons, label: 'طن CO₂ موفّر', suffix: '', color: 'text-green-600' },
    { icon: TreePine, value: impact.treesEquivalent, label: 'شجرة مكافئة', suffix: '', color: 'text-teal-600' },
    { icon: Droplets, value: impact.waterSavedLiters, label: 'لتر مياه', suffix: '', color: 'text-blue-600' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gradient-to-r from-emerald-50/80 to-blue-50/80 dark:from-emerald-950/30 dark:to-blue-950/30 rounded-xl border border-emerald-200/50 dark:border-emerald-800/30">
      {metrics.map((m) => (
        <div key={m.label} className="flex flex-col items-center gap-1 text-center">
          <m.icon className={`w-5 h-5 ${m.color}`} />
          <span className="text-lg font-bold text-foreground">
            <AnimatedCounter value={m.value} duration={1200} />
          </span>
          <span className="text-[10px] text-muted-foreground leading-tight">{m.label}</span>
        </div>
      ))}
    </div>
  );
};

export default OrgImpactCounter;
