/**
 * System Contract Templates - Egyptian Waste Management Law Compliant
 * قوالب العقود النظامية - محدّثة ومنظمة
 * 
 * المرجعيات:
 * - قانون البيئة رقم 4 لسنة 1994
 * - قانون تنظيم إدارة المخلفات رقم 202 لسنة 2020
 * - لوائح جهاز تنظيم إدارة المخلفات (WMRA)
 * - اتفاقية بازل (للمخلفات الخطرة)
 */

import { hazardousWasteCategories, nonHazardousWasteCategories } from '@/lib/wasteClassification';

export interface SystemContractTemplate {
  name: string;
  description: string;
  partner_type: 'generator' | 'recycler' | 'both';
  contract_category: 'collection' | 'transport' | 'collection_transport' | 'recycling' | 'other';
  waste_category_id: string;
  subcategory_code?: string;
  header_text: string;
  introduction_text: string;
  terms_template: string;
  obligations_party_one: string;
  obligations_party_two: string;
  payment_terms_template: string;
  duration_clause: string;
  termination_clause: string;
  dispute_resolution: string;
  closing_text: string;
}

// ============================================
// بناء نص العقد المُهيكل (25 مادة مرقمة)
// ============================================

const generateContractTerms = (
  categoryName: string,
  isHazardous: boolean,
  partnerType: 'generator' | 'recycler',
  subcategoryName?: string
): string => {
  const wasteLabel = subcategoryName || categoryName;
  const hazardTag = isHazardous ? ' ⚠️ (مخلفات خطرة - تخضع لاشتراطات خاصة)' : '';
  const partyOneRole = partnerType === 'generator' ? 'الجهة المولدة' : 'جهة التدوير';
  const partyTwoRole = 'شركة النقل المرخصة';

  return `
═══════════════════════════════════════════
الباب الأول: أحكام عامة وتعريفات
═══════════════════════════════════════════

المادة (1) - التعريفات والمصطلحات:
1/1 "المخلفات": ${wasteLabel} وفقاً للتصنيف المعتمد من جهاز تنظيم إدارة المخلفات.${hazardTag}
1/2 "${partyOneRole}": الطرف الأول المسؤول عن ${partnerType === 'generator' ? 'توليد وتسليم' : 'استقبال ومعالجة'} المخلفات.
1/3 "${partyTwoRole}": الطرف الثاني الحاصل على ترخيص نقل ساري المفعول.
1/4 "وثيقة النقل": المستند الرسمي المعتمد من الجهاز لتوثيق حركة المخلفات.
1/5 "الجهاز": جهاز تنظيم إدارة المخلفات (WMRA).

المادة (2) - الإطار القانوني:
2/1 يخضع هذا العقد لأحكام القانون المدني المصري رقم 131 لسنة 1948.
2/2 يلتزم الطرفان بقانون تنظيم إدارة المخلفات رقم 202 لسنة 2020 ولائحته التنفيذية.
2/3 تُعتبر قرارات الجهاز ملزمة للطرفين دون استثناء.
2/4 أي تعديل تشريعي يُلزم الطرفين بالتوافق خلال 30 يوماً من نفاذه.
${isHazardous ? '2/5 تسري اشتراطات اتفاقية بازل على عمليات النقل العابرة للحدود إن وُجدت.' : ''}

المادة (3) - التراخيص والتصاريح:
3/1 يتعهد الناقل بالحفاظ على ترخيص نقل المخلفات سارياً طوال مدة العقد.
3/2 تُقدم ${partyOneRole} نسخة من السجل البيئي وموافقات جهاز شؤون البيئة.
3/3 يلتزم الطرفان بتجديد التراخيص قبل انتهائها بـ 30 يوماً على الأقل.
3/4 انتهاء أي ترخيص دون تجديد يمنح الطرف الآخر حق إيقاف العمل فوراً.

═══════════════════════════════════════════
الباب الثاني: نطاق الخدمات والمواصفات الفنية
═══════════════════════════════════════════

المادة (4) - نطاق الخدمات:
4/1 يشمل العقد ${partnerType === 'generator' ? 'جمع ونقل' : 'استقبال وتدوير'} ${wasteLabel}.
4/2 تُحدد المواصفات الفنية والكميات في الملحق (أ).
4/3 يحق للناقل رفض مخلفات لا تطابق المواصفات المتفق عليها.
4/4 أي تغيير في نوعية أو كمية المخلفات يستوجب إخطاراً كتابياً مسبقاً بـ 7 أيام.

المادة (5) - اشتراطات النقل والتجهيز:
5/1 تُستخدم حاويات مطابقة للمواصفات المصرية القياسية.
5/2 يلتزم الناقل بتجهيز مركباته بأنظمة تتبع GPS معتمدة من الجهاز.
5/3 ${isHazardous ? 'تُوضع علامات التحذير الدولية (GHS) على جميع الحاويات والمركبات.' : 'تُوضع علامات تعريفية واضحة على الحاويات.'}
5/4 يُحظر خلط ${wasteLabel} مع أنواع أخرى أثناء النقل.
5/5 المركبات مجهزة بمعدات ${isHazardous ? 'احتواء التسربات الكيميائية وإطفاء الحريق' : 'النظافة والتطهير'}.

═══════════════════════════════════════════
الباب الثالث: التوثيق والسجلات
═══════════════════════════════════════════

المادة (6) - التوثيق الإلزامي:
6/1 يُعبأ نموذج وثيقة النقل المعتمد لكل شحنة.
6/2 تُحفظ نسخ السجلات لمدة لا تقل عن 5 سنوات.
6/3 تُقدم تقارير شهرية مفصلة عن الكميات والوجهات.
6/4 تُسجل العمليات في المنظومة الإلكترونية لتتبع المخلفات فور تفعيلها.

═══════════════════════════════════════════
الباب الرابع: السلامة والمسؤولية البيئية
═══════════════════════════════════════════

المادة (7) - السلامة والصحة المهنية:
7/1 يلتزم الناقل بتوفير معدات الوقاية الشخصية (PPE) لجميع العاملين.
7/2 تدريب دوري موثق على التعامل الآمن مع ${wasteLabel}.
7/3 ${isHazardous ? 'فحص طبي دوري للعاملين المتعاملين مع المخلفات الخطرة (كل 6 أشهر).' : 'تطبيق إجراءات السلامة المهنية المعتمدة.'}
7/4 حفظ سجلات السلامة والحوادث لمدة 10 سنوات.

المادة (8) - المسؤولية البيئية:
8/1 يتحمل الناقل المسؤولية الكاملة من لحظة الاستلام حتى التسليم النهائي.
8/2 الإبلاغ الفوري عن أي تسرب أو حادث خلال ساعة واحدة.
8/3 يلتزم المتسبب في الضرر بتكاليف المعالجة والتعويضات.
8/4 تُطبق قاعدة "الملوث يدفع" وفقاً للمادة 4 من قانون 202/2020.

المادة (9) - التأمين والضمانات:
9/1 تأمين شامل ضد أخطار النقل والمسؤولية المدنية والبيئية.
9/2 ${isHazardous ? 'الحد الأدنى لمبلغ التأمين: 5,000,000 جنيه مصري للمخلفات الخطرة.' : 'مبلغ التأمين يتناسب مع حجم العمليات وطبيعة المخلفات.'}
9/3 تُقدم نسخة سارية من وثيقة التأمين عند التوقيع وعند كل تجديد.
9/4 يجوز طلب ضمان بنكي إضافي بالاتفاق بين الطرفين.

═══════════════════════════════════════════
الباب الخامس: الالتزامات المالية
═══════════════════════════════════════════

المادة (10) - الأسعار والفواتير:
10/1 جدول الأسعار في الملحق (ب) - يشمل التكلفة لكل طن/رحلة.
10/2 تُصدر الفواتير خلال أول 5 أيام عمل من الشهر التالي.
10/3 السداد خلال 30 يوماً من تاريخ استلام الفاتورة المعتمدة.
10/4 تأخير السداد: غرامة 1% شهرياً من المبلغ المتأخر.
10/5 مراجعة سنوية للأسعار بناءً على مؤشر التضخم الرسمي.

المادة (11) - الجزاءات والخصومات:
11/1 التأخير عن موعد الجمع المتفق عليه: 5% من قيمة الشحنة.
11/2 مخالفة إجراءات التوثيق: خصم 10% من الفاتورة الشهرية.
11/3 تكرار المخالفة 3 مرات: حق إنهاء العقد بإخطار 15 يوماً.

═══════════════════════════════════════════
الباب السادس: مدة العقد وإنهاؤه
═══════════════════════════════════════════

المادة (12) - المدة والتجديد:
12/1 مدة العقد: سنة ميلادية من تاريخ التوقيع.
12/2 تجديد تلقائي لفترات مماثلة ما لم يُخطر أحد الطرفين الآخر كتابياً.
12/3 إخطار عدم التجديد: قبل 90 يوماً من تاريخ الانتهاء.

المادة (13) - الإنهاء والفسخ:
13/1 إنهاء بالتراضي: إخطار كتابي مسبق قبل 60 يوماً.
13/2 الفسخ الفوري: في حالة الإخلال الجسيم بالالتزامات.
13/3 إلغاء الترخيص يُنهي العقد تلقائياً.
13/4 تسوية المستحقات خلال 30 يوماً من تاريخ الإنهاء.
13/5 التزام الناقل بإتمام جمع المخلفات المعلقة قبل الإنهاء الفعلي.

═══════════════════════════════════════════
الباب السابع: أحكام عامة وختامية
═══════════════════════════════════════════

المادة (14) - السرية:
14/1 سرية جميع المعلومات المتبادلة بموجب العقد.
14/2 يُحظر الإفصاح لأي طرف ثالث دون موافقة كتابية.
14/3 استمرار التزام السرية لمدة 3 سنوات بعد انتهاء العقد.
14/4 استثناء: المعلومات المطلوبة قانوناً للجهات الرقابية.

المادة (15) - القوة القاهرة:
15/1 لا يُسأل أي طرف عن التأخير الناتج عن قوة قاهرة (المادة 165 مدني).
15/2 إخطار الطرف الآخر خلال 48 ساعة من وقوع الحدث.
15/3 تعليق الالتزامات المتأثرة لحين زوال السبب.
15/4 استمرار القوة القاهرة أكثر من 90 يوماً: حق الإنهاء لأي طرف.

المادة (16) - التعديلات والملاحق:
16/1 لا تعديل إلا بملحق مكتوب موقع من الطرفين المفوضين.
16/2 الملاحق جزء لا يتجزأ من العقد.
16/3 عند التعارض: أحكام الملحق الأحدث تسود.

المادة (17) - التنازل:
17/1 لا تنازل عن الحقوق أو الالتزامات دون موافقة كتابية مسبقة.
17/2 يجوز التعاقد من الباطن بموافقة الطرف الآخر وإخطار الجهات الرقابية.
17/3 يظل الطرف الأصلي مسؤولاً تضامنياً.

المادة (18) - الإخطارات:
18/1 جميع الإخطارات كتابية وباللغة العربية على العناوين المبينة في الديباجة.
18/2 الإخطار نافذ من تاريخ الاستلام أو بعد 7 أيام من الإرسال المسجل.
18/3 إخطار بأي تغيير في بيانات الاتصال خلال 15 يوماً.
18/4 المراسلات الإلكترونية مقبولة على العناوين المعتمدة رسمياً.

المادة (19) - الرقابة والتفتيش:
19/1 حق ${partyOneRole} في التفتيش على مركبات ومعدات الناقل.
19/2 تعاون كامل مع مفتشي الجهاز والجهات الرقابية.
19/3 تقارير دورية شهرية عن العمليات المنفذة.

المادة (20) - مكافحة الفساد والنزاهة:
20/1 الالتزام بقوانين مكافحة الفساد والرشوة.
20/2 أي مخالفة تُعد إخلالاً جوهرياً يُوجب الفسخ الفوري.

المادة (21) - حماية البيانات:
21/1 الامتثال لقانون حماية البيانات الشخصية رقم 151 لسنة 2020.
21/2 اتخاذ التدابير الأمنية اللازمة لحماية البيانات.

المادة (22) - استقلالية البنود:
22/1 بطلان أي مادة لا يؤثر على صحة باقي المواد.
22/2 يُستبدل البند الباطل ببند يحقق ذات الغرض.

المادة (23) - كامل الاتفاق:
23/1 العقد وملاحقه يمثلان كامل الاتفاق ويلغيان أي اتفاقات سابقة.
23/2 لا يُعتد بوعود أو تمثيلات غير مدونة.

المادة (24) - حل النزاعات:
24/1 تسوية ودية خلال 30 يوماً من نشوء النزاع.
24/2 تعذر الحل الودي: تحكيم وفق قواعد مركز القاهرة الإقليمي للتحكيم.
24/3 مقر التحكيم: القاهرة | اللغة: العربية.
24/4 قرار التحكيم نهائي وملزم وغير قابل للطعن.
24/5 الاختصاص القضائي: محاكم القاهرة الاقتصادية.

المادة (25) - النسخ والتوقيعات:
25/1 يُحرر العقد من 3 نسخ أصلية متطابقة باللغة العربية.
25/2 يحتفظ كل طرف بنسخة وتُودع الثالثة لدى الجهة المختصة.
25/3 يجوز التوقيع الإلكتروني وفق قانون 15 لسنة 2004.
25/4 يُعتبر العقد نافذاً من تاريخ التوقيع.
`.trim();
};

