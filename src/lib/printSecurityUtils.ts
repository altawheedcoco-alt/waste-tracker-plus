/**
 * أدوات التأمين المشتركة للطباعة — علامة مائية ديناميكية + خيوط جيلوشي نصية + تسجيل النشاط
 * 
 * 3-Layer Document Architecture:
 *   Layer 1 (z-index:0) — Guilloche frame & pattern background + Guilloche text threads
 *   Layer 2 (z-index:1) — Dynamic watermark (org, user, date/time AR+EN)
 *   Layer 3 (z-index:2) — Document content
 */
import { supabase } from '@/integrations/supabase/client';

// ─── Trilingual Guilloche Text Threads ────────────────────────
const GUILLOCHE_TEXT_EN = 'iRecycle Waste Management System';
const GUILLOCHE_TEXT_AR = 'آي ريسايكل لإدارة المخلفات';
// Hieroglyphic transliteration using Egyptian Unicode block
const GUILLOCHE_TEXT_HIERO = '𓇋𓂋𓇌𓋴𓇌𓎡𓃭 𓅱𓇌𓋴𓏏 𓅓𓈖𓇌𓆓𓅓𓈖𓏏 𓋴𓇌𓋴𓏏𓅓';

/**
 * Generate guilloche text filler threads HTML — fills empty spaces
 * with fine sinusoidal SVG waves interspersed with trilingual text.
 * Injected as part of Layer 1 (z-index: 0).
 */
export function generateGuillocheTextFillerHTML(accentColor = '#059669'): string {
  const textLine = `${GUILLOCHE_TEXT_EN}  ✦  ${GUILLOCHE_TEXT_AR}  ✦  ${GUILLOCHE_TEXT_HIERO}`;
  const rows: string[] = [];

  // Generate horizontal wave-text rows covering the full page
  for (let i = 0; i < 28; i++) {
    const top = 2 + i * 3.5; // % spacing
    const alpha = i % 3 === 0 ? 0.045 : i % 3 === 1 ? 0.035 : 0.028;
    const fontSize = i % 2 === 0 ? 7.5 : 6.5;
    const angle = i % 4 === 0 ? -18 : i % 4 === 1 ? 12 : i % 4 === 2 ? -8 : 15;
    const offsetX = (i % 5) * -60; // stagger

    rows.push(
      `<div style="position:absolute;top:${top}%;left:${offsetX}px;right:-200px;text-align:center;font-size:${fontSize}px;font-family:'Noto Sans Egyptian Hieroglyphs','Cairo','Aref Ruqaa Ink',serif;color:rgba(${hexToRgb(accentColor)},${alpha});transform:rotate(${angle}deg);white-space:nowrap;letter-spacing:3px;font-weight:400;line-height:1;pointer-events:none;user-select:none;">${textLine}&nbsp;&nbsp;◈&nbsp;&nbsp;${textLine}&nbsp;&nbsp;◈&nbsp;&nbsp;${textLine}&nbsp;&nbsp;◈&nbsp;&nbsp;${textLine}</div>`
    );
  }

  // Add SVG guilloche wave threads between text rows
  const waveSVGs: string[] = [];
  for (let w = 0; w < 14; w++) {
    const y = 5 + w * 7;
    const amp = 8 + (w % 3) * 4;
    const freq = 0.008 + (w % 4) * 0.002;
    const alpha = 0.04 + (w % 3) * 0.01;
    const sw = 0.3 + (w % 2) * 0.2;

    // Build SVG sine wave path
    let d = `M 0 ${amp}`;
    for (let x = 0; x <= 900; x += 3) {
      const yp = amp * Math.sin(freq * x * Math.PI * 2 + w * 0.7);
      d += ` L ${x} ${amp + yp}`;
    }

    waveSVGs.push(
      `<div style="position:absolute;top:${y}%;left:0;right:0;height:${amp * 2 + 4}px;pointer-events:none;opacity:${alpha};overflow:hidden;">` +
      `<svg width="100%" height="${amp * 2 + 4}" viewBox="0 0 900 ${amp * 2 + 4}" preserveAspectRatio="none" style="display:block;">` +
      `<path d="${d}" fill="none" stroke="${accentColor}" stroke-width="${sw}" stroke-linecap="round"/>` +
      `</svg></div>`
    );
  }

  // Vertical digital watermark — left side, bottom third, rotated 90°
  const verticalStamp = `<div style="position:fixed;left:20mm;top:50%;transform:rotate(-90deg) translateX(-50%);transform-origin:left center;z-index:1;pointer-events:none;user-select:none;white-space:nowrap;font-family:'Courier New','Cairo',monospace;font-size:7.5px;letter-spacing:1.5px;color:rgba(0,0,0,0.65);font-weight:900;direction:rtl;">
    <span style="background:rgba(255,255,255,0.85);padding:3px 12px;border:1px solid rgba(0,0,0,0.15);border-radius:2px;">▸ منصة اي ريسايكل — هذه الوثيقة مؤمنة وذكية | iRecycle Platform — This Document is Secured &amp; Smart | 𓇋𓂋𓇌𓋴𓇌𓎡𓃭 — 𓅓𓋴𓏏𓈖𓂧 𓅓𓀀𓅓𓈖 𓅱𓇌𓎡𓇌 ◂</span>
  </div>`;

  return `<div class="guilloche-text-filler" style="position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;">${rows.join('')}${waveSVGs.join('')}</div>${verticalStamp}`;
}

