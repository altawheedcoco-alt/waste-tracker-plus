import { memo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UserCheck, Clock, Shield, Lock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useCheckConsultantGate } from '@/hooks/useWMIS';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  shipmentId: string;
  gateType: string;
  weightKg?: number;
  onApprovalStatus?: (status: 'approved' | 'pending' | 'not_required') => void;
  children?: React.ReactNode;
}

const ConsultantApprovalGate = memo(({ shipmentId, gateType, weightKg, onApprovalStatus, children }: Props) => {
  const { mutate: checkGate, data: gateResult, isPending } = useCheckConsultantGate();
  const [shipmentApproval, setShipmentApproval] = useState<string | null>(null);

  useEffect(() => {
    checkGate({ gateType, shipmentId, weightKg });
    // Fetch current approval status
    supabase
      .from('shipments')
      .select('consultant_technical_approval')
      .eq('id', shipmentId)
      .single()
      .then(({ data }) => {
        setShipmentApproval(data?.consultant_technical_approval || null);
      });
  }, [shipmentId, gateType, weightKg]);

  useEffect(() => {
    if (!gateResult) return;
    if (!gateResult.required || gateResult.autoApproved || gateResult.alreadyApproved) {
      onApprovalStatus?.('approved');
    } else if (shipmentApproval === 'approved') {
      onApprovalStatus?.('approved');
    } else {
      onApprovalStatus?.('pending');
    }
  }, [gateResult, shipmentApproval]);

  if (isPending) return null;
  if (!gateResult) return <>{children}</>;

  // Not required — pass through
  if (!gateResult.required) {
    if (gateResult.autoApproved) {
      return (
        <>
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 mb-3">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800 dark:text-blue-300 text-sm">
              ✅ موافقة تلقائية — {gateResult.reason}
            </AlertTitle>
          </Alert>
          {children}
        </>
      );
    }
    return <>{children}</>;
  }

  // Already approved
  if (shipmentApproval === 'approved') {
    return (
      <>
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 mb-3">
          <UserCheck className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-300 text-sm">
            ✅ تمت الموافقة الفنية من الاستشاري
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-400 text-xs">
            المسؤولية الفنية محمولة بالكامل على الاستشاري البيئي المعتمد
          </AlertDescription>
        </Alert>
        {children}
      </>
    );
  }

  // Pending — block action if mandatory
  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-amber-800 dark:text-amber-300">
          <Lock className="h-4 w-4" />
          بوابة الاستشاري — في انتظار الموافقة الفنية
          {gateResult.mandatory && (
            <Badge variant="destructive" className="text-[10px]">إلزامي</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-amber-700 dark:text-amber-400 space-y-1">
          <p className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            مهلة الموافقة: {gateResult.maxHours} ساعة (يتم التصعيد تلقائياً بعدها)
          </p>
          {gateResult.requiresSiteVisit && (
            <p className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              يتطلب زيارة ميدانية من الاستشاري
            </p>
          )}
          <p className="flex items-center gap-1 mt-2 font-semibold">
            <Shield className="h-3 w-3" />
            ⚖️ الختم النهائي في يد الاستشاري — المسؤولية الفنية تنتقل بالكامل من المنصة إلى الاستشاري
          </p>
        </div>

        {gateResult.mandatory ? (
          <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/20 border-red-200">
            <Lock className="h-4 w-4" />
            <AlertDescription className="text-xs">
              لا يمكن إتمام هذا الإجراء بدون موافقة الاستشاري البيئي المعتمد
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert className="border-amber-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                يمكن المتابعة بدون موافقة الاستشاري، لكن المسؤولية القانونية تقع بالكامل على مُنفذ العملية
              </AlertDescription>
            </Alert>
            {children}
          </>
        )}
      </CardContent>
    </Card>
  );
});

ConsultantApprovalGate.displayName = 'ConsultantApprovalGate';
export default ConsultantApprovalGate;
