import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Printer, Award, Star, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { PrideCertificate } from '@/hooks/usePrideCertificates';

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

const getOrgTypeAr = (type: string) => {
  switch (type) {
    case 'generator': return 'جهة مولدة';
    case 'transporter': return 'جهة ناقلة';
    case 'recycler': return 'جهة تدوير';
    case 'disposal': return 'جهة تخلص نهائي';
    default: return 'منظمة';
  }
};

const PrideCertificateCard = ({ certificate, organizationName }: PrideCertificateCardProps) => {
  const { organization } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const style = getCertificateStyle(certificate.certificate_type);
  const Icon = style.icon;
  const orgName = organizationName || organization?.name || '';

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>شهادة فخر - ${certificate.certificate_number}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Tajawal', sans-serif; direction: rtl; }
          @page { size: A4 landscape; margin: 0; }
          .certificate {
            width: 297mm; height: 210mm;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #dee2e6 100%);
            position: relative; overflow: hidden;
            padding: 30mm;
          }
          .border-frame {
            position: absolute; inset: 8mm;
            border: 3px double #b8860b;
            border-radius: 8px;
          }
          .inner-frame {
            position: absolute; inset: 12mm;
            border: 1px solid #daa520;
            border-radius: 4px;
          }
          .corner { position: absolute; width: 40px; height: 40px; color: #b8860b; font-size: 28px; }
          .corner-tl { top: 14mm; right: 14mm; }
          .corner-tr { top: 14mm; left: 14mm; transform: scaleX(-1); }
          .corner-bl { bottom: 14mm; right: 14mm; transform: scaleY(-1); }
          .corner-br { bottom: 14mm; left: 14mm; transform: scale(-1); }
          .badge { 
            background: linear-gradient(135deg, #b8860b, #daa520);
            color: white; padding: 8px 32px; border-radius: 24px;
            font-size: 14px; font-weight: 700; letter-spacing: 2px;
            margin-bottom: 16px;
          }
          .title { font-size: 42px; font-weight: 900; color: #1a1a2e; margin-bottom: 8px; }
          .subtitle { font-size: 20px; color: #555; margin-bottom: 24px; }
          .org-name { font-size: 36px; font-weight: 800; color: #b8860b; margin-bottom: 16px; }
          .org-type { font-size: 16px; color: #777; margin-bottom: 24px; }
          .milestone { 
            font-size: 64px; font-weight: 900; 
            background: linear-gradient(135deg, #b8860b, #daa520);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            margin-bottom: 8px;
          }
          .tons-label { font-size: 24px; color: #555; margin-bottom: 24px; }
          .description { font-size: 16px; color: #666; max-width: 600px; text-align: center; line-height: 1.8; margin-bottom: 24px; }
          .cert-number { font-size: 12px; color: #999; font-family: monospace; }
          .date { font-size: 14px; color: #888; margin-top: 8px; }
          .emoji { font-size: 48px; margin-bottom: 12px; }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="border-frame"></div>
          <div class="inner-frame"></div>
          <div class="corner corner-tl">❖</div>
          <div class="corner corner-tr">❖</div>
          <div class="corner corner-bl">❖</div>
          <div class="corner corner-br">❖</div>
          
          <div class="emoji">${certificate.certificate_type === 'excellence' ? '🏆' : certificate.certificate_type === 'appreciation' ? '⭐' : '🏅'}</div>
          <div class="badge">${style.badge}</div>
          <div class="title">${certificate.title_ar}</div>
          <div class="subtitle">Certificate of Environmental Pride</div>
          
          <div class="org-name">${orgName}</div>
          <div class="org-type">${getOrgTypeAr(certificate.organization_type)}</div>
          
          <div class="milestone">${certificate.milestone_tons}</div>
          <div class="tons-label">طن من المخلفات</div>
          
          <div class="description">${certificate.description_ar}</div>
          
          <div class="cert-number">رقم الشهادة: ${certificate.certificate_number}</div>
          <div class="date">تاريخ الإصدار: ${new Date(certificate.issued_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
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
