import ExcelJS from 'exceljs';

/**
 * Safe Excel export utility replacing vulnerable `xlsx` (SheetJS) package.
 * Uses ExcelJS which is actively maintained and has no known vulnerabilities.
 */

export function createWorkbook() {
  return new ExcelJS.Workbook();
}

export function jsonToSheet(workbook: ExcelJS.Workbook, data: Record<string, any>[], sheetName: string) {
  const worksheet = workbook.addWorksheet(sheetName.substring(0, 31));
  
  if (data.length === 0) return worksheet;
  
  const headers = Object.keys(data[0]);
  worksheet.columns = headers.map(h => ({ header: h, key: h, width: 20 }));
  
  data.forEach(row => worksheet.addRow(row));
  
  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  
  return worksheet;
}

export function aoaToSheet(workbook: ExcelJS.Workbook, aoa: any[][], sheetName: string, colWidths?: number[]) {
  const worksheet = workbook.addWorksheet(sheetName.substring(0, 31));
  
  aoa.forEach(row => worksheet.addRow(row));
  
  // Style header row
  if (aoa.length > 0) {
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
  }
  
  // Set column widths
  if (colWidths) {
    colWidths.forEach((w, i) => {
      const col = worksheet.getColumn(i + 1);
      col.width = w;
    });
  }
  
  // Set RTL
  worksheet.views = [{ rightToLeft: true }];
  
  return worksheet;
}

export async function writeFile(workbook: ExcelJS.Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
