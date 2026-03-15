/**
 * أدوات التأمين المشتركة للطباعة — علامة مائية ديناميكية + تسجيل النشاط
 */
import { supabase } from '@/integrations/supabase/client';

/**
 * Generate dynamic watermark HTML to be injected into print windows
 */
export function generatePrintWatermarkHTML(orgName: string, userName: string): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  const watermarkText = `${orgName} | ${userName} | ${dateStr} ${timeStr}`;

  const rows: string[] = [];
  for (let i = 0; i < 8; i++) {
    const top = 5 + i * 12;
    rows.push(
      `<div style="position:absolute;top:${top}%;left:-10%;right:-10%;text-align:center;font-size:14px;font-family:'Cairo',sans-serif;color:rgba(0,0,0,0.04);transform:rotate(-35deg);white-space:nowrap;letter-spacing:4px;font-weight:700;pointer-events:none;user-select:none;">${watermarkText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${watermarkText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${watermarkText}</div>`
    );
  }

  return `<div style="position:fixed;inset:0;z-index:9999;pointer-events:none;overflow:hidden;">${rows.join('')}</div>`;
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