// ============================================
// Generators
// ============================================

const generateHeader = (categoryName: string, partnerType: 'generator' | 'recycler'): string => {
  return `عقد ${partnerType === 'generator' ? 'جمع ونقل' : 'تدوير ومعالجة'} ${categoryName}
وفقاً لأحكام قانون تنظيم إدارة المخلفات رقم 202 لسنة 2020
ولائحته التنفيذية وقرارات جهاز تنظيم إدارة المخلفات`;
};

const generateIntroduction = (categoryName: string, isHazardous: boolean): string => {
  return `إنه في يوم {{التاريخ}} الموافق {{التاريخ_هجري}}
بمقر الطرف الأول الكائن في {{عنوان_الطرف_الأول}}

تم الاتفاق بين كل من:

الطرف الأول: {{اسم_الجهة_الأولى}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• السجل التجاري رقم: {{رقم_السجل_التجاري}}
• البطاقة الضريبية رقم: {{رقم_البطاقة_الضريبية}}
• الترخيص البيئي رقم: {{رقم_الترخيص_البيئي}}
• يمثله السيد/ة: {{اسم_الممثل_القانوني}} - بصفته: {{الصفة}}

الطرف الثاني: {{اسم_الجهة_الثانية}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• السجل التجاري رقم: {{رقم_السجل_التجاري_2}}
• ترخيص نقل المخلفات رقم: {{رقم_ترخيص_النقل}}
• يمثله السيد/ة: {{اسم_الممثل_القانوني_2}} - بصفته: {{الصفة_2}}

═══════════════════════════════════════
موضوع العقد: ${isHazardous ? '⚠️' : '♻️'} جمع ونقل ${categoryName}
التصنيف: ${isHazardous ? 'مخلفات خطرة (تخضع لاشتراطات خاصة)' : 'مخلفات غير خطرة'}
═══════════════════════════════════════

بعد إقرار الطرفين بأهليتهما القانونية الكاملة للتعاقد، اتفقا على البنود التالية:`;
};

