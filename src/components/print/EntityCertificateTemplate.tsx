import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import {
  Factory, Truck, Recycle, Trash2, Shield, Award,
  MapPin, Calendar, Weight, FileCheck, Leaf, CheckCircle2,
} from 'lucide-react';

export type CertificateType = 
  | 'waste-generation'       // شهادة توليد مخلفات
  | 'transport-manifest'     // بيان شحن / نقل
  | 'recycling-certificate'  // شهادة إعادة تدوير
  | 'disposal-certificate'   // شهادة تخلص نهائي
  | 'environmental-compliance' // شهادة امتثال بيئي
  | 'chain-of-custody';      // شهادة سلسلة الحيازة

interface CertificateData {
  certificateNumber: string;
  issueDate?: string;
  entityName: string;
  entityLogo?: string | null;
  partnerName?: string;
  wasteType?: string;
  weight?: number;
  weightUnit?: string;
  origin?: string;
  destination?: string;
  vehiclePlate?: string;
  driverName?: string;
  notes?: string;
  verificationCode?: string;
  customFields?: { label: string; value: string }[];
}

interface EntityCertificateTemplateProps {
  type: CertificateType;
  data: CertificateData;
  designVariant?: 'standard' | 'ornate' | 'minimal' | 'bordered';
}

const CERT_CONFIG: Record<CertificateType, {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
  badgeText: string;
}> = {
  'waste-generation': {
    title: 'شهادة توليد مخلفات',
    subtitle: 'Waste Generation Certificate',
    icon: Factory,
    accentColor: '#059669',
    gradientFrom: '#064e3b',
    gradientTo: '#10b981',
    borderColor: '#a7f3d0',
    badgeText: 'مولّد معتمد',
  },
  'transport-manifest': {
    title: 'بيان شحن ونقل',
    subtitle: 'Transport Manifest',
    icon: Truck,
    accentColor: '#2563eb',
    gradientFrom: '#1e3a5f',
    gradientTo: '#60a5fa',
    borderColor: '#bfdbfe',
    badgeText: 'ناقل مرخص',
  },
  'recycling-certificate': {
    title: 'شهادة إعادة تدوير',
    subtitle: 'Recycling Certificate',
    icon: Recycle,
    accentColor: '#0d9488',
    gradientFrom: '#134e4a',
    gradientTo: '#2dd4bf',
    borderColor: '#99f6e4',
    badgeText: 'مُدوّر معتمد',
  },
  'disposal-certificate': {
    title: 'شهادة تخلص نهائي',
    subtitle: 'Final Disposal Certificate',
    icon: Trash2,
    accentColor: '#d97706',
    gradientFrom: '#713f12',
    gradientTo: '#fbbf24',
    borderColor: '#fde68a',
    badgeText: 'تخلص آمن',
  },
  'environmental-compliance': {
    title: 'شهادة امتثال بيئي',
    subtitle: 'Environmental Compliance Certificate',
    icon: Leaf,
    accentColor: '#16a34a',
    gradientFrom: '#14532d',
    gradientTo: '#4ade80',
    borderColor: '#bbf7d0',
    badgeText: 'ملتزم بيئياً',
  },
  'chain-of-custody': {
    title: 'شهادة سلسلة الحيازة',
    subtitle: 'Chain of Custody Certificate',
    icon: Shield,
    accentColor: '#7c3aed',
    gradientFrom: '#3b0764',
    gradientTo: '#a78bfa',
    borderColor: '#ddd6fe',
    badgeText: 'موثق رقمياً',
  },
};

