import { useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UnifiedDocumentPreview from '@/components/shared/UnifiedDocumentPreview';
import {
  generateGuillocheTextFillerHTML,
  generatePrintWatermarkHTML,
  generateMICRLineHTML,
  generateVerticalStampHTML,
  getSecurePrintCSS,
  MICR_FONT_FACE_CSS,
} from '@/lib/printSecurityUtils';
import { generateDigitalVerificationStamp } from '@/lib/digitalVerificationStamp';

interface AttestationPrintViewProps {
  attestation: any;
  onClose: () => void;
}

const AttestationPrintView = ({ attestation, onClose }: AttestationPrintViewProps) => {
  const { organization, profile } = useAuth();
  const isExpired = new Date(attestation.valid_until) < new Date();
  const orgData = attestation.organization_data || {};

  const typeLabel = attestation.attestation_type === 'fee_payment_processing'
    ? 'إفادة بسداد الرسوم وجاري استخراج الترخيص'
    : 'إفادة بالتسجيل وتأكيد صلاحية العمل المؤقتة';

  const bodyText = attestation.attestation_type === 'fee_payment_processing'
    ? `يفيد ${organization?.name || 'الجهاز'} بأن الجهة المذكورة أعلاه قد قامت بسداد كافة الرسوم المقررة لاستخراج/تجديد الترخيص، وجاري استخراج الترخيص في مدة أقصاها ${attestation.max_validity_days} يوم عمل من تاريخ هذه الإفادة. ينتهي العمل بهذه الإفادة بانقضاء المدة المحددة أعلاه.`
    : `يفيد ${organization?.name || 'الجهاز'} بأن الجهة المذكورة أعلاه مسجلة لدى الجهاز وأن بياناتها القانونية مستوفاة. يُمكن العمل بهذه الإفادة لحين استخراج الترخيص الرسمي خلال المدة المحددة.`;

  const orgName = organization?.name || 'الجهة الرقابية';
  const userName = profile?.full_name || 'مستخدم النظام';
  const accentColor = '#1a5276';

  // Security layers HTML
  const guillocheHTML = generateGuillocheTextFillerHTML(accentColor);
  const watermarkHTML = generatePrintWatermarkHTML(orgName, userName);
  const micrHTML = generateMICRLineHTML(orgData.license_number, attestation.attestation_number);
  const verticalStampHTML = generateVerticalStampHTML();
  const digitalStampHTML = generateDigitalVerificationStamp({
    referenceNumber: attestation.attestation_number,
    documentType: 'attestation',
    entityName: orgName,
    accentColor,
    seal: organization?.id ? {
      entityId: organization.id,
      entityType: 'organization',
      entityDisplayName: orgName,
    } : undefined,
  });

  return (
    <UnifiedDocumentPreview
      isOpen={true}
      onClose={onClose}
      title={`إفادة ${attestation.attestation_number}`}
      filename={`إفادة-${attestation.attestation_number}`}
    >
      <div
        dir="rtl"
        style={{
          fontFamily: "'Cairo', 'Segoe UI', sans-serif",
          width: '210mm',
          minHeight: '297mm',
          margin: '0 auto',
          padding: '15mm 15mm 20mm 15mm',
          color: '#1a1a1a',
          position: 'relative',
          boxSizing: 'border-box',
          WebkitPrintColorAdjust: 'exact' as any,
        }}
      >
        {/* Security Layer 1: Guilloche Text Filler */}
        <div dangerouslySetInnerHTML={{ __html: guillocheHTML }} />

        {/* Security Layer 2: Dynamic Watermark */}
        <div dangerouslySetInnerHTML={{ __html: watermarkHTML }} />

        {/* Expired Watermark */}
        {isExpired && (
          <div style={{
            position: 'absolute', top: '40%', left: '50%',
            transform: 'translate(-50%, -50%) rotate(-30deg)',
            fontSize: '80px', color: 'rgba(220,38,38,0.06)', fontWeight: 'bold', zIndex: 3,
            pointerEvents: 'none',
          }}>
            منتهية الصلاحية
          </div>
        )}

        {/* Security Layer 3: Document Content */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '700px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', borderBottom: `3px double ${accentColor}`, paddingBottom: '16px', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '22px', margin: '8px 0 4px', color: accentColor }}>
              {orgName}
            </h1>
            <div style={{ fontSize: '12px', color: '#666' }}>جمهورية مصر العربية</div>
            <div style={{
              background: 'rgba(240,244,248,0.7)',
              padding: '8px 16px',
              borderRadius: '6px',
              display: 'inline-block',
              fontWeight: 'bold',
              fontSize: '14px',
              margin: '12px 0',
              border: `1px solid ${accentColor}30`,
            }}>
              رقم الإفادة: {attestation.attestation_number}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '8px' }}>
              {typeLabel}
            </div>
          </div>

          {/* Organization Info */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', color: accentColor, borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '8px' }}>
              بيانات الجهة
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
              <div style={{ fontSize: '13px', padding: '4px 0', background: 'transparent' }}><strong>الاسم: </strong>{orgData.name || '-'}</div>
              <div style={{ fontSize: '13px', padding: '4px 0', background: 'transparent' }}><strong>النوع: </strong>{orgData.organization_type || '-'}</div>
              <div style={{ fontSize: '13px', padding: '4px 0', background: 'transparent' }}><strong>البريد: </strong>{orgData.email || '-'}</div>
              <div style={{ fontSize: '13px', padding: '4px 0', background: 'transparent' }}><strong>الهاتف: </strong>{orgData.phone || '-'}</div>
              {orgData.license_number && <div style={{ fontSize: '13px', padding: '4px 0', background: 'transparent' }}><strong>رقم الترخيص: </strong>{orgData.license_number}</div>}
              {orgData.license_expiry && <div style={{ fontSize: '13px', padding: '4px 0', background: 'transparent' }}><strong>تاريخ انتهاء الترخيص: </strong>{new Date(orgData.license_expiry).toLocaleDateString('ar-EG')}</div>}
            </div>
          </div>

          {/* Body Text */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', color: accentColor, borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '8px' }}>
              نص الإفادة
            </h3>
            <p style={{ fontSize: '14px', lineHeight: 2, textAlign: 'justify', background: 'transparent' }}>
              {bodyText}
            </p>
          </div>

          {/* Validity */}
          <div style={{
            background: isExpired ? 'rgba(254,242,242,0.7)' : 'rgba(240,253,244,0.7)',
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
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '16px', background: 'transparent' }}>
              <strong>ملاحظات: </strong>{attestation.notes}
            </div>
          )}

          {/* Digital Verification Stamp */}
          <div dangerouslySetInnerHTML={{ __html: digitalStampHTML }} />

          {/* Footer with signatures */}
          <div style={{ borderTop: `2px solid ${accentColor}`, paddingTop: '16px', marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
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

          {/* Vertical Security Stamp */}
          <div style={{ marginTop: '12px' }} dangerouslySetInnerHTML={{ __html: verticalStampHTML }} />

          {/* MICR Line */}
          <div style={{ marginTop: '8px' }} dangerouslySetInnerHTML={{ __html: micrHTML }} />

          {/* System Footer */}
          <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '9px', color: '#9ca3af', borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
            <p>هذه الوثيقة صادرة إلكترونياً من منصة iRecycle لإدارة المخلفات — مؤمنة بختم رقمي وعلامة مائية</p>
          </div>
        </div>

        {/* Inject MICR font + secure print CSS */}
        <style dangerouslySetInnerHTML={{ __html: `${MICR_FONT_FACE_CSS}\n${getSecurePrintCSS()}` }} />
      </div>
    </UnifiedDocumentPreview>
  );
};

export default AttestationPrintView;
