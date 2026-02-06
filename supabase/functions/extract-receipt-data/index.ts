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
                text: `أنت خبير في قراءة إيصالات الإيداع البنكي. 

**تعليمات صارمة لقراءة المبلغ:**
- اقرأ المبلغ المكتوب بالضبط كما يظهر في الإيصال
- المبالغ في الإيصالات المصرية عادة بين 100 جنيه و 10,000,000 جنيه
- الفاصلة (,) هي فاصل الآلاف فقط - أزلها واكتب الرقم كاملاً
- مثال: "60,000" تعني ستين ألف = 60000
- مثال: "1,500,000" تعني مليون ونصف = 1500000
- مثال: "250,000.50" تعني مئتان وخمسون ألف وخمسون قرش = 250000.50
- لا تضرب أو تقسم المبلغ بأي رقم
- إذا رأيت "60,000" لا ترسلها كـ 60000000 أو 60

استخرج من الصورة:
1. amount: المبلغ (رقم صحيح أو عشري)
2. payment_date: التاريخ (YYYY-MM-DD)
3. bank_name: اسم البنك
4. bank_branch: الفرع
5. account_number: رقم الحساب
6. depositor_name: اسم المودع
7. recipient_name: اسم المستلم
8. reference_number: رقم المرجع
9. check_number: رقم الشيك
10. payment_method: طريقة الدفع (cash/bank_transfer/check/card/other)

أجب بـ JSON فقط:
{
  "amount": 0,
  "payment_date": "",
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
        
        let parsedAmount = parseFloat(amountStr);
        
        // Sanity check: if amount is unreasonably large (> 100 million), 
        // it might have been multiplied incorrectly - try dividing by 1000
        if (parsedAmount > 100000000) {
          console.log(`Amount ${parsedAmount} seems too large, checking...`);
          // Check if dividing by 1000 gives a reasonable number
          const correctedAmount = parsedAmount / 1000;
          if (correctedAmount >= 100 && correctedAmount <= 100000000) {
            console.log(`Correcting amount from ${parsedAmount} to ${correctedAmount}`);
            parsedAmount = correctedAmount;
            extractedData.notes = (extractedData.notes || '') + ' (تم تصحيح المبلغ تلقائياً)';
          }
        }
        
        // Also check if amount is too small (< 10) - might need multiplying
        if (parsedAmount > 0 && parsedAmount < 10 && amountStr.length <= 2) {
          console.log(`Amount ${parsedAmount} seems too small for a deposit`);
          // This might be a partial read, leave a note
          extractedData.notes = (extractedData.notes || '') + ' (يرجى التحقق من المبلغ)';
        }
        
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
