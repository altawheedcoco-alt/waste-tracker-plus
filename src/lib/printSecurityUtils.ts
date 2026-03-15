/**
 * أدوات التأمين المشتركة للطباعة — علامة مائية ديناميكية + تسجيل النشاط
 * 
 * 3-Layer Document Architecture:
 *   Layer 1 (z-index:0) — Guilloche frame & pattern background
 *   Layer 2 (z-index:1) — Dynamic watermark (org, user, date/time AR+EN)
 *   Layer 3 (z-index:2) — Document content
 */
import { supabase } from '@/integrations/supabase/client';

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

  // Build identity line with org codes
  const identityParts = [orgName];
  if (orgClientCode) identityParts.push(`🆔${orgClientCode}`);
  if (orgVerificationCode) identityParts.push(`🔐${orgVerificationCode}`);

  const line1 = `✦ ${identityParts.join(' ⟐ ')} ⟐ ${userName} ✦`;
  const line2 = `${dateAr} ${timeAr} ● ${dateEn} ${timeEn}`;
  const watermarkText = `${line1} ❖ ${line2}`;

  const rows: string[] = [];
  for (let i = 0; i < 12; i++) {
    const top = 1 + i * 8.5;
    const angle = i % 2 === 0 ? -33 : -28;
    const size = i % 2 === 0 ? 12 : 10;
    const alpha = i % 2 === 0 ? 0.065 : 0.045;
    rows.push(
      `<div style="position:absolute;top:${top}%;left:-20%;right:-20%;text-align:center;font-size:${size}px;font-family:'Aref Ruqaa Ink','Reem Kufi Ink','Noto Kufi Arabic','Cairo',serif;color:rgba(6,95,70,${alpha});transform:rotate(${angle}deg);white-space:nowrap;letter-spacing:2.2px;font-weight:700;line-height:1.5;text-shadow:0 0 0.3px rgba(6,95,70,0.4);pointer-events:none;user-select:none;">${watermarkText}&nbsp;&nbsp;❖&nbsp;&nbsp;${watermarkText}&nbsp;&nbsp;❖&nbsp;&nbsp;${watermarkText}</div>`
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

