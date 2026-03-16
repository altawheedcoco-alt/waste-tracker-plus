import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import UnifiedDocumentPreview from '@/components/shared/UnifiedDocumentPreview';

interface AttestationPrintViewProps {
  attestation: any;
  onClose: () => void;
}

const AttestationPrintView = ({ attestation, onClose }: AttestationPrintViewProps) => {
  const { organization } = useAuth();
  const isExpired = new Date(attestation.valid_until) < new Date();
  const orgData = attestation.organization_data || {};

  const typeLabel = attestation.attestation_type === 'fee_payment_processing'
    ? 'إفادة بسداد الرسوم وجاري استخراج الترخيص'
    : 'إفادة بالتسجيل وتأكيد صلاحية العمل المؤقتة';

  const bodyText = attestation.attestation_type === 'fee_payment_processing'
    ? `يفيد ${organization?.name || 'الجهاز'} بأن الجهة المذكورة أعلاه قد قامت بسداد كافة الرسوم المقررة لاستخراج/تجديد الترخيص، وجاري استخراج الترخيص في مدة أقصاها ${attestation.max_validity_days} يوم عمل من تاريخ هذه الإفادة. ينتهي العمل بهذه الإفادة بانقضاء المدة المحددة أعلاه.`
    : `يفيد ${organization?.name || 'الجهاز'} بأن الجهة المذكورة أعلاه مسجلة لدى الجهاز وأن بياناتها القانونية مستوفاة. يُمكن العمل بهذه الإفادة لحين استخراج الترخيص الرسمي خلال المدة المحددة.`;

  return (
    <UnifiedDocumentPreview
      isOpen={true}
      onClose={onClose}
      title={`إفادة ${attestation.attestation_number}`}
      filename={`إفادة-${attestation.attestation_number}`}
    >
      <div dir="rtl" style={{ fontFamily: "'Cairo', 'Segoe UI', sans-serif", padding: '20mm', color: '#1a1a1a', position: 'relative' }}>
        {isExpired && (
          <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', fontSize: '80px', color: 'rgba(0,0,0,0.03)', fontWeight: 'bold', zIndex: 0 }}>
            منتهية الصلاحية
          </div>
        )}

        <div style={{ maxWidth: '700px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', borderBottom: '3px double #1a5276', paddingBottom: '16px', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '22px', margin: '8px 0 4px', color: '#1a5276' }}>
              {organization?.name || 'الجهة الرقابية'}
            </h1>
            <div style={{ fontSize: '12px', color: '#666' }}>جمهورية مصر العربية</div>
            <div style={{ background: '#f0f4f8', padding: '8px 16px', borderRadius: '6px', display: 'inline-block', fontWeight: 'bold', fontSize: '14px', margin: '12px 0' }}>
              رقم الإفادة: {attestation.attestation_number}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '8px' }}>
              {typeLabel}
            </div>
          </div>

          {/* Organization Info */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', color: '#1a5276', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '8px' }}>
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

          {/* Body Text */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', color: '#1a5276', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '8px' }}>
              نص الإفادة
            </h3>
            <p style={{ fontSize: '14px', lineHeight: 2, textAlign: 'justify' }}>
              {bodyText}
            </p>
          </div>

          {/* Validity */}
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

          {/* Footer */}
          <div style={{ borderTop: '2px solid #1a5276', paddingTop: '16px', marginTop: '32px', display: 'flex', justifyContent: 'space-between' }}>
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
      </div>
    </UnifiedDocumentPreview>
  );
};

export default AttestationPrintView;
