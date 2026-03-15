/**
 * أدوات التأمين المشتركة للطباعة — علامة مائية ديناميكية + تسجيل النشاط
 */
import { supabase } from '@/integrations/supabase/client';

/**
 * Generate anti-forgery watermark HTML (interwoven style, hard-to-copy typography)
 */
export function generatePrintWatermarkHTML(orgName: string, userName: string): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  const watermarkText = `✦ ${orgName} ⟐ ${userName} ⟐ ${dateStr} ${timeStr} ✦`;

  const rows: string[] = [];
  for (let i = 0; i < 10; i++) {
    const top = 2 + i * 10;
    const angle = i % 2 === 0 ? -33 : -28;
    const size = i % 2 === 0 ? 13 : 11;
    const alpha = i % 2 === 0 ? 0.07 : 0.05;
    rows.push(
      `<div style="position:absolute;top:${top}%;left:-16%;right:-16%;text-align:center;font-size:${size}px;font-family:'Aref Ruqaa Ink','Reem Kufi Ink','Noto Kufi Arabic','Cairo',serif;color:rgba(6,95,70,${alpha});transform:rotate(${angle}deg);white-space:nowrap;letter-spacing:2.6px;font-weight:700;line-height:1.6;text-shadow:0 0 0.3px rgba(6,95,70,0.45);pointer-events:none;user-select:none;">${watermarkText}&nbsp;&nbsp;❖&nbsp;&nbsp;${watermarkText}&nbsp;&nbsp;❖&nbsp;&nbsp;${watermarkText}</div>`
    );
  }

  return `<div style="position:fixed;inset:0;z-index:1;pointer-events:none;overflow:hidden;mix-blend-mode:multiply;">${rows.join('')}</div>`;
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

