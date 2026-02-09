export type PrintThemeId = 'corporate' | 'elegant' | 'modern' | 'classic' | 'eco' | 'royal';

export interface PrintTheme {
  id: PrintThemeId;
  name: string;
  description: string;
  preview: string; // emoji/icon hint
  fonts: {
    heading: string;
    body: string;
    googleImport: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    headerBg: string;
    headerText: string;
    tableBorder: string;
    tableHeaderBg: string;
    tableHeaderText: string;
    tableStripeBg: string;
    bodyText: string;
    mutedText: string;
    borderColor: string;
    pageBg: string;
  };
  spacing: {
    pageMargin: string;
    sectionGap: string;
    headerPadding: string;
  };
  borders: {
    headerBorder: string;
    sectionBorder: string;
    tableBorder: string;
    radius: string;
  };
  decorations: {
    headerStyle: 'solid' | 'gradient' | 'underline' | 'boxed' | 'ribbon' | 'minimal';
    watermark: boolean;
    ornaments: boolean;
  };
}

export const PRINT_THEMES: PrintTheme[] = [
  {
    id: 'corporate',
    name: 'مؤسسي رسمي',
    description: 'تصميم احترافي بخطوط عصرية وألوان داكنة',
    preview: '🏢',
    fonts: {
      heading: "'Cairo', sans-serif",
      body: "'Cairo', sans-serif",
      googleImport: 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap',
    },
    colors: {
      primary: '#1a365d',
      secondary: '#2d3748',
      accent: '#3182ce',
      headerBg: '#1a365d',
      headerText: '#ffffff',
      tableBorder: '#cbd5e0',
      tableHeaderBg: '#1a365d',
      tableHeaderText: '#ffffff',
      tableStripeBg: '#f7fafc',
      bodyText: '#1a202c',
      mutedText: '#718096',
      borderColor: '#e2e8f0',
      pageBg: '#ffffff',
    },
    spacing: { pageMargin: '20mm', sectionGap: '24px', headerPadding: '24px' },
    borders: { headerBorder: '4px solid #1a365d', sectionBorder: '1px solid #e2e8f0', tableBorder: '1px solid #cbd5e0', radius: '4px' },
    decorations: { headerStyle: 'solid', watermark: false, ornaments: false },
  },
  {
    id: 'elegant',
    name: 'أنيق فاخر',
    description: 'تصميم راقي بزخارف ذهبية وخطوط كلاسيكية',
    preview: '✨',
    fonts: {
      heading: "'Amiri', serif",
      body: "'Tajawal', sans-serif",
      googleImport: 'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Tajawal:wght@400;500;700&display=swap',
    },
    colors: {
      primary: '#7c5e2c',
      secondary: '#5c4a1e',
      accent: '#c9a84c',
      headerBg: 'linear-gradient(135deg, #5c4a1e, #7c5e2c, #c9a84c)',
      headerText: '#ffffff',
      tableBorder: '#d4c5a0',
      tableHeaderBg: '#7c5e2c',
      tableHeaderText: '#ffffff',
      tableStripeBg: '#faf8f2',
      bodyText: '#3d3319',
      mutedText: '#8b7d5e',
      borderColor: '#e8dfc8',
      pageBg: '#fffef9',
    },
    spacing: { pageMargin: '22mm', sectionGap: '28px', headerPadding: '28px' },
    borders: { headerBorder: '3px double #c9a84c', sectionBorder: '1px solid #e8dfc8', tableBorder: '1px solid #d4c5a0', radius: '6px' },
    decorations: { headerStyle: 'gradient', watermark: true, ornaments: true },
  },
  {
    id: 'modern',
    name: 'عصري متطور',
    description: 'تصميم حديث بألوان زاهية وزوايا مستديرة',
    preview: '🎨',
    fonts: {
      heading: "'Rubik', sans-serif",
      body: "'Noto Sans Arabic', sans-serif",
      googleImport: 'https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap',
    },
    colors: {
      primary: '#6366f1',
      secondary: '#4f46e5',
      accent: '#a78bfa',
      headerBg: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      headerText: '#ffffff',
      tableBorder: '#e0e7ff',
      tableHeaderBg: '#6366f1',
      tableHeaderText: '#ffffff',
      tableStripeBg: '#f5f3ff',
      bodyText: '#1e1b4b',
      mutedText: '#6b7280',
      borderColor: '#e0e7ff',
      pageBg: '#ffffff',
    },
    spacing: { pageMargin: '18mm', sectionGap: '20px', headerPadding: '20px' },
    borders: { headerBorder: '0', sectionBorder: 'none', tableBorder: '1px solid #e0e7ff', radius: '12px' },
    decorations: { headerStyle: 'gradient', watermark: false, ornaments: false },
  },
  {
    id: 'classic',
    name: 'تقليدي كلاسيكي',
    description: 'تصميم هادئ بإطارات مزدوجة وخطوط تقليدية',
    preview: '📜',
    fonts: {
      heading: "'Amiri', serif",
      body: "'Amiri', serif",
      googleImport: 'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap',
    },
    colors: {
      primary: '#1a4731',
      secondary: '#22543d',
      accent: '#2f855a',
      headerBg: '#ffffff',
      headerText: '#1a4731',
      tableBorder: '#9ae6b4',
      tableHeaderBg: '#e6fffa',
      tableHeaderText: '#1a4731',
      tableStripeBg: '#f0fff4',
      bodyText: '#1a202c',
      mutedText: '#4a5568',
      borderColor: '#c6f6d5',
      pageBg: '#ffffff',
    },
    spacing: { pageMargin: '25mm', sectionGap: '28px', headerPadding: '20px' },
    borders: { headerBorder: '3px double #1a4731', sectionBorder: '1px dashed #c6f6d5', tableBorder: '1px solid #9ae6b4', radius: '0' },
    decorations: { headerStyle: 'boxed', watermark: false, ornaments: true },
  },
  {
    id: 'eco',
    name: 'صديق البيئة',
    description: 'تصميم طبيعي بألوان خضراء وأيقونات بيئية',
    preview: '🌿',
    fonts: {
      heading: "'Cairo', sans-serif",
      body: "'Tajawal', sans-serif",
      googleImport: 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Tajawal:wght@400;500;700&display=swap',
    },
    colors: {
      primary: '#166534',
      secondary: '#15803d',
      accent: '#22c55e',
      headerBg: 'linear-gradient(135deg, #166534, #15803d, #22c55e)',
      headerText: '#ffffff',
      tableBorder: '#bbf7d0',
      tableHeaderBg: '#166534',
      tableHeaderText: '#ffffff',
      tableStripeBg: '#f0fdf4',
      bodyText: '#14532d',
      mutedText: '#4ade80',
      borderColor: '#bbf7d0',
      pageBg: '#fafff7',
    },
    spacing: { pageMargin: '18mm', sectionGap: '22px', headerPadding: '22px' },
    borders: { headerBorder: '3px solid #22c55e', sectionBorder: '1px solid #bbf7d0', tableBorder: '1px solid #bbf7d0', radius: '8px' },
    decorations: { headerStyle: 'gradient', watermark: true, ornaments: true },
  },
  {
    id: 'royal',
    name: 'ملكي فخم',
    description: 'تصميم فاخر بتدرجات أرجوانية وزخارف ملكية',
    preview: '👑',
    fonts: {
      heading: "'Amiri', serif",
      body: "'Cairo', sans-serif",
      googleImport: 'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700&display=swap',
    },
    colors: {
      primary: '#581c87',
      secondary: '#6b21a8',
      accent: '#a855f7',
      headerBg: 'linear-gradient(135deg, #581c87, #7c3aed, #a855f7)',
      headerText: '#ffffff',
      tableBorder: '#ddd6fe',
      tableHeaderBg: '#581c87',
      tableHeaderText: '#ffffff',
      tableStripeBg: '#faf5ff',
      bodyText: '#3b0764',
      mutedText: '#7c3aed',
      borderColor: '#e9d5ff',
      pageBg: '#fefcff',
    },
    spacing: { pageMargin: '20mm', sectionGap: '26px', headerPadding: '26px' },
    borders: { headerBorder: '4px solid #a855f7', sectionBorder: '1px solid #e9d5ff', tableBorder: '1px solid #ddd6fe', radius: '8px' },
    decorations: { headerStyle: 'ribbon', watermark: true, ornaments: true },
  },
];