/** Helper: hex color to r,g,b string */
function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r},${g},${b}`;
}

/**
 * Generate anti-forgery watermark HTML — Layer 2
 * Includes: org name, user name, org client code, org verification code, date+time in Arabic AND English
 */
export function generatePrintWatermarkHTML(
  orgName: string,
  userName: string,
  orgClientCode?: string | null,
  orgVerificationCode?: string | null,
): string {
  const now = new Date();

  // Arabic date & time
  const dateAr = now.toLocaleDateString('ar-EG', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const timeAr = now.toLocaleTimeString('ar-EG', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  // English date & time
  const dateEn = now.toLocaleDateString('en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const timeEn = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  // Build identity line — text only, no icons or symbols
  const identityParts = [orgName];
  if (orgClientCode) identityParts.push(orgClientCode);
  if (orgVerificationCode) identityParts.push(orgVerificationCode);

  const line1 = `${identityParts.join(' - ')} - ${userName}`;
  const line2 = `${dateAr} ${timeAr} | ${dateEn} ${timeEn}`;
  const watermarkText = `${line1} | ${line2}`;

  const rows: string[] = [];
  for (let i = 0; i < 12; i++) {
    const top = 1 + i * 8.5;
    const angle = i % 2 === 0 ? -33 : -28;
    const size = i % 2 === 0 ? 13 : 11;
    const alpha = i % 2 === 0 ? 0.08 : 0.055;
    rows.push(
      `<div style="position:absolute;top:${top}%;left:-20%;right:-20%;text-align:center;font-size:${size}px;font-family:'Cairo','Segoe UI','Helvetica Neue',sans-serif;color:rgba(6,95,70,${alpha});transform:rotate(${angle}deg);white-space:nowrap;letter-spacing:1.8px;font-weight:600;line-height:1.5;pointer-events:none;user-select:none;">${watermarkText}    ${watermarkText}    ${watermarkText}</div>`
    );
  }

  return `<div class="watermark-layer" style="position:fixed;inset:0;z-index:1;pointer-events:none;overflow:hidden;mix-blend-mode:multiply;">${rows.join('')}</div>`;
}

/**
 * Shared secure print CSS to preserve guilloche + watermark colors in print
 */
export function getSecurePrintCSS(): string {
  return `
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    @media print {
      body { background: #fff !important; }
      svg, path, rect, div, span {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  `;
}

/**
 * Log a print/export action for auditing
 */
export async function logPrintAudit(params: {
  userId: string;
  orgId: string;
  action: string;
  resourceType?: string;
  details?: Record<string, any>;
}) {
  try {
    await supabase.from('activity_logs').insert({
      user_id: params.userId,
      organization_id: params.orgId,
      action: params.action,
      action_type: 'print',
      resource_type: params.resourceType || 'document',
      details: params.details as any,
    });
  } catch {
    // silent
  }
}

