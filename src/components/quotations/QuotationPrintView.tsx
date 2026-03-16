import { type Quotation, type QuotationItem } from '@/hooks/useQuotations';
import { format } from 'date-fns';

interface Props {
  quotation: Quotation;
  items: QuotationItem[];
  organizationName: string;
}

const QuotationPrintView = ({ quotation, items, organizationName }: Props) => {
  return (
    <div dir="rtl" style={{ fontFamily: 'Arial, sans-serif', padding: '15mm 15mm 20mm 15mm', maxWidth: '210mm', margin: '0 auto', color: '#1a1a1a', fontSize: '12px', lineHeight: '1.6', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ borderBottom: '3px solid #1e40af', paddingBottom: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e40af', margin: 0 }}>عرض سعر</h1>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>PRICE QUOTATION</p>
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontWeight: 'bold', fontSize: '14px' }}>{organizationName}</p>
            <p style={{ color: '#6b7280', fontSize: '11px' }}>رقم العرض: {quotation.quotation_number}</p>
            <p style={{ color: '#6b7280', fontSize: '11px' }}>التاريخ: {format(new Date(quotation.created_at!), 'dd/MM/yyyy')}</p>
          </div>
        </div>
      </div>

      {/* Client Info */}
      <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px', marginBottom: '20px', border: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}>بيانات العميل</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
          <div><span style={{ color: '#6b7280' }}>الاسم:</span> <strong>{quotation.client_name || '-'}</strong></div>
          <div><span style={{ color: '#6b7280' }}>الهاتف:</span> <strong>{quotation.client_phone || '-'}</strong></div>
          <div><span style={{ color: '#6b7280' }}>البريد:</span> <strong>{quotation.client_email || '-'}</strong></div>
          <div><span style={{ color: '#6b7280' }}>العنوان:</span> <strong>{quotation.client_address || '-'}</strong></div>
          {quotation.client_tax_number && <div><span style={{ color: '#6b7280' }}>الرقم الضريبي:</span> <strong>{quotation.client_tax_number}</strong></div>}
        </div>
      </div>

      {/* Description */}
      {quotation.description && (
        <div style={{ marginBottom: '20px', fontSize: '12px', color: '#374151', fontStyle: 'italic', borderRight: '3px solid #1e40af', paddingRight: '12px' }}>
          {quotation.description}
        </div>
      )}

      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr style={{ background: '#1e40af', color: 'white' }}>
            <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '11px' }}>#</th>
            <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '11px' }}>البند</th>
            <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px' }}>الوحدة</th>
            <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px' }}>الكمية</th>
            <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px' }}>سعر الوحدة</th>
            <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px' }}>الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#f9fafb' : 'white', borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '8px 12px', fontSize: '11px' }}>{idx + 1}</td>
              <td style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '500' }}>{item.description}</td>
              <td style={{ padding: '8px 12px', fontSize: '11px', textAlign: 'center' }}>{item.unit}</td>
              <td style={{ padding: '8px 12px', fontSize: '11px', textAlign: 'center' }}>{item.quantity}</td>
              <td style={{ padding: '8px 12px', fontSize: '11px', textAlign: 'center' }}>{Number(item.unit_price).toLocaleString()}</td>
              <td style={{ padding: '8px 12px', fontSize: '11px', textAlign: 'center', fontWeight: 'bold' }}>{Number(item.total_price).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <div style={{ minWidth: '250px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', fontSize: '11px' }}>
            <span>الإجمالي الفرعي</span>
            <span>{Number(quotation.subtotal).toLocaleString()} ج.م</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', fontSize: '11px', background: '#f9fafb' }}>
            <span>ضريبة القيمة المضافة ({quotation.tax_rate}%)</span>
            <span>{Number(quotation.tax_amount).toLocaleString()} ج.م</span>
          </div>
          {Number(quotation.discount_amount) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', fontSize: '11px', color: '#dc2626' }}>
              <span>خصم</span>
              <span>-{Number(quotation.discount_amount).toLocaleString()} ج.م</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', fontSize: '14px', fontWeight: 'bold', background: '#1e40af', color: 'white' }}>
            <span>الإجمالي النهائي</span>
            <span>{Number(quotation.total_amount).toLocaleString()} ج.م</span>
          </div>
        </div>
      </div>

      {/* Terms */}
      {(quotation.terms_and_conditions || quotation.payment_terms || quotation.delivery_terms) && (
        <div style={{ marginTop: '24px', fontSize: '10px', color: '#6b7280', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
          {quotation.terms_and_conditions && (
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#374151' }}>الشروط والأحكام:</strong> {quotation.terms_and_conditions}
            </div>
          )}
          {quotation.payment_terms && (
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#374151' }}>شروط الدفع:</strong> {quotation.payment_terms}
            </div>
          )}
          {quotation.delivery_terms && (
            <div>
              <strong style={{ color: '#374151' }}>شروط التسليم:</strong> {quotation.delivery_terms}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: '40px', borderTop: '2px solid #1e40af', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9ca3af' }}>
        <div>
          <p style={{ margin: 0 }}>هذا العرض ساري لمدة 30 يوماً من تاريخ الإصدار</p>
          <p style={{ margin: '2px 0 0' }}>تم إنشاء هذا المستند إلكترونياً عبر منصة iRecycle</p>
        </div>
        <div style={{ textAlign: 'left' }}>
          <p style={{ margin: 0 }}>التوقيع والختم</p>
          <div style={{ width: '120px', height: '50px', border: '1px dashed #d1d5db', marginTop: '4px', borderRadius: '4px' }} />
        </div>
      </div>
    </div>
  );
};

export default QuotationPrintView;
