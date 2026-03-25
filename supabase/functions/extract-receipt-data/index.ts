import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * دالة تحليل الأرقام حسب التنسيق المصري
 * النظام المصري: الفاصلة (,) للآلاف، النقطة (.) للكسور العشرية
 * مثال: 60,000.00 = ستون ألف جنيه
 */
function parseEgyptianNumber(value: string | number): number {
  if (!value || value === "") return 0;

  let str = String(value).trim();
  
  // إزالة رموز العملات والمسافات والحروف العربية
  str = str.replace(/[¤$€£¥\s٫،ج.مجم]/g, '');
  str = str.replace(/جنيه|مصري|LE|EGP/gi, '');
  str = str.trim();
  
  // إذا كان فارغاً بعد التنظيف
  if (!str) return 0;
  
  // تحديد موقع آخر فاصلة ونقطة
  const lastComma = str.lastIndexOf(',');
  const lastDot = str.lastIndexOf('.');
  
  // عد الفواصل والنقاط
  const commaCount = (str.match(/,/g) || []).length;
  const dotCount = (str.match(/\./g) || []).length;
  
  console.log(`Parsing: "${str}" - lastComma: ${lastComma}, lastDot: ${lastDot}, commas: ${commaCount}, dots: ${dotCount}`);
  
  /**
   * التنسيق المصري/الأمريكي: 60,000.00 أو 1,500,000
   * - الفاصلة (,) = فاصل الآلاف
   * - النقطة (.) = فاصل عشري
   * 
   * التنسيق الأوروبي: 60.000,00
   * - النقطة (.) = فاصل الآلاف
   * - الفاصلة (,) = فاصل عشري
   */
  
  let isEuropeanFormat = false;
  
  // إذا كانت الفاصلة بعد النقطة، فهذا تنسيق أوروبي
  if (lastComma > lastDot && lastDot !== -1) {
    isEuropeanFormat = true;
  }
  // إذا كانت هناك فاصلة واحدة فقط وتتبعها رقمين (مثل 60,00)
  else if (commaCount === 1 && lastComma !== -1 && str.length - lastComma - 1 === 2 && dotCount === 0) {
    // قد يكون تنسيق أوروبي 60,00 أو تنسيق عادي 60,000
    // نتحقق: إذا كان ما بعد الفاصلة رقمين فقط وليس 3، فهو عشري أوروبي
    const afterComma = str.substring(lastComma + 1);
    if (afterComma.length === 2) {
      // لكن 60,00 غير منطقي كمبلغ إيداع، غالباً يقصد 6000
      // لذا نفترض أنه خطأ قراءة ونعتبره تنسيق عادي
      isEuropeanFormat = false;
    }
  }
  
  if (isEuropeanFormat) {
    // تنسيق أوروبي: إزالة النقاط (فواصل الآلاف) وتحويل الفاصلة لنقطة (عشري)
    str = str.replace(/\./g, '');
    str = str.replace(',', '.');
    console.log(`European format detected, converted to: ${str}`);
  } else {
    // تنسيق مصري/أمريكي: إزالة الفواصل (فواصل الآلاف) والإبقاء على النقطة (عشري)
    str = str.replace(/,/g, '');
    console.log(`Egyptian/US format, cleaned to: ${str}`);
  }
  
  const parsed = parseFloat(str);
  
  if (isNaN(parsed)) {
    console.log(`Failed to parse: ${str}`);
    return 0;
  }
  
  console.log(`Final parsed amount: ${parsed}`);
  return parsed;
}

/**
 * فحص معقولية المبلغ
 * المبالغ المعقولة للإيداعات المصرية: 100 - 100,000,000 جنيه
 */
