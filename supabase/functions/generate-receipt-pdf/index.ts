import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * إنشاء PDF من صورة الإيصال المعالجة
 * Generate PDF from processed receipt image
 * 
 * الخطوات:
 * 1. استلام الصورة المعالجة (Base64)
 * 2. إضافة معلومات الإيداع كنص
 * 3. تغليف في ملف PDF
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'غير مصرح' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabaseAuth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { error: authError } = await supabaseAuth.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (authError) {
      return new Response(JSON.stringify({ error: 'غير مصرح' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { 
      imageBase64,
      depositData,
      organizationName,
      partnerName,
    } = await req.json();

    if (!imageBase64) {
      throw new Error('No image provided');
    }

    // Prepare deposit info for PDF header
    const depositInfo = {
      amount: depositData?.amount || 0,
      date: depositData?.deposit_date || new Date().toISOString().split('T')[0],
      depositorName: depositData?.depositor_name || '',
      recipientName: depositData?.recipient_name || '',
      bankName: depositData?.bank_name || '',
      referenceNumber: depositData?.reference_number || '',
      transferMethod: depositData?.transfer_method || '',
      organizationName: organizationName || '',
      partnerName: partnerName || '',
    };

    // Create a simple HTML-based PDF content
    const pdfHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Arial', 'Tahoma', sans-serif;
    }
    body {
      background: white;
      padding: 20px;
      direction: rtl;
    }
    .header {
      text-align: center;
      padding: 15px;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      border-radius: 10px;
      margin-bottom: 20px;
    }
    .header h1 {
      font-size: 24px;
      margin-bottom: 5px;
    }
    .header p {
      font-size: 14px;
      opacity: 0.9;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 20px;
    }
    .info-box {
      padding: 12px;
      background: #f3f4f6;
      border-radius: 8px;
      border-right: 4px solid #10b981;
    }
    .info-box.full {
      grid-column: span 2;
    }
    .info-label {
      font-size: 11px;
      color: #6b7280;
      margin-bottom: 4px;
    }
    .info-value {
      font-size: 14px;
      font-weight: bold;
      color: #1f2937;
    }
    .amount-box {
      text-align: center;
      padding: 20px;
      background: linear-gradient(135deg, #ecfdf5, #d1fae5);
      border: 2px solid #10b981;
      border-radius: 12px;
      margin-bottom: 20px;
    }
    .amount-label {
      font-size: 14px;
      color: #059669;
      margin-bottom: 8px;
    }
    .amount-value {
      font-size: 32px;
      font-weight: bold;
      color: #047857;
    }
    .amount-currency {
      font-size: 18px;
      color: #059669;
    }
    .receipt-image {
      width: 100%;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 20px;
    }
    .receipt-image img {
      width: 100%;
      height: auto;
      display: block;
    }
    .receipt-header {
      background: #f9fafb;
      padding: 10px 15px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 13px;
      color: #6b7280;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer {
      text-align: center;
      padding: 15px;
      background: #f9fafb;
      border-radius: 8px;
      margin-top: 20px;
    }
    .footer-logo {
      font-size: 16px;
      font-weight: bold;
      color: #10b981;
      margin-bottom: 5px;
    }
    .footer-text {
      font-size: 11px;
      color: #9ca3af;
    }
    .timestamp {
      font-size: 10px;
      color: #9ca3af;
      text-align: center;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>إيصال إيداع</h1>
    <p>Deposit Receipt</p>
  </div>

  <div class="amount-box">
    <div class="amount-label">المبلغ المودع</div>
    <div class="amount-value">
      ${new Intl.NumberFormat('ar-EG').format(depositInfo.amount)}
      <span class="amount-currency">ج.م</span>
    </div>
  </div>

  <div class="info-grid">
    ${depositInfo.organizationName ? `
    <div class="info-box">
      <div class="info-label">تم الإيداع في حساب</div>
      <div class="info-value">${depositInfo.organizationName}</div>
    </div>
    ` : ''}
    
    ${depositInfo.partnerName ? `
    <div class="info-box">
      <div class="info-label">من شركة</div>
      <div class="info-value">${depositInfo.partnerName}</div>
    </div>
    ` : ''}
    
    <div class="info-box">
      <div class="info-label">المودع</div>
      <div class="info-value">${depositInfo.depositorName || '-'}</div>
    </div>
    
    <div class="info-box">
      <div class="info-label">تاريخ الإيداع</div>
      <div class="info-value">${depositInfo.date}</div>
    </div>
    
    ${depositInfo.bankName ? `
    <div class="info-box">
      <div class="info-label">البنك</div>
      <div class="info-value">${depositInfo.bankName}</div>
    </div>
    ` : ''}
    
    ${depositInfo.referenceNumber ? `
    <div class="info-box">
      <div class="info-label">رقم المرجع</div>
      <div class="info-value" dir="ltr">${depositInfo.referenceNumber}</div>
    </div>
    ` : ''}
    
    ${depositInfo.transferMethod ? `
    <div class="info-box">
      <div class="info-label">طريقة الإيداع</div>
      <div class="info-value">${getTransferMethodLabel(depositInfo.transferMethod)}</div>
    </div>
    ` : ''}
  </div>

  <div class="receipt-image">
    <div class="receipt-header">
      <span>📄 صورة الإيصال الأصلية</span>
      <span>معالجة تلقائياً</span>
    </div>
    <img src="${imageBase64}" alt="صورة الإيصال" />
  </div>

  <div class="footer">
    <div class="footer-logo">🌿 iRecycle</div>
    <div class="footer-text">نظام إدارة المخلفات الذكي</div>
  </div>

  <div class="timestamp">
    تم إنشاء هذا المستند بتاريخ ${new Date().toLocaleDateString('ar-EG', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}
  </div>
</body>
</html>
    `;

    // Return the HTML content (frontend will handle PDF generation)
    return new Response(JSON.stringify({
      success: true,
      html: pdfHtml,
      depositInfo,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getTransferMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    'bank_transfer': 'تحويل بنكي',
    'instapay': 'انستا باي',
    'wallet': 'محفظة إلكترونية',
    'cash': 'نقدي',
    'check': 'شيك',
    'other': 'أخرى',
  };
  return labels[method] || method;
}
