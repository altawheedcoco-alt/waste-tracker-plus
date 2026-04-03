import { useState } from 'react';
import { useClaimablePartners, useSubmitClaim } from '@/hooks/useDataClaim';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, ArrowRightLeft, Check, Loader2, X } from 'lucide-react';

/**
 * Banner shown to newly registered orgs that have matching external_partners data.
 * Appears on dashboard if there are claimable records.
 */
export function ClaimableBanner() {
  const { data: claimable, isLoading } = useClaimablePartners();
  const submitClaim = useSubmitClaim();
  const [dismissed, setDismissed] = useState(false);

  if (isLoading || dismissed) return null;

  const unclaimed = claimable?.filter(c => !c.claimStatus) || [];
  const pending = claimable?.filter(c => c.claimStatus === 'pending') || [];

  if (unclaimed.length === 0 && pending.length === 0) return null;

  return (
    <Alert className="border-primary/30 bg-primary/5 relative mb-4">
      <Database className="h-5 w-5 text-primary" />
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 left-2 h-6 w-6"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
      </Button>

      <AlertTitle className="text-base font-bold">
        بيانات سابقة باسمكم
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-sm text-muted-foreground">
          تم العثور على بيانات (شحنات، فواتير، قيود محاسبية) مسجّلة باسم جهتكم عند شركاء آخرين. يمكنكم طلب ضمّها لحسابكم.
        </p>

        {unclaimed.map((ep) => (
          <div
            key={ep.id}
            className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{ep.name}</p>
              <p className="text-xs text-muted-foreground">
                {ep.partner_type === 'generator' ? 'مولّد' :
                 ep.partner_type === 'recycler' ? 'مدوّر' :
                 ep.partner_type === 'disposal' ? 'تخلص' : ep.partner_type}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => submitClaim.mutate({
                externalPartnerId: ep.id,
                ownerOrgId: ep.ownerOrgId,
              })}
              disabled={submitClaim.isPending}
            >
              {submitClaim.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRightLeft className="h-4 w-4 ml-1" />
              )}
              طلب الضم
            </Button>
          </div>
        ))}

        {pending.map((ep) => (
          <div
            key={ep.id}
            className="flex items-center justify-between gap-3 rounded-lg border bg-muted/50 p-3"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{ep.name}</p>
            </div>
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              في انتظار الموافقة
            </Badge>
          </div>
        ))}
      </AlertDescription>
    </Alert>
  );
}
