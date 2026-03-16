/**
 * ShipmentTaglineFooter — تذييل الجُمل التحفيزية حسب الدور
 * يظهر في تذييل صفحة 1 من نموذج تتبع نقل المخلفات
 */
import React, { useMemo } from 'react';
import { generateRoleTagline } from '@/lib/roleTaglineEngine';

interface ShipmentTaglineFooterProps {
  shipmentNumber: string;
  disposalMethod?: string | null;
}

const ShipmentTaglineFooter: React.FC<ShipmentTaglineFooterProps> = ({ shipmentNumber, disposalMethod }) => {
  const taglines = useMemo(() => {
    const seed = shipmentNumber || 'DRAFT';
    const isDisposal = disposalMethod === 'landfill' || disposalMethod === 'incineration' || disposalMethod === 'treatment';
    const destRole = isDisposal ? 'disposal' as const : 'recycler' as const;
    
    return {
      generator: generateRoleTagline('generator', seed),
      transporter: generateRoleTagline('transporter', seed),
      destination: generateRoleTagline(destRole, seed),
      destLabel: isDisposal ? '🏗️ رسالة لجهة التخلص' : '♻ رسالة للمُدوّر',
    };
  }, [shipmentNumber, disposalMethod]);

  return (
    <div style={{
      marginTop: '1px',
      marginBottom: '1px',
      padding: '1px 3px',
      border: '1px solid #d1d5db',
      borderRadius: '2px',
      background: 'rgba(240,253,244,0.4)',
      fontSize: '4.5pt',
      lineHeight: 1.2,
      color: '#374151',
      textAlign: 'center',
    }}>
      <div style={{ display: 'table', width: '100%', borderCollapse: 'separate', borderSpacing: '2px 0px' }}>
        <div style={{ display: 'table-row' }}>
          <div style={{ display: 'table-cell', width: '33%', verticalAlign: 'top', padding: '1px 2px', borderLeft: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '4.5pt', color: '#059669', fontWeight: 700 }}>🏭 المولّد</div>
            <div style={{ fontStyle: 'italic', color: '#1f2937', fontSize: '4.5pt' }}>{taglines.generator}</div>
          </div>
          <div style={{ display: 'table-cell', width: '33%', verticalAlign: 'top', padding: '1px 2px', borderLeft: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '4.5pt', color: '#059669', fontWeight: 700 }}>🚛 الناقل</div>
            <div style={{ fontStyle: 'italic', color: '#1f2937', fontSize: '4.5pt' }}>{taglines.transporter}</div>
          </div>
          <div style={{ display: 'table-cell', width: '34%', verticalAlign: 'top', padding: '1px 2px' }}>
            <div style={{ fontSize: '4.5pt', color: '#059669', fontWeight: 700 }}>{taglines.destLabel}</div>
            <div style={{ fontStyle: 'italic', color: '#1f2937', fontSize: '4.5pt' }}>{taglines.destination}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipmentTaglineFooter;
