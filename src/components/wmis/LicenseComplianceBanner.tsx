import { memo, useEffect } from 'react';
import { AlertTriangle, ShieldCheck, ShieldX, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCheckLicenseCompliance, LicenseCheckResult } from '@/hooks/useWMIS';

interface Props {
  organizationId: string;
  organizationName: string;
  wasteType: string;
  role: 'generator' | 'transporter' | 'recycler';
  shipmentId?: string;
  onResult?: (result: LicenseCheckResult) => void;
}

const ROLE_LABELS: Record<string, string> = {
  generator: 'المولد',
  transporter: 'الناقل',
  recycler: 'المدوّر',
};

const LicenseComplianceBanner = memo(({ organizationId, organizationName, wasteType, role, shipmentId, onResult }: Props) => {
  const { mutate: checkCompliance, data: result, isPending } = useCheckLicenseCompliance();

  useEffect(() => {
    if (organizationId && wasteType) {
      checkCompliance({ organizationId, wasteType, shipmentId });
    }
  }, [organizationId, wasteType, shipmentId]);

  useEffect(() => {
    if (result && onResult) onResult(result);
  }, [result]);

  if (!organizationId || !wasteType) return null;

  if (isPending) {
    return (
      <Alert className="border-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>جاري التحقق من ترخيص {ROLE_LABELS[role]}...</AlertTitle>
      </Alert>
    );
  }

  if (!result) return null;

  if (result.result === 'pass') {
    return (
      <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
        <ShieldCheck className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800 dark:text-green-300">
          ✅ {ROLE_LABELS[role]} ({organizationName}) — مرخص
        </AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-400 text-xs">
          نوع المخلف متوافق مع نطاق الترخيص
        </AlertDescription>
      </Alert>
    );
  }

  if (result.result === 'fail') {
    const messages: Record<string, { title: string; desc: string }> = {
      waste_type_not_licensed: {
        title: `🚫 ${ROLE_LABELS[role]} (${organizationName}) — خارج نطاق الترخيص`,
        desc: `نوع المخلف "${result.requested}" غير مشمول. المرخص: ${result.licensed?.join('، ') || 'غير محدد'}`,
      },
      not_hazardous_certified: {
        title: `⛔ ${ROLE_LABELS[role]} (${organizationName}) — غير معتمد للمخلفات الخطرة`,
        desc: 'هذه الجهة غير حاصلة على شهادة التعامل مع المخلفات الخطرة',
      },
      license_expired: {
        title: `❌ ${ROLE_LABELS[role]} (${organizationName}) — ترخيص منتهي`,
        desc: `انتهت صلاحية الترخيص في ${result.expiry_date}`,
      },
      organization_inactive: {
        title: `🔒 ${ROLE_LABELS[role]} (${organizationName}) — موقوفة`,
        desc: 'هذه الجهة غير نشطة أو تم تعليقها',
      },
    };

    const msg = messages[result.reason || ''] || { title: 'فشل التحقق', desc: result.reason };

    return (
      <Alert variant="destructive" className="border-red-300 bg-red-50 dark:bg-red-950/20">
        <ShieldX className="h-4 w-4" />
        <AlertTitle>{msg.title}</AlertTitle>
        <AlertDescription className="text-xs">
          {msg.desc}
          <br />
          <span className="font-semibold mt-1 block">
            ⚖️ المسؤولية القانونية تقع بالكامل على مُدخل البيانات وصاحب التوقيع وفقاً للمادة 18 من القانون 202/2020
          </span>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
});

LicenseComplianceBanner.displayName = 'LicenseComplianceBanner';
export default LicenseComplianceBanner;