const EntityCertificateTemplate = forwardRef<HTMLDivElement, EntityCertificateTemplateProps>(
  ({ type, data, designVariant = 'standard' }, ref) => {
    const config = CERT_CONFIG[type];
    const IconComp = config.icon;
    const now = new Date();
    const issueDate = data.issueDate || format(now, 'PPP', { locale: ar });
    const qrValue = `${window.location.origin}/qr-verify?type=entity_certificate&code=${encodeURIComponent(data.certificateNumber)}`;

    const borderStyle = designVariant === 'bordered'
      ? { border: `6px double ${config.accentColor}`, padding: '15mm 15mm 20mm 15mm' }
      : designVariant === 'ornate'
      ? { border: `4px solid ${config.borderColor}`, boxShadow: `inset 0 0 0 2px ${config.accentColor}`, padding: '15mm 15mm 20mm 15mm' }
      : {};

    return (
      <div
        ref={ref}
        dir="rtl"
        className="bg-white text-black"
        style={{
          width: '210mm',
          minHeight: '297mm',
          margin: '0 auto',
          padding: '15mm 15mm 20mm 15mm',
          fontFamily: "'Cairo', 'Amiri', sans-serif",
          position: 'relative',
          ...borderStyle,
        }}
      >
        {/* Watermark */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%) rotate(-45deg)',
          fontSize: '72px', opacity: 0.03, pointerEvents: 'none',
          fontFamily: "'Amiri', serif", whiteSpace: 'nowrap',
          color: config.accentColor,
        }}>
          {config.title}
        </div>

        {/* Corner ornaments for ornate variant */}
        {designVariant === 'ornate' && (
          <>
            <div style={{ position: 'absolute', top: '15mm', right: '15mm', fontSize: '24px', opacity: 0.15, color: config.accentColor }}>✦</div>
            <div style={{ position: 'absolute', top: '15mm', left: '15mm', fontSize: '24px', opacity: 0.15, color: config.accentColor }}>✦</div>
            <div style={{ position: 'absolute', bottom: '15mm', right: '15mm', fontSize: '24px', opacity: 0.15, color: config.accentColor }}>✦</div>
            <div style={{ position: 'absolute', bottom: '15mm', left: '15mm', fontSize: '24px', opacity: 0.15, color: config.accentColor }}>✦</div>
          </>
        )}

        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${config.gradientFrom}, ${config.gradientTo})`,
          color: '#ffffff',
          padding: '24px 32px',
          borderRadius: designVariant === 'minimal' ? '0' : '12px',
          textAlign: 'center',
          marginBottom: '24px',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <QRCodeSVG value={qrValue} size={60} level="M" bgColor="transparent" fgColor="#ffffff" />
            <div style={{ flex: 1, padding: '0 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
                <Award style={{ width: '28px', height: '28px' }} />
                <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>{config.title}</h1>
              </div>
              <p style={{ fontSize: '13px', opacity: 0.85, margin: '4px 0 0' }}>{config.subtitle}</p>
            </div>
            {data.entityLogo ? (
              <img src={data.entityLogo} alt="" style={{ height: '50px', objectFit: 'contain' }} crossOrigin="anonymous" />
            ) : (
              <Barcode value={data.certificateNumber} width={1} height={35} fontSize={0} displayValue={false} />
            )}
          </div>
        </div>

        {/* Certificate Number Badge */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span style={{
            display: 'inline-block',
            background: `${config.accentColor}15`,
            border: `2px solid ${config.accentColor}`,
            borderRadius: '8px',
            padding: '8px 24px',
            fontSize: '14px',
            fontWeight: 700,
            color: config.accentColor,
          }}>
            رقم الشهادة: <span style={{ fontFamily: 'monospace', letterSpacing: '2px' }}>{data.certificateNumber}</span>
          </span>
        </div>

        {/* Entity Info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '24px',
        }}>
          <InfoBox label="الجهة المصدرة" value={data.entityName} accent={config.accentColor} icon="🏢" />
          {data.partnerName && <InfoBox label="الجهة المستفيدة" value={data.partnerName} accent={config.accentColor} icon="🤝" />}
          <InfoBox label="تاريخ الإصدار" value={issueDate} accent={config.accentColor} icon="📅" />
          <InfoBox label="الحالة" value={config.badgeText} accent={config.accentColor} icon="✅" />
        </div>

        {/* Waste Details */}
        {(data.wasteType || data.weight) && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{
              fontSize: '16px', fontWeight: 700, color: config.accentColor,
              borderRight: `4px solid ${config.accentColor}`, paddingRight: '12px',
              marginBottom: '12px',
            }}>
              تفاصيل المخلفات
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              {data.wasteType && <InfoBox label="نوع المخلفات" value={data.wasteType} accent={config.accentColor} />}
              {data.weight && <InfoBox label="الوزن" value={`${data.weight.toLocaleString()} ${data.weightUnit || 'كجم'}`} accent={config.accentColor} />}
              {data.origin && <InfoBox label="المصدر" value={data.origin} accent={config.accentColor} />}
            </div>
          </div>
        )}

        {/* Transport Details */}
        {(data.vehiclePlate || data.driverName || data.destination) && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{
              fontSize: '16px', fontWeight: 700, color: config.accentColor,
              borderRight: `4px solid ${config.accentColor}`, paddingRight: '12px',
              marginBottom: '12px',
            }}>
              تفاصيل النقل
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              {data.vehiclePlate && <InfoBox label="لوحة المركبة" value={data.vehiclePlate} accent={config.accentColor} />}
              {data.driverName && <InfoBox label="السائق" value={data.driverName} accent={config.accentColor} />}
              {data.destination && <InfoBox label="الوجهة" value={data.destination} accent={config.accentColor} />}
            </div>
          </div>
        )}

        {/* Custom Fields */}
        {data.customFields && data.customFields.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{
              fontSize: '16px', fontWeight: 700, color: config.accentColor,
              borderRight: `4px solid ${config.accentColor}`, paddingRight: '12px',
              marginBottom: '12px',
            }}>
              بيانات إضافية
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {data.customFields.map((f, i) => (
                <InfoBox key={i} label={f.label} value={f.value} accent={config.accentColor} />
              ))}
            </div>
          </div>
        )}

        {/* Declaration */}
        <div style={{
          background: `${config.accentColor}08`,
          border: `1px solid ${config.borderColor}`,
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <CheckCircle2 style={{ width: '20px', height: '20px', color: config.accentColor }} />
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: config.accentColor, margin: 0 }}>
              إقرار رسمي
            </h3>
          </div>
          <p style={{ fontSize: '12px', lineHeight: 1.8, color: '#374151' }}>
            نقر بأن البيانات الواردة في هذه الشهادة صحيحة ودقيقة وتمثل الواقع الفعلي للعملية.
            هذه الوثيقة صادرة إلكترونياً من نظام إدارة المخلفات وإعادة التدوير وتعتبر صالحة بدون حاجة لتوقيع يدوي
            في حالة التحقق الإلكتروني عبر رمز QR المرفق.
          </p>
        </div>

        {/* Notes */}
        {data.notes && (
          <div style={{ marginBottom: '24px', padding: '12px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '4px' }}>ملاحظات:</p>
            <p style={{ fontSize: '12px', color: '#374151' }}>{data.notes}</p>
          </div>
        )}

        {/* Signature Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '24px',
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: `2px solid ${config.borderColor}`,
        }}>
          {['المسؤول المختص', 'المدير المعتمد', 'ختم المؤسسة'].map((label) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: `1px solid ${config.accentColor}`, width: '70%', margin: '30px auto 8px' }} />
              <p style={{ fontSize: '11px', color: '#6b7280' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '30px',
          paddingTop: '12px',
          borderTop: `1px solid ${config.borderColor}`,
          textAlign: 'center',
          fontSize: '10px',
          color: '#9ca3af',
        }}>
          <p>هذه الوثيقة صادرة إلكترونياً من نظام إدارة المخلفات وإعادة التدوير - آي ريسايكل</p>
          <p style={{ marginTop: '4px' }}>
            تاريخ الإصدار: {issueDate} | رقم المرجع: {data.certificateNumber} | رمز التحقق: {data.verificationCode || data.certificateNumber}
          </p>
        </div>
      </div>
    );
  }
);

EntityCertificateTemplate.displayName = 'EntityCertificateTemplate';

const InfoBox = ({ label, value, accent, icon }: { label: string; value: string; accent: string; icon?: string }) => (
  <div style={{
    padding: '10px 14px',
    background: `${accent}06`,
    borderRadius: '6px',
    borderRight: `3px solid ${accent}`,
  }}>
    <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>
      {icon && <span style={{ marginLeft: '4px' }}>{icon}</span>}{label}
    </p>
    <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: 0 }}>{value || '-'}</p>
  </div>
);

export default EntityCertificateTemplate;