const generateObligationsPartyOne = (partnerType: 'generator' | 'recycler', categoryName: string): string => {
  if (partnerType === 'generator') {
    return `التزامات الطرف الأول (الجهة المولدة):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
أ) فرز ${categoryName} وفقاً للتصنيف المعتمد من الجهاز.
ب) توفير مكان آمن ومناسب لتخزين المخلفات لحين موعد الجمع.
ج) إعداد المخلفات للنقل بالتغليف المطابق للمواصفات الفنية.
د) تزويد الناقل بالبيانات الكاملة عن المخلفات (النوع، الكمية، الخطورة).
هـ) التوقيع على وثائق النقل وتسليم النسخة الأصلية.
و) الالتزام بمواعيد الجمع والإخطار بأي تغيير قبل 24 ساعة.
ز) توفير ممر آمن ومُضاء لوصول مركبات النقل.
ح) سداد المستحقات المالية في المواعيد المتفق عليها.`;
  }
  return `التزامات الطرف الأول (جهة التدوير):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
أ) استلام ${categoryName} المطابقة للمواصفات المتفق عليها فقط.
ب) المعالجة وفقاً للطرق المعتمدة والمرخصة بيئياً.
ج) إصدار شهادات المعالجة والتخلص النهائي.
د) الاحتفاظ بسجلات دقيقة للكميات المستلمة والمعالجة.
هـ) إخطار الناقل بأي مخالفة في مواصفات المخلفات.
و) توفير مرافق استلام مجهزة ومطابقة بيئياً.
ز) سداد مستحقات الناقل في المواعيد المتفق عليها.
ح) التعاون مع الجهات الرقابية وتسهيل التفتيش.`;
};

