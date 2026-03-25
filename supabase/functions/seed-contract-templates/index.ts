import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Waste categories data
const hazardousCategories = [
  {
    id: 'chemical',
    name: 'المخلفات الكيميائية',
    subcategories: [
      { name: 'المذيبات العضوية', code: 'CH-01' },
      { name: 'الأحماض والقلويات', code: 'CH-02' },
      { name: 'المبيدات الحشرية', code: 'CH-03' },
      { name: 'الأسمدة الكيميائية المنتهية', code: 'CH-04' },
      { name: 'المواد المؤكسدة', code: 'CH-05' },
      { name: 'المواد الكاوية', code: 'CH-06' },
      { name: 'المواد السامة', code: 'CH-07' },
      { name: 'مخلفات المختبرات الكيميائية', code: 'CH-08' },
      { name: 'الزيوت والشحوم الملوثة', code: 'CH-09' },
      { name: 'الطلاءات والدهانات', code: 'CH-10' },
      { name: 'براميل كيميائية ملوثة', code: 'CH-11' },
      { name: 'حاويات مواد خطرة فارغة', code: 'CH-12' },
      { name: 'مخلفات التنظيف الصناعي', code: 'CH-13' },
      { name: 'غازات مضغوطة ملوثة', code: 'CH-14' },
      { name: 'مواد لاصقة صناعية', code: 'CH-15' },
      { name: 'راتنجات ومواد ايبوكسي', code: 'CH-16' },
      { name: 'مخلفات التبريد والتكييف', code: 'CH-17' },
      { name: 'زيوت هيدروليكية مستعملة', code: 'CH-18' },
      { name: 'مخلفات الطباعة والأحبار', code: 'CH-19' },
      { name: 'مخلفات معالجة الأسطح', code: 'CH-20' },
    ],
  },
  {
    id: 'electronic',
    name: 'المخلفات الإلكترونية',
    subcategories: [
      { name: 'البطاريات (رصاص-حمض)', code: 'EL-01' },
      { name: 'البطاريات الليثيوم', code: 'EL-02' },
      { name: 'الشاشات CRT', code: 'EL-03' },
      { name: 'اللوحات الإلكترونية', code: 'EL-04' },
      { name: 'الكابلات والأسلاك', code: 'EL-05' },
      { name: 'أجهزة الحاسوب', code: 'EL-06' },
      { name: 'الهواتف المحمولة', code: 'EL-07' },
      { name: 'الطابعات وخراطيش الحبر', code: 'EL-08' },
      { name: 'المصابيح الفلورية', code: 'EL-09' },
      { name: 'الأجهزة المنزلية الإلكترونية', code: 'EL-10' },
      { name: 'مكيفات هواء مستعملة', code: 'EL-11' },
      { name: 'ثلاجات ومبردات', code: 'EL-12' },
      { name: 'معدات طبية إلكترونية', code: 'EL-13' },
      { name: 'أجهزة اتصالات وشبكات', code: 'EL-14' },
      { name: 'شاشات LCD/LED', code: 'EL-15' },
      { name: 'محولات كهربائية', code: 'EL-16' },
      { name: 'UPS وبطاريات احتياطية', code: 'EL-17' },
      { name: 'ألواح طاقة شمسية تالفة', code: 'EL-18' },
      { name: 'موتورات كهربائية', code: 'EL-19' },
      { name: 'أسلاك نحاسية معزولة', code: 'EL-20' },
    ],
  },
  {
    id: 'medical',
    name: 'المخلفات الطبية',
    subcategories: [
      { name: 'النفايات المعدية', code: 'MD-01' },
      { name: 'الأدوات الحادة (إبر، مشارط)', code: 'MD-02' },
      { name: 'الأدوية منتهية الصلاحية', code: 'MD-03' },
      { name: 'المواد الكيميائية الصيدلانية', code: 'MD-04' },
      { name: 'النفايات التشريحية', code: 'MD-05' },
      { name: 'نفايات العلاج الكيميائي', code: 'MD-06' },
      { name: 'النفايات المشعة الطبية', code: 'MD-07' },
      { name: 'أكياس الدم ومشتقاته', code: 'MD-08' },
      { name: 'المستلزمات الطبية الملوثة', code: 'MD-09' },
      { name: 'نفايات غسيل الكلى', code: 'MD-10' },
      { name: 'قفازات طبية ملوثة', code: 'MD-11' },
      { name: 'أقنعة ومعدات وقاية شخصية', code: 'MD-12' },
      { name: 'عبوات أدوية فارغة', code: 'MD-13' },
      { name: 'نفايات مختبرات التحاليل', code: 'MD-14' },
      { name: 'نفايات الأسنان', code: 'MD-15' },
      { name: 'نفايات العيادات البيطرية', code: 'MD-16' },
      { name: 'أنابيب ومحاقن مستعملة', code: 'MD-17' },
      { name: 'ضمادات وقطن ملوث', code: 'MD-18' },
      { name: 'نفايات غرف العمليات', code: 'MD-19' },
      { name: 'مخلفات التعقيم', code: 'MD-20' },
    ],
  },
  {
    id: 'industrial',
    name: 'المخلفات الصناعية الخطرة',
    subcategories: [
      { name: 'براميل صناعية ملوثة', code: 'IN-01' },
      { name: 'حمأة صناعية سامة', code: 'IN-02' },
      { name: 'مخلفات الدباغة', code: 'IN-03' },
      { name: 'رماد أفران صناعية', code: 'IN-04' },
      { name: 'مخلفات صناعة البتروكيماويات', code: 'IN-05' },
      { name: 'مخلفات الطلاء الكهربائي', code: 'IN-06' },
      { name: 'حمأة معالجة المياه الصناعية', code: 'IN-07' },
      { name: 'مخلفات صناعة النسيج الملوثة', code: 'IN-08' },
      { name: 'فلاتر صناعية ملوثة', code: 'IN-09' },
      { name: 'مخلفات اللحام والقطع', code: 'IN-10' },
      { name: 'خبث المعادن الثقيلة', code: 'IN-11' },
      { name: 'مخلفات الأسبستوس', code: 'IN-12' },
    ],
  },
];

