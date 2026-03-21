import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claims, error: authError } = await supabaseClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { organization_id } = await req.json();
    if (!organization_id) {
      throw new Error("organization_id is required");
    }

    // Fetch organization info
    const { data: org } = await supabaseClient
      .from("organizations")
      .select("name, organization_type, licensed_waste_types, wmra_license, wmra_license_expiry_date, environmental_approval_number, env_approval_expiry, land_transport_license, hazardous_certified, commercial_register, environmental_license, address, city, governorate, phone, email, website, tax_number, industrial_register, established_date")
      .eq("id", organization_id)
      .single();

    // Fetch ALL AI-extracted documents (no limit)
    const { data: docs } = await supabaseClient
      .from("entity_documents")
      .select("document_type, ocr_extracted_data, ocr_confidence, created_at, tags, title")
      .eq("organization_id", organization_id)
      .eq("ai_extracted", true)
      .order("created_at", { ascending: false });

    // Fetch shipment stats
    const { data: shipments, count: shipmentsCount } = await supabaseClient
      .from("shipments")
      .select("status, waste_type, total_value, quantity, created_at", { count: "exact" })
      .or(`generator_id.eq.${organization_id},transporter_id.eq.${organization_id},receiver_id.eq.${organization_id}`)
      .order("created_at", { ascending: false })
      .limit(200);

    // Fetch contracts
    const { data: contracts } = await supabaseClient
      .from("contracts")
      .select("contract_type, status, start_date, end_date, total_value, waste_types")
      .or(`party_a_id.eq.${organization_id},party_b_id.eq.${organization_id}`)
      .order("created_at", { ascending: false })
      .limit(50);

    // Fetch invoices summary
    const { data: invoices, count: invoicesCount } = await supabaseClient
      .from("invoices")
      .select("status, total_amount, invoice_date, due_date", { count: "exact" })
      .eq("organization_id", organization_id)
      .order("created_at", { ascending: false })
      .limit(100);

    // Fetch compliance records
    const { data: complianceRecords } = await supabaseClient
      .from("compliance_records")
      .select("*")
      .eq("organization_id", organization_id)
      .order("created_at", { ascending: false })
      .limit(50);

    // Fetch fleet/vehicles if transporter
    const { data: vehicles } = await supabaseClient
      .from("fleet_vehicles")
      .select("vehicle_type, plate_number, license_expiry, insurance_expiry, status")
      .eq("organization_id", organization_id)
      .limit(50);

    // Fetch drivers
    const { data: drivers } = await supabaseClient
      .from("driver_profiles")
      .select("full_name, license_type, license_expiry, status")
      .eq("organization_id", organization_id)
      .limit(50);

    // Fetch members count
    const { count: membersCount } = await supabaseClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization_id);

    const documentsData = (docs || []).map((d: any) => ({
      type: d.document_type,
      title: d.title,
      all_extracted_data: d.ocr_extracted_data || {},
      confidence: d.ocr_confidence,
      date: d.created_at,
    }));

    // Build operational stats
    const shipmentStats = {
      total: shipmentsCount || 0,
      completed: (shipments || []).filter((s: any) => s.status === "completed").length,
      cancelled: (shipments || []).filter((s: any) => s.status === "cancelled").length,
      waste_types_handled: [...new Set((shipments || []).map((s: any) => s.waste_type).filter(Boolean))],
      total_value: (shipments || []).reduce((sum: number, s: any) => sum + (s.total_value || 0), 0),
      total_quantity: (shipments || []).reduce((sum: number, s: any) => sum + (s.quantity || 0), 0),
    };

    const contractStats = {
      total: (contracts || []).length,
      active: (contracts || []).filter((c: any) => c.status === "active").length,
      expired: (contracts || []).filter((c: any) => c.status === "expired").length,
      waste_types_in_contracts: [...new Set((contracts || []).flatMap((c: any) => c.waste_types || []))],
    };

    const invoiceStats = {
      total: invoicesCount || 0,
      paid: (invoices || []).filter((i: any) => i.status === "paid").length,
      pending: (invoices || []).filter((i: any) => i.status === "pending").length,
      overdue: (invoices || []).filter((i: any) => i.status === "overdue").length,
      total_value: (invoices || []).reduce((sum: number, i: any) => sum + (i.total_amount || 0), 0),
    };

    const fleetStats = {
      total_vehicles: (vehicles || []).length,
      active: (vehicles || []).filter((v: any) => v.status === "active").length,
      expired_licenses: (vehicles || []).filter((v: any) => v.license_expiry && new Date(v.license_expiry) < new Date()).length,
      expired_insurance: (vehicles || []).filter((v: any) => v.insurance_expiry && new Date(v.insurance_expiry) < new Date()).length,
    };

    const driverStats = {
      total: (drivers || []).length,
      active: (drivers || []).filter((d: any) => d.status === "active").length,
      expired_licenses: (drivers || []).filter((d: any) => d.license_expiry && new Date(d.license_expiry) < new Date()).length,
    };

    const prompt = `أنت محلل امتثال بيئي وقانوني وتشغيلي ومالي متخصص في المنشآت المصرية العاملة في مجال إدارة المخلفات.

مطلوب منك تحليل عميق وشامل ودقيق جداً — ليس ملخصاً موجزاً — بل تقريراً تفصيلياً يغطي كل جانب من جوانب الجهة. استخرج كل معلومة من البيانات المقدمة دون إغفال أي تفصيل.

═══════════════════════════════════════
بيانات الجهة الأساسية:
═══════════════════════════════════════
- الاسم: ${org?.name || "غير معروف"}
- النوع: ${org?.organization_type || "غير محدد"}
- العنوان: ${org?.address || "غير متوفر"}، ${org?.city || ""}، ${org?.governorate || ""}
- الهاتف: ${org?.phone || "غير متوفر"}
- البريد: ${org?.email || "غير متوفر"}
- الموقع: ${org?.website || "غير متوفر"}
- الرقم الضريبي: ${org?.tax_number || "غير متوفر"}
- السجل الصناعي: ${org?.industrial_register || "غير متوفر"}
- تاريخ التأسيس: ${org?.established_date || "غير محدد"}
- عدد الأعضاء: ${membersCount || 0}

═══════════════════════════════════════
التراخيص والتصاريح:
═══════════════════════════════════════
- ترخيص WMRA: ${org?.wmra_license || "غير متوفر"} (ينتهي: ${org?.wmra_license_expiry_date || "غير محدد"})
- الموافقة البيئية: ${org?.environmental_approval_number || "غير متوفرة"} (تنتهي: ${org?.env_approval_expiry || "غير محدد"})
- الترخيص البيئي: ${org?.environmental_license || "غير متوفر"}
- ترخيص النقل البري: ${org?.land_transport_license || "غير متوفر"}
- مرخص للمخلفات الخطرة: ${org?.hazardous_certified ? "نعم" : "لا"}
- السجل التجاري: ${org?.commercial_register || "غير متوفر"}
- أنواع المخلفات المرخصة: ${(org?.licensed_waste_types || []).join("، ") || "غير محدد"}

═══════════════════════════════════════
المستندات المستخرجة بالذكاء الاصطناعي (${documentsData.length} مستند):
═══════════════════════════════════════
${JSON.stringify(documentsData, null, 2)}

═══════════════════════════════════════
الإحصائيات التشغيلية:
═══════════════════════════════════════
- الشحنات: ${JSON.stringify(shipmentStats)}
- العقود: ${JSON.stringify(contractStats)}
- الفواتير: ${JSON.stringify(invoiceStats)}
- الأسطول: ${JSON.stringify(fleetStats)}
- السائقين: ${JSON.stringify(driverStats)}
- سجلات الامتثال: ${(complianceRecords || []).length} سجل

═══════════════════════════════════════
التعليمات - تحليل عميق وشامل:
═══════════════════════════════════════

قم بإنتاج تقرير تحليلي عميق وشامل لا يقل عن 2000 كلمة يغطي:

1. **الملخص التنفيذي** (executive_summary): فقرة مفصلة لا تقل عن 200 كلمة تصف نشاط الجهة ونطاق عملها وحجم عملياتها والتحديات الرئيسية ونقاط القوة والضعف.

2. **التراخيص والتصاريح** (licenses): كل ترخيص تفصيلاً مع:
   - رقم الترخيص الدقيق المستخرج من المستندات
   - الجهة المانحة
   - تاريخ الإصدار والانتهاء الدقيقين
   - الحالة (ساري/منتهي/قارب على الانتهاء)
   - الشروط والقيود المرتبطة
   - ملاحظات تفصيلية

3. **تحليل الامتثال البيئي** (environmental_compliance): تقييم تفصيلي يشمل:
   - مدى الالتزام بقانون 202 لسنة 2020 وقانون 4 لسنة 1994
   - اللوائح التنفيذية والقرارات الوزارية
   - معايير جهاز شئون البيئة (EEAA)
   - متطلبات وكالة تنظيم إدارة المخلفات (WMRA)
   - اتفاقية بازل وستوكهولم إن انطبقت

4. **الاشتراطات والالتزامات** (obligations): كل اشتراط من كل مستند:
   - النص الحرفي الكامل للاشتراط كما ورد في المستند
   - المصدر (اسم المستند ورقمه)
   - حالة الاستيفاء مع الدليل
   - الأثر القانوني لعدم الاستيفاء

5. **تحليل أنواع المخلفات** (waste_types_analysis): تفصيل شامل:
   - كل نوع مخلف مرخص مع كود التصنيف
   - الكميات المسموحة
   - طرق المعالجة المعتمدة
   - شروط النقل والتخزين
   - مقارنة بين المرخص والمُعامل فعلياً من الشحنات

6. **التحليل المالي** (financial_analysis): تقييم مالي شامل:
   - حجم العمليات المالية
   - معدل التحصيل
   - الفواتير المتأخرة
   - تقييم الصحة المالية

7. **تحليل الأسطول والسائقين** (fleet_analysis): إن وُجد:
   - حالة المركبات والتراخيص
   - حالة رخص السائقين
   - نسبة الجاهزية التشغيلية

8. **التحليل التشغيلي** (operational_analysis): تقييم العمليات:
   - معدل إنجاز الشحنات
   - معدل الإلغاء وأسبابه
   - كفاءة العمليات
   - أنماط العمل

9. **تحليل المخاطر** (risks): كل خطر بتفصيل:
   - الفئة (قانوني/بيئي/تشغيلي/مالي/سمعة)
   - الوصف التفصيلي والأثر المحتمل
   - احتمالية الحدوث
   - الغرامات أو العقوبات المحتملة بالأرقام
   - إجراءات التخفيف المقترحة

10. **المستندات الناقصة** (missing_documents): كل مستند مطلوب قانونياً وغير متوفر مع:
    - الأساس القانوني للمطالبة به
    - الجهة المسؤولة عن إصداره
    - عواقب عدم توفره

11. **التوصيات** (recommendations): توصيات تنفيذية مفصلة:
    - الإجراء المطلوب بالتفصيل
    - الأولوية والموعد النهائي
    - التكلفة التقديرية إن أمكن
    - الأثر المتوقع على الامتثال

12. **تفصيل درجة الامتثال** (scoring_breakdown): من 100 مقسمة على 10 معايير بدلاً من 5

أجب بصيغة JSON فقط بالهيكل التالي:
{
  "executive_summary": "فقرة تفصيلية شاملة لا تقل عن 200 كلمة...",
  "compliance_score": 75,
  "risk_level": "medium",
  "licenses": [
    {"name": "", "number": "", "issuing_authority": "", "status": "valid|expired|expiring_soon|missing", "issue_date": "", "expiry_date": "", "conditions": "", "notes": ""}
  ],
  "environmental_compliance": {
    "score": 80,
    "details": "تقييم تفصيلي مطول...",
    "laws_referenced": [],
    "specific_requirements": ["متطلب محدد 1", "متطلب محدد 2"],
    "violations_risk": "تفاصيل مخاطر المخالفات"
  },
  "obligations": [
    {"text": "النص الحرفي الكامل", "status": "fulfilled|pending|violated|unknown", "source_document": "", "legal_consequence": "", "deadline": ""}
  ],
  "waste_types_analysis": {
    "licensed_types": [{"name": "", "code": "", "allowed_quantity": "", "treatment_method": "", "storage_conditions": ""}],
    "actually_handled": [],
    "discrepancies": "",
    "notes": ""
  },
  "financial_analysis": {
    "total_operations_value": 0,
    "collection_rate": 0,
    "overdue_invoices": 0,
    "financial_health": "",
    "details": ""
  },
  "fleet_analysis": {
    "total_vehicles": 0,
    "operational_readiness": 0,
    "license_issues": "",
    "details": ""
  },
  "operational_analysis": {
    "completion_rate": 0,
    "cancellation_rate": 0,
    "efficiency_score": 0,
    "patterns": "",
    "details": ""
  },
  "risks": [
    {"category": "legal|environmental|operational|financial|reputational", "description": "وصف تفصيلي", "severity": "critical|high|medium|low", "probability": "high|medium|low", "potential_penalties": "", "mitigation": "إجراء تخفيف مفصل"}
  ],
  "missing_documents": [
    {"name": "", "legal_basis": "", "issuing_authority": "", "consequence": ""}
  ],
  "recommendations": [
    {"priority": "critical|high|medium|low", "action": "الإجراء التفصيلي", "deadline": "", "estimated_cost": "", "impact": "الأثر المتوقع", "responsible_party": ""}
  ],
  "scoring_breakdown": {
    "licenses_validity": 10,
    "environmental_compliance": 10,
    "documentation_completeness": 10,
    "obligations_fulfillment": 10,
    "risk_management": 10,
    "financial_health": 10,
    "operational_efficiency": 10,
    "fleet_readiness": 10,
    "legal_compliance": 10,
    "data_quality": 10
  }
}`;

    const { callAIWithRetry } = await import("../_shared/ai-retry.ts");

    const response = await callAIWithRetry(LOVABLE_API_KEY!, {
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: "أنت محلل امتثال بيئي وقانوني وتشغيلي ومالي متخصص في المنشآت المصرية. مطلوب تحليل عميق وشامل ودقيق جداً لكل تفصيلة. استخرج كل بيانات المستندات بدقة. أجب دائماً بصيغة JSON فقط بدون أي نص خارج JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.15,
      max_tokens: 16000,
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز الحد الأقصى للطلبات" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse analysis result");
    }

    const result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Organization analysis error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "حدث خطأ في التحليل",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
