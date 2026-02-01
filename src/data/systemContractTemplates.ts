/**
 * System Contract Templates - Egyptian Waste Management Law Compliant
 * قوالب العقود الجاهزة المتوافقة مع قانون إدارة المخلفات المصري
 * 
 * Based on:
 * - Law No. 4 of 1994 (Environment Law)
 * - Law No. 202 of 2020 (Waste Management Law)
 * - WMRA Regulations
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

// Helper function to generate detailed contract terms
const generateContractTerms = (
  categoryName: string,
  isHazardous: boolean,
  partnerType: 'generator' | 'recycler',
  subcategoryName?: string
): string => {
  const wasteLabel = subcategoryName || categoryName;
  const hazardNote = isHazardous ? 
    `\n\n**ملاحظة هامة:** هذا العقد يتضمن التعامل مع مخلفات خطرة ويخضع للاشتراطات الخاصة المنصوص عليها في قانون 202 لسنة 2020 ولوائحه التنفيذية.` : '';
  
  return `
**البند الأول: التعريفات والمصطلحات**
1.1 يُقصد بـ"المخلفات" في هذا العقد: ${wasteLabel} وفقاً للتصنيف المعتمد من جهاز تنظيم إدارة المخلفات.
1.2 "الناقل المرخص": الطرف ${partnerType === 'generator' ? 'الثاني' : 'الأول'} الحاصل على ترخيص نقل المخلفات ساري المفعول.
1.3 "الجهة ${partnerType === 'generator' ? 'المولدة' : 'المعالجة'}": الطرف ${partnerType === 'generator' ? 'الأول' : 'الثاني'} المسؤول عن ${partnerType === 'generator' ? 'توليد' : 'معالجة'} المخلفات.
1.4 "وثيقة النقل": المستند الرسمي المعتمد لتتبع حركة المخلفات وفقاً للنموذج المعتمد.${hazardNote}

**البند الثاني: الإطار القانوني والمرجعية التشريعية**
2.1 يخضع هذا العقد لأحكام قانون البيئة رقم 4 لسنة 1994 وتعديلاته.
2.2 يلتزم الطرفان بقانون تنظيم إدارة المخلفات رقم 202 لسنة 2020 ولائحته التنفيذية.
2.3 تُعتبر القرارات الصادرة من جهاز تنظيم إدارة المخلفات ملزمة للطرفين.
2.4 أي تعديل تشريعي يُلزم الطرفين بالتوافق مع أحكامه خلال المدة القانونية المحددة.

**البند الثالث: التراخيص والتصاريح الإلزامية**
3.1 يتعهد الناقل بالحصول والحفاظ على ترخيص نقل المخلفات ساري المفعول طوال مدة العقد.
3.2 ${partnerType === 'generator' ? 'تتعهد الجهة المولدة' : 'تتعهد جهة التدوير'} بتقديم نسخة من السجل البيئي وموافقات جهاز شؤون البيئة.
3.3 يلتزم الطرفان بتجديد التراخيص قبل انتهائها بمدة لا تقل عن 30 يوماً.
3.4 يحق للطرف الآخر إيقاف العمل في حال انتهاء أي ترخيص دون تجديد.

**البند الرابع: نطاق الخدمات ومواصفات المخلفات**
4.1 يشمل هذا العقد جمع ونقل ${wasteLabel} من مواقع ${partnerType === 'generator' ? 'الجهة المولدة' : 'الجهة المعالجة'}.
4.2 تُحدد المواصفات الفنية للمخلفات في الملحق (أ) المرفق بهذا العقد.
4.3 يحق للناقل رفض استلام مخلفات لا تطابق المواصفات المتفق عليها.
4.4 أي تغيير في نوعية أو كمية المخلفات يستوجب إخطاراً كتابياً مسبقاً.

**البند الخامس: المواصفات الفنية واشتراطات النقل**
5.1 تُستخدم حاويات مطابقة للمواصفات المصرية القياسية لنقل ${wasteLabel}.
5.2 يلتزم الناقل بتجهيز مركباته بأنظمة التتبع GPS المعتمدة من الجهاز.
5.3 ${isHazardous ? 'يجب وضع علامات التحذير الدولية على جميع الحاويات والمركبات.' : 'تُوضع علامات تعريفية واضحة على الحاويات.'}
5.4 يُحظر خلط ${wasteLabel} مع أنواع أخرى من المخلفات أثناء النقل.

**البند السادس: التوثيق والسجلات الإلزامية**
6.1 يلتزم الناقل بتعبئة وثيقة النقل لكل شحنة وفقاً للنموذج المعتمد.
6.2 تُحتفظ نسخ من السجلات لمدة لا تقل عن 5 سنوات.
6.3 يلتزم الطرفان بتقديم التقارير الدورية للجهاز في المواعيد المحددة.
6.4 تُسجل جميع العمليات في المنظومة الإلكترونية لتتبع المخلفات.

**البند السابع: السلامة والصحة المهنية**
7.1 يلتزم الناقل بتوفير معدات الوقاية الشخصية لجميع العاملين.
7.2 يخضع العاملون لتدريب دوري على التعامل الآمن مع ${wasteLabel}.
7.3 ${isHazardous ? 'يُجرى فحص طبي دوري للعاملين المتعاملين مع المخلفات الخطرة.' : 'تُطبق إجراءات السلامة المهنية المعتمدة.'}
7.4 يُحتفظ بسجلات السلامة والحوادث لمدة 10 سنوات.

**البند الثامن: المسؤولية البيئية والتعويضات**
8.1 يتحمل الناقل المسؤولية الكاملة عن أي تلوث ناتج أثناء عمليات النقل.
8.2 في حالة التسرب أو الانسكاب، يلتزم الناقل باتخاذ إجراءات الاحتواء الفورية.
8.3 يلتزم المتسبب في الضرر البيئي بتكاليف المعالجة والتعويضات.
8.4 تُقدر التعويضات وفقاً لمعايير جهاز شؤون البيئة.

**البند التاسع: التأمين والضمانات**
9.1 يلتزم الناقل بالحصول على وثيقة تأمين شاملة ضد أخطار النقل والمسؤولية المدنية.
9.2 ${isHazardous ? 'يجب ألا يقل مبلغ التأمين عن 5 مليون جنيه للمخلفات الخطرة.' : 'يُحدد مبلغ التأمين بما يتناسب مع حجم العمليات.'}
9.3 تُقدم نسخة من وثيقة التأمين سارية المفعول للطرف الآخر.
9.4 يجوز طلب ضمان بنكي إضافي في حالات خاصة يتفق عليها الطرفان.

**البند العاشر: الأسعار وشروط الدفع**
10.1 تُحدد أسعار الخدمات في الملحق (ب) المرفق بهذا العقد.
10.2 تُصدر الفواتير شهرياً ويستحق السداد خلال 30 يوماً من تاريخ الاستلام.
10.3 يُحسب تأخير السداد بمعدل 1% شهرياً من قيمة المبلغ المتأخر.
10.4 تُراجع الأسعار سنوياً بناءً على مؤشر التضخم الرسمي.

**البند الحادي عشر: مدة العقد والتجديد**
11.1 يسري هذا العقد لمدة سنة ميلادية تبدأ من تاريخ التوقيع.
11.2 يتجدد العقد تلقائياً لفترات مماثلة ما لم يُخطر أحد الطرفين الآخر بالإنهاء.
11.3 يُقدم إخطار عدم التجديد قبل 90 يوماً من تاريخ الانتهاء.
11.4 تظل الالتزامات المالية سارية حتى تسويتها الكاملة.

**البند الثاني عشر: إنهاء العقد وفسخه**
12.1 يجوز لأي طرف إنهاء العقد بإخطار كتابي مسبق قبل 60 يوماً.
12.2 يحق للطرف المتضرر فسخ العقد فوراً في حالة الإخلال الجسيم.
12.3 يُعتبر إلغاء الترخيص أو توقفه سبباً لإنهاء العقد تلقائياً.
12.4 تُسوى المستحقات المالية خلال 30 يوماً من تاريخ الإنهاء.

**البند الثالث عشر: السرية وحماية المعلومات**
13.1 يلتزم الطرفان بسرية جميع المعلومات المتبادلة بموجب هذا العقد.
13.2 يُحظر الإفصاح عن المعلومات لأي طرف ثالث دون موافقة كتابية مسبقة.
13.3 يستمر التزام السرية لمدة 3 سنوات بعد انتهاء العقد.
13.4 تُستثنى المعلومات المطلوب الإفصاح عنها قانوناً للجهات الرقابية.

**البند الرابع عشر: القوة القاهرة**
14.1 لا يُسأل أي طرف عن التأخير أو الإخفاق الناتج عن ظروف القوة القاهرة.
14.2 يُخطر الطرف المتأثر الطرف الآخر خلال 48 ساعة من وقوع الحدث.
14.3 تُعلق الالتزامات المتأثرة لحين زوال ظرف القوة القاهرة.
14.4 إذا استمرت القوة القاهرة لأكثر من 90 يوماً، يجوز لأي طرف إنهاء العقد.

**البند الخامس عشر: التعديلات والملاحق**
15.1 لا يجوز تعديل هذا العقد إلا بموجب ملحق مكتوب موقع من الطرفين.
15.2 تُعتبر الملاحق المرفقة جزءاً لا يتجزأ من هذا العقد.
15.3 في حالة التعارض، تسود أحكام الملحق الأحدث تاريخاً.
15.4 تُرقم الملاحق تسلسلياً ويُشار إليها بتاريخ إصدارها.

**البند السادس عشر: التنازل والتحويل**
16.1 لا يجوز لأي طرف التنازل عن حقوقه أو التزاماته دون موافقة كتابية مسبقة.
16.2 يجوز التعاقد من الباطن بشرط موافقة الطرف الآخر والتزام المتعاقد الفرعي.
16.3 يظل الطرف الأصلي مسؤولاً عن أي إخلال من المتعاقد الفرعي.
16.4 تُخطر الجهات الرقابية بأي تغيير في أطراف العقد.

**البند السابع عشر: الإخطارات والمراسلات**
17.1 تُوجه جميع الإخطارات كتابياً على العناوين المبينة في ديباجة العقد.
17.2 يُعتبر الإخطار نافذاً من تاريخ استلامه أو بعد 7 أيام من الإرسال المسجل.
17.3 يلتزم كل طرف بإخطار الآخر بأي تغيير في بيانات الاتصال خلال 15 يوماً.
17.4 تُقبل المراسلات الإلكترونية على العناوين المعتمدة رسمياً.

**البند الثامن عشر: كامل الاتفاق**
18.1 يمثل هذا العقد كامل الاتفاق بين الطرفين بشأن موضوعه.
18.2 يُلغي هذا العقد أي اتفاقات أو تفاهمات سابقة شفهية أو مكتوبة.
18.3 لا يُعتد بأي وعود أو تمثيلات غير مدونة في هذا العقد.
18.4 تُفسر بنود العقد بما يحقق المقصد التعاقدي للطرفين.

**البند التاسع عشر: استقلالية البنود**
19.1 إذا حُكم ببطلان أي بند، تظل البنود الأخرى سارية المفعول.
19.2 يُستبدل البند الباطل ببند صالح يحقق ذات الغرض التعاقدي.
19.3 بطلان جزء من البند لا يمتد إلى باقي أجزائه الصالحة.
19.4 يتعاون الطرفان بحسن نية لمعالجة أي فراغ تعاقدي.

**البند العشرون: حل النزاعات والتحكيم**
20.1 يسعى الطرفان لحل أي نزاع ودياً خلال 30 يوماً من نشوئه.
20.2 إذا تعذر الحل الودي، يُحال النزاع للتحكيم وفقاً لقواعد مركز القاهرة.
20.3 يكون مقر التحكيم مدينة القاهرة ولغته العربية.
20.4 يكون قرار التحكيم نهائياً وملزماً للطرفين.

**البند الحادي والعشرون: الاختصاص القضائي**
21.1 تختص المحاكم المصرية بنظر أي نزاع ناشئ عن هذا العقد.
21.2 يكون الاختصاص المكاني لمحاكم القاهرة الاقتصادية.
21.3 لا يحول التحكيم دون اللجوء للقضاء في المسائل المستعجلة.
21.4 تُطبق أحكام القانون المدني المصري على ما لم يرد بشأنه نص.

**البند الثاني والعشرون: اللغة المعتمدة**
22.1 اللغة العربية هي اللغة الرسمية لهذا العقد وملاحقه.
22.2 في حالة وجود ترجمة، يُرجع للنص العربي عند التعارض.
22.3 تُحرر جميع الإخطارات والمراسلات باللغة العربية.
22.4 تُفسر المصطلحات الفنية وفقاً للمعاجم المصرية المعتمدة.

**البند الثالث والعشرون: النسخ الأصلية**
23.1 يُحرر هذا العقد من ثلاث نسخ أصلية متطابقة.
23.2 يحتفظ كل طرف بنسخة وتُودع الثالثة لدى جهة مختصة.
23.3 تتساوى جميع النسخ في الحجية القانونية.
23.4 يجوز توثيق العقد لدى الجهات المختصة بناءً على طلب أي طرف.

**البند الرابع والعشرون: التزامات ${partnerType === 'generator' ? 'الجهة المولدة' : 'جهة التدوير'} الخاصة**
24.1 ${partnerType === 'generator' ? 'تلتزم الجهة المولدة بفرز المخلفات وفقاً للتصنيف المتفق عليه.' : 'تلتزم جهة التدوير بمعالجة المخلفات وفقاً للمواصفات البيئية.'}
24.2 توفير مكان آمن ومناسب ${partnerType === 'generator' ? 'لتجميع' : 'لاستقبال'} المخلفات.
24.3 إعداد ${wasteLabel} للنقل وفقاً للمواصفات الفنية المطلوبة.
24.4 التعاون مع الناقل في إجراءات التوثيق والتسجيل.

**البند الخامس والعشرون: التزامات شركة النقل الخاصة**
25.1 الالتزام بمواعيد الجمع المتفق عليها مع هامش تأخير لا يتجاوز ساعتين.
25.2 توفير المعدات والحاويات المناسبة لنقل ${wasteLabel}.
25.3 تسليم المخلفات للجهة ${partnerType === 'generator' ? 'المعالجة' : 'المولدة'} المرخصة فقط.
25.4 الحفاظ على نظافة وصيانة مركبات النقل بشكل دوري.

**البند السادس والعشرون: إجراءات الطوارئ والتسربات**
26.1 يُعد الناقل خطة طوارئ معتمدة للتعامل مع الحوادث.
26.2 ${isHazardous ? 'تتوفر معدات احتواء التسربات الكيميائية في كل مركبة.' : 'تتوفر معدات التنظيف الأساسية في المركبات.'}
26.3 يُبلغ عن أي حادث للجهات المختصة خلال ساعة واحدة من وقوعه.
26.4 تُوثق جميع الحوادث وإجراءات المعالجة في سجل خاص.

**البند السابع والعشرون: الرقابة والتفتيش**
27.1 يحق ${partnerType === 'generator' ? 'للجهة المولدة' : 'لجهة التدوير'} التفتيش على مركبات ومعدات الناقل.
27.2 يتعاون الناقل مع مفتشي جهاز تنظيم إدارة المخلفات.
27.3 تُقدم تقارير دورية عن العمليات المنفذة شهرياً.
27.4 يجوز طلب تقارير استثنائية في أي وقت بإخطار مسبق.

**البند الثامن والعشرون: الجزاءات والغرامات**
28.1 التأخير عن موعد الجمع: غرامة تأخير بنسبة 5% من قيمة الشحنة.
28.2 مخالفة إجراءات التوثيق: خصم 10% من قيمة الفاتورة الشهرية.
28.3 تكرار المخالفة ثلاث مرات: حق إنهاء العقد بإخطار 15 يوماً.
28.4 تُراجع قيمة الجزاءات سنوياً بالتوافق بين الطرفين.

**البند التاسع والعشرون: التعاون مع الجهات الرقابية**
29.1 يلتزم الطرفان بتسهيل مهام المفتشين الحكوميين.
29.2 تُقدم جميع السجلات والوثائق المطلوبة فور الطلب.
29.3 يُخطر كل طرف الآخر بأي تفتيش رقابي خلال 24 ساعة.
29.4 تُنفذ ملاحظات التفتيش في المواعيد المحددة.

**البند الثلاثون: الإقرارات والضمانات النهائية**
30.1 يُقر كل طرف بأهليته القانونية الكاملة للتعاقد.
30.2 يضمن كل طرف صحة ودقة المعلومات المقدمة للآخر.
30.3 يتعهد الطرفان بتنفيذ العقد بحسن نية ونزاهة.
30.4 يُعتبر هذا العقد نافذاً من تاريخ توقيعه من الطرفين.
`.trim();
};

// Generate header text
const generateHeader = (categoryName: string, partnerType: 'generator' | 'recycler'): string => {
  return `عقد ${partnerType === 'generator' ? 'جمع ونقل' : 'تدوير ومعالجة'} ${categoryName}
وفقاً لأحكام قانون تنظيم إدارة المخلفات رقم 202 لسنة 2020`;
};

// Generate introduction text
const generateIntroduction = (categoryName: string, isHazardous: boolean): string => {
  return `إنه في يوم {{التاريخ}} الموافق {{التاريخ_هجري}}
بمقر الطرف الأول الكائن في {{عنوان_الطرف_الأول}}

تم الاتفاق بين كل من:

**الطرف الأول:** {{اسم_الجهة_الأولى}}
سجل تجاري رقم: {{رقم_السجل_التجاري}}
ترخيص بيئي رقم: {{رقم_الترخيص_البيئي}}
ويمثله: {{اسم_الممثل_القانوني}} بصفته: {{الصفة}}

**الطرف الثاني:** {{اسم_الجهة_الثانية}}
سجل تجاري رقم: {{رقم_السجل_التجاري_2}}
ترخيص نقل مخلفات رقم: {{رقم_ترخيص_النقل}}
ويمثله: {{اسم_الممثل_القانوني_2}} بصفته: {{الصفة_2}}

**موضوع العقد:** جمع ونقل ${categoryName} ${isHazardous ? '(مخلفات خطرة)' : '(مخلفات غير خطرة)'}

وبعد أن أقر الطرفان بأهليتهما القانونية للتعاقد والتصرف، اتفقا على ما يلي:`;
};

// Generate obligations for party one
const generateObligationsPartyOne = (partnerType: 'generator' | 'recycler', categoryName: string): string => {
  if (partnerType === 'generator') {
    return `التزامات الجهة المولدة (الطرف الأول):
• فرز ${categoryName} وفقاً للتصنيف المعتمد من جهاز تنظيم إدارة المخلفات.
• توفير مكان آمن ومناسب لتخزين المخلفات لحين موعد الجمع المتفق عليه.
• إعداد المخلفات للنقل بالشكل والتغليف المطابق للمواصفات الفنية.
• تزويد الناقل بكافة المعلومات والبيانات الخاصة بالمخلفات.
• التوقيع على وثائق النقل وتسليم النسخة الأصلية للناقل.
• الالتزام بمواعيد الجمع المتفق عليها والإخطار بأي تغيير مسبقاً.
• توفير إضاءة كافية ومسار آمن لوصول مركبات النقل.
• سداد المستحقات المالية في المواعيد المتفق عليها.`;
  }
  return `التزامات جهة التدوير (الطرف الأول):
• استلام ${categoryName} المطابقة للمواصفات المتفق عليها فقط.
• معالجة المخلفات وفقاً للطرق المعتمدة والمرخصة بيئياً.
• إصدار شهادات المعالجة والتخلص النهائي للجهة المولدة.
• الاحتفاظ بسجلات دقيقة لكميات المخلفات المستلمة والمعالجة.
• إخطار الناقل بأي مخالفة في نوعية أو مواصفات المخلفات.
• توفير مرافق استلام مجهزة ومطابقة للاشتراطات البيئية.
• سداد المستحقات المالية للناقل في المواعيد المتفق عليها.
• التعاون مع الجهات الرقابية وتسهيل عمليات التفتيش.`;
};

// Generate obligations for party two
const generateObligationsPartyTwo = (categoryName: string, isHazardous: boolean): string => {
  return `التزامات شركة النقل (الطرف الثاني):
• الالتزام بترخيص نقل المخلفات الساري والمطابق لنوعية ${categoryName}.
• توفير مركبات نقل مجهزة ومطابقة للمواصفات الفنية والبيئية.
• تجهيز المركبات بأنظمة التتبع GPS المعتمدة من الجهاز.
• ${isHazardous ? 'تزويد المركبات بمعدات احتواء التسربات والمواد الخطرة.' : 'الحفاظ على نظافة المركبات والحاويات.'}
• الالتزام بمواعيد الجمع والتسليم المتفق عليها.
• تدريب السائقين والعمال على التعامل الآمن مع المخلفات.
• توثيق جميع العمليات في المنظومة الإلكترونية للتتبع.
• تسليم المخلفات للجهات المرخصة فقط والحصول على إيصالات الاستلام.
• الإبلاغ الفوري عن أي حوادث أو تسربات أثناء النقل.
• تقديم تقارير دورية عن العمليات المنفذة.`;
};

// Generate payment terms
const generatePaymentTerms = (): string => {
  return `شروط الدفع والمقابل المالي:
• تُحسب قيمة الخدمة بناءً على جدول الأسعار المرفق (الملحق ب).
• تُصدر الفواتير الشهرية خلال أول 5 أيام عمل من الشهر التالي.
• يستحق السداد خلال 30 يوماً من تاريخ استلام الفاتورة.
• يُضاف تأخير سداد بمعدل 1% شهرياً من قيمة المبالغ المتأخرة.
• تُراجع الأسعار سنوياً بناءً على مؤشر التضخم الرسمي.
• يجوز تعديل الأسعار بموجب ملحق مكتوب يوقعه الطرفان.
• تُخصم أي غرامات مستحقة من الدفعات المالية القادمة.`;
};

// Generate duration clause
const generateDurationClause = (): string => {
  return `مدة العقد والتجديد:
• يسري هذا العقد لمدة سنة ميلادية واحدة تبدأ من تاريخ التوقيع.
• يتجدد العقد تلقائياً لفترات مماثلة ما لم يُخطر أحد الطرفين الآخر كتابياً.
• يُقدم إخطار عدم التجديد قبل 90 يوماً من تاريخ انتهاء العقد أو أي تجديد له.
• تستمر الالتزامات المالية والتوثيقية حتى تسويتها الكاملة بعد انتهاء العقد.`;
};

// Generate termination clause
const generateTerminationClause = (): string => {
  return `إنهاء العقد وفسخه:
• يجوز لأي طرف إنهاء العقد بإخطار كتابي مسبق قبل 60 يوماً.
• يحق للطرف المتضرر فسخ العقد فوراً في حالة الإخلال الجسيم بالالتزامات.
• يُعتبر إلغاء أو توقف ترخيص أي طرف سبباً لإنهاء العقد تلقائياً.
• في حالة الإنهاء، تُسوى جميع المستحقات خلال 30 يوماً.
• يلتزم الناقل بإتمام جمع أي مخلفات معلقة وتسليمها للجهة المرخصة.`;
};

// Generate dispute resolution
const generateDisputeResolution = (): string => {
  return `حل النزاعات والتحكيم:
• يسعى الطرفان لحل أي نزاع ودياً خلال 30 يوماً من تاريخ نشوئه.
• إذا تعذر الحل الودي، يُحال النزاع للتحكيم وفقاً لقواعد مركز القاهرة الإقليمي للتحكيم.
• يكون مقر التحكيم مدينة القاهرة واللغة المستخدمة هي العربية.
• يصدر قرار التحكيم نهائياً وملزماً للطرفين وغير قابل للطعن.
• يتحمل الطرف الخاسر مصاريف التحكيم ما لم يقرر المحكم خلاف ذلك.`;
};

// Generate closing text
const generateClosingText = (): string => {
  return `وإثباتاً لما تقدم، حُرر هذا العقد من ثلاث نسخ أصلية متطابقة، تسلم كل طرف نسخة للعمل بموجبها، وتُودع النسخة الثالثة لدى الجهة المختصة.

والله خير الشاهدين

**الطرف الأول**
الاسم: _______________________
التوقيع: _______________________
الختم الرسمي: _______________________
التاريخ: _______________________

**الطرف الثاني**
الاسم: _______________________
التوقيع: _______________________
الختم الرسمي: _______________________
التاريخ: _______________________`;
};

// Generate all templates
export const generateSystemTemplates = (): SystemContractTemplate[] => {
  const templates: SystemContractTemplate[] = [];
  const allCategories = [...hazardousWasteCategories, ...nonHazardousWasteCategories];

  // For each category, create 2 main templates (generator + recycler) and subcategory templates
  allCategories.forEach(category => {
    const isHazardous = category.category === 'hazardous';

    // Main templates for generators (10 templates per category)
    for (let i = 1; i <= 10; i++) {
      templates.push({
        name: `عقد جمع ونقل ${category.name} - نموذج ${i}`,
        description: `قالب عقد رقم ${i} لجمع ونقل ${category.name} من الجهات المولدة - متوافق مع قانون 202 لسنة 2020`,
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
    }

    // Main templates for recyclers (10 templates per category)
    for (let i = 1; i <= 10; i++) {
      templates.push({
        name: `عقد تدوير ومعالجة ${category.name} - نموذج ${i}`,
        description: `قالب عقد رقم ${i} لتدوير ومعالجة ${category.name} مع جهات التدوير - متوافق مع قانون 202 لسنة 2020`,
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
    }

    // Subcategory templates (1 for each subcategory)
    category.subcategories.forEach(subcategory => {
      // Generator template for subcategory
      templates.push({
        name: `عقد جمع ${subcategory.name} (${subcategory.code})`,
        description: `قالب عقد متخصص لجمع ونقل ${subcategory.name} - الكود: ${subcategory.code}`,
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

      // Recycler template for subcategory
      templates.push({
        name: `عقد تدوير ${subcategory.name} (${subcategory.code})`,
        description: `قالب عقد متخصص لتدوير ومعالجة ${subcategory.name} - الكود: ${subcategory.code}`,
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

// Get templates count summary
export const getTemplatesSummary = () => {
  const allCategories = [...hazardousWasteCategories, ...nonHazardousWasteCategories];
  const totalSubcategories = allCategories.reduce((sum, cat) => sum + cat.subcategories.length, 0);
  
  return {
    mainCategories: allCategories.length,
    subcategories: totalSubcategories,
    mainTemplatesPerCategory: 20, // 10 generator + 10 recycler
    subcategoryTemplates: totalSubcategories * 2, // generator + recycler for each
    totalTemplates: (allCategories.length * 20) + (totalSubcategories * 2),
  };
};
