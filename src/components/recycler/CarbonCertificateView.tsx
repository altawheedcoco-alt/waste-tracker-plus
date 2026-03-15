import { useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Printer, Award, Leaf, Factory, TreePine, Car, Droplets } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/contexts/AuthContext';

interface CarbonCertificateViewProps {
  data: any;
  type: 'product' | 'facility';
  onBack: () => void;
  onIssue: () => void;
}

const CarbonCertificateView = ({ data, type, onBack, onIssue }: CarbonCertificateViewProps) => {
  const { organization } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;
    const htmlContent = `
      <html dir="rtl"><head><title>شهادة البصمة الكربونية</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, sans-serif; }
        body { padding: 20px; }
        @media print { body { padding: 10mm; } }
      </style></head>
      <body>${printRef.current.innerHTML}</body></html>
    `;
    import('@/services/documentService').then(({ PrintService }) => {
      PrintService.printHTML(htmlContent, { title: 'شهادة البصمة الكربونية' });
    });
  };

  const isProduct = type === 'product';
  const certNumber = data.certificate_number || 'N/A';
  const qrData = JSON.stringify({
    cert: certNumber,
    org: organization?.name,
    type,
    emissions: isProduct ? data.total_emissions : data.total_emissions,
    savings: isProduct ? data.recycling_savings : data.total_recycling_savings,
    date: new Date().toISOString().split('T')[0],
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Button variant="ghost" onClick={onBack}>
          <ArrowRight className="w-4 h-4 ml-1" />
          العودة
        </Button>
        <div className="flex gap-2">
          {!data.certificate_issued && (
            <Button onClick={onIssue} variant="default">
              <Award className="w-4 h-4 ml-1" />
              إصدار الشهادة
            </Button>
          )}
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 ml-1" />
            طباعة
          </Button>
        </div>
      </div>

      <div ref={printRef}>
        <div style={{ maxWidth: 700, margin: '0 auto', border: '3px solid #10B981', borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #059669, #10B981)', padding: '24px 32px', color: 'white', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 28 }}>🌿</span>
              <h1 style={{ fontSize: 22, fontWeight: 'bold' }}>شهادة البصمة الكربونية</h1>
              <span style={{ fontSize: 28 }}>🌿</span>
            </div>
            <p style={{ fontSize: 14, opacity: 0.9 }}>
              {isProduct ? 'Carbon Footprint Certificate - Product Level' : 'Carbon Footprint Certificate - Facility Level'}
            </p>
            <div style={{ marginTop: 8, padding: '4px 16px', background: 'rgba(255,255,255,0.2)', borderRadius: 20, display: 'inline-block', fontSize: 13 }}>
              رقم الشهادة: {certNumber}
            </div>
          </div>

          {/* Organization Info */}
          <div style={{ padding: '20px 32px', borderBottom: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <p style={{ fontSize: 11, color: '#6B7280' }}>المنشأة</p>
                <p style={{ fontSize: 16, fontWeight: 'bold' }}>{organization?.name || 'المنشأة'}</p>
                <p style={{ fontSize: 12, color: '#6B7280' }}>{(organization as any)?.city || ''} {(organization as any)?.address || ''}</p>
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 11, color: '#6B7280' }}>تاريخ الإصدار</p>
                <p style={{ fontSize: 14, fontWeight: '600' }}>{new Date().toLocaleDateString('ar-SA')}</p>
              </div>
            </div>
          </div>

          {/* Main Data */}
          <div style={{ padding: '20px 32px' }}>
            {isProduct ? (
              <>
                <h3 style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 12, color: '#059669' }}>بيانات المنتج المُدوَّر</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <InfoBox label="اسم المنتج" value={data.product_name} />
                  <InfoBox label="نوع المخلف" value={data.waste_type} />
                  <InfoBox label="الوزن المُدخل" value={`${data.input_weight_tons} طن`} />
                  <InfoBox label="الوزن المُخرج" value={`${data.output_weight_tons} طن`} />
                  <InfoBox label="المسافة" value={`${data.distance_km} كم`} />
                  <InfoBox label="معدل التدوير" value={`${data.recycling_rate}%`} />
                </div>
              </>
            ) : (
              <>
                <h3 style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 12, color: '#059669' }}>بيانات المنشأة - الفترة</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <InfoBox label="بداية الفترة" value={new Date(data.period_start).toLocaleDateString('ar-SA')} />
                  <InfoBox label="نهاية الفترة" value={new Date(data.period_end).toLocaleDateString('ar-SA')} />
                  <InfoBox label="عدد الشحنات" value={data.shipments_count} />
                  <InfoBox label="إجمالي المدخلات" value={`${data.total_input_tons} طن`} />
                  <InfoBox label="إجمالي المخرجات" value={`${data.total_output_tons} طن`} />
                  <InfoBox label="نقاط الاستدامة" value={`${data.sustainability_score}/100`} />
                </div>
              </>
            )}
          </div>

          {/* Environmental Impact */}
          <div style={{ padding: '20px 32px', background: '#F0FDF4', borderTop: '1px solid #D1FAE5' }}>
            <h3 style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 16, color: '#059669' }}>الأثر البيئي</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, textAlign: 'center' }}>
              <ImpactBox icon="🏭" label="إجمالي الانبعاثات" value={`${isProduct ? data.total_emissions : data.total_emissions} طن CO₂`} color="#EF4444" />
              <ImpactBox icon="🌱" label="الوفورات البيئية" value={`${isProduct ? data.recycling_savings : data.total_recycling_savings} طن CO₂`} color="#10B981" />
              <ImpactBox icon="📊" label="صافي الأثر" value={`${isProduct ? data.net_impact : data.total_net_impact} طن CO₂`} color={((isProduct ? data.net_impact : data.total_net_impact) || 0) <= 0 ? '#10B981' : '#EF4444'} />
            </div>

            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <EquivBox icon="🌳" label="أشجار مُعادلة" value={`${isProduct ? data.trees_equivalent : data.total_trees_equivalent} شجرة/سنة`} />
              <EquivBox icon="🚗" label="سيارات مُعادلة" value={`${isProduct ? data.cars_equivalent : data.total_cars_equivalent} سيارة/سنة`} />
            </div>
          </div>

          {/* QR Code + Footer */}
          <div style={{ padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E7EB', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <QRCodeSVG value={qrData} size={80} />
              <p style={{ fontSize: 9, color: '#9CA3AF', marginTop: 4 }}>امسح للتحقق</p>
            </div>
            <div style={{ textAlign: 'left', fontSize: 10, color: '#9CA3AF' }}>
              <p>تم الحساب وفقاً لبروتوكول الغازات الدفيئة (GHG Protocol)</p>
              <p>ومعاملات IPCC 2006 للانبعاثات</p>
              <p style={{ marginTop: 4 }}>
                {data.certificate_issued ? '✅ شهادة صادرة ومُعتمدة' : '⏳ قيد المراجعة'}
              </p>
            </div>
          </div>

          {/* إخلاء مسؤولية قانوني */}
          <div style={{ padding: '12px 32px', background: '#FEF3C7', borderTop: '2px solid #F59E0B', fontSize: 9, color: '#92400E', lineHeight: 1.7, textAlign: 'center' }}>
            <p style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 10 }}>⚖️ إخلاء مسؤولية</p>
            <p>
              تعتبر هذه المنصة وسيطاً تقنياً لنقل وتداول البيانات، وتقع المسئولية القانونية الكاملة عن صحة البيانات المدخلة ومطابقتها للواقع الفعلي على عاتق المستخدم (المولد/ الناقل/ المستلم) دون أدنى مسئولية على إدارة المنصة.
            </p>
            <p style={{ marginTop: 4, fontSize: 8, color: '#B45309' }}>
              هذا المستند صدر آلياً من منصة iRecycle ولا يتطلب توقيعاً خطياً أو ختماً يدوياً للاعتداد به رقمياً (وفقاً للقانون 15/2004). البيانات الواردة تحت مسؤولية الجهة المُصدرة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoBox = ({ label, value }: { label: string; value: any }) => (
  <div style={{ padding: '8px 12px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
    <p style={{ fontSize: 10, color: '#6B7280' }}>{label}</p>
    <p style={{ fontSize: 14, fontWeight: '600' }}>{value}</p>
  </div>
);

const ImpactBox = ({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) => (
  <div style={{ padding: 12, background: 'white', borderRadius: 10, border: '1px solid #D1FAE5' }}>
    <span style={{ fontSize: 24 }}>{icon}</span>
    <p style={{ fontSize: 10, color: '#6B7280', marginTop: 4 }}>{label}</p>
    <p style={{ fontSize: 16, fontWeight: 'bold', color }}>{value}</p>
  </div>
);

const EquivBox = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <div style={{ padding: '8px 12px', background: 'white', borderRadius: 8, border: '1px solid #D1FAE5', display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{ fontSize: 20 }}>{icon}</span>
    <div>
      <p style={{ fontSize: 10, color: '#6B7280' }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: '600' }}>{value}</p>
    </div>
  </div>
);

export default CarbonCertificateView;
