import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Printer, Award, Star, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { PrideCertificate } from '@/hooks/usePrideCertificates';
import { useDocumentService } from '@/hooks/useDocumentService';

interface PrideCertificateCardProps {
  certificate: PrideCertificate;
  organizationName?: string;
}

const getCertificateStyle = (type: string) => {
  switch (type) {
    case 'excellence':
      return {
        border: 'border-yellow-400 dark:border-yellow-600',
        bg: 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
        icon: Trophy,
        iconColor: 'text-yellow-600',
        badge: 'شهادة تميز',
        badgeBg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
      };
    case 'appreciation':
      return {
        border: 'border-blue-400 dark:border-blue-600',
        bg: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
        icon: Star,
        iconColor: 'text-blue-600',
        badge: 'شهادة تقدير',
        badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
      };
    default:
      return {
        border: 'border-primary',
        bg: 'bg-gradient-to-br from-primary/5 to-primary/10',
        icon: Award,
        iconColor: 'text-primary',
        badge: 'شهادة فخر',
        badgeBg: 'bg-primary/10 text-primary',
      };
  }
};

const PrideCertificateCard = ({ certificate, organizationName }: PrideCertificateCardProps) => {
  const { organization } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const { printContent } = useDocumentService({ filename: `pride-certificate-${certificate.certificate_number}` });
  const style = getCertificateStyle(certificate.certificate_type);
  const Icon = style.icon;
  const orgName = organizationName || organization?.name || '';

  const handlePrint = () => {
    if (printRef.current) {
      printContent(printRef.current);
    }
  };

  return (
    <Card className={`${style.border} ${style.bg} border-2 overflow-hidden transition-all hover:shadow-lg`}>
      <CardContent className="p-6 text-center space-y-4">
        <div className="flex items-center justify-between">
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${style.badgeBg}`}>
            {style.badge}
          </span>
          <Button variant="ghost" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
          </Button>
        </div>

        <Icon className={`h-16 w-16 mx-auto ${style.iconColor}`} />

        <div>
          <h3 className="text-3xl font-black">{certificate.milestone_tons}</h3>
          <p className="text-sm text-muted-foreground">طن من المخلفات</p>
        </div>

        <p className="text-sm leading-relaxed">{certificate.description_ar}</p>

        <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
          <p className="font-mono">{certificate.certificate_number}</p>
          <p>{new Date(certificate.issued_at).toLocaleDateString('ar-EG')}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrideCertificateCard;
