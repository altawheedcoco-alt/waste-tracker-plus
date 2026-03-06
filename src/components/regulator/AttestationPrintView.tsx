import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AttestationPrintViewProps {
  attestation: any;
  onClose: () => void;
}

const AttestationPrintView = ({ attestation, onClose }: AttestationPrintViewProps) => {
  const { organization } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const isExpired = new Date(attestation.valid_until) < new Date();
  const orgData = attestation.organization_data || {};

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head><meta charset="UTF-8"><title>إفادة ${attestation.attestation_number}</title>
      <style>
        @page { size: A4; margin: 20mm; }
        body { font-family: 'Cairo', 'Segoe UI', sans-serif; direction: rtl; padding: 0; margin: 0; color: #1a1a1a; }
        .print-container { max-width: 700px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 3px double #1a5276; padding-bottom: 16px; margin-bottom: 24px; }
        .header h1 { font-size: 22px; margin: 8px 0 4px; color: #1a5276; }
        .header .sub { font-size: 12px; color: #666; }
        .att-number { background: #f0f4f8; padding: 8px 16px; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 14px; margin: 12px 0; }
        .section { margin-bottom: 20px; }
        .section h3 { font-size: 14px; color: #1a5276; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 8px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; }
        .info-item { display: flex; gap: 8px; font-size: 13px; padding: 4px 0; }
        .info-item .label { font-weight: bold; min-width: 120px; color: #555; }
        .body-text { font-size: 14px; line-height: 2; text-align: justify; }
        .validity { background: ${isExpired ? '#fef2f2' : '#f0fdf4'}; border: 1px solid ${isExpired ? '#fecaca' : '#bbf7d0'}; padding: 12px; border-radius: 8px; text-align: center; margin: 16px 0; }
        .footer { border-top: 2px solid #1a5276; padding-top: 16px; margin-top: 32px; display: flex; justify-content: space-between; }
        .stamp { text-align: center; }
        .stamp .box { border: 2px dashed #aaa; border-radius: 8px; width: 140px; height: 80px; display: flex; align-items: center; justify-content: center; color: #aaa; font-size: 11px; margin: 0 auto; }
        .watermark { position: fixed; top: 40%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 80px; color: rgba(0,0,0,0.03); font-weight: bold; z-index: -1; }
      </style></head>
      <body>
        ${isExpired ? '<div class="watermark">منتهية الصلاحية</div>' : ''}
        ${content.innerHTML}
      </body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const typeLabel = attestation.attestation_type === 'fee_payment_processing'
    ? 'إفادة بسداد الرسوم وجاري استخراج الترخيص'
    : 'إفادة بالتسجيل وتأكيد صلاحية العمل المؤقتة';

  const bodyText = attestation.attestation_type === 'fee_payment_processing'
    ? `يفيد ${organization?.name || 'الجهاز'} بأن الجهة المذكورة أعلاه قد قامت بسداد كافة الرسوم المقررة لاستخراج/تجديد الترخيص، وجاري استخراج الترخيص في مدة أقصاها ${attestation.max_validity_days} يوم عمل من تاريخ هذه الإفادة. ينتهي العمل بهذه الإفادة بانقضاء المدة المحددة أعلاه.`
    : `يفيد ${organization?.name || 'الجهاز'} بأن الجهة المذكورة أعلاه مسجلة لدى الجهاز وأن بياناتها القانونية مستوفاة. يُمكن العمل بهذه الإفادة لحين استخراج الترخيص الرسمي خلال المدة المحددة.`;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>عرض الإفادة</span>
            <div className="flex gap-2">
              <Button size="sm" onClick={handlePrint}><Printer className="w-4 h-4 ml-1" /> طباعة</Button>
              <Button size="sm" variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="print-container">
          <div className="header" style={{ textAlign: 'center', borderBottom: '3px double hsl(var(--primary))', paddingBottom: '16px', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '22px', margin: '8px 0 4px', color: 'hsl(var(--primary))' }}>
              {organization?.name || 'الجهة الرقابية'}
            </h1>
            <div className="sub" style={{ fontSize: '12px', color: '#666' }}>جمهورية مصر العربية</div>
            <div style={{ background: '#f0f4f8', padding: '8px 16px', borderRadius: '6px', display: 'inline-block', fontWeight: 'bold', fontSize: '14px', margin: '12px 0' }}>
              رقم الإفادة: {attestation.attestation_number}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '8px' }}>
              {typeLabel}
            </div>
          </div>

          <div className="section" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', color: 'hsl(var(--primary))', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '8px' }}>
              بيانات الجهة
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
              <div style={{ fontSize: '13px', padding: '4px 0' }}><strong>الاسم: </strong>{orgData.name || '-'}</div>
              <div style={{ fontSize: '13px', padding: '4px 0' }}><strong>النوع: </strong>{orgData.organization_type || '-'}</div>
              <div style={{ fontSize: '13px', padding: '4px 0' }}><strong>البريد: </strong>{orgData.email || '-'}</div>
              <div style={{ fontSize: '13px', padding: '4px 0' }}><strong>الهاتف: </strong>{orgData.phone || '-'}</div>
              {orgData.license_number && <div style={{ fontSize: '13px', padding: '4px 0' }}><strong>رقم الترخيص: </strong>{orgData.license_number}</div>}
              {orgData.license_expiry && <div style={{ fontSize: '13px', padding: '4px 0' }}><strong>تاريخ انتهاء الترخيص: </strong>{new Date(orgData.license_expiry).toLocaleDateString('ar-EG')}</div>}
            </div>
          </div>

          <div className="section" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', color: 'hsl(var(--primary))', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '8px' }}>
              نص الإفادة
            </h3>
            <p style={{ fontSize: '14px', lineHeight: 2, textAlign: 'justify' }}>
              {bodyText}
            </p>
          </div>

          <div style={{
            background: isExpired ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${isExpired ? '#fecaca' : '#bbf7d0'}`,
            padding: '12px',
            borderRadius: '8px',
            textAlign: 'center',
            margin: '16px 0',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
              {isExpired ? '⚠️ هذه الإفادة منتهية الصلاحية' : '✅ إفادة سارية المفعول'}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              صادرة بتاريخ: {new Date(attestation.issued_at).toLocaleDateString('ar-EG')} — 
              سارية حتى: {new Date(attestation.valid_until).toLocaleDateString('ar-EG')}
            </div>
          </div>

          {attestation.notes && (
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '16px' }}>
              <strong>ملاحظات: </strong>{attestation.notes}
            </div>
          )}

          <div style={{ borderTop: '2px solid hsl(var(--primary))', paddingTop: '16px', marginTop: '32px', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>تاريخ الإصدار</div>
              <div style={{ fontSize: '13px' }}>{new Date(attestation.issued_at).toLocaleDateString('ar-EG')}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ border: '2px dashed #aaa', borderRadius: '8px', width: '140px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '11px' }}>
                ختم الجهاز
              </div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>التوقيع</div>
              <div style={{ border: '1px dashed #ccc', width: '120px', height: '40px', borderRadius: '4px', marginTop: '4px' }} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttestationPrintView;