const nonHazardousCategories = [
  {
    id: 'plastic',
    name: 'مخلفات البلاستيك',
    subcategories: [
      { name: 'PET (زجاجات المياه)', code: 'PL-01' },
      { name: 'HDPE (عبوات الحليب)', code: 'PL-02' },
      { name: 'PVC (أنابيب)', code: 'PL-03' },
      { name: 'LDPE (أكياس بلاستيكية)', code: 'PL-04' },
      { name: 'PP (علب الطعام)', code: 'PL-05' },
      { name: 'PS (الستايروفوم)', code: 'PL-06' },
      { name: 'البلاستيك المختلط', code: 'PL-07' },
      { name: 'الأغشية البلاستيكية', code: 'PL-08' },
      { name: 'بلاستيك صناعي', code: 'PL-09' },
      { name: 'خراطيم بلاستيكية', code: 'PL-10' },
    ],
  },
  {
    id: 'paper',
    name: 'مخلفات الورق والكرتون',
    subcategories: [
      { name: 'الورق المكتبي الأبيض', code: 'PA-01' },
      { name: 'الصحف والمجلات', code: 'PA-02' },
      { name: 'الكرتون المموج', code: 'PA-03' },
      { name: 'الكرتون المضغوط', code: 'PA-04' },
      { name: 'أكياس الورق', code: 'PA-05' },
      { name: 'ورق التغليف', code: 'PA-06' },
      { name: 'الورق المشمع أو المغلف', code: 'PA-07' },
      { name: 'ورق طباعة ملون', code: 'PA-08' },
      { name: 'كتب ومستندات قديمة', code: 'PA-09' },
    ],
  },
  {
    id: 'metal',
    name: 'مخلفات المعادن',
    subcategories: [
      { name: 'الألومنيوم (علب المشروبات)', code: 'MT-01' },
      { name: 'الحديد والصلب', code: 'MT-02' },
      { name: 'النحاس', code: 'MT-03' },
      { name: 'الستانلس ستيل', code: 'MT-04' },
      { name: 'البرونز والنحاس الأصفر', code: 'MT-05' },
      { name: 'الخردة المعدنية المختلطة', code: 'MT-06' },
      { name: 'براميل معدنية نظيفة', code: 'MT-07' },
      { name: 'أنابيب معدنية', code: 'MT-08' },
    ],
  },
  {
    id: 'glass',
    name: 'مخلفات الزجاج',
    subcategories: [
      { name: 'زجاج شفاف', code: 'GL-01' },
      { name: 'زجاج أخضر', code: 'GL-02' },
      { name: 'زجاج بني', code: 'GL-03' },
      { name: 'زجاج مختلط', code: 'GL-04' },
      { name: 'زجاج مسطح (نوافذ)', code: 'GL-05' },
      { name: 'عبوات زجاجية', code: 'GL-06' },
    ],
  },
  {
    id: 'organic',
    name: 'مخلفات عضوية',
    subcategories: [
      { name: 'مخلفات الطعام', code: 'OR-01' },
      { name: 'مخلفات الحدائق', code: 'OR-02' },
      { name: 'مخلفات الأخشاب النظيفة', code: 'OR-03' },
      { name: 'مخلفات المنسوجات الطبيعية', code: 'OR-04' },
      { name: 'مخلفات زراعية', code: 'OR-05' },
      { name: 'سماد عضوي', code: 'OR-06' },
    ],
  },
  {
    id: 'construction',
    name: 'مخلفات البناء والهدم',
    subcategories: [
      { name: 'الخرسانة والطوب', code: 'CN-01' },
      { name: 'الأخشاب الإنشائية', code: 'CN-02' },
      { name: 'البلاط والسيراميك', code: 'CN-03' },
      { name: 'المعادن الإنشائية', code: 'CN-04' },
      { name: 'مخلفات الترميم', code: 'CN-05' },
      { name: 'ردم وأتربة', code: 'CN-06' },
    ],
  },
];

