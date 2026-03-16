import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import {
  Building2,
  Truck,
  Recycle,
  FileText,
  Scale,
  Calendar,
  Package,
  Leaf,
  Stamp,
  PenTool,
} from 'lucide-react';
import ReportCoverPage, { PartyInfo } from './ReportCoverPage';

interface ShipmentData {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit: string;
  status: string;
  pickup_address: string;
  delivery_address: string;
  created_at: string;
  pickup_date: string | null;
  delivered_at: string | null;
  generator: {
    id?: string;
    name: string;
    name_en?: string | null;
    logo_url: string | null;
    stamp_url: string | null;
    signature_url: string | null;
    client_code: string | null;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    region?: string | null;
    commercial_register?: string | null;
    environmental_license?: string | null;
    representative_name?: string | null;
    representative_position?: string | null;
    representative_phone?: string | null;
    representative_national_id?: string | null;
  };
  transporter: {
    id?: string;
    name: string;
    name_en?: string | null;
    logo_url: string | null;
    stamp_url: string | null;
    signature_url: string | null;
    client_code: string | null;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    region?: string | null;
    commercial_register?: string | null;
    environmental_license?: string | null;
    representative_name?: string | null;
    representative_position?: string | null;
    representative_phone?: string | null;
    representative_national_id?: string | null;
  };
  recycler: {
    id?: string;
    name: string;
    name_en?: string | null;
    logo_url: string | null;
    stamp_url: string | null;
    signature_url: string | null;
    client_code: string | null;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    region?: string | null;
    commercial_register?: string | null;
    environmental_license?: string | null;
    representative_name?: string | null;
    representative_position?: string | null;
    representative_phone?: string | null;
    representative_national_id?: string | null;
  };
}

interface OrganizationInfo {
  id: string;
  name: string;
  name_en?: string | null;
  logo_url?: string | null;
  stamp_url?: string | null;
  signature_url?: string | null;
  address?: string;
  city?: string;
  region?: string | null;
  phone?: string;
  email?: string;
  commercial_register?: string;
  environmental_license?: string;
  representative_name?: string | null;
  representative_position?: string | null;
  representative_phone?: string | null;
  representative_national_id?: string | null;
}

interface AggregateReportPrintProps {
  shipments: ShipmentData[];
  organization: OrganizationInfo | null;
  includeStamps: boolean;
  includeSignatures: boolean;
  includeCoverPage?: boolean;
  reportTitle?: string;
  dateRange?: { start?: string; end?: string };
}

const wasteTypeLabels: Record<string, string> = {
  plastic: 'بلاستيك',
  paper: 'ورق',
  metal: 'معادن',
  glass: 'زجاج',
  electronic: 'إلكترونيات',
  organic: 'عضوية',
  chemical: 'كيميائية',
  medical: 'طبية',
  construction: 'مخلفات بناء',
  other: 'أخرى',
};

const statusLabels: Record<string, string> = {
  new: 'جديدة',
  approved: 'معتمدة',
  collecting: 'جاري التجميع',
  in_transit: 'في الطريق',
  delivered: 'تم التسليم',
  confirmed: 'مؤكدة',
};

