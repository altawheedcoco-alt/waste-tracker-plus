import { memo, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { BadgeCheck, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { evaluateAndEndorse, type AutoEndorsementResult } from '@/services/platformAutoEndorsement';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ShipmentEndorsementButtonProps {
  shipmentId: string;
  shipmentNumber: string;
  shipmentStatus: string;
}

const ShipmentEndorsementButton = memo(({ shipmentId, shipmentNumber, shipmentStatus }: ShipmentEndorsementButtonProps) => {
  const { user, organization } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [existingEndorsement, setExistingEndorsement] = useState<{ id: string; verification_code: string; document_number: string } | null>(null);
  const [autoMode, setAutoMode] = useState(false);

  // Check if endorsement already exists
  useEffect(() => {
    if (!shipmentId || !organization?.id) return;
    
    supabase
      .from('document_endorsements')
      .select('id, verification_code, document_number')
      .eq('document_id', shipmentId)
      .eq('document_type', 'shipment')
      .eq('organization_id', organization.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setExistingEndorsement(data);
      });
  }, [shipmentId, organization?.id]);

  // Check auto-actions setting for this org
  useEffect(() => {
    if (!organization?.id) return;
    supabase
      .from('organization_auto_actions' as any)
      .select('auto_signature_request')
      .eq('organization_id', organization.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data?.auto_signature_request) setAutoMode(true);
      });
  }, [organization?.id]);

  // Auto-endorse silently when status reaches confirmed/completed and auto mode is on
  useEffect(() => {
    if (autoMode && !existingEndorsement && ['confirmed', 'completed', 'delivered'].includes(shipmentStatus)) {
      handleEndorse(true);
    }
  }, [autoMode, existingEndorsement, shipmentStatus]);

  const handleEndorse = useCallback(async (silent = false) => {
    if (!user?.id || !organization?.id || isLoading || existingEndorsement) return;
    setIsLoading(true);
    try {
      const result = await evaluateAndEndorse({
        documentType: 'shipment',
        documentId: shipmentId,
        organizationId: organization.id,
        userId: user.id,
        silent,
      });
      if (result.allCriteriaMet && result.endorsementId) {
        setExistingEndorsement({
          id: result.endorsementId,
          verification_code: result.verificationCode || '',
          document_number: result.systemSealNumber || '',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, organization?.id, shipmentId, isLoading, existingEndorsement]);

  // Already endorsed — show badge
  if (existingEndorsement) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 cursor-default text-[10px] h-5">
              <ShieldCheck className="w-3 h-3" />
              مُصدّق
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs" dir="rtl">
            <p>رقم الختم: {existingEndorsement.document_number}</p>
            <p>رمز التحقق: {existingEndorsement.verification_code}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Not in an endorsable status
  if (!['delivered', 'confirmed', 'completed'].includes(shipmentStatus)) {
    return null;
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className={cn(
        "text-[10px] h-6 px-2 gap-1",
        "border-primary/30 text-primary hover:bg-primary/10"
      )}
      onClick={(e) => {
        e.stopPropagation();
        handleEndorse();
      }}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <BadgeCheck className="w-3 h-3" />
      )}
      تصديق وختم
    </Button>
  );
});

ShipmentEndorsementButton.displayName = 'ShipmentEndorsementButton';
export default ShipmentEndorsementButton;
