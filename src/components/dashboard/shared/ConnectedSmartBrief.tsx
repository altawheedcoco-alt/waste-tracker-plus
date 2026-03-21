import { lazy, Suspense } from 'react';
import { useSmartBriefData } from '@/hooks/useSmartBriefData';

const SmartDailyBrief = lazy(() => import('./SmartDailyBrief'));

type Role = 'generator' | 'transporter' | 'recycler' | 'driver' | 'disposal' | 'admin';

interface Props {
  role: Role;
  /** Optional override stats - if not provided, fetched from DB */
  statsOverride?: { pending?: number; active?: number; completed?: number; total?: number };
}

/**
 * Wrapper that connects SmartDailyBrief to real database data
 * with auto-refresh every 30 seconds.
 */
const ConnectedSmartBrief = ({ role, statsOverride }: Props) => {
  const { stats, extraData } = useSmartBriefData(role);

  return (
    <Suspense fallback={null}>
      <SmartDailyBrief
        role={role}
        stats={statsOverride || stats}
        extraData={extraData}
      />
    </Suspense>
  );
};

export default ConnectedSmartBrief;
