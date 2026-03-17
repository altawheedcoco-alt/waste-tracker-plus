import React from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';

interface Operation {
  id: string;
  operation_number?: string;
  waste_type: string;
  waste_description?: string;
  quantity: number;
  unit?: string;
  disposal_method?: string;
  cost?: number;
  currency?: string;
  status: string;
  certificate_number?: string;
  created_at: string;
  processing_completed_at?: string;
}

interface DisposalAccountStatementPrintProps {
  operations: Operation[];
  facilityName: string;
  facilityAddress?: string;
  facilityLicense?: string;
  clientName: string;
  clientAddress?: string;
  statementNumber: string;
  periodFrom: string;
  periodTo: string;
  stamp_url?: string | null;
  signature_url?: string | null;
  includeStamp?: boolean;
  includeSignature?: boolean;
}

const methodLabels: Record<string, string> = {
  incineration: 'حرق',
  landfill: 'دفن',
  chemical_treatment: 'كيميائي',
};

const DisposalAccountStatementPrint = ({
  operations, facilityName, facilityAddress, facilityLicense,
  clientName, clientAddress, statementNumber, periodFrom, periodTo,
  stamp_url, signature_url, includeStamp = true, includeSignature = true,
}: DisposalAccountStatementPrintProps) => {
  const currentDate = format(new Date(), 'dd MMMM yyyy', { locale: ar });
  const totalQuantity = operations.reduce((s, o) => s + (o.quantity || 0), 0);
  const totalCost = operations.reduce((s, o) => s + (o.cost || 0), 0);
  const completedOps = operations.filter(o => o.status === 'completed');
  const withCert = operations.filter(o => o.certificate_number);

  return (
    <div
      className="bg-white mx-auto print:p-0 print:shadow-none"
      style={{
        maxWidth: '210mm',
        fontFamily: 'Cairo, sans-serif',
        direction: 'rtl',
        fontSize: '9pt',
        lineHeight: '1.4',
        padding: '15mm 15mm 20mm 15mm',
      }}
    >
      {/* Header */}
      <div className="text-center mb-5 pb-3" style={{ borderBottom: '3px solid #7c3aed' }}>
        <div className="flex items-center justify-between mb-2">
          <div style={{ width: '28%' }}>
            <Barcode value={statementNumber} width={1} height={30} fontSize={7} displayValue />
          </div>
          <div className="text-center flex-1">
            <h1 style={{ fontSize: '16pt', fontWeight: 'bold', color: '#6d28d9', marginBottom: '2px' }}>
              كشف حساب شامل — التخلص الآمن
            </h1>
            <p style={{ fontSize: '9pt', color: '#888' }}>
              رقم الكشف: <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{statementNumber}</span>
            </p>
            <p style={{ fontSize: '8pt', color: '#aaa' }}>
              الفترة: {format(new Date(periodFrom), 'dd/MM/yyyy')} — {format(new Date(periodTo), 'dd/MM/yyyy')}
            </p>
          </div>
          <div style={{ width: '28%' }} className="flex justify-end">
            <QRCodeSVG value={`${window.location.origin}/qr-verify?type=statement&code=${encodeURIComponent(statementNumber)}`} size={70} />
          </div>
        </div>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="p-3 rounded-lg" style={{ backgroundColor: '#faf5ff', border: '1px solid #e9d5ff' }}>
          <h3 style={{ fontSize: '9pt', fontWeight: 'bold', color: '#6d28d9', marginBottom: '6px' }}>🏭 جهة التخلص</h3>
          <p style={{ fontSize: '8pt' }}><strong>{facilityName}</strong></p>
          {facilityAddress && <p style={{ fontSize: '7pt', color: '#666' }}>{facilityAddress}</p>}
          {facilityLicense && <p style={{ fontSize: '7pt', color: '#666' }}>ترخيص: {facilityLicense}</p>}
        </div>
        <div className="p-3 rounded-lg" style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}>
          <h3 style={{ fontSize: '9pt', fontWeight: 'bold', color: '#0369a1', marginBottom: '6px' }}>🏢 العميل</h3>
          <p style={{ fontSize: '8pt' }}><strong>{clientName}</strong></p>
          {clientAddress && <p style={{ fontSize: '7pt', color: '#666' }}>{clientAddress}</p>}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'إجمالي العمليات', value: operations.length },
          { label: 'الأوزان (طن)', value: totalQuantity.toFixed(2) },
          { label: 'الشهادات الصادرة', value: withCert.length },
          { label: 'إجمالي التكلفة (ج.م)', value: totalCost.toLocaleString() },
        ].map((s) => (
          <div key={s.label} className="text-center p-2 rounded" style={{ backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: '16pt', fontWeight: 'bold', color: '#6d28d9' }}>{s.value}</p>
            <p style={{ fontSize: '7pt', color: '#666' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Operations Table */}
      <div className="mb-5">
        <h3 style={{ fontSize: '10pt', fontWeight: 'bold', marginBottom: '6px' }}>📋 تفاصيل العمليات</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7pt' }}>
          <thead>
            <tr style={{ backgroundColor: '#6d28d9', color: 'white' }}>
              {['#', 'رقم العملية', 'نوع المخلف', 'الكمية', 'الطريقة', 'التكلفة', 'الشهادة', 'التاريخ'].map((h) => (
                <th key={h} style={{ border: '1px solid #5b21b6', padding: '5px', textAlign: 'center' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {operations.map((op, i) => (
              <tr key={op.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#faf5ff' }}>
                <td style={{ border: '1px solid #d1d5db', padding: '4px', textAlign: 'center' }}>{i + 1}</td>
                <td style={{ border: '1px solid #d1d5db', padding: '4px', fontFamily: 'monospace', fontSize: '7pt' }}>{op.operation_number || op.id.slice(0, 8)}</td>
                <td style={{ border: '1px solid #d1d5db', padding: '4px' }}>{op.waste_description || op.waste_type}</td>
                <td style={{ border: '1px solid #d1d5db', padding: '4px', textAlign: 'center' }}>{op.quantity} {op.unit || 'طن'}</td>
                <td style={{ border: '1px solid #d1d5db', padding: '4px', textAlign: 'center' }}>{methodLabels[op.disposal_method || ''] || '-'}</td>
                <td style={{ border: '1px solid #d1d5db', padding: '4px', textAlign: 'center' }}>{op.cost ? `${op.cost.toLocaleString()} ج.م` : '-'}</td>
                <td style={{ border: '1px solid #d1d5db', padding: '4px', textAlign: 'center', fontFamily: 'monospace', fontSize: '6pt' }}>{op.certificate_number || '-'}</td>
                <td style={{ border: '1px solid #d1d5db', padding: '4px', textAlign: 'center' }}>
                  {op.processing_completed_at ? format(new Date(op.processing_completed_at), 'dd/MM/yyyy') : format(new Date(op.created_at), 'dd/MM/yyyy')}
                </td>
              </tr>
            ))}
            <tr style={{ backgroundColor: '#ede9fe', fontWeight: 'bold' }}>
              <td colSpan={3} style={{ border: '1px solid #d1d5db', padding: '5px', textAlign: 'center' }}>الإجمالي</td>
              <td style={{ border: '1px solid #d1d5db', padding: '5px', textAlign: 'center' }}>{totalQuantity.toFixed(2)}</td>
              <td style={{ border: '1px solid #d1d5db', padding: '5px' }} />
              <td style={{ border: '1px solid #d1d5db', padding: '5px', textAlign: 'center' }}>{totalCost.toLocaleString()} ج.م</td>
              <td colSpan={2} style={{ border: '1px solid #d1d5db', padding: '5px' }} />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Signature with QR */}
      <div className="pt-3" style={{ borderTop: '2px solid #7c3aed' }}>
        <div className="grid grid-cols-2 gap-8">
          <div className="text-center">
            <p style={{ fontWeight: 'bold', fontSize: '9pt', marginBottom: '8px' }}>جهة التخلص</p>
            <p style={{ fontSize: '8pt', color: '#666', marginBottom: '12px' }}>{facilityName}</p>
            <div className="flex items-center justify-center gap-4">
              {includeStamp && stamp_url && (
                <img src={stamp_url} alt="ختم" style={{ width: '70px', height: '70px', objectFit: 'contain', opacity: 0.9 }} crossOrigin="anonymous" />
              )}
              {includeSignature && signature_url && (
                <img src={signature_url} alt="توقيع" style={{ width: '80px', height: '40px', objectFit: 'contain' }} crossOrigin="anonymous" />
              )}
            </div>
            <div className="mt-2 flex justify-center">
              <QRCodeSVG value={`${window.location.origin}/qr-verify?type=signer&code=${encodeURIComponent(facilityLicense || facilityName)}&doc=${encodeURIComponent(statementNumber)}`} size={30} level="L" />
            </div>
            <p style={{ fontSize: '5pt', color: '#9ca3af', marginTop: '2px' }}>QR الموقع</p>
          </div>
          <div className="text-center">
            <p style={{ fontWeight: 'bold', fontSize: '9pt', marginBottom: '8px' }}>العميل</p>
            <p style={{ fontSize: '8pt', color: '#666', marginBottom: '12px' }}>{clientName}</p>
            <div style={{ borderBottom: '1px dotted #999', width: '150px', margin: '30px auto 0' }} />
            <p style={{ fontSize: '6pt', color: '#9ca3af', marginTop: '4px' }}>التوقيع</p>
            <div className="mt-2 flex justify-center">
              <QRCodeSVG value={`${window.location.origin}/qr-verify?type=signer&code=${encodeURIComponent(clientName || 'client')}&doc=${encodeURIComponent(statementNumber)}`} size={30} level="L" />
            </div>
            <p style={{ fontSize: '5pt', color: '#9ca3af', marginTop: '2px' }}>QR الموقع</p>
          </div>
        </div>
        <p className="text-center" style={{ fontSize: '7pt', color: '#9ca3af', marginTop: '12px' }}>
          تاريخ الإصدار: {currentDate}
        </p>
      </div>

      <div className="mt-3 pt-2 text-center" style={{ borderTop: '1px dashed #d1d5db', fontSize: '7pt', color: '#9ca3af' }}>
        <p>كشف حساب صادر إلكترونياً — يمكن التحقق بمسح رمز QR</p>
      </div>
    </div>
  );
};

export default DisposalAccountStatementPrint;
