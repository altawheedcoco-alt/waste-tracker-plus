import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      throw new Error('No image provided');
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Use Lovable AI to extract receipt data
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `أنت مساعد متخصص في قراءة إيصالات الإيداع البنكي العربية والإنجليزية.

قم بتحليل هذه الصورة لإيصال إيداع بنكي واستخرج المعلومات التالية:
1. المبلغ المودع (رقم فقط بدون عملة - انتبه للفواصل والنقاط)
   - مهم جداً: اقرأ المبلغ بالكامل كما هو مكتوب
   - مثال: إذا كان المبلغ 60,000 أو 60000 فأرسله كـ 60000
   - مثال: إذا كان المبلغ 1,500,000 فأرسله كـ 1500000
   - لا تقسم على 1000 أو أي رقم آخر
   - الفاصلة (,) هي فاصل الآلاف وليست فاصلة عشرية
   - النقطة (.) قد تكون فاصلة عشرية للكسور فقط
2. تاريخ الإيداع (بصيغة YYYY-MM-DD)
3. اسم البنك
4. فرع البنك
5. رقم الحساب المودع فيه
6. اسم المودع (صاحب الحساب أو المستفيد)
7. اسم المودع إليه (المستلم)
8. رقم المرجع أو رقم الإيصال
9. رقم الشيك (إن وجد)
10. طريقة الدفع (cash, bank_transfer, check, card, other)

أجب بصيغة JSON فقط بدون أي نص إضافي:
{
  "amount": 0,
  "payment_date": "YYYY-MM-DD",
  "bank_name": "",
  "bank_branch": "",
  "account_number": "",
  "depositor_name": "",
  "recipient_name": "",
  "reference_number": "",
  "check_number": "",
  "payment_method": "bank_transfer",
  "confidence": 0.0,
  "notes": ""
}

مهم جداً للمبلغ: اقرأ كل الأرقام بالتسلسل بدون تجاهل أي أصفار.
إذا لم تتمكن من قراءة قيمة معينة، اتركها فارغة أو 0.
أضف مستوى الثقة في القراءة (0-1) وأي ملاحظات مهمة.`
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
        max_tokens: 1500,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error('Failed to analyze receipt');
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';
    
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
      
      // Parse and clean the amount - handle locale-specific formats
      if (extractedData.amount) {
        let amountStr = String(extractedData.amount);
        
        // Remove currency symbols, spaces, and Arabic characters
        amountStr = amountStr.replace(/[¤$€£¥\s٫،ج.م]/g, '');
        
        // Detect format: if comma appears after dot, comma is decimal separator (European)
        const lastComma = amountStr.lastIndexOf(',');
        const lastDot = amountStr.lastIndexOf('.');
        
        // Standard format: comma as thousand separator, dot as decimal
        if (lastDot > lastComma || lastComma === -1) {
          // Remove thousand separators (commas)
          amountStr = amountStr.replace(/,/g, '');
        } else {
          // European format: dot as thousand separator, comma as decimal
          amountStr = amountStr.replace(/\./g, '');
          amountStr = amountStr.replace(',', '.');
        }
        
        const parsedAmount = parseFloat(amountStr);
        extractedData.amount = isNaN(parsedAmount) ? 0 : parsedAmount;
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