export const getThemeById = (id: PrintThemeId): PrintTheme => {
  return PRINT_THEMES.find(t => t.id === id) || PRINT_THEMES[0];
};

/** Generate full CSS for a print theme to inject into print windows */
export const generateThemeCSS = (theme: PrintTheme): string => {
  const isGradient = theme.colors.headerBg.includes('gradient');

  return `
    @import url('${theme.fonts.googleImport}');

    @page {
      size: A4;
      margin: ${theme.spacing.pageMargin};
    }

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 0;
      background: ${theme.colors.pageBg} !important;
      font-family: ${theme.fonts.body};
      color: ${theme.colors.bodyText};
      direction: rtl;
      font-size: 13px;
      line-height: 1.9;
    }

    .print-container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 15mm;
    }

    /* Header */
    .doc-header {
      ${isGradient ? `background: ${theme.colors.headerBg};` : `background: ${theme.colors.headerBg};`}
      color: ${theme.colors.headerText};
      padding: ${theme.spacing.headerPadding};
      border-radius: ${theme.borders.radius};
      margin-bottom: ${theme.spacing.sectionGap};
      ${!isGradient && theme.decorations.headerStyle === 'underline' ? `border-bottom: ${theme.borders.headerBorder};` : ''}
      ${theme.decorations.headerStyle === 'boxed' ? `border: ${theme.borders.headerBorder}; background: transparent; color: ${theme.colors.primary};` : ''}
      text-align: center;
      position: relative;
    }

    .doc-header h1 {
      font-family: ${theme.fonts.heading};
      font-size: 22px;
      font-weight: 700;
      margin: 0 0 6px 0;
    }

    .doc-header p {
      margin: 2px 0;
      opacity: 0.9;
      font-size: 12px;
    }

    /* Ornaments */
    ${theme.decorations.ornaments ? `
    .doc-header::before, .doc-header::after {
      content: '✦';
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      font-size: 18px;
      opacity: 0.4;
    }
    .doc-header::before { right: 16px; }
    .doc-header::after { left: 16px; }
    ` : ''}

    /* Headings */
    h1 {
      font-family: ${theme.fonts.heading};
      font-size: 20px;
      font-weight: 700;
      color: ${theme.colors.primary};
      border-bottom: 3px solid ${theme.colors.accent};
      padding-bottom: 8px;
      margin: ${theme.spacing.sectionGap} 0 16px 0;
    }

    h2 {
      font-family: ${theme.fonts.heading};
      font-size: 16px;
      font-weight: 700;
      color: ${theme.colors.primary};
      border-right: 4px solid ${theme.colors.accent};
      padding-right: 12px;
      margin: 20px 0 10px 0;
    }

    h3 {
      font-family: ${theme.fonts.heading};
      font-size: 14px;
      font-weight: 600;
      color: ${theme.colors.secondary};
      margin: 16px 0 8px 0;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      border-radius: ${theme.borders.radius};
      overflow: hidden;
    }

    th {
      background: ${theme.colors.tableHeaderBg};
      color: ${theme.colors.tableHeaderText};
      font-weight: 700;
      font-size: 12px;
      padding: 10px 14px;
      text-align: right;
      border: ${theme.borders.tableBorder};
    }

    td {
      padding: 8px 14px;
      font-size: 12px;
      border: ${theme.borders.tableBorder};
      text-align: right;
    }

    tr:nth-child(even) td {
      background: ${theme.colors.tableStripeBg};
    }

    /* Sections */
    .doc-section {
      margin-bottom: ${theme.spacing.sectionGap};
      ${theme.borders.sectionBorder !== 'none' ? `border-bottom: ${theme.borders.sectionBorder}; padding-bottom: ${theme.spacing.sectionGap};` : ''}
    }

    /* Info grid */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin: 16px 0;
    }

    .info-item {
      padding: 10px 14px;
      background: ${theme.colors.tableStripeBg};
      border-radius: ${theme.borders.radius};
      border-right: 3px solid ${theme.colors.accent};
    }

    .info-item .label {
      font-size: 11px;
      color: ${theme.colors.mutedText};
      margin-bottom: 2px;
    }

    .info-item .value {
      font-size: 13px;
      font-weight: 600;
      color: ${theme.colors.bodyText};
    }

    /* Signature area */
    .signature-area {
      display: flex;
      justify-content: space-around;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid ${theme.colors.borderColor};
    }

    .signature-box {
      text-align: center;
      width: 30%;
    }

    .signature-box .sig-line {
      border-bottom: 1px solid ${theme.colors.bodyText};
      margin: 40px auto 8px;
      width: 80%;
    }

    .signature-box .sig-label {
      font-size: 11px;
      color: ${theme.colors.mutedText};
    }

    /* Watermark */
    ${theme.decorations.watermark ? `
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 80px;
      font-family: ${theme.fonts.heading};
      color: ${theme.colors.accent};
      opacity: 0.04;
      pointer-events: none;
      z-index: 0;
      white-space: nowrap;
    }
    ` : ''}

    /* Strong */
    strong {
      color: ${theme.colors.primary};
    }

    /* Separator */
    hr {
      border: none;
      border-top: ${theme.borders.sectionBorder !== 'none' ? theme.borders.sectionBorder : `1px solid ${theme.colors.borderColor}`};
      margin: 20px 0;
    }

    /* QR / Barcode area */
    .verification-area {
      text-align: center;
      margin-top: 24px;
      padding: 16px;
      background: ${theme.colors.tableStripeBg};
      border-radius: ${theme.borders.radius};
      border: 1px dashed ${theme.colors.borderColor};
    }

    /* Footer */
    .doc-footer {
      margin-top: 30px;
      padding-top: 12px;
      border-top: 2px solid ${theme.colors.borderColor};
      text-align: center;
      font-size: 10px;
      color: ${theme.colors.mutedText};
    }

    /* Logos */
    .logo-area {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .logo-area img {
      max-height: 50px;
      max-width: 100px;
    }

    @media print {
      .no-print { display: none !important; }
      body { margin: 0; padding: 0; }
    }
  `;
};
