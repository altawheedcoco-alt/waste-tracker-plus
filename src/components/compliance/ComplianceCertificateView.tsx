import { generateDigitalVerificationStamp } from '@/lib/digitalVerificationStamp';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Printer, QrCode, Shield, Award, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/contexts/AuthContext';
import { useRef } from 'react';
import { toast } from 'sonner';

interface ComplianceCertificateViewProps {
  certificate: any;
  open: boolean;
  onClose: () => void;
}

const levelStyles = {
  gold: { bg: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100', border: 'border-amber-400', accent: 'text-amber-700', badge: '🥇 ذهبي', ring: 'ring-amber-400/30' },
  silver: { bg: 'bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100', border: 'border-slate-400', accent: 'text-slate-700', badge: '🥈 فضي', ring: 'ring-slate-400/30' },
  bronze: { bg: 'bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100', border: 'border-orange-400', accent: 'text-orange-700', badge: '🥉 برونزي', ring: 'ring-orange-400/30' },
};

const ComplianceCertificateView = ({ certificate, open, onClose }: ComplianceCertificateViewProps) => {
  const { organization } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const style = levelStyles[certificate.certificate_level as keyof typeof levelStyles] || levelStyles.bronze;

  const verifyUrl = `${window.location.origin}/verify?code=${certificate.verification_code}`;

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) { toast.error('يرجى السماح بالنوافذ المنبثقة'); return; }
    printWindow.document.write(`
      <html dir="rtl"><head><title>شهادة امتثال - ${certificate.certificate_number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, sans-serif; }
        body { padding: 20mm; background: white; }
        .cert { border: 3px double #b8860b; padding: 30px; position: relative; }
        .cert::before { content: ''; position: absolute; inset: 8px; border: 1px solid #d4af37; pointer-events: none; }
        .header { text-align: center; margin-bottom: 24px; }
        .title { font-size: 28px; font-weight: bold; color: #1a365d; margin-bottom: 8px; }
        .subtitle { font-size: 14px; color: #4a5568; }
        .org-name { font-size: 24px; font-weight: bold; color: #2d3748; margin: 20px 0; text-align: center; }
        .score { font-size: 48px; font-weight: bold; text-align: center; margin: 16px 0; }
        .level { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 20px; }
        .details { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; font-size: 13px; }
        .detail-item { padding: 8px; border: 1px solid #e2e8f0; border-radius: 4px; }
        .detail-label { font-weight: bold; color: #4a5568; }
        .axes { margin: 20px 0; }
        .axis { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f0f0f0; font-size: 12px; }
        .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #718096; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        .qr { text-align: center; margin: 16px 0; }
        .iso { text-align: center; font-size: 12px; color: #4a5568; margin: 8px 0; }
        @media print { body { padding: 10mm; } }
      </style></head><body>
      <div class="cert">
        <div class="header">
          <div class="title">🏅 شهادة امتثال iRecycle</div>
          <div class="subtitle">iRecycle Compliance Certificate</div>
          <div class="iso">مبنية على معايير ${(certificate.iso_standards || ['ISO 14001:2015', 'ISO 45001:2018']).join(' | ')}</div>
        </div>
        <div class="org-name">${organization?.name || ''}</div>
        <div class="score" style="color: ${certificate.overall_score >= 90 ? '#b8860b' : certificate.overall_score >= 80 ? '#64748b' : '#c2410c'}">${certificate.overall_score}%</div>
        <div class="level">المستوى: ${style.badge}</div>
        <div class="details">
          <div class="detail-item"><span class="detail-label">رقم الشهادة:</span> ${certificate.certificate_number}</div>
          <div class="detail-item"><span class="detail-label">تاريخ الإصدار:</span> ${format(new Date(certificate.issued_at), 'dd MMMM yyyy', { locale: ar })}</div>
          <div class="detail-item"><span class="detail-label">صالحة حتى:</span> ${format(new Date(certificate.expires_at), 'dd MMMM yyyy', { locale: ar })}</div>
          <div class="detail-item"><span class="detail-label">كود التحقق:</span> ${certificate.verification_code}</div>
        </div>
        <div class="axes">
          <div class="axis"><span>${certificate.licenses_score}%</span><span>التراخيص السارية</span></div>
          <div class="axis"><span>${certificate.training_score}%</span><span>التدريب والتأهيل</span></div>
          <div class="axis"><span>${certificate.operations_score}%</span><span>السجل التشغيلي</span></div>
          <div class="axis"><span>${certificate.documentation_score}%</span><span>التوثيق الرقمي</span></div>
          <div class="axis"><span>${certificate.safety_environment_score}%</span><span>السلامة والبيئة</span></div>
        </div>
        ${generateDigitalVerificationStamp({
          referenceNumber: `COMP-${certificate.id?.slice(0,8) || Date.now()}`,
          documentType: 'certificate',
          entityName: certificate.organization_name || 'iRecycle',
          accentColor: '#059669',
          compact: true,
        })}
        <div class="footer">
          <p>هذه الشهادة صادرة آلياً من منصة iRecycle وتعكس مستوى الامتثال بناءً على البيانات التشغيلية الفعلية</p>
          <p>للتحقق: ${verifyUrl}</p>
        </div>
      </div>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            شهادة امتثال iRecycle
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className={`${style.bg} ${style.border} border-2 rounded-xl p-5 space-y-4 ring-4 ${style.ring}`}>
          {/* Header */}
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-foreground">🏅 شهادة امتثال iRecycle</h2>
            <p className="text-xs text-muted-foreground">iRecycle Compliance Certificate</p>
            <p className="text-[10px] text-muted-foreground">{(certificate.iso_standards || []).join(' | ')}</p>
          </div>

          {/* Org Name */}
          <div className="text-center">
            <h3 className="text-lg font-bold">{organization?.name}</h3>
          </div>

          {/* Score */}
          <div className="text-center">
            <div className={`text-5xl font-bold ${style.accent}`}>{certificate.overall_score}%</div>
            <Badge className={`mt-2 text-sm ${style.accent}`}>{style.badge}</Badge>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-background/50 rounded border">
              <span className="text-muted-foreground">رقم الشهادة</span>
              <p className="font-mono font-bold">{certificate.certificate_number}</p>
            </div>
            <div className="p-2 bg-background/50 rounded border">
              <span className="text-muted-foreground">تاريخ الإصدار</span>
              <p className="font-bold">{format(new Date(certificate.issued_at), 'dd MMM yyyy', { locale: ar })}</p>
            </div>
            <div className="p-2 bg-background/50 rounded border">
              <span className="text-muted-foreground">صالحة حتى</span>
              <p className="font-bold">{format(new Date(certificate.expires_at), 'dd MMM yyyy', { locale: ar })}</p>
            </div>
            <div className="p-2 bg-background/50 rounded border">
              <span className="text-muted-foreground">الحالة</span>
              <p className="font-bold flex items-center gap-1">
                {certificate.is_valid ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> سارية</> : 'منتهية'}
              </p>
            </div>
          </div>

          {/* Axes */}
          <div className="space-y-1.5 text-xs">
            {[
              { label: 'التراخيص', score: certificate.licenses_score },
              { label: 'التدريب', score: certificate.training_score },
              { label: 'العمليات', score: certificate.operations_score },
              { label: 'التوثيق', score: certificate.documentation_score },
              { label: 'السلامة', score: certificate.safety_environment_score },
            ].map(a => (
              <div key={a.label} className="flex items-center justify-between bg-background/50 rounded px-2 py-1">
                <span className="font-mono font-bold">{a.score}%</span>
                <span>{a.label}</span>
              </div>
            ))}
          </div>

          {/* QR */}
          <div className="flex justify-center">
            <QRCodeSVG value={verifyUrl} size={100} level="M" />
          </div>
          <p className="text-[9px] text-center text-muted-foreground">{certificate.verification_code}</p>

          {/* Footer */}
          <p className="text-[9px] text-center text-muted-foreground border-t pt-2">
            شهادة صادرة آلياً من منصة iRecycle • تعكس مستوى الامتثال الفعلي بناءً على البيانات التشغيلية
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handlePrint}>
            <Printer className="w-3.5 h-3.5" /> طباعة
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ComplianceCertificateView;
