import { forwardRef } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { wasteTypeLabels } from "@/lib/wasteClassification";

interface ExternalRecord {
  id: string;
  company_name: string;
  generator_company_name: string | null;
  partner_company_name: string | null;
  partner_type: string | null;
  quantity: number;
  unit: string;
  waste_type: string;
  waste_description: string | null;
  record_date: string;
  is_linked_to_system: boolean;
  notes: string | null;
}

interface Props {
  records: ExternalRecord[];
  organizationType: 'recycler' | 'transporter';
  organizationName: string;
  filterType: 'all' | 'linked' | 'unlinked';
}

const ExternalRecordsPrint = forwardRef<HTMLDivElement, Props>(
  ({ records, organizationType, organizationName, filterType }, ref) => {
    const roleLabel = organizationType === 'recycler' ? 'المستلمة' : 'المنقولة';
    const partnerLabel = organizationType === 'recycler' ? 'الجهة الناقلة' : 'جهة التدوير';
    
    const totalQuantityKg = records.reduce((sum, r) => 
      sum + (r.unit === 'طن' ? r.quantity * 1000 : r.quantity), 0
    );
    
    const linkedCount = records.filter(r => r.is_linked_to_system).length;
    const unlinkedCount = records.filter(r => !r.is_linked_to_system).length;

    const filterLabel = filterType === 'all' ? 'جميع السجلات' : 
                        filterType === 'linked' ? 'السجلات المرتبطة فقط' : 'السجلات غير المرتبطة فقط';

    return (
      <div ref={ref} className="bg-white text-black p-6 min-h-[297mm] w-[210mm] mx-auto" dir="rtl">
        {/* Header */}
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
          <h1 className="text-xl font-bold mb-1">سجل الكميات {roleLabel} الخارجية</h1>
          <p className="text-sm text-gray-600">{organizationName}</p>
          <p className="text-xs text-gray-500 mt-1">
            تاريخ الطباعة: {format(new Date(), 'PPP', { locale: ar })}
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4 text-center">
          <div className="border rounded p-2">
            <p className="text-xs text-gray-500">إجمالي السجلات</p>
            <p className="text-lg font-bold">{records.length}</p>
          </div>
          <div className="border rounded p-2">
            <p className="text-xs text-gray-500">إجمالي الكميات</p>
            <p className="text-lg font-bold">{(totalQuantityKg / 1000).toFixed(2)} طن</p>
          </div>
          <div className="border rounded p-2 bg-green-50">
            <p className="text-xs text-gray-500">مرتبطة بالنظام</p>
            <p className="text-lg font-bold text-green-700">{linkedCount}</p>
          </div>
          <div className="border rounded p-2 bg-orange-50">
            <p className="text-xs text-gray-500">غير مرتبطة</p>
            <p className="text-lg font-bold text-orange-600">{unlinkedCount}</p>
          </div>
        </div>

        {/* Filter indicator */}
        <div className="mb-3 text-xs text-gray-600 flex items-center gap-2">
          <span className="font-medium">الفلتر المطبق:</span>
          <span className="px-2 py-0.5 bg-gray-100 rounded">{filterLabel}</span>
        </div>

        {/* Records Table */}
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-1.5 text-right">#</th>
              <th className="border border-gray-300 p-1.5 text-right">الجهة المولدة</th>
              <th className="border border-gray-300 p-1.5 text-right">{partnerLabel}</th>
              <th className="border border-gray-300 p-1.5 text-right">نوع المخلف</th>
              <th className="border border-gray-300 p-1.5 text-right">الكمية</th>
              <th className="border border-gray-300 p-1.5 text-right">التاريخ</th>
              <th className="border border-gray-300 p-1.5 text-center">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => (
              <tr key={record.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-300 p-1.5 text-center">{index + 1}</td>
                <td className="border border-gray-300 p-1.5">
                  {record.generator_company_name || record.company_name}
                </td>
                <td className="border border-gray-300 p-1.5">
                  {record.partner_company_name || '-'}
                </td>
                <td className="border border-gray-300 p-1.5">
                  {wasteTypeLabels[record.waste_type as keyof typeof wasteTypeLabels] || record.waste_type}
                </td>
                <td className="border border-gray-300 p-1.5 text-center">
                  {record.quantity} {record.unit}
                </td>
                <td className="border border-gray-300 p-1.5 text-center">
                  {format(new Date(record.record_date), 'yyyy/MM/dd')}
                </td>
                <td className="border border-gray-300 p-1.5 text-center">
                  {record.is_linked_to_system ? (
                    <span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded text-[10px]">مرتبط</span>
                  ) : (
                    <span className="px-1.5 py-0.5 bg-orange-100 text-orange-800 rounded text-[10px]">غير مرتبط</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-300 text-xs text-gray-500 flex justify-between">
          <span>عدد السجلات: {records.length}</span>
          <span>تم التوليد بواسطة نظام إدارة المخلفات</span>
        </div>

        {/* Notes Section */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs">
          <p className="font-medium text-blue-800 mb-1">ملاحظة:</p>
          <p className="text-blue-700">
            السجلات <strong>غير المرتبطة</strong> لا تُحتسب ضمن إحصائيات وتقارير النظام الرسمية.
            السجلات <strong>المرتبطة</strong> تُضاف تلقائياً للتحليلات والتقارير البيئية.
          </p>
        </div>
      </div>
    );
  }
);

ExternalRecordsPrint.displayName = 'ExternalRecordsPrint';

export default ExternalRecordsPrint;