const generateObligationsPartyTwo = (categoryName: string, isHazardous: boolean): string => {
  return `التزامات الطرف الثاني (شركة النقل):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
أ) الحفاظ على ترخيص نقل المخلفات سارياً ومطابقاً لنوعية ${categoryName}.
ب) توفير مركبات مجهزة ومطابقة للمواصفات الفنية والبيئية.
ج) تجهيز المركبات بأنظمة تتبع GPS معتمدة من الجهاز.
د) ${isHazardous ? 'تزويد المركبات بمعدات احتواء التسربات ومواد الامتصاص الكيميائي.' : 'الحفاظ على نظافة المركبات والحاويات وتطهيرها دورياً.'}
هـ) الالتزام بمواعيد الجمع والتسليم (هامش تأخير: ساعتان كحد أقصى).
و) تدريب السائقين والعمال على التعامل الآمن (تدريب موثق).
ز) توثيق جميع العمليات في المنظومة الإلكترونية.
ح) التسليم للجهات المرخصة فقط + إيصالات استلام موقعة.
ط) الإبلاغ الفوري عن أي حادث أو تسرب (خلال ساعة).
ي) تقديم تقارير شهرية مفصلة بالعمليات المنفذة.`;
};

const generatePaymentTerms = (): string => {
  return `شروط الدفع والمقابل المالي:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
أ) جدول الأسعار: الملحق (ب) المرفق - يحدد التكلفة لكل وحدة (طن/رحلة/حاوية).
ب) إصدار الفواتير: خلال أول 5 أيام عمل من الشهر التالي لفترة الخدمة.
ج) مدة السداد: 30 يوماً من تاريخ استلام الفاتورة المعتمدة.
د) غرامة تأخير: 1% شهرياً من قيمة المبالغ المتأخرة.
هـ) مراجعة الأسعار: سنوياً بناءً على مؤشر أسعار المستهلك الرسمي.
و) تعديل الأسعار: بموجب ملحق مكتوب يوقعه الطرفان.
ز) خصم الغرامات المستحقة من الدفعات المالية القادمة.`;
};

