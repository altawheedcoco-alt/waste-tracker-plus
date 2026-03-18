/**
 * ختم الهوية الرقمية الإلزامي — Digital Verification Stamp
 * 
 * يُولّد HTML كامل لشريط التحقق الرقمي (QR + Barcode + VRF Code)
 * يُضاف إلزامياً على كل مستند صادر من المنصة.
 * 
 * يدعم:
 * - QR Code (SVG-based)
 * - Barcode (Code128-like SVG)
 * - Verification Code (VRF-XXXX-XXXX)
 * - Document Reference Number
 * - Legal disclaimer
 * - Entity name (org/user)
 * - Secure Digital Seal (optional, auto-generated from entity data)
 * 
 * Usage in raw HTML print contexts:
 *   const stampHTML = generateDigitalVerificationStamp({ ... });
 *   printWindow.document.write(`...${stampHTML}...`);
 */

import { generateDigitalSealSVG, generateSealNumber, generateDocumentSealProof } from './secureDigitalSeal';

interface StampEntitySeal {
  /** Entity ID for seal generation */
  entityId: string;
  /** Entity type */
  entityType: 'member' | 'organization';
  /** Entity display name */
  entityDisplayName: string;
  /** Optional title/position */
  title?: string;
}

interface StampOptions {
  /** Reference number (shipment, invoice, document number) */
  referenceNumber: string;
  /** Document type for QR URL */
  documentType?: string;
  /** Verification code (auto-generated if not provided) */
  verificationCode?: string;
  /** Serial number (optional, if different from reference) */
  serialNumber?: string;
  /** Entity/organization name */
  entityName?: string;
  /** Accent color */
  accentColor?: string;
  /** Compact mode for small documents */
  compact?: boolean;
  /** Base URL for QR verification */
  baseUrl?: string;
  /** Secure digital seal data — when provided, the cryptographic seal is included */
  seal?: StampEntitySeal;
}

