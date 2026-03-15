import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, X, Shield } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface SafetyCardPrintViewProps {
  record: any;
  organizationName: string;
  onClose: () => void;
}

const SafetyCardPrintView = ({ record, organizationName, onClose }: SafetyCardPrintViewProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = cardRef.current;
    if (!printContent) return;
    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>كارنيه السيفتي - ${record.trainee_name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; }
          @media print { body { background: white; } .no-print { display: none !important; } }
        </style>
      </head>
      <body>
        ${printContent.outerHTML}
      </body>
      </html>
    `;
    import('@/services/documentService').then(({ PrintService }) => {
      PrintService.printHTML(htmlContent, { title: `كارنيه السيفتي - ${record.trainee_name}` });
    });
  };

  const expired = record.card_expires_at && new Date(record.card_expires_at) < new Date();
  const qrValue = record.card_qr_data || JSON.stringify({ card: record.card_number, name: record.trainee_name });

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent dir="rtl" className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <Button size="sm" onClick={handlePrint}><Printer className="w-4 h-4 ml-1" />طباعة</Button>
            <span>كارنيه السيفتي</span>
          </DialogTitle>
        </DialogHeader>

        {/* Card Design */}
        <div ref={cardRef} style={{ width: '400px', margin: '0 auto' }}>
          {/* Front Side */}
          <div style={{
            width: '400px', height: '250px', borderRadius: '16px', overflow: 'hidden',
            background: 'linear-gradient(135deg, #1a5632 0%, #2d8a56 50%, #1a5632 100%)',
            color: 'white', padding: '20px', position: 'relative',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ textAlign: 'left' }}>
                <QRCodeSVG value={qrValue} size={60} bgColor="transparent" fgColor="white" level="M" />
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginBottom: '4px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>كارنيه السلامة المهنية</span>
                  <Shield style={{ width: '20px', height: '20px' }} />
                </div>
                <p style={{ fontSize: '10px', opacity: 0.8 }}>Safety Certification Card</p>
                <p style={{ fontSize: '11px', opacity: 0.9, marginTop: '2px' }}>{organizationName}</p>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.3)', margin: '8px 0' }} />

            {/* Body */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'left', fontSize: '10px' }}>
                <p style={{ opacity: 0.7 }}>رقم الكارنيه</p>
                <p style={{ fontWeight: 'bold', fontSize: '12px', fontFamily: 'monospace' }}>{record.card_number || 'N/A'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '20px', fontWeight: 'bold' }}>{record.trainee_name}</p>
                <p style={{ fontSize: '12px', opacity: 0.8 }}>{record.trainee_job_title || 'موظف'}</p>
                {record.trainee_national_id && <p style={{ fontSize: '10px', opacity: 0.7, fontFamily: 'monospace' }}>الرقم القومي: {record.trainee_national_id}</p>}
              </div>
            </div>

            {/* Footer */}
            <div style={{ position: 'absolute', bottom: '16px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
              <div style={{ textAlign: 'left' }}>
                <p style={{ opacity: 0.7 }}>ينتهي في</p>
                <p style={{ fontWeight: 'bold', color: expired ? '#ff6b6b' : '#90EE90' }}>
                  {record.card_expires_at ? format(new Date(record.card_expires_at), 'dd/MM/yyyy') : '-'}
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ opacity: 0.7 }}>الدورة</p>
                <p style={{ fontWeight: 'bold', fontSize: '11px' }}>{record.safety_training_courses?.title || '-'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ opacity: 0.7 }}>تاريخ الإصدار</p>
                <p style={{ fontWeight: 'bold' }}>
                  {record.card_issued_at ? format(new Date(record.card_issued_at), 'dd/MM/yyyy') : '-'}
                </p>
              </div>
            </div>

            {/* Watermark */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.05, fontSize: '80px', fontWeight: 'bold', pointerEvents: 'none' }}>
              🛡️
            </div>
          </div>

          {/* Back Side */}
          <div style={{
            width: '400px', minHeight: '180px', borderRadius: '0 0 16px 16px', overflow: 'hidden',
            background: '#f8f9fa', color: '#333', padding: '16px',
            borderTop: '3px dashed #ccc',
            fontSize: '10px',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <p style={{ fontWeight: 'bold', fontSize: '11px' }}>⚠️ تعليمات مهمة</p>
            </div>
            <ul style={{ paddingRight: '16px', lineHeight: '1.8', textAlign: 'right' }}>
              <li>هذا الكارنيه يثبت اجتياز حامله لدورة السلامة المهنية المعتمدة</li>
              <li>يجب حمل الكارنيه أثناء العمل في المنشأة</li>
              <li>يجب تجديد الكارنيه قبل تاريخ الانتهاء</li>
              <li>يمكن التحقق من صلاحية الكارنيه بمسح رمز QR</li>
              <li>وفقاً لقانون العمل المصري وقانون البيئة رقم 4/1994</li>
            </ul>
            <div style={{ textAlign: 'center', marginTop: '8px', opacity: 0.6, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              صادر من نظام <img src="/irecycle-logo.png" alt="iRecycle" style={{ height: '14px', verticalAlign: 'middle', borderRadius: '3px' }} /> لإدارة المخلفات — {new Date().getFullYear()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SafetyCardPrintView;