function sanityCheckAmount(amount: number, originalStr: string): { amount: number; warning?: string } {
  if (amount <= 0) {
    return { amount: 0, warning: 'لم يتم قراءة المبلغ' };
  }
  
  // إذا كان أكبر من 100 مليون، قد يكون هناك خطأ في قراءة الأصفار
  if (amount > 100000000) {
    console.log(`Amount ${amount} > 100M, attempting correction...`);
    
    // جرب القسمة على 1000
    const divided = amount / 1000;
    if (divided >= 100 && divided <= 100000000) {
      console.log(`Corrected to ${divided} (divided by 1000)`);
      return { amount: divided, warning: 'تم تصحيح المبلغ تلقائياً' };
    }
    
    // جرب القسمة على 100
    const dividedBy100 = amount / 100;
    if (dividedBy100 >= 100 && dividedBy100 <= 100000000) {
      console.log(`Corrected to ${dividedBy100} (divided by 100)`);
      return { amount: dividedBy100, warning: 'تم تصحيح المبلغ تلقائياً' };
    }
  }
  
  // إذا كان أقل من 100 جنيه، قد يكون هناك مشكلة
  if (amount < 100) {
    console.log(`Amount ${amount} < 100, might be incorrect`);
    return { amount, warning: 'يرجى التحقق من المبلغ - يبدو صغيراً' };
  }
  
  return { amount };
}

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

    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      throw new Error('No image provided');
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Use Lovable AI to extract receipt data
    const { callAIWithRetry } = await import("../_shared/ai-retry.ts");
    const response = await callAIWithRetry(lovableApiKey, {
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `أنت خبير في قراءة إيصالات الإيداع البنكي المصرية والعربية.

**تعليمات قراءة المبلغ - مهم جداً:**
- النظام المصري يستخدم الفاصلة (,) لفصل الآلاف والنقطة (.) للكسور
- اقرأ كل رقم بالترتيب من اليسار لليمين
- أمثلة صحيحة:
  * "60,000" = 60000 (ستون ألف)
  * "150,000" = 150000 (مائة وخمسون ألف)
  * "1,500,000" = 1500000 (مليون ونصف)
  * "25,000.50" = 25000.50

**المطلوب استخراجه:**
1. amount: المبلغ كرقم (بدون فواصل الآلاف)
2. payment_date: تاريخ الإيداع (YYYY-MM-DD)
3. bank_name: اسم البنك
4. bank_branch: اسم الفرع
5. account_number: رقم الحساب
6. depositor_name: اسم المودع
7. recipient_name: اسم صاحب الحساب
8. reference_number: رقم الإيصال
9. check_number: رقم الشيك (إن وجد)
10. payment_method: طريقة الدفع (cash/bank_transfer/check/card/other)

أجب بصيغة JSON فقط:
{
  "amount": 0, "payment_date": "", "bank_name": "", "bank_branch": "",
  "account_number": "", "depositor_name": "", "recipient_name": "",
  "reference_number": "", "check_number": "", "payment_method": "bank_transfer",
  "confidence": 0.0, "notes": ""
}`
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      temperature: 0.1,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error('Failed to analyze receipt');
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';
    
    console.log('AI Response:', content);
    
    // Parse the JSON response - clean up common issues
    let extractedData;
    try {
      // Clean the content before parsing
      let cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .trim();
      
      // Try to extract JSON from the response
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
      
      console.log('Extracted data before processing:', extractedData);
      
      // معالجة المبلغ باستخدام الدالة المحسنة
      if (extractedData.amount !== undefined && extractedData.amount !== null) {
        const originalAmount = String(extractedData.amount);
        console.log(`Processing amount: "${originalAmount}"`);
        
        const parsedAmount = parseEgyptianNumber(extractedData.amount);
        const { amount: finalAmount, warning } = sanityCheckAmount(parsedAmount, originalAmount);
        
        extractedData.amount = finalAmount;
        
        if (warning) {
          extractedData.notes = extractedData.notes 
            ? `${extractedData.notes} - ${warning}` 
            : warning;
        }
        
        console.log(`Final amount: ${finalAmount}`);
      }
      
    } catch (parseError) {
      console.error('Parse error:', parseError, 'Content:', content);
      extractedData = {
        amount: 0,
        payment_date: new Date().toISOString().split('T')[0],
        bank_name: '',
        bank_branch: '',
        account_number: '',
        depositor_name: '',
        recipient_name: '',
        reference_number: '',
        check_number: '',
        payment_method: 'bank_transfer',
        confidence: 0,
        notes: 'تعذر قراءة الإيصال بشكل صحيح'
      };
    }

    return new Response(JSON.stringify({
      success: true,
      data: extractedData
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
