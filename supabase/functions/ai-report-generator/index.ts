import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { reportType, title, organizationName, organizationType, periodStart, periodEnd, additionalNotes, includeCharts } = await req.json();

    const periodText = periodStart && periodEnd
      ? `الفترة من ${periodStart} إلى ${periodEnd}`
      : 'الفترة الحالية';

    const orgTypeLabels: Record<string, string> = {
      generator: 'مولد مخلفات',
      transporter: 'ناقل',
      recycler: 'مدوّر',
      disposal: 'تخلص نهائي',
    };

    const reportTemplates: Record<string, string> = {
      environmental: `أنشئ تقريراً بيئياً شاملاً يتضمن: ملخص تنفيذي، الأثر البيئي، إدارة المخلفات، انبعاثات الكربون، التوصيات.`,
      compliance: `أنشئ تقرير امتثال يتضمن: حالة التراخيص، المعايير المُطبقة، نقاط القوة، الملاحظات، خطة العمل التصحيحية.`,
      operational: `أنشئ تقريراً تشغيلياً يتضمن: ملخص العمليات، أداء الشحنات، كفاءة النقل، مؤشرات الأداء، التوصيات.`,
      esg: `أنشئ تقرير ESG يتضمن: الحوكمة البيئية، المسؤولية الاجتماعية، حوكمة الشركات، الأهداف والإنجازات.`,
      waste_audit: `أنشئ تقرير تدقيق مخلفات يتضمن: تصنيف المخلفات، الكميات، معدلات التدوير، التكاليف، فرص التحسين.`,
      incident: `أنشئ تقرير حوادث بيئية يتضمن: وصف الحادثة، التحليل الجذري، الإجراءات التصحيحية، الدروس المستفادة.`,
    };

    const prompt = `أنت خبير بيئي مصري متخصص في إدارة المخلفات والامتثال البيئي.
    
${reportTemplates[reportType] || reportTemplates.environmental}

معلومات المنظمة:
- الاسم: ${organizationName}
- النوع: ${orgTypeLabels[organizationType] || organizationType || 'غير محدد'}
- ${periodText}

${additionalNotes ? `ملاحظات إضافية: ${additionalNotes}` : ''}

التقرير يجب أن يكون:
- باللغة العربية الفصحى
- مهني ومنظم بعناوين فرعية واضحة
- يتضمن أرقام وإحصائيات واقعية (تقديرية)
- يراعي القوانين المصرية (قانون البيئة 4/1994 وتعديلاته)
- يتضمن توصيات عملية قابلة للتنفيذ
${includeCharts ? '- يقترح رسوم بيانية مناسبة (وصفياً)' : ''}

العنوان: ${title}`;

    // Use Lovable AI proxy
    const aiResponse = await fetch("https://dgununqfxohodimmgxuk.supabase.co/functions/v1/ai-proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      // Fallback: generate a template report
      const fallbackReport = generateFallbackReport(reportType, title, organizationName, periodText);
      return new Response(JSON.stringify({ report: fallbackReport, model: 'template' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const report = aiData.choices?.[0]?.message?.content || aiData.content || '';

    return new Response(JSON.stringify({ report, model: 'gemini-2.5-flash' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateFallbackReport(type: string, title: string, orgName: string, period: string): string {
  return `# ${title}

## ملخص تنفيذي
هذا التقرير يقدم نظرة شاملة على أداء ${orgName} خلال ${period}.

## المعلومات الأساسية
- **المنظمة**: ${orgName}
- **الفترة**: ${period}
- **نوع التقرير**: ${type === 'environmental' ? 'بيئي شامل' : type === 'compliance' ? 'امتثال' : type === 'operational' ? 'تشغيلي' : type}
- **تاريخ الإصدار**: ${new Date().toLocaleDateString('ar-EG')}

## النتائج الرئيسية
1. تم تسجيل التزام عام بالمعايير البيئية المصرية
2. يوجد مجال لتحسين معدلات التدوير
3. تحتاج بعض العمليات لمراجعة إضافية

## التوصيات
1. مراجعة إجراءات فصل المخلفات من المصدر
2. تحديث سجلات الامتثال البيئي بشكل دوري
3. تدريب الموظفين على أفضل ممارسات إدارة المخلفات
4. النظر في اعتماد شهادة ISO 14001

## الخلاصة
يُوصى بتطبيق التوصيات أعلاه خلال الربع القادم لتحسين الأداء البيئي العام.

---
*تقرير مُنشأ تلقائياً — منصة iRecycle*`;
}