const generateDurationClause = (): string => {
  return `مدة العقد والتجديد:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
أ) المدة: سنة ميلادية واحدة تبدأ من تاريخ التوقيع.
ب) التجديد: تلقائي لفترات مماثلة ما لم يُقدم إخطار كتابي بعدم الرغبة.
ج) إخطار عدم التجديد: قبل 90 يوماً من تاريخ الانتهاء.
د) الالتزامات المالية والتوثيقية تستمر حتى تسويتها الكاملة.`;
};

const generateTerminationClause = (): string => {
  return `إنهاء العقد وفسخه:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
أ) الإنهاء بالتراضي: إخطار كتابي مسبق قبل 60 يوماً.
ب) الفسخ الفوري: حق الطرف المتضرر في حالة الإخلال الجسيم.
ج) إلغاء الترخيص أو توقفه: إنهاء تلقائي فوري.
د) تسوية المستحقات: خلال 30 يوماً من الإنهاء.
هـ) التزام الناقل بإتمام جمع المخلفات المعلقة وتسليمها قبل الإنهاء الفعلي.`;
};

const generateDisputeResolution = (): string => {
  return `حل النزاعات والتحكيم:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
أ) تسوية ودية: خلال 30 يوماً من نشوء النزاع عبر التفاوض المباشر.
ب) التحكيم: وفق قواعد مركز القاهرة الإقليمي للتحكيم التجاري الدولي.
ج) مقر التحكيم: القاهرة | اللغة: العربية.
د) قرار التحكيم: نهائي وملزم وغير قابل للطعن.
هـ) المصاريف: يتحملها الطرف الخاسر ما لم يقرر المحكم خلاف ذلك.
و) الاختصاص القضائي: محاكم القاهرة الاقتصادية.`;
};