const AggregateReportPrint = ({
  shipments,
  organization,
  includeStamps,
  includeSignatures,
  includeCoverPage = true,
  reportTitle = 'التقرير المجمع للشحنات',
  dateRange,
}: AggregateReportPrintProps) => {
  const currentDate = format(new Date(), 'PP', { locale: ar });
  const currentDateTime = format(new Date(), 'PPpp', { locale: ar });
  
  const totalQuantity = shipments.reduce((sum, s) => sum + (s.quantity || 0), 0);
  const confirmedCount = shipments.filter(s => s.status === 'confirmed').length;
  const deliveredCount = shipments.filter(s => s.status === 'delivered').length;
  const inTransitCount = shipments.filter(s => s.status === 'in_transit').length;

  // Generate unique report number
  const reportNumber = `AGR-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ar });
    } catch {
      return '-';
    }
  };

  // Get unique organizations with full data for cover page
  const uniqueGenerators = shipments
    .map(s => s.generator)
    .filter((g, i, arr) => g?.id && arr.findIndex(x => x?.id === g.id) === i);
  
  const uniqueTransporters = shipments
    .map(s => s.transporter)
    .filter((t, i, arr) => t?.id && arr.findIndex(x => x?.id === t.id) === i);
  
  const uniqueRecyclers = shipments
    .map(s => s.recycler)
    .filter((r, i, arr) => r?.id && arr.findIndex(x => x?.id === r.id) === i);

  // Get unique waste types for summary
  const uniqueWasteTypes = [...new Set(shipments.map(s => wasteTypeLabels[s.waste_type] || s.waste_type))];

  // Prepare party info for cover page - use first of each type or merge multiple
  const primaryGenerator: PartyInfo | null = uniqueGenerators[0] ? {
    id: uniqueGenerators[0].id,
    name: uniqueGenerators.length > 1 
      ? `${uniqueGenerators[0].name} (+${uniqueGenerators.length - 1} جهات أخرى)`
      : uniqueGenerators[0].name,
    name_en: uniqueGenerators[0].name_en,
    email: uniqueGenerators[0].email,
    phone: uniqueGenerators[0].phone,
    address: uniqueGenerators[0].address,
    city: uniqueGenerators[0].city,
    region: uniqueGenerators[0].region,
    commercial_register: uniqueGenerators[0].commercial_register,
    environmental_license: uniqueGenerators[0].environmental_license,
    representative_name: uniqueGenerators[0].representative_name,
    representative_position: uniqueGenerators[0].representative_position,
    representative_phone: uniqueGenerators[0].representative_phone,
    representative_national_id: uniqueGenerators[0].representative_national_id,
    logo_url: uniqueGenerators[0].logo_url,
    stamp_url: uniqueGenerators[0].stamp_url,
    signature_url: uniqueGenerators[0].signature_url,
    client_code: uniqueGenerators[0].client_code,
  } : null;

  const primaryTransporter: PartyInfo | null = uniqueTransporters[0] ? {
    id: uniqueTransporters[0].id,
    name: uniqueTransporters.length > 1 
      ? `${uniqueTransporters[0].name} (+${uniqueTransporters.length - 1} جهات أخرى)`
      : uniqueTransporters[0].name,
    name_en: uniqueTransporters[0].name_en,
    email: uniqueTransporters[0].email,
    phone: uniqueTransporters[0].phone,
    address: uniqueTransporters[0].address,
    city: uniqueTransporters[0].city,
    region: uniqueTransporters[0].region,
    commercial_register: uniqueTransporters[0].commercial_register,
    environmental_license: uniqueTransporters[0].environmental_license,
    representative_name: uniqueTransporters[0].representative_name,
    representative_position: uniqueTransporters[0].representative_position,
    representative_phone: uniqueTransporters[0].representative_phone,
    representative_national_id: uniqueTransporters[0].representative_national_id,
    logo_url: uniqueTransporters[0].logo_url,
    stamp_url: uniqueTransporters[0].stamp_url,
    signature_url: uniqueTransporters[0].signature_url,
    client_code: uniqueTransporters[0].client_code,
  } : null;

  const primaryRecycler: PartyInfo | null = uniqueRecyclers[0] ? {
    id: uniqueRecyclers[0].id,
    name: uniqueRecyclers.length > 1 
      ? `${uniqueRecyclers[0].name} (+${uniqueRecyclers.length - 1} جهات أخرى)`
      : uniqueRecyclers[0].name,
    name_en: uniqueRecyclers[0].name_en,
    email: uniqueRecyclers[0].email,
    phone: uniqueRecyclers[0].phone,
    address: uniqueRecyclers[0].address,
    city: uniqueRecyclers[0].city,
    region: uniqueRecyclers[0].region,
    commercial_register: uniqueRecyclers[0].commercial_register,
    environmental_license: uniqueRecyclers[0].environmental_license,
    representative_name: uniqueRecyclers[0].representative_name,
    representative_position: uniqueRecyclers[0].representative_position,
    representative_phone: uniqueRecyclers[0].representative_phone,
    representative_national_id: uniqueRecyclers[0].representative_national_id,
    logo_url: uniqueRecyclers[0].logo_url,
    stamp_url: uniqueRecyclers[0].stamp_url,
    signature_url: uniqueRecyclers[0].signature_url,
    client_code: uniqueRecyclers[0].client_code,
  } : null;

  // Limit shipments to show based on count for single page
  const maxShipmentsToShow = Math.min(shipments.length, 15);
  const displayedShipments = shipments.slice(0, maxShipmentsToShow);
  const hasMoreShipments = shipments.length > maxShipmentsToShow;

  return (
    <>
      {/* Cover Page with Full Legal Party Information */}
      {includeCoverPage && (
        <ReportCoverPage
          reportType="aggregate"
          reportTitle={reportTitle}
          reportNumber={reportNumber}
          reportDate={new Date()}
          generator={primaryGenerator}
          transporter={primaryTransporter}
          recycler={primaryRecycler}
          issuingOrganization={organization ? {
            ...organization,
            id: organization.id,
            name: organization.name,
          } : null}
          summary={{
            shipmentsCount: shipments.length,
            totalQuantity,
            unit: 'كجم',
            dateRange,
            wasteTypes: uniqueWasteTypes,
          }}
          includeStamps={includeStamps}
          includeSignatures={includeSignatures}
        />
      )}

      {/* Main Report Content */}
      <div 
        className="print-container bg-white text-black" 
        dir="rtl" 
        style={{
        height: '297mm', 
        width: '210mm', 
        margin: '0 auto',
        padding: '15mm 15mm 20mm 15mm',
        fontFamily: 'Cairo, sans-serif',
        fontSize: '8pt',
        overflow: 'hidden',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 15mm 15mm 20mm 15mm; }
          .print-container { 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
          }
        }
      `}</style>

      {/* Compact Header */}
      <header className="flex items-center justify-between mb-2 pb-2" style={{ borderBottom: '2px solid #16a34a' }}>
        <div className="text-center">
          <QRCodeSVG
            value={`${window.location.origin}/verify?type=aggregate&code=${reportNumber}`}
            size={45}
            level="L"
          />
        </div>

        <div className="text-center flex-1 px-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Leaf className="w-5 h-5" style={{ color: '#16a34a' }} />
            <h1 className="text-sm font-bold" style={{ color: '#15803d' }}>{reportTitle}</h1>
            <Leaf className="w-5 h-5" style={{ color: '#16a34a' }} />
          </div>
          <div className="inline-block rounded px-2 py-0.5" style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac' }}>
            <span className="font-mono font-bold" style={{ color: '#15803d', fontSize: '9pt' }}>{reportNumber}</span>
          </div>
        </div>

        <div className="text-center">
          <Barcode value={reportNumber} width={1} height={30} fontSize={7} displayValue={false} />
        </div>
      </header>

      {/* Compact Info Row */}
      <div className="grid grid-cols-4 gap-1 text-[7pt] mb-2 p-1.5 rounded" style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
        <div><span className="text-gray-500">المصدر:</span> <strong>{organization?.name || '-'}</strong></div>
        <div><span className="text-gray-500">التاريخ:</span> <strong>{currentDate}</strong></div>
        {dateRange?.start && <div><span className="text-gray-500">من:</span> <strong>{formatDate(dateRange.start)}</strong></div>}
        {dateRange?.end && <div><span className="text-gray-500">إلى:</span> <strong>{formatDate(dateRange.end)}</strong></div>}
      </div>

      {/* Compact Stats Row */}
      <div className="grid grid-cols-4 gap-1 mb-2">
        <div className="text-center p-1.5 rounded" style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac' }}>
          <Package className="w-4 h-4 mx-auto text-primary" />
          <p className="text-base font-bold text-primary">{shipments.length}</p>
          <p className="text-[6pt] text-gray-600">شحنات</p>
        </div>
        <div className="text-center p-1.5 rounded" style={{ backgroundColor: '#ecfdf5', border: '1px solid #6ee7b7' }}>
          <Scale className="w-4 h-4 mx-auto text-emerald-600" />
          <p className="text-base font-bold text-emerald-600">{totalQuantity.toLocaleString()}</p>
          <p className="text-[6pt] text-gray-600">كجم</p>
        </div>
        <div className="text-center p-1.5 rounded" style={{ backgroundColor: '#eff6ff', border: '1px solid #93c5fd' }}>
          <FileText className="w-4 h-4 mx-auto text-blue-600" />
          <p className="text-base font-bold text-blue-600">{confirmedCount}</p>
          <p className="text-[6pt] text-gray-600">مؤكدة</p>
        </div>
        <div className="text-center p-1.5 rounded" style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d' }}>
          <Truck className="w-4 h-4 mx-auto text-amber-600" />
          <p className="text-base font-bold text-amber-600">{inTransitCount + deliveredCount}</p>
          <p className="text-[6pt] text-gray-600">منجزة</p>
        </div>
      </div>

      {/* Compact Table */}
      <div className="flex-1 overflow-hidden mb-2">
        <table className="w-full border-collapse" style={{ fontSize: '7pt' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th className="border p-0.5 text-center" style={{ width: '4%' }}>#</th>
              <th className="border p-0.5 text-right" style={{ width: '14%' }}>رقم الشحنة</th>
              <th className="border p-0.5 text-right" style={{ width: '10%' }}>النوع</th>
              <th className="border p-0.5 text-right" style={{ width: '8%' }}>الكمية</th>
              <th className="border p-0.5 text-right" style={{ width: '8%' }}>الحالة</th>
              <th className="border p-0.5 text-right" style={{ width: '18%' }}>المولد</th>
              <th className="border p-0.5 text-right" style={{ width: '18%' }}>الناقل</th>
              <th className="border p-0.5 text-right" style={{ width: '18%' }}>المدور</th>
            </tr>
          </thead>
          <tbody>
            {displayedShipments.map((shipment, index) => (
              <tr key={shipment.id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9fafb' }}>
                <td className="border p-0.5 text-center">{index + 1}</td>
                <td className="border p-0.5 font-mono" style={{ fontSize: '6pt' }}>{shipment.shipment_number}</td>
                <td className="border p-0.5">{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</td>
                <td className="border p-0.5">{shipment.quantity}</td>
                <td className="border p-0.5">
                  <span className="px-1 py-0.5 rounded" style={{ fontSize: '6pt', backgroundColor: '#e5e7eb' }}>
                    {statusLabels[shipment.status] || shipment.status}
                  </span>
                </td>
                <td className="border p-0.5 truncate" style={{ maxWidth: '60px' }}>{shipment.generator?.name || '-'}</td>
                <td className="border p-0.5 truncate" style={{ maxWidth: '60px' }}>{shipment.transporter?.name || '-'}</td>
                <td className="border p-0.5 truncate" style={{ maxWidth: '60px' }}>{shipment.recycler?.name || '-'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <td colSpan={3} className="border p-0.5 text-right font-bold">الإجمالي</td>
              <td className="border p-0.5 font-bold">{totalQuantity.toLocaleString()}</td>
              <td colSpan={4} className="border p-0.5 text-right text-[6pt] text-gray-500">
                {hasMoreShipments && `+${shipments.length - maxShipmentsToShow} شحنات إضافية`}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Compact Parties */}
      <div className="grid grid-cols-3 gap-1 mb-2" style={{ fontSize: '6pt' }}>
        <div className="border rounded p-1.5" style={{ backgroundColor: '#eff6ff' }}>
          <div className="flex items-center gap-1 font-bold text-blue-700 mb-1">
            <Building2 className="w-3 h-3" />
            <span>المولدة ({uniqueGenerators.length})</span>
          </div>
          <div className="truncate">{uniqueGenerators.slice(0, 2).map(g => g?.name).join('، ') || '-'}</div>
        </div>
        <div className="border rounded p-1.5" style={{ backgroundColor: '#fffbeb' }}>
          <div className="flex items-center gap-1 font-bold text-amber-700 mb-1">
            <Truck className="w-3 h-3" />
            <span>النقل ({uniqueTransporters.length})</span>
          </div>
          <div className="truncate">{uniqueTransporters.slice(0, 2).map(t => t?.name).join('، ') || '-'}</div>
        </div>
        <div className="border rounded p-1.5" style={{ backgroundColor: '#ecfdf5' }}>
          <div className="flex items-center gap-1 font-bold text-emerald-700 mb-1">
            <Recycle className="w-3 h-3" />
            <span>التدوير ({uniqueRecyclers.length})</span>
          </div>
          <div className="truncate">{uniqueRecyclers.slice(0, 2).map(r => r?.name).join('، ') || '-'}</div>
        </div>
      </div>

      {/* Compact Stamps/Signatures */}
      {(includeStamps || includeSignatures) && (
        <div className="grid grid-cols-3 gap-2 mb-2 pt-2" style={{ borderTop: '1px solid #e5e7eb' }}>
          {[
            { label: 'المولدة', data: shipments[0]?.generator, color: '#1e40af', bg: '#eff6ff', Icon: Building2 },
            { label: 'الناقل', data: shipments[0]?.transporter, color: '#92400e', bg: '#fffbeb', Icon: Truck },
            { label: 'المدور', data: shipments[0]?.recycler, color: '#166534', bg: '#ecfdf5', Icon: Recycle },
          ].map(({ label, data, color, bg, Icon }) => (
            <div key={label} className="text-center p-1 rounded" style={{ backgroundColor: bg }}>
              <div className="flex items-center justify-center gap-1 mb-1" style={{ color, fontSize: '7pt' }}>
                <Icon className="w-3 h-3" />
                <span className="font-medium">{label}</span>
              </div>
              <p className="text-[6pt] font-medium mb-1 truncate">{data?.name || '-'}</p>
              <div className="flex justify-center gap-2">
                {includeStamps && (
                  <div className="text-center">
                    {data?.stamp_url ? (
                      <img src={data.stamp_url} alt="ختم" className="w-10 h-10 object-contain mx-auto" crossOrigin="anonymous" />
                    ) : (
                      <div className="w-10 h-10 border border-dashed rounded flex items-center justify-center bg-white/50 mx-auto">
                        <Stamp className="w-4 h-4 text-gray-300" />
                      </div>
                    )}
                  </div>
                )}
                {includeSignatures && (
                  <div className="text-center">
                    {data?.signature_url ? (
                      <img src={data.signature_url} alt="توقيع" className="w-10 h-10 object-contain mx-auto" crossOrigin="anonymous" />
                    ) : (
                      <div className="w-10 h-10 border border-dashed rounded flex items-center justify-center bg-white/50 mx-auto">
                        <PenTool className="w-4 h-4 text-gray-300" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compact Footer */}
      <footer className="text-center pt-1 mt-auto" style={{ borderTop: '1px solid #e5e7eb', fontSize: '6pt', color: '#6b7280' }}>
        <p>نظام إدارة المخلفات - آي ريسايكل | {currentDateTime} | {reportNumber}</p>
        <p style={{ color: '#9ca3af' }}>وثيقة إلكترونية - دون أدنى مسؤولية على النظام</p>
      </footer>
    </div>
    </>
  );
};

export default AggregateReportPrint;
