/**
 * Lightweight XLSX export utility - no external dependencies.
 * Generates valid .xlsx files using the Open XML format directly.
 * Replaces ExcelJS to eliminate CVE-2025-64756 (glob vulnerability).
 */

// Simple XML escaping
const esc = (v: any): string => {
  const s = v == null ? '' : String(v);
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

interface Sheet {
  name: string;
  rows: any[][];
  colWidths?: number[];
  headerBold?: boolean;
  rtl?: boolean;
}

class SimpleWorkbook {
  sheets: Sheet[] = [];

  addWorksheet(name: string): SimpleWorksheet {
    const sheet: Sheet = { name: name.substring(0, 31), rows: [], headerBold: true, rtl: false };
    this.sheets.push(sheet);
    return new SimpleWorksheet(sheet);
  }

  async writeBuffer(): Promise<ArrayBuffer> {
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();

    // [Content_Types].xml
    let contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    contentTypes += '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">';
    contentTypes += '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>';
    contentTypes += '<Default Extension="xml" ContentType="application/xml"/>';
    contentTypes += '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>';
    contentTypes += '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>';
    contentTypes += '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>';
    this.sheets.forEach((_, i) => {
      contentTypes += `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`;
    });
    contentTypes += '</Types>';
    zip.file('[Content_Types].xml', contentTypes);

    // _rels/.rels
    zip.file('_rels/.rels',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '</Relationships>'
    );

    // Collect shared strings
    const sharedStrings: string[] = [];
    const ssMap = new Map<string, number>();
    const getSSIndex = (s: string): number => {
      if (ssMap.has(s)) return ssMap.get(s)!;
      const idx = sharedStrings.length;
      sharedStrings.push(s);
      ssMap.set(s, idx);
      return idx;
    };

    // Build sheets
    const sheetRels: string[] = [];
    this.sheets.forEach((sheet, si) => {
      let xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
      xml += '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">';

      if (sheet.rtl) {
        xml += '<sheetViews><sheetView rightToLeft="1" workbookViewId="0"/></sheetViews>';
      }

      if (sheet.colWidths && sheet.colWidths.length > 0) {
        xml += '<cols>';
        sheet.colWidths.forEach((w, ci) => {
          xml += `<col min="${ci + 1}" max="${ci + 1}" width="${w}" customWidth="1"/>`;
        });
        xml += '</cols>';
      }

      xml += '<sheetData>';
      sheet.rows.forEach((row, ri) => {
        xml += `<row r="${ri + 1}">`;
        row.forEach((cell, ci) => {
          const ref = colLetter(ci) + (ri + 1);
          const styleId = (ri === 0 && sheet.headerBold) ? ' s="1"' : '';
          if (cell == null || cell === '') {
            xml += `<c r="${ref}"${styleId}/>`;
          } else if (typeof cell === 'number' && isFinite(cell)) {
            xml += `<c r="${ref}"${styleId}><v>${cell}</v></c>`;
          } else {
            const idx = getSSIndex(String(cell));
            xml += `<c r="${ref}" t="s"${styleId}><v>${idx}</v></c>`;
          }
        });
        xml += '</row>';
      });
      xml += '</sheetData></worksheet>';
      zip.file(`xl/worksheets/sheet${si + 1}.xml`, xml);
      sheetRels.push(`<Relationship Id="rId${si + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${si + 1}.xml"/>`);
    });

    // xl/workbook.xml
    let wb = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    wb += '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">';
    wb += '<sheets>';
    this.sheets.forEach((s, i) => {
      wb += `<sheet name="${esc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`;
    });
    wb += '</sheets></workbook>';
    zip.file('xl/workbook.xml', wb);

    // xl/_rels/workbook.xml.rels
    let wbRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    wbRels += '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">';
    wbRels += sheetRels.join('');
    wbRels += `<Relationship Id="rId${this.sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`;
    wbRels += `<Relationship Id="rId${this.sheets.length + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>`;
    wbRels += '</Relationships>';
    zip.file('xl/_rels/workbook.xml.rels', wbRels);

    // xl/styles.xml (minimal with bold style)
    zip.file('xl/styles.xml',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
      '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
      '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>' +
      '</styleSheet>'
    );

    // xl/sharedStrings.xml
    let ss = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    ss += `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${sharedStrings.length}" uniqueCount="${sharedStrings.length}">`;
    sharedStrings.forEach(s => { ss += `<si><t>${esc(s)}</t></si>`; });
    ss += '</sst>';
    zip.file('xl/sharedStrings.xml', ss);

    return await zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
  }
}

class SimpleWorksheet {
  private sheet: Sheet;

  constructor(sheet: Sheet) {
    this.sheet = sheet;
  }

  addRow(row: any[]) {
    this.sheet.rows.push([...row]);
  }

  setColumns(headers: { header: string; key: string; width: number }[]) {
    this.sheet.colWidths = headers.map(h => h.width);
  }

  setRTL() {
    this.sheet.rtl = true;
  }

  set views(v: { rightToLeft?: boolean }[]) {
    if (v[0]?.rightToLeft) this.sheet.rtl = true;
  }

  set columns(cols: { header: string; key: string; width: number }[]) {
    this.sheet.colWidths = cols.map(c => c.width);
    // Add header row from columns definition
    if (this.sheet.rows.length === 0) {
      this.sheet.rows.push(cols.map(c => c.header));
    }
  }

  getRow(_n: number) {
    return { font: {} as any };
  }

  getColumn(n: number) {
    return {
      set width(w: number) {
        // no-op in simplified version
      }
    };
  }
}

function colLetter(ci: number): string {
  let s = '';
  let n = ci;
  while (n >= 0) {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

// ---- Public API (same interface as before) ----

export function createWorkbook() {
  return new SimpleWorkbook();
}

export function jsonToSheet(workbook: SimpleWorkbook, data: Record<string, any>[], sheetName: string) {
  const worksheet = workbook.addWorksheet(sheetName.substring(0, 31));

  if (data.length === 0) return worksheet;

  const headers = Object.keys(data[0]);
  worksheet.columns = headers.map(h => ({ header: h, key: h, width: 20 }));

  data.forEach(row => {
    worksheet.addRow(headers.map(h => row[h]));
  });

  return worksheet;
}

export function aoaToSheet(workbook: SimpleWorkbook, aoa: any[][], sheetName: string, colWidths?: number[]) {
  const worksheet = workbook.addWorksheet(sheetName.substring(0, 31));

  aoa.forEach(row => worksheet.addRow(row));

  if (colWidths) {
    worksheet.setColumns(colWidths.map((w, i) => ({ header: '', key: String(i), width: w })));
  }

  worksheet.views = [{ rightToLeft: true }];

  return worksheet;
}

export async function writeFile(workbook: SimpleWorkbook, filename: string) {
  const buffer = await workbook.writeBuffer();
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