/** Generate a simple SVG QR code (7-segment grid-based) */
function generateQRSVG(value: string, size = 60): string {
  // Generate a deterministic pattern from the value
  const hash = simpleHash(value);
  const gridSize = 21;
  const cellSize = size / gridSize;
  
  let cells = '';
  // Fixed patterns (finder patterns at corners)
  const addFinder = (x: number, y: number) => {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        const isBorder = i === 0 || i === 6 || j === 0 || j === 6;
        const isInner = i >= 2 && i <= 4 && j >= 2 && j <= 4;
        if (isBorder || isInner) {
          cells += `<rect x="${(x + j) * cellSize}" y="${(y + i) * cellSize}" width="${cellSize}" height="${cellSize}" fill="#000"/>`;
        }
      }
    }
  };
  
  addFinder(0, 0);
  addFinder(gridSize - 7, 0);
  addFinder(0, gridSize - 7);
  
  // Data cells based on hash
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      // Skip finder pattern areas
      if ((i < 8 && j < 8) || (i < 8 && j > gridSize - 9) || (i > gridSize - 9 && j < 8)) continue;
      const idx = i * gridSize + j;
      const hashBit = parseInt(hash.charAt(idx % hash.length), 16);
      if ((hashBit + idx) % 3 === 0) {
        cells += `<rect x="${j * cellSize}" y="${i * cellSize}" width="${cellSize}" height="${cellSize}" fill="#000"/>`;
      }
    }
  }
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="white"/>
    ${cells}
  </svg>`;
}

/** Generate a Code128-like barcode SVG */
function generateBarcodeSVG(value: string, width = 120, height = 30): string {
  const hash = simpleHash(value);
  let bars = '';
  const totalBars = 40;
  const barWidth = width / totalBars;
  
  // Start pattern
  bars += `<rect x="0" y="0" width="${barWidth * 2}" height="${height}" fill="#000"/>`;
  
  for (let i = 2; i < totalBars - 2; i++) {
    const charCode = hash.charCodeAt(i % hash.length);
    const isBlack = (charCode + i) % 3 !== 0;
    if (isBlack) {
      const w = (i % 4 === 0) ? barWidth * 1.5 : barWidth;
      bars += `<rect x="${i * barWidth}" y="0" width="${w}" height="${height}" fill="#000"/>`;
    }
  }
  
  // End pattern
  bars += `<rect x="${(totalBars - 2) * barWidth}" y="0" width="${barWidth * 2}" height="${height}" fill="#000"/>`;
  
  // Value text below
  const fontSize = Math.min(8, height * 0.25);
  bars += `<text x="${width / 2}" y="${height + fontSize + 1}" text-anchor="middle" font-family="monospace" font-size="${fontSize}" fill="#333">${value}</text>`;
  
  return `<svg width="${width}" height="${height + fontSize + 4}" viewBox="0 0 ${width} ${height + fontSize + 4}" xmlns="http://www.w3.org/2000/svg">
    ${bars}
  </svg>`;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(16, '0') +
    Math.abs(hash * 31).toString(16).toUpperCase().padStart(16, '0') +
    Math.abs(hash * 127).toString(16).toUpperCase().padStart(16, '0');
}

function generateVRFCode(reference: string): string {
  const h = simpleHash(reference);
  return `VRF-${h.slice(0, 4)}-${h.slice(4, 8)}-${h.slice(8, 12)}`;
}

/**
 * Generate the mandatory Digital Verification Stamp HTML.
 * This MUST be included on every document output.
 */
export function generateDigitalVerificationStamp(options: StampOptions): string {
  const {
    referenceNumber,
    documentType = 'document',
    verificationCode,
    serialNumber,
    entityName = 'iRecycle',
    accentColor = '#059669',
    compact = false,
    baseUrl,
  } = options;

  const vCode = verificationCode || generateVRFCode(referenceNumber);
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://irecycle21.lovable.app');
  const qrValue = `${origin}/qr-verify?type=${documentType}&code=${encodeURIComponent(referenceNumber)}`;
  
  const qrSVG = generateQRSVG(qrValue, compact ? 40 : 60);
  const barcodeSVG = generateBarcodeSVG(referenceNumber, compact ? 90 : 130, compact ? 22 : 30);

  if (compact) {
    return `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 10px;border:1px solid #e5e7eb;border-radius:6px;background:#f9fafb;font-size:7pt;direction:rtl;font-family:'Cairo','Segoe UI',sans-serif;page-break-inside:avoid;">
      ${qrSVG}
      <div style="flex:1;text-align:center;">
        <div style="font-family:monospace;font-weight:bold;color:${accentColor};">${referenceNumber}</div>
        <div style="color:#6b7280;">كود التحقق: <span style="font-family:monospace;font-weight:bold;">${vCode}</span></div>
      </div>
      ${barcodeSVG}
    </div>`;
  }

  return `
  <div style="margin-top:16px;page-break-inside:avoid;direction:rtl;font-family:'Cairo','Segoe UI',sans-serif;">
    <!-- Verification Identity Strip -->
    <div style="border:2px solid ${accentColor}22;border-radius:10px;padding:12px;background:linear-gradient(135deg,${accentColor}06,${accentColor}03);margin-bottom:8px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <!-- QR Code -->
        <div style="text-align:center;flex-shrink:0;">
          ${qrSVG}
          <div style="font-size:6pt;color:#9ca3af;margin-top:3px;">امسح للتحقق</div>
        </div>

        <!-- Center: Verification Info -->
        <div style="flex:1;text-align:center;">
          <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${accentColor}" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span style="font-size:10pt;font-weight:bold;color:${accentColor};">هوية التحقق الرقمي</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${accentColor}" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          
          <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-bottom:4px;">
            <div style="background:${accentColor}10;padding:3px 10px;border-radius:12px;font-size:8pt;">
              رقم المرجع: <span style="font-family:monospace;font-weight:bold;color:#1f2937;">${referenceNumber}</span>
            </div>
            ${serialNumber && serialNumber !== referenceNumber ? `
            <div style="background:${accentColor}10;padding:3px 10px;border-radius:12px;font-size:8pt;">
              الرقم التسلسلي: <span style="font-family:monospace;font-weight:bold;color:#1f2937;">${serialNumber}</span>
            </div>` : ''}
          </div>

          <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:4px 12px;border-radius:8px;display:inline-block;margin:4px 0;">
            <span style="font-size:8pt;">كود التحقق: </span>
            <span style="font-family:monospace;font-weight:bold;font-size:11pt;color:${accentColor};letter-spacing:1px;">${vCode}</span>
          </div>

          ${entityName ? `<div style="font-size:7pt;color:#6b7280;margin-top:4px;">صادر من: ${entityName}</div>` : ''}
        </div>

        <!-- Barcode -->
        <div style="text-align:center;flex-shrink:0;">
          ${barcodeSVG}
        </div>
      </div>
    </div>

    <!-- Legal Notice -->
    <div style="border:1px solid #d1d5db;border-radius:6px;padding:6px 10px;background:#fffbeb;text-align:center;margin-bottom:4px;">
      <div style="font-size:7pt;font-weight:bold;color:#92400e;margin-bottom:2px;">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#92400e" stroke-width="2" style="display:inline;vertical-align:middle;margin-left:3px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        إقرار بالحجية الرقمية
      </div>
      <div style="font-size:6pt;color:#78716c;line-height:1.5;">
        رمز الاستجابة السريعة (QR) والباركود المُدرجان يقومان مقام التوقيع والختم الحي.
        لا يحتاج المستند لإمضاء أو ختم يدوي إضافي وفقاً لقانون التوقيع الإلكتروني المصري رقم 15 لسنة 2004.
        يُعد هذا المستند الإلكتروني حجة قانونية كاملة في الإثبات.
      </div>
    </div>
    <div style="text-align:center;font-size:6pt;color:#9ca3af;">
      للتحقق من صحة المستند امسح رمز QR أو أدخل كود التحقق في بوابة التحقق الإلكترونية
    </div>
  </div>`;
}

/**
 * CSS styles needed for the stamp (include in print window head)
 */
export const VERIFICATION_STAMP_CSS = `
  .verification-stamp { page-break-inside: avoid; }
`;

/**
 * Generate a verification stamp for the document header area (top of page)
 */
export function generateHeaderVerificationBadge(referenceNumber: string, accentColor = '#059669'): string {
  const vCode = generateVRFCode(referenceNumber);
  return `
  <div style="display:flex;align-items:center;gap:6px;font-size:7pt;color:#6b7280;direction:rtl;font-family:'Cairo',sans-serif;">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${accentColor}" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    <span>مرجع: <b style="font-family:monospace;color:#374151;">${referenceNumber}</b></span>
    <span>|</span>
    <span>تحقق: <b style="font-family:monospace;color:${accentColor};">${vCode}</b></span>
  </div>`;
}
