import { Button } from '@/components/ui/button';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
// jsPDF loaded dynamically
import { createWorkbook, jsonToSheet, writeFile } from '@/lib/excelExport';

const LICENSE_LABELS: Record<string, string> = {
  medical: 'طبية', solid: 'صلبة', electronic: 'إلكترونية',
  hazardous: 'خطرة', construction: 'بناء', other: 'أخرى',
};

interface Props {
  companies: any[];
}

const ExportButtons = ({ companies }: Props) => {
  const exportPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFont('helvetica');
      doc.setFontSize(16);
      doc.text('Regulated Companies Report', 14, 20);
      doc.setFontSize(10);
      doc.text(`Total: ${companies.length} companies | Date: ${new Date().toLocaleDateString()}`, 14, 28);

      let y = 38;
      const headers = ['#', 'Company Name', 'License Type', 'License #', 'Governorate', 'Expiry', 'Status'];
      const colX = [14, 24, 80, 130, 160, 200, 235];

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      headers.forEach((h, i) => doc.text(h, colX[i], y));
      y += 6;

      doc.setFont('helvetica', 'normal');
      companies.forEach((c, idx) => {
        if (y > 190) { doc.addPage(); y = 20; }
        doc.text(String(idx + 1), colX[0], y);
        doc.text((c.company_name || '').substring(0, 30), colX[1], y);
        doc.text(LICENSE_LABELS[c.license_type] || c.license_type || '', colX[2], y);
        doc.text(c.license_number || '-', colX[3], y);
        doc.text(c.governorate || '', colX[4], y);
        doc.text(c.license_expiry_date || '-', colX[5], y);
        doc.text(c.license_status || '-', colX[6], y);
        y += 5;
      });

      doc.save('regulated-companies-report.pdf');
      toast.success('تم تصدير التقرير PDF');
    } catch {
      toast.error('خطأ في تصدير PDF');
    }
  };

  const exportExcel = async () => {
    try {
      const data = companies.map((c, i) => ({
        '#': i + 1,
        'Company Name': c.company_name || '',
        'Company Name (AR)': c.company_name_ar || '',
        'License Type': LICENSE_LABELS[c.license_type] || c.license_type,
        'License Number': c.license_number || '',
        'Governorate': c.governorate || '',
        'City': c.city || '',
        'Expiry Date': c.license_expiry_date || '',
        'Status': c.license_status || '',
        'Contact': c.contact_person || '',
        'Phone': c.contact_phone || '',
        'Email': c.contact_email || '',
      }));
      const wb = createWorkbook();
      jsonToSheet(wb, data, 'Companies');
      await writeFile(wb, 'regulated-companies.xlsx');
      toast.success('تم تصدير التقرير Excel');
    } catch {
      toast.error('خطأ في تصدير Excel');
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={exportPDF} disabled={companies.length === 0}>
        <FileDown className="w-4 h-4 ml-1" />PDF
      </Button>
      <Button variant="outline" size="sm" onClick={exportExcel} disabled={companies.length === 0}>
        <FileSpreadsheet className="w-4 h-4 ml-1" />Excel
      </Button>
    </>
  );
};

export default ExportButtons;