// Generate contract terms
function generateContractTerms(categoryName: string, isHazardous: boolean, partnerType: string, subcategoryName?: string): string {
  const wasteLabel = subcategoryName || categoryName;
  const hazardNote = isHazardous ? 
    `\n\n**ملاحظة هامة:** هذا العقد يتضمن التعامل مع مخلفات خطرة ويخضع للاشتراطات الخاصة المنصوص عليها في قانون 202 لسنة 2020 ولوائحه التنفيذية.` : '';
  
  return `**البند الأول: التعريفات والمصطلحات**
1.1 يُقصد بـ"المخلفات" في هذا العقد: ${wasteLabel} وفقاً للتصنيف المعتمد من جهاز تنظيم إدارة المخلفات.
1.2 "الناقل المرخص": الطرف ${partnerType === 'generator' ? 'الثاني' : 'الأول'} الحاصل على ترخيص نقل المخلفات ساري المفعول.
1.3 "الجهة ${partnerType === 'generator' ? 'المولدة' : 'المعالجة'}": الطرف ${partnerType === 'generator' ? 'الأول' : 'الثاني'} المسؤول عن ${partnerType === 'generator' ? 'توليد' : 'معالجة'} المخلفات.${hazardNote}

**البند الثاني: الإطار القانوني**
2.1 يخضع هذا العقد لأحكام قانون البيئة رقم 4 لسنة 1994 وتعديلاته.
2.2 يلتزم الطرفان بقانون تنظيم إدارة المخلفات رقم 202 لسنة 2020 ولائحته التنفيذية.

**البند الثالث: التراخيص والتصاريح**
3.1 يتعهد الناقل بالحصول والحفاظ على ترخيص نقل المخلفات ساري المفعول.
3.2 يلتزم الطرفان بتجديد التراخيص قبل انتهائها بمدة لا تقل عن 30 يوماً.

**البند الرابع: نطاق الخدمات**
4.1 يشمل هذا العقد ${partnerType === 'generator' ? 'جمع ونقل' : 'تدوير ومعالجة'} ${wasteLabel}.
4.2 تُحدد المواصفات الفنية للمخلفات في الملحق (أ) المرفق.

**البند الخامس: المواصفات الفنية**
5.1 تُستخدم حاويات مطابقة للمواصفات المصرية القياسية.
5.2 ${isHazardous ? 'يجب وضع علامات التحذير الدولية على جميع الحاويات.' : 'تُوضع علامات تعريفية واضحة.'}

**البند السادس إلى الثلاثين:**
[تفاصيل البنود القانونية الكاملة متوفرة في النسخة الموسعة من العقد]`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get organization ID from request (or use a system org)
    const { organization_id } = await req.json();
    
    if (!organization_id) {
      return new Response(
        JSON.stringify({ error: "organization_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const templates: any[] = [];
    const allCategories = [
      ...hazardousCategories.map(c => ({ ...c, isHazardous: true })),
      ...nonHazardousCategories.map(c => ({ ...c, isHazardous: false })),
    ];

    // Generate templates
    for (const category of allCategories) {
      // 10 generator templates per category
      for (let i = 1; i <= 10; i++) {
        templates.push({
          organization_id,
          name: `عقد جمع ونقل ${category.name} - نموذج ${i}`,
          description: `قالب عقد رقم ${i} لجمع ونقل ${category.name} من الجهات المولدة`,
          partner_type: 'generator',
          contract_category: 'collection_transport',
          template_type: 'system',
          terms_template: generateContractTerms(category.name, category.isHazardous, 'generator'),
          include_stamp: true,
          include_signature: true,
          include_header_logo: true,
          is_active: true,
          usage_count: 0,
        });
      }

      // 10 recycler templates per category
      for (let i = 1; i <= 10; i++) {
        templates.push({
          organization_id,
          name: `عقد تدوير ومعالجة ${category.name} - نموذج ${i}`,
          description: `قالب عقد رقم ${i} لتدوير ومعالجة ${category.name} مع جهات التدوير`,
          partner_type: 'recycler',
          contract_category: 'recycling',
          template_type: 'system',
          terms_template: generateContractTerms(category.name, category.isHazardous, 'recycler'),
          include_stamp: true,
          include_signature: true,
          include_header_logo: true,
          is_active: true,
          usage_count: 0,
        });
      }

      // Subcategory templates
      for (const sub of category.subcategories) {
        // Generator
        templates.push({
          organization_id,
          name: `عقد جمع ${sub.name} (${sub.code})`,
          description: `قالب عقد متخصص لجمع ونقل ${sub.name} - الكود: ${sub.code}`,
          partner_type: 'generator',
          contract_category: 'collection_transport',
          template_type: 'system',
          terms_template: generateContractTerms(category.name, category.isHazardous, 'generator', sub.name),
          include_stamp: true,
          include_signature: true,
          include_header_logo: true,
          is_active: true,
          usage_count: 0,
        });

        // Recycler
        templates.push({
          organization_id,
          name: `عقد تدوير ${sub.name} (${sub.code})`,
          description: `قالب عقد متخصص لتدوير ومعالجة ${sub.name} - الكود: ${sub.code}`,
          partner_type: 'recycler',
          contract_category: 'recycling',
          template_type: 'system',
          terms_template: generateContractTerms(category.name, category.isHazardous, 'recycler', sub.name),
          include_stamp: true,
          include_signature: true,
          include_header_logo: true,
          is_active: true,
          usage_count: 0,
        });
      }
    }

    // Insert in batches of 50
    const batchSize = 50;
    let inserted = 0;
    
    for (let i = 0; i < templates.length; i += batchSize) {
      const batch = templates.slice(i, i + batchSize);
      const { error } = await supabase
        .from('contract_templates')
        .insert(batch);
      
      if (error) {
        console.error('Batch insert error:', error);
        throw error;
      }
      inserted += batch.length;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `تم إنشاء ${inserted} قالب عقد بنجاح`,
        templates_count: inserted,
        categories_count: allCategories.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error seeding templates:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