const generateClosingText = (): string => {
  return `═══════════════════════════════════════════
التوقيعات والختم الرسمي
═══════════════════════════════════════════

وإثباتاً لما تقدم، حُرر هذا العقد من ثلاث نسخ أصلية متطابقة باللغة العربية،
تسلم كل طرف نسخة للعمل بموجبها، وتُودع النسخة الثالثة لدى الجهة المختصة.

والله خير الشاهدين

┌───────────────────────────┬───────────────────────────┐
│      الطرف الأول          │      الطرف الثاني         │
├───────────────────────────┼───────────────────────────┤
│ الاسم: _________________ │ الاسم: _________________ │
│ التوقيع: ________________ │ التوقيع: ________________ │
│ الختم: __________________ │ الختم: __________________ │
│ التاريخ: ________________ │ التاريخ: ________________ │
└───────────────────────────┴───────────────────────────┘`;
};

// ============================================
// Generate all templates (optimized - fewer duplicates)
// ============================================

export const generateSystemTemplates = (): SystemContractTemplate[] => {
  const templates: SystemContractTemplate[] = [];
  const allCategories = [...hazardousWasteCategories, ...nonHazardousWasteCategories];

  allCategories.forEach(category => {
    const isHazardous = category.category === 'hazardous';

    // 2 main templates per category (generator + recycler)
    templates.push({
      name: `عقد جمع ونقل ${category.name}`,
      description: `قالب عقد معتمد لجمع ونقل ${category.name} من الجهات المولدة - متوافق مع قانون 202/2020`,
      partner_type: 'generator',
      contract_category: 'collection_transport',
      waste_category_id: category.id,
      header_text: generateHeader(category.name, 'generator'),
      introduction_text: generateIntroduction(category.name, isHazardous),
      terms_template: generateContractTerms(category.name, isHazardous, 'generator'),
      obligations_party_one: generateObligationsPartyOne('generator', category.name),
      obligations_party_two: generateObligationsPartyTwo(category.name, isHazardous),
      payment_terms_template: generatePaymentTerms(),
      duration_clause: generateDurationClause(),
      termination_clause: generateTerminationClause(),
      dispute_resolution: generateDisputeResolution(),
      closing_text: generateClosingText(),
    });

    templates.push({
      name: `عقد تدوير ومعالجة ${category.name}`,
      description: `قالب عقد معتمد لتدوير ومعالجة ${category.name} مع جهات التدوير - متوافق مع قانون 202/2020`,
      partner_type: 'recycler',
      contract_category: 'recycling',
      waste_category_id: category.id,
      header_text: generateHeader(category.name, 'recycler'),
      introduction_text: generateIntroduction(category.name, isHazardous),
      terms_template: generateContractTerms(category.name, isHazardous, 'recycler'),
      obligations_party_one: generateObligationsPartyOne('recycler', category.name),
      obligations_party_two: generateObligationsPartyTwo(category.name, isHazardous),
      payment_terms_template: generatePaymentTerms(),
      duration_clause: generateDurationClause(),
      termination_clause: generateTerminationClause(),
      dispute_resolution: generateDisputeResolution(),
      closing_text: generateClosingText(),
    });

    // Subcategory-specific templates
    category.subcategories.forEach(subcategory => {
      templates.push({
        name: `عقد جمع ${subcategory.name} (${subcategory.code})`,
        description: `قالب متخصص لجمع ونقل ${subcategory.name} - كود: ${subcategory.code}${subcategory.baselCode ? ` | بازل: ${subcategory.baselCode}` : ''}`,
        partner_type: 'generator',
        contract_category: 'collection_transport',
        waste_category_id: category.id,
        subcategory_code: subcategory.code,
        header_text: generateHeader(subcategory.name, 'generator'),
        introduction_text: generateIntroduction(subcategory.name, isHazardous),
        terms_template: generateContractTerms(category.name, isHazardous, 'generator', subcategory.name),
        obligations_party_one: generateObligationsPartyOne('generator', subcategory.name),
        obligations_party_two: generateObligationsPartyTwo(subcategory.name, isHazardous),
        payment_terms_template: generatePaymentTerms(),
        duration_clause: generateDurationClause(),
        termination_clause: generateTerminationClause(),
        dispute_resolution: generateDisputeResolution(),
        closing_text: generateClosingText(),
      });

      templates.push({
        name: `عقد تدوير ${subcategory.name} (${subcategory.code})`,
        description: `قالب متخصص لتدوير ومعالجة ${subcategory.name} - كود: ${subcategory.code}${subcategory.baselCode ? ` | بازل: ${subcategory.baselCode}` : ''}`,
        partner_type: 'recycler',
        contract_category: 'recycling',
        waste_category_id: category.id,
        subcategory_code: subcategory.code,
        header_text: generateHeader(subcategory.name, 'recycler'),
        introduction_text: generateIntroduction(subcategory.name, isHazardous),
        terms_template: generateContractTerms(category.name, isHazardous, 'recycler', subcategory.name),
        obligations_party_one: generateObligationsPartyOne('recycler', subcategory.name),
        obligations_party_two: generateObligationsPartyTwo(subcategory.name, isHazardous),
        payment_terms_template: generatePaymentTerms(),
        duration_clause: generateDurationClause(),
        termination_clause: generateTerminationClause(),
        dispute_resolution: generateDisputeResolution(),
        closing_text: generateClosingText(),
      });
    });
  });

  return templates;
};

export const getTemplatesSummary = () => {
  const allCategories = [...hazardousWasteCategories, ...nonHazardousWasteCategories];
  const totalSubcategories = allCategories.reduce((sum, cat) => sum + cat.subcategories.length, 0);
  
  return {
    mainCategories: allCategories.length,
    subcategories: totalSubcategories,
    mainTemplatesPerCategory: 2, // generator + recycler
    subcategoryTemplates: totalSubcategories * 2,
    totalTemplates: (allCategories.length * 2) + (totalSubcategories * 2),
  };
};
