import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, FileText } from 'lucide-react';
// jsPDF & html2canvas loaded dynamically
import { usePDFExport } from '@/hooks/usePDFExport';

interface ChartData {
  shipmentsByStatus: { name: string; value: number; color: string }[];
  shipmentsByWasteType: { name: string; value: number }[];
  shipmentsTrend: { date: string; count: number }[];
  organizationsByType: { name: string; value: number; color: string }[];
  topGenerators: { name: string; shipments: number }[];
  topTransporters: { name: string; shipments: number }[];
}

interface OfficialReportPrintProps {
  data: ChartData;
  period: string;
  organizationName?: string;
  includeStamps?: boolean;
  includeSignatures?: boolean;
}

const periodLabels: Record<string, string> = {
  week: 'الأسبوع الماضي',
  month: 'الشهر الماضي',
  quarter: 'الربع الأخير',
  year: 'السنة الماضية',
};

const OfficialReportPrint: React.FC<OfficialReportPrintProps> = ({
  data,
  period,
  organizationName = 'نظام إدارة النفايات',
  includeStamps = true,
  includeSignatures = true,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<HTMLDivElement>(null);
  const { printContent } = usePDFExport({ filename: 'تقرير-رسمي' });

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const hijriDate = new Date().toLocaleDateString('ar-EG-u-ca-islamic', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const totalShipments = data.shipmentsByStatus.reduce((a, b) => a + b.value, 0);
  const totalOrganizations = data.organizationsByType.reduce((a, b) => a + b.value, 0);
  const completedShipments = data.shipmentsByStatus.find(s => s.name === 'مكتمل')?.value || 0;
  const completionRate = totalShipments > 0 ? ((completedShipments / totalShipments) * 100).toFixed(1) : '0';

  const handlePrint = () => {
    if (printRef.current) {
      printContent(printRef.current);
    }
  };

  const handleExportPDF = async () => {
    if (!printRef.current) return;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Capture main report
    const mainCanvas = await html2canvas(printRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const mainImgData = mainCanvas.toDataURL('image/png');
    const mainImgHeight = (mainCanvas.height * pageWidth) / mainCanvas.width;
    
    pdf.addImage(mainImgData, 'PNG', 0, 0, pageWidth, mainImgHeight);

    // If charts exist, add as appendix
    if (chartsRef.current) {
      pdf.addPage();
      
      const chartsCanvas = await html2canvas(chartsRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const chartsImgData = chartsCanvas.toDataURL('image/png');
      const chartsImgHeight = (chartsCanvas.height * pageWidth) / chartsCanvas.width;
      
      pdf.addImage(chartsImgData, 'PNG', 0, 0, pageWidth, chartsImgHeight);
    }

    pdf.save(`تقرير-إحصائي-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-2 print:hidden">
        <Button onClick={handlePrint} variant="outline" className="gap-2">
          <Printer className="w-4 h-4" />
          طباعة التقرير
        </Button>
        <Button onClick={handleExportPDF} className="gap-2">
          <FileText className="w-4 h-4" />
          تصدير PDF
        </Button>
      </div>

      {/* Main Report - 1919 Official Style */}
      <div
        ref={printRef}
        className="bg-white p-8 print:p-4 text-black print:text-black"
        style={{ fontFamily: 'serif' }}
        dir="rtl"
      >
        {/* Decorative Border */}
        <div className="border-[3px] border-double border-black p-6 relative">
          {/* Corner Decorations */}
          <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-black" />
          <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-black" />
          <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-black" />
          <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-black" />

          {/* Header Section */}
          <div className="text-center border-b-2 border-black pb-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="text-xs text-right">
                <p>التاريخ الميلادي</p>
                <p className="font-bold">{currentDate}</p>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'serif' }}>
                  ❧ التقرير الإحصائي الرسمي ❧
                </h1>
                <h2 className="text-xl font-semibold mb-1">{organizationName}</h2>
                <p className="text-sm">إدارة النفايات والمخلفات</p>
              </div>
              <div className="text-xs text-left">
                <p>التاريخ الهجري</p>
                <p className="font-bold">{hijriDate}</p>
              </div>
            </div>
            
            <div className="flex justify-center items-center gap-2 mt-4">
              <span className="text-lg">✦</span>
              <span className="text-sm font-semibold border-t border-b border-black px-4 py-1">
                فترة التقرير: {periodLabels[period]}
              </span>
              <span className="text-lg">✦</span>
            </div>
          </div>

          {/* Bismillah */}
          <div className="text-center mb-6">
            <p className="text-xl font-bold" style={{ fontFamily: 'serif' }}>
              ﷽
            </p>
          </div>

          {/* Introduction */}
          <div className="mb-6 text-justify leading-relaxed">
            <p className="indent-8">
              بناءً على ما تقتضيه مصلحة العمل ومتطلبات الرقابة والإشراف، وعملاً بأحكام اللوائح التنظيمية
              المعمول بها في مجال إدارة النفايات والمخلفات، نتشرف برفع هذا التقرير الإحصائي الشامل
              والذي يوضح الأداء العام للمنظومة خلال الفترة المحددة أعلاه.
            </p>
          </div>

          {/* Statistics Summary Table */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-center mb-4 border-b border-black pb-2">
              ❦ الملخص الإحصائي العام ❦
            </h3>
            
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-2 text-center w-1/4">البيان</th>
                  <th className="border border-black p-2 text-center w-1/4">العدد</th>
                  <th className="border border-black p-2 text-center w-1/4">البيان</th>
                  <th className="border border-black p-2 text-center w-1/4">العدد</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-2 text-center font-semibold">إجمالي الشحنات</td>
                  <td className="border border-black p-2 text-center">{totalShipments}</td>
                  <td className="border border-black p-2 text-center font-semibold">إجمالي المنظمات</td>
                  <td className="border border-black p-2 text-center">{totalOrganizations}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 text-center font-semibold">الشحنات المكتملة</td>
                  <td className="border border-black p-2 text-center">{completedShipments}</td>
                  <td className="border border-black p-2 text-center font-semibold">نسبة الإنجاز</td>
                  <td className="border border-black p-2 text-center">{completionRate}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Shipments by Status */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-center mb-4 border-b border-black pb-2">
              ❦ توزيع الشحنات حسب الحالة ❦
            </h3>
            
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-2 text-center">م</th>
                  <th className="border border-black p-2 text-center">الحالة</th>
                  <th className="border border-black p-2 text-center">العدد</th>
                  <th className="border border-black p-2 text-center">النسبة المئوية</th>
                </tr>
              </thead>
              <tbody>
                {data.shipmentsByStatus.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-black p-2 text-center">{index + 1}</td>
                    <td className="border border-black p-2 text-center font-semibold">{item.name}</td>
                    <td className="border border-black p-2 text-center">{item.value}</td>
                    <td className="border border-black p-2 text-center">
                      {totalShipments > 0 ? ((item.value / totalShipments) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Waste Types */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-center mb-4 border-b border-black pb-2">
              ❦ توزيع الشحنات حسب نوع النفايات ❦
            </h3>
            
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-2 text-center">م</th>
                  <th className="border border-black p-2 text-center">نوع النفايات</th>
                  <th className="border border-black p-2 text-center">عدد الشحنات</th>
                  <th className="border border-black p-2 text-center">النسبة المئوية</th>
                </tr>
              </thead>
              <tbody>
                {data.shipmentsByWasteType.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-black p-2 text-center">{index + 1}</td>
                    <td className="border border-black p-2 text-center font-semibold">{item.name}</td>
                    <td className="border border-black p-2 text-center">{item.value}</td>
                    <td className="border border-black p-2 text-center">
                      {totalShipments > 0 ? ((item.value / totalShipments) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Organizations Distribution */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-center mb-4 border-b border-black pb-2">
              ❦ توزيع المنظمات المسجلة ❦
            </h3>
            
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-2 text-center">م</th>
                  <th className="border border-black p-2 text-center">نوع المنظمة</th>
                  <th className="border border-black p-2 text-center">العدد</th>
                  <th className="border border-black p-2 text-center">النسبة المئوية</th>
                </tr>
              </thead>
              <tbody>
                {data.organizationsByType.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-black p-2 text-center">{index + 1}</td>
                    <td className="border border-black p-2 text-center font-semibold">{item.name}</td>
                    <td className="border border-black p-2 text-center">{item.value}</td>
                    <td className="border border-black p-2 text-center">
                      {totalOrganizations > 0 ? ((item.value / totalOrganizations) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top Performers */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h4 className="text-sm font-bold text-center mb-2 border-b border-black pb-1">
                أعلى الجهات المولدة نشاطاً
              </h4>
              <table className="w-full border-collapse border border-black text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-1">م</th>
                    <th className="border border-black p-1">الجهة</th>
                    <th className="border border-black p-1">الشحنات</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topGenerators.slice(0, 5).map((item, index) => (
                    <tr key={index}>
                      <td className="border border-black p-1 text-center">{index + 1}</td>
                      <td className="border border-black p-1 text-center">{item.name}</td>
                      <td className="border border-black p-1 text-center">{item.shipments}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h4 className="text-sm font-bold text-center mb-2 border-b border-black pb-1">
                أعلى شركات النقل نشاطاً
              </h4>
              <table className="w-full border-collapse border border-black text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-1">م</th>
                    <th className="border border-black p-1">الشركة</th>
                    <th className="border border-black p-1">الشحنات</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topTransporters.slice(0, 5).map((item, index) => (
                    <tr key={index}>
                      <td className="border border-black p-1 text-center">{index + 1}</td>
                      <td className="border border-black p-1 text-center">{item.name}</td>
                      <td className="border border-black p-1 text-center">{item.shipments}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Conclusion */}
          <div className="mb-6 text-justify leading-relaxed border-t border-black pt-4">
            <p className="indent-8">
              وختاماً، فإن هذا التقرير يعكس الجهود المبذولة في إدارة منظومة النفايات والمخلفات،
              ونؤكد على استمرار العمل وفق أعلى معايير الجودة والكفاءة، راجين من المولى عز وجل
              التوفيق والسداد في خدمة الوطن والمواطن.
            </p>
          </div>

          {/* Signatures Section */}
          {(includeSignatures || includeStamps) && (
            <div className="grid grid-cols-3 gap-4 mt-8 pt-4 border-t border-black">
              <div className="text-center">
                <p className="font-bold mb-8">المدير التنفيذي</p>
                <div className="border-t border-black w-32 mx-auto pt-1">
                  <p className="text-xs text-gray-600">
                    {includeSignatures && includeStamps ? 'التوقيع والختم' : includeSignatures ? 'التوقيع' : 'الختم'}
                  </p>
                </div>
              </div>
              <div className="text-center">
                <p className="font-bold mb-8">مدير الإدارة</p>
                <div className="border-t border-black w-32 mx-auto pt-1">
                  <p className="text-xs text-gray-600">
                    {includeSignatures && includeStamps ? 'التوقيع والختم' : includeSignatures ? 'التوقيع' : 'الختم'}
                  </p>
                </div>
              </div>
              <div className="text-center">
                <p className="font-bold mb-8">معد التقرير</p>
                <div className="border-t border-black w-32 mx-auto pt-1">
                  <p className="text-xs text-gray-600">
                    {includeSignatures && includeStamps ? 'التوقيع والختم' : includeSignatures ? 'التوقيع' : 'الختم'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-6 pt-4 border-t border-dashed border-black text-xs">
            <p>※ هذا التقرير صادر آلياً من نظام إدارة النفايات ※</p>
            <p>❧ انظر الملحق للرسوم البيانية والإحصائيات المرئية ❧</p>
          </div>
        </div>
      </div>

      {/* Appendix - Charts (for print/PDF) */}
      <div
        ref={chartsRef}
        className="bg-white p-8 print:p-4 text-black print:text-black print:break-before-page"
        style={{ fontFamily: 'serif' }}
        dir="rtl"
      >
        <div className="border-[3px] border-double border-black p-6 relative">
          {/* Corner Decorations */}
          <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-black" />
          <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-black" />
          <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-black" />
          <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-black" />

          {/* Appendix Header */}
          <div className="text-center border-b-2 border-black pb-4 mb-6">
            <h2 className="text-2xl font-bold mb-2">❧ الملحق ❧</h2>
            <h3 className="text-lg font-semibold">الرسوم البيانية والإحصائيات المرئية</h3>
            <p className="text-sm text-gray-600 mt-2">{currentDate}</p>
          </div>

          {/* Shipments Trend Chart Placeholder */}
          <div className="mb-6">
            <h4 className="text-lg font-bold text-center mb-4 border-b border-black pb-2">
              ❦ اتجاه الشحنات خلال الفترة ❦
            </h4>
            <div className="bg-gray-50 border border-black p-4">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-2 text-center">التاريخ</th>
                    {data.shipmentsTrend.map((item, index) => (
                      <th key={index} className="border border-black p-2 text-center text-xs">
                        {item.date}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-2 text-center font-semibold">عدد الشحنات</td>
                    {data.shipmentsTrend.map((item, index) => (
                      <td key={index} className="border border-black p-2 text-center">
                        {item.count}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="border border-black p-2 text-center font-semibold">الرسم البياني</td>
                    {data.shipmentsTrend.map((item, index) => {
                      const maxCount = Math.max(...data.shipmentsTrend.map(t => t.count), 1);
                      const height = (item.count / maxCount) * 40;
                      return (
                        <td key={index} className="border border-black p-1 text-center align-bottom">
                          <div
                            className="bg-black mx-auto"
                            style={{
                              width: '20px',
                              height: `${height}px`,
                              minHeight: '2px',
                            }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Visual Statistics */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Status Distribution */}
            <div>
              <h4 className="text-sm font-bold text-center mb-4 border-b border-black pb-2">
                توزيع الشحنات حسب الحالة
              </h4>
              <div className="space-y-2">
                {data.shipmentsByStatus.map((item, index) => {
                  const percentage = totalShipments > 0 ? (item.value / totalShipments) * 100 : 0;
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <span className="w-20 text-xs text-right">{item.name}</span>
                      <div className="flex-1 bg-gray-200 h-4 border border-black">
                        <div
                          className="h-full bg-black"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-12 text-xs">{percentage.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Waste Type Distribution */}
            <div>
              <h4 className="text-sm font-bold text-center mb-4 border-b border-black pb-2">
                توزيع أنواع النفايات
              </h4>
              <div className="space-y-2">
                {data.shipmentsByWasteType.slice(0, 6).map((item, index) => {
                  const percentage = totalShipments > 0 ? (item.value / totalShipments) * 100 : 0;
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <span className="w-20 text-xs text-right">{item.name}</span>
                      <div className="flex-1 bg-gray-200 h-4 border border-black">
                        <div
                          className="h-full"
                          style={{
                            width: `${percentage}%`,
                            background: `repeating-linear-gradient(45deg, #000, #000 2px, #fff 2px, #fff 4px)`,
                          }}
                        />
                      </div>
                      <span className="w-12 text-xs">{percentage.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Summary Statistics Box */}
          <div className="border-2 border-black p-4 mb-6">
            <h4 className="text-center font-bold mb-4">✦ ملخص الإحصائيات الرئيسية ✦</h4>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="border border-black p-3">
                <p className="text-2xl font-bold">{totalShipments}</p>
                <p className="text-xs">إجمالي الشحنات</p>
              </div>
              <div className="border border-black p-3">
                <p className="text-2xl font-bold">{totalOrganizations}</p>
                <p className="text-xs">المنظمات المسجلة</p>
              </div>
              <div className="border border-black p-3">
                <p className="text-2xl font-bold">{completedShipments}</p>
                <p className="text-xs">الشحنات المكتملة</p>
              </div>
              <div className="border border-black p-3">
                <p className="text-2xl font-bold">{completionRate}%</p>
                <p className="text-xs">نسبة الإنجاز</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-dashed border-black text-xs">
            <p>※ نهاية الملحق ※</p>
            <p className="mt-1">صفحة الملحق - التقرير الإحصائي الرسمي</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
};

export default OfficialReportPrint;
