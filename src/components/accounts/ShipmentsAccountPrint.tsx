import { forwardRef } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ShipmentData {
  id: string;
  shipment_number: string;
  waste_description?: string;
  waste_type?: string;
  quantity?: number;
  unit?: string;
  status: string;
  created_at: string;
  pricePerUnit?: number;
  calculatedTotal?: number;
  cancelled_at?: string;
}

interface ShipmentsAccountPrintProps {
  partnerName: string;
  partnerType: string;
  shipments: ShipmentData[];
  organizationName?: string;
  printDate?: string;
}

const ShipmentsAccountPrint = forwardRef<HTMLDivElement, ShipmentsAccountPrintProps>(
  ({ partnerName, partnerType, shipments, organizationName, printDate }, ref) => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
      }).format(amount);
    };

    const formatDate = (dateStr: string) => {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ar });
    };

    const getTypeLabel = (type: string) => {
      switch (type) {
        case 'generator': return 'مولد';
        case 'recycler': return 'مدور';
        case 'transporter': return 'ناقل';
        case 'guest': return 'عميل خارجي';
        default: return type;
      }
    };

    const getStatusLabel = (status: string) => {
      const statusMap: Record<string, string> = {
        new: 'جديدة',
        collecting: 'قيد التجميع',
        in_transit: 'في الطريق',
        delivered: 'تم التسليم',
        confirmed: 'مؤكدة',
        cancelled: 'ملغاة',
        rejected: 'مرفوضة',
      };
      return statusMap[status] || status;
    };

    const activeShipments = shipments.filter(s => !s.cancelled_at);
    const cancelledShipments = shipments.filter(s => s.cancelled_at);
    
    const totalQuantity = activeShipments.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
    const totalValue = activeShipments.reduce((sum, s) => sum + (s.calculatedTotal || 0), 0);

    const currentDate = printDate || format(new Date(), 'dd/MM/yyyy - hh:mm a', { locale: ar });

    return (
      <div 
        ref={ref} 
        className="bg-white text-black p-6"
        style={{ 
          width: '210mm', 
          minHeight: '297mm', 
          fontFamily: 'Arial, sans-serif',
          fontSize: '10pt',
          direction: 'rtl'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #333', paddingBottom: '15px' }}>
          <h1 style={{ fontSize: '18pt', fontWeight: 'bold', marginBottom: '5px' }}>
            كشف شحنات الشريك
          </h1>
          {organizationName && (
            <p style={{ fontSize: '12pt', color: '#666', marginBottom: '10px' }}>{organizationName}</p>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9pt', color: '#666' }}>
            <span>تاريخ الطباعة: {currentDate}</span>
            <span>عدد الشحنات: {shipments.length} (نشطة: {activeShipments.length})</span>
          </div>
        </div>

        {/* Partner Info */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: '15px', 
          padding: '10px', 
          backgroundColor: '#f5f5f5',
          borderRadius: '4px'
        }}>
          <div><strong>اسم الشريك:</strong> {partnerName}</div>
          <div><strong>النوع:</strong> {getTypeLabel(partnerType)}</div>
        </div>

        {/* Shipments Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#e5e7eb' }}>
              <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center', width: '30px' }}>#</th>
              <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center', width: '90px' }}>رقم الشحنة</th>
              <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right' }}>نوع المخلف</th>
              <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center', width: '60px' }}>الكمية</th>
              <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center', width: '60px' }}>السعر</th>
              <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center', width: '80px' }}>الإجمالي</th>
              <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center', width: '60px' }}>الحالة</th>
              <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center', width: '70px' }}>التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((shipment, index) => {
              const isCancelled = !!shipment.cancelled_at;
              return (
                <tr 
                  key={shipment.id}
                  style={{ 
                    backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa',
                    textDecoration: isCancelled ? 'line-through' : 'none',
                    color: isCancelled ? '#999' : 'inherit'
                  }}
                >
                  <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'center' }}>{index + 1}</td>
                  <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'center', fontSize: '9pt' }}>
                    {shipment.shipment_number}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '5px' }}>
                    {shipment.waste_description || shipment.waste_type || '-'}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'center' }}>
                    {shipment.quantity ? `${formatCurrency(Number(shipment.quantity))} ${shipment.unit || ''}` : '-'}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'center' }}>
                    {shipment.pricePerUnit ? formatCurrency(shipment.pricePerUnit) : '-'}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'center', fontWeight: 'bold' }}>
                    {isCancelled ? '0' : (shipment.calculatedTotal ? formatCurrency(shipment.calculatedTotal) : '-')}
                  </td>
                  <td style={{ 
                    border: '1px solid #ccc', 
                    padding: '5px', 
                    textAlign: 'center',
                    fontSize: '9pt',
                    color: isCancelled ? '#dc2626' : 'inherit'
                  }}>
                    {isCancelled ? 'ملغاة' : getStatusLabel(shipment.status)}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'center', fontSize: '9pt' }}>
                    {formatDate(shipment.created_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Summary */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-around', 
          padding: '15px', 
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '9pt', color: '#666' }}>إجمالي الشحنات</div>
            <div style={{ fontSize: '14pt', fontWeight: 'bold' }}>{shipments.length}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '9pt', color: '#666' }}>الشحنات النشطة</div>
            <div style={{ fontSize: '14pt', fontWeight: 'bold', color: '#16a34a' }}>{activeShipments.length}</div>
          </div>
          {cancelledShipments.length > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '9pt', color: '#666' }}>الملغاة</div>
              <div style={{ fontSize: '14pt', fontWeight: 'bold', color: '#dc2626' }}>{cancelledShipments.length}</div>
            </div>
          )}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '9pt', color: '#666' }}>إجمالي الكمية</div>
            <div style={{ fontSize: '14pt', fontWeight: 'bold' }}>{formatCurrency(totalQuantity)} كجم</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '9pt', color: '#666' }}>إجمالي القيمة</div>
            <div style={{ fontSize: '14pt', fontWeight: 'bold', color: '#2563eb' }}>
              {formatCurrency(totalValue)} ج.م
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          fontSize: '8pt', 
          color: '#999', 
          borderTop: '1px solid #ddd', 
          paddingTop: '10px' 
        }}>
          <p>هذا الكشف صادر من منصة iRecycle لإدارة المخلفات</p>
          <p>جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
        </div>
      </div>
    );
  }
);

ShipmentsAccountPrint.displayName = 'ShipmentsAccountPrint';

export default ShipmentsAccountPrint;
