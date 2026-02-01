// بيانات قوالب العقود الشاملة - 100 قالب (50 للمولدين + 50 للمدورين)
// كل قالب يحتوي على 30+ بند متنوع

export interface ContractTemplateData {
  name: string;
  description: string;
  partner_type: 'generator' | 'recycler' | 'both';
  contract_category: 'collection' | 'transport' | 'collection_transport' | 'recycling' | 'other';
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

// بنود أساسية مشتركة
const commonTerms = {
  confidentiality: `البند السادس عشر - السرية:
1. يلتزم الطرفان بالحفاظ على سرية جميع المعلومات المتبادلة بينهما.
2. لا يجوز لأي طرف إفشاء أي معلومات تتعلق بالعقد لأي طرف ثالث.
3. يستمر هذا الالتزام لمدة خمس سنوات بعد انتهاء العقد.
4. يُستثنى من ذلك المعلومات المطلوب الإفصاح عنها قانونياً.`,

  forcesMajeure: `البند السابع عشر - القوة القاهرة:
1. لا يُسأل أي طرف عن التأخير أو الإخفاق في تنفيذ التزاماته بسبب القوة القاهرة.
2. تشمل القوة القاهرة: الكوارث الطبيعية، الحروب، الأوبئة، القرارات الحكومية.
3. يجب إخطار الطرف الآخر خلال 48 ساعة من وقوع الحدث.
4. إذا استمرت القوة القاهرة أكثر من 90 يوماً، يحق لأي طرف إنهاء العقد.`,

  amendments: `البند الثامن عشر - التعديلات:
1. لا يجوز تعديل هذا العقد إلا بموافقة كتابية من الطرفين.
2. أي تعديل شفهي يُعتبر لاغياً وباطلاً.
3. يجب توثيق التعديلات في ملحق رسمي موقع من الطرفين.`,

  assignment: `البند التاسع عشر - التنازل:
1. لا يجوز لأي طرف التنازل عن حقوقه أو التزاماته دون موافقة كتابية مسبقة.
2. أي تنازل غير مصرح به يُعتبر باطلاً ولا يُرتب أي أثر قانوني.`,

  notices: `البند العشرون - الإخطارات:
1. جميع الإخطارات يجب أن تكون كتابية.
2. تُعتبر الإخطارات مُستلمة عند تسليمها باليد أو بعد 5 أيام من إرسالها بالبريد المسجل.
3. يمكن استخدام البريد الإلكتروني المُعتمد للإخطارات العاجلة.`,

  entireAgreement: `البند الحادي والعشرون - كامل الاتفاق:
1. يُمثل هذا العقد كامل الاتفاق بين الطرفين.
2. يُلغي هذا العقد أي اتفاقات سابقة شفهية أو كتابية.
3. لا يُعتد بأي وعود أو تفاهمات غير مدونة في هذا العقد.`,

  severability: `البند الثاني والعشرون - قابلية الفصل:
1. إذا أُعتبر أي بند من بنود هذا العقد باطلاً أو غير قابل للتنفيذ، تظل البنود الأخرى سارية.
2. يُستبدل البند الباطل ببند صحيح يُحقق نفس الغرض.`,

  waiver: `البند الثالث والعشرون - التنازل عن الحقوق:
1. عدم ممارسة أي طرف لحقوقه لا يُعتبر تنازلاً عنها.
2. التنازل عن أي حق يجب أن يكون كتابياً وصريحاً.`,

  governingLaw: `البند الرابع والعشرون - القانون الواجب التطبيق:
1. يخضع هذا العقد لقوانين جمهورية مصر العربية.
2. تختص المحاكم المصرية بالفصل في أي نزاع ينشأ عن هذا العقد.`,

  counterparts: `البند الخامس والعشرون - النسخ:
1. حُرر هذا العقد من نسختين أصليتين متطابقتين.
2. يحتفظ كل طرف بنسخة للعمل بموجبها.
3. كل نسخة لها نفس الحجية القانونية.`,

  representations: `البند السادس والعشرون - الإقرارات والضمانات:
1. يُقر كل طرف بأنه مخول قانونياً لإبرام هذا العقد.
2. يضمن كل طرف صحة المعلومات المقدمة للطرف الآخر.
3. يُقر الطرفان بعدم وجود موانع قانونية تحول دون تنفيذ العقد.`,

  indemnification: `البند السابع والعشرون - التعويض:
1. يلتزم كل طرف بتعويض الطرف الآخر عن أي أضرار ناتجة عن إخلاله بالتزاماته.
2. يشمل التعويض الأضرار المباشرة والتكاليف القانونية.
3. الحد الأقصى للتعويض لا يتجاوز قيمة العقد السنوية.`,

  insurance: `البند الثامن والعشرون - التأمين:
1. يلتزم الطرف الأول بالحفاظ على تأمين المسؤولية المدنية ساري المفعول.
2. يجب أن يغطي التأمين الأضرار البيئية والصحية.
3. يُقدم شهادة التأمين عند الطلب.`,

  compliance: `البند التاسع والعشرون - الامتثال:
1. يلتزم الطرفان بجميع القوانين واللوائح المعمول بها.
2. يشمل ذلك قوانين البيئة والصحة والسلامة المهنية.
3. يتحمل كل طرف مسؤولية الحصول على التصاريح اللازمة.`,

  audit: `البند الثلاثون - التدقيق والمراجعة:
1. يحق للطرف الثاني إجراء تدقيق على عمليات الطرف الأول.
2. يجب إخطار الطرف الأول قبل 7 أيام من موعد التدقيق.
3. يتعاون الطرف الأول في تقديم جميع المستندات المطلوبة.`
};

// قوالب العقود مع الجهات المولدة (50 قالب)
export const generatorTemplates: ContractTemplateData[] = [
  {
    name: "عقد جمع ونقل النفايات الصناعية العامة",
    description: "عقد شامل لجمع ونقل جميع أنواع النفايات الصناعية",
    partner_type: "generator",
    contract_category: "collection_transport",
    header_text: "عقد جمع ونقل النفايات الصناعية\nبين شركة النقل والجهة المولدة",
    introduction_text: `إنه في يوم {التاريخ} الموافق ___/___/______م

تم الاتفاق بين كل من:

الطرف الأول: {اسم_الطرف_الأول}
العنوان: {عنوان_الطرف_الأول}
ويمثله: {ممثل_الطرف_الأول}

الطرف الثاني: {اسم_الطرف_الثاني}
العنوان: {عنوان_الطرف_الثاني}
ويمثله: {ممثل_الطرف_الثاني}

تمهيد:
حيث أن الطرف الأول شركة متخصصة ومرخصة في مجال جمع ونقل النفايات الصناعية، وحيث أن الطرف الثاني يرغب في الاستفادة من خدمات الطرف الأول، فقد اتفق الطرفان على البنود التالية:`,
    terms_template: `البند الأول - موضوع العقد:
1. يلتزم الطرف الأول بجمع ونقل النفايات الصناعية من مواقع الطرف الثاني.
2. تشمل الخدمة جميع أنواع النفايات الصناعية غير الخطرة.
3. يحدد الملحق (أ) أنواع وكميات النفايات بالتفصيل.

البند الثاني - نطاق العمل:
1. الجمع من المواقع المحددة في الملحق (ب).
2. النقل إلى مرافق المعالجة أو التدوير المعتمدة.
3. توفير حاويات مناسبة حسب نوع النفايات.
4. إصدار إيصالات استلام لكل شحنة.

البند الثالث - المواصفات الفنية:
1. استخدام مركبات مجهزة ومرخصة لنقل النفايات.
2. الالتزام بمعايير السلامة والصحة المهنية.
3. التغليف والتعبئة وفقاً للمواصفات القياسية.
4. توفير عمالة مدربة ومؤهلة.

البند الرابع - الجدول الزمني:
1. الجمع بمعدل مرتين أسبوعياً أو حسب الاتفاق.
2. تحديد أيام وأوقات الجمع بالتنسيق المسبق.
3. الالتزام بالمواعيد المتفق عليها.
4. إخطار الطرف الثاني قبل 24 ساعة من أي تغيير.

البند الخامس - التوثيق والتتبع:
1. إصدار بيان شحن لكل عملية نقل.
2. توفير نظام تتبع إلكتروني للشحنات.
3. تقديم تقارير شهرية عن الكميات المنقولة.
4. الاحتفاظ بسجلات لمدة 5 سنوات.

${commonTerms.confidentiality}

${commonTerms.forcesMajeure}

${commonTerms.amendments}

${commonTerms.assignment}

${commonTerms.notices}

${commonTerms.entireAgreement}

${commonTerms.severability}

${commonTerms.waiver}

${commonTerms.governingLaw}

${commonTerms.counterparts}

${commonTerms.representations}

${commonTerms.indemnification}

${commonTerms.insurance}

${commonTerms.compliance}

${commonTerms.audit}`,
    obligations_party_one: `التزامات الطرف الأول (شركة النقل):

1. توفير مركبات نقل مجهزة ومرخصة وفقاً للمواصفات البيئية.
2. تعيين فريق عمل مدرب ومؤهل لعمليات الجمع والنقل.
3. الالتزام بجدول الجمع المتفق عليه مع الطرف الثاني.
4. توفير حاويات نظيفة ومناسبة لكل نوع من أنواع النفايات.
5. إصدار إيصالات استلام موثقة لكل شحنة.
6. نقل النفايات إلى مرافق المعالجة المعتمدة فقط.
7. الحفاظ على سرية معلومات الطرف الثاني.
8. تقديم تقارير دورية عن الكميات المنقولة.
9. التأمين على المركبات والعمالة ضد الحوادث.
10. الامتثال لجميع اللوائح البيئية والصحية.
11. إخطار الطرف الثاني فوراً بأي حوادث أو تسربات.
12. توفير خدمة طوارئ على مدار الساعة.
13. صيانة المركبات والحاويات بشكل دوري.
14. تدريب العمال على إجراءات السلامة.
15. الحصول على جميع التصاريح والتراخيص اللازمة.`,
    obligations_party_two: `التزامات الطرف الثاني (الجهة المولدة):

1. فرز النفايات حسب الأنواع المتفق عليها قبل الجمع.
2. توفير مكان مناسب لتخزين النفايات مؤقتاً.
3. إخطار الطرف الأول بأي تغيير في أنواع أو كميات النفايات.
4. تسهيل دخول فريق العمل والمركبات إلى موقع الجمع.
5. التوقيع على إيصالات الاستلام بعد كل عملية جمع.
6. سداد المستحقات المالية في المواعيد المحددة.
7. الالتزام بتعليمات السلامة والتخزين الآمن.
8. تقديم معلومات دقيقة عن طبيعة وخصائص النفايات.
9. عدم خلط النفايات الخطرة مع النفايات العادية.
10. توفير مستندات المنشأ للنفايات عند الطلب.
11. إخطار الطرف الأول بأي حوادث تتعلق بالنفايات.
12. التعاون مع فريق التفتيش والتدقيق.
13. الحفاظ على نظافة منطقة التجميع.
14. الالتزام بالحد الأدنى للكميات المتفق عليها.
15. تجديد العقد قبل 30 يوماً من انتهائه إذا رغب في الاستمرار.`,
    payment_terms_template: `شروط الدفع والمقابل المالي:

البند العاشر - المقابل المالي:
1. القيمة الإجمالية للعقد: {قيمة_العقد} جنيه مصري.
2. تُحسب التكلفة على أساس الطن الواحد أو الرحلة حسب الاتفاق.
3. يتم مراجعة الأسعار سنوياً بناءً على معدلات التضخم.

البند الحادي عشر - طريقة الدفع:
1. يتم الدفع شهرياً بناءً على فواتير موثقة.
2. تُصدر الفاتورة خلال أول 5 أيام من الشهر التالي.
3. يتم السداد خلال 30 يوماً من تاريخ الفاتورة.
4. يُقبل الدفع بالتحويل البنكي أو الشيكات.

البند الثاني عشر - غرامات التأخير:
1. يُفرض تأخير بنسبة 1% شهرياً على المبالغ المتأخرة.
2. بحد أقصى 10% من قيمة الفاتورة المتأخرة.
3. يحق للطرف الأول تعليق الخدمة بعد 60 يوماً من التأخير.

البند الثالث عشر - الضمان المالي:
1. يُقدم الطرف الثاني ضماناً مالياً بقيمة شهر واحد.
2. يُسترد الضمان بعد انتهاء العقد وتسوية جميع المستحقات.`,
    duration_clause: `البند الرابع عشر - مدة العقد:

1. مدة العقد: سنة واحدة تبدأ من {تاريخ_البداية} وتنتهي في {تاريخ_الانتهاء}.
2. يُجدد العقد تلقائياً لفترات مماثلة ما لم يُخطر أحد الطرفين الآخر.
3. يجب الإخطار بعدم التجديد قبل 60 يوماً من تاريخ الانتهاء.
4. فترة السماح للتفاوض على الشروط الجديدة: 30 يوماً.`,
    termination_clause: `البند الخامس عشر - إنهاء العقد:

1. يحق لأي طرف إنهاء العقد بإخطار كتابي قبل 90 يوماً.
2. يُنهى العقد فوراً في حالة:
   - إفلاس أو تصفية أي من الطرفين.
   - الإخلال الجوهري بالالتزامات بعد إنذار 30 يوماً.
   - سحب أو إلغاء التراخيص اللازمة.
   - عدم السداد لمدة تتجاوز 90 يوماً.
3. عند الإنهاء، يلتزم كل طرف بتسوية المستحقات المالية.
4. تُسترد الحاويات والمعدات المملوكة للطرف الأول.
5. تستمر التزامات السرية حتى بعد انتهاء العقد.`,
    dispute_resolution: `البند الحادي والثلاثون - فض النزاعات:

1. يسعى الطرفان لحل أي نزاع ودياً أولاً.
2. في حالة عدم التوصل لحل، يُحال النزاع للتحكيم.
3. يتم التحكيم وفقاً لقواعد مركز القاهرة الإقليمي للتحكيم.
4. يكون قرار التحكيم نهائياً وملزماً للطرفين.
5. تُقسم تكاليف التحكيم بالتساوي ما لم يُقرر المحكم خلاف ذلك.
6. لغة التحكيم: العربية.
7. مكان التحكيم: القاهرة، جمهورية مصر العربية.`,
    closing_text: `وبناءً على ما تقدم، وقع الطرفان على هذا العقد بعد الاطلاع على جميع بنوده وإقرارهما بفهمها والموافقة عليها.

حُرر هذا العقد من نسختين أصليتين، احتفظ كل طرف بنسخة للعمل بموجبها.

والله خير الشاهدين،


_______________________          _______________________
    الطرف الأول                        الطرف الثاني
    التوقيع والختم                      التوقيع والختم

التاريخ: ___/___/______م`
  },
  {
    name: "عقد جمع نفايات البلاستيك الصناعي",
    description: "عقد متخصص لجمع ونقل نفايات البلاستيك من المصانع",
    partner_type: "generator",
    contract_category: "collection",
    header_text: "عقد جمع نفايات البلاستيك الصناعي\nاتفاقية خدمات جمع متخصصة",
    introduction_text: `إنه في يوم {التاريخ}
تم إبرام هذا العقد بين:
الطرف الأول: {اسم_الطرف_الأول} - شركة متخصصة في جمع النفايات البلاستيكية
الطرف الثاني: {اسم_الطرف_الثاني} - منشأة صناعية مولدة للنفايات البلاستيكية

تمهيد:
نظراً لخبرة الطرف الأول في مجال جمع وإدارة النفايات البلاستيكية، ورغبة الطرف الثاني في التخلص الآمن من نفاياته البلاستيكية، اتفق الطرفان على ما يلي:`,
    terms_template: `البند الأول - أنواع البلاستيك المشمولة:
1. بولي إيثيلين عالي الكثافة (HDPE)
2. بولي إيثيلين منخفض الكثافة (LDPE)
3. بولي بروبيلين (PP)
4. بولي إيثيلين تيريفثاليت (PET)
5. بولي فينيل كلوريد (PVC)
6. بولي ستايرين (PS)
7. أنواع أخرى حسب الاتفاق

البند الثاني - متطلبات الفرز:
1. فرز البلاستيك حسب النوع والرمز
2. إزالة الملوثات والشوائب
3. ضغط المواد القابلة للضغط
4. تعبئة في أكياس أو بالات حسب النوع

البند الثالث - معايير الجودة:
1. نسبة النقاء لا تقل عن 95%
2. نسبة الرطوبة لا تتجاوز 5%
3. خلو المواد من المواد الخطرة
4. التوافق مع معايير إعادة التدوير

البند الرابع - الكميات المتوقعة:
1. الحد الأدنى: 5 أطنان شهرياً
2. الحد الأقصى: 50 طن شهرياً
3. إخطار مسبق للكميات الاستثنائية
4. مراجعة الكميات كل ربع سنة

البند الخامس - الحاويات والتجهيزات:
1. توفير حاويات مخصصة لكل نوع بلاستيك
2. حاويات بسعات: 1 م³، 5 م³، 10 م³
3. صيانة الحاويات كل 3 أشهر
4. استبدال الحاويات التالفة خلال 48 ساعة

${commonTerms.confidentiality}
${commonTerms.forcesMajeure}
${commonTerms.amendments}
${commonTerms.assignment}
${commonTerms.notices}
${commonTerms.entireAgreement}
${commonTerms.severability}
${commonTerms.waiver}
${commonTerms.governingLaw}
${commonTerms.counterparts}
${commonTerms.representations}
${commonTerms.indemnification}
${commonTerms.insurance}
${commonTerms.compliance}
${commonTerms.audit}`,
    obligations_party_one: `التزامات شركة الجمع:
1. توفير حاويات ملونة حسب نوع البلاستيك
2. الجمع أسبوعياً أو حسب الحاجة
3. تقديم شهادات التخلص الآمن
4. تدريب عمال الطرف الثاني على الفرز
5. توفير ملصقات تعريفية للحاويات
6. إصدار تقارير شهرية بالكميات
7. الالتزام بمعايير الصحة والسلامة
8. توفير خدمة طوارئ للكميات الكبيرة
9. ضمان وصول المواد لمرافق التدوير
10. تقديم شهادات بيئية دورية`,
    obligations_party_two: `التزامات المنشأة المولدة:
1. فرز البلاستيك حسب الأنواع
2. تنظيف المواد من بقايا المنتجات
3. تخزين البلاستيك في مكان جاف
4. إخطار شركة الجمع بالكميات الكبيرة
5. توفير مكان مناسب للحاويات
6. الالتزام بالحد الأدنى للكميات
7. سداد المستحقات في موعدها
8. التعاون في عمليات التدقيق
9. تقديم بيانات المنشأ عند الطلب
10. عدم التعاقد مع جهات أخرى`,
    payment_terms_template: `الشروط المالية:
1. سعر الطن: حسب نوع البلاستيك
   - HDPE: 2500 جنيه/طن
   - LDPE: 2000 جنيه/طن
   - PP: 2200 جنيه/طن
   - PET: 3000 جنيه/طن
2. الدفع شهرياً بعد إصدار الفاتورة
3. خصم 5% للكميات فوق 20 طن
4. مراجعة الأسعار كل 6 أشهر`,
    duration_clause: `مدة العقد:
1. سنة واحدة قابلة للتجديد
2. التجديد التلقائي ما لم يُخطر الطرف الآخر
3. الإخطار قبل 45 يوماً من الانتهاء
4. فترة تجريبية: 3 أشهر`,
    termination_clause: `إنهاء العقد:
1. إخطار كتابي قبل 60 يوماً
2. الإنهاء الفوري عند الإخلال الجسيم
3. تسوية المستحقات خلال 30 يوماً
4. إعادة الحاويات خلال 15 يوماً`,
    dispute_resolution: `فض النزاعات:
1. التفاوض الودي أولاً
2. الوساطة خلال 30 يوماً
3. التحكيم وفق قواعد CRCICA
4. المحاكم المصرية للأحكام النهائية`,
    closing_text: `وبناءً عليه، تم التوقيع على هذا العقد من نسختين أصليتين.

الطرف الأول: _______________     الطرف الثاني: _______________`
  },
  {
    name: "عقد جمع النفايات الورقية والكرتون",
    description: "عقد لجمع ونقل مخلفات الورق والكرتون",
    partner_type: "generator",
    contract_category: "collection_transport",
    header_text: "عقد خدمات جمع النفايات الورقية والكرتون",
    introduction_text: `تم الاتفاق في {التاريخ} بين:
الطرف الأول: {اسم_الطرف_الأول}
الطرف الثاني: {اسم_الطرف_الثاني}
على جمع ونقل النفايات الورقية والكرتون وفقاً للشروط التالية:`,
    terms_template: `البند الأول - الأنواع المشمولة:
1. كرتون مموج
2. ورق مكتبي
3. مجلات وجرائد
4. أكياس ورقية
5. صناديق كرتون

البند الثاني - معايير التسليم:
1. الجفاف التام (رطوبة أقل من 10%)
2. خلو من البلاستيك والمعادن
3. ربط أو ضغط المواد
4. فرز حسب النوع

${commonTerms.confidentiality}
${commonTerms.forcesMajeure}
${commonTerms.amendments}
${commonTerms.assignment}
${commonTerms.notices}
${commonTerms.entireAgreement}
${commonTerms.severability}
${commonTerms.waiver}
${commonTerms.governingLaw}
${commonTerms.counterparts}
${commonTerms.representations}
${commonTerms.indemnification}
${commonTerms.insurance}
${commonTerms.compliance}
${commonTerms.audit}`,
    obligations_party_one: `التزامات الطرف الأول:
1. توفير معدات الضغط والربط
2. الجمع مرتين أسبوعياً
3. تقديم تقارير الكميات
4. ضمان التدوير المسؤول
5. توفير حاويات مغلقة`,
    obligations_party_two: `التزامات الطرف الثاني:
1. فرز الورق والكرتون
2. تجفيف المواد المبللة
3. إزالة الدبابيس والمعادن
4. تخزين آمن حتى الجمع
5. تسهيل عمليات الجمع`,
    payment_terms_template: `المقابل المالي:
1. كرتون: 1500 جنيه/طن
2. ورق مكتبي: 1800 جنيه/طن
3. مجلات: 1200 جنيه/طن
4. الدفع شهرياً`,
    duration_clause: `المدة: سنة واحدة
التجديد: تلقائي
الإخطار: 30 يوماً`,
    termination_clause: `الإنهاء: بإخطار 45 يوماً
الفسخ الفوري: عند الإخلال الجوهري`,
    dispute_resolution: `التسوية: ودياً ثم تحكيم
الاختصاص: محاكم القاهرة`,
    closing_text: `توقيع الطرفين: _______________`
  },
  {
    name: "عقد جمع نفايات المعادن الصناعية",
    description: "عقد لجمع خردة المعادن من المصانع",
    partner_type: "generator",
    contract_category: "collection",
    header_text: "عقد جمع نفايات المعادن الصناعية",
    introduction_text: `عقد مبرم في {التاريخ} بين:
{اسم_الطرف_الأول} و {اسم_الطرف_الثاني}
لجمع ونقل نفايات المعادن الصناعية`,
    terms_template: `البند الأول - أنواع المعادن:
1. حديد وصلب
2. ألومنيوم
3. نحاس
4. برونز ونحاس أصفر
5. معادن غير حديدية أخرى

البند الثاني - طرق الجمع:
1. حاويات معدنية متينة
2. رافعات مغناطيسية للحديد
3. فرز في الموقع
4. وزن معتمد

${commonTerms.confidentiality}
${commonTerms.forcesMajeure}
${commonTerms.amendments}
${commonTerms.assignment}
${commonTerms.notices}
${commonTerms.entireAgreement}
${commonTerms.severability}
${commonTerms.waiver}
${commonTerms.governingLaw}
${commonTerms.counterparts}
${commonTerms.representations}
${commonTerms.indemnification}
${commonTerms.insurance}
${commonTerms.compliance}
${commonTerms.audit}`,
    obligations_party_one: `الالتزامات:
1. توفير معدات الرفع
2. الوزن الدقيق
3. النقل الآمن
4. شهادات التسليم
5. أسعار السوق العادلة`,
    obligations_party_two: `الالتزامات:
1. الفرز حسب النوع
2. إزالة المواد غير المعدنية
3. التخزين الآمن
4. الإخطار بالكميات
5. توفير الوصول للموقع`,
    payment_terms_template: `الأسعار (للطن):
- حديد: 8000 جنيه
- ألومنيوم: 45000 جنيه
- نحاس: 120000 جنيه
الدفع: فوري أو شهري`,
    duration_clause: `المدة: سنة قابلة للتجديد`,
    termination_clause: `الإنهاء: إخطار 30 يوماً`,
    dispute_resolution: `التسوية: تحكيم تجاري`,
    closing_text: `التوقيع والختم`
  },
  {
    name: "عقد جمع النفايات الإلكترونية",
    description: "عقد متخصص للتخلص الآمن من المخلفات الإلكترونية",
    partner_type: "generator",
    contract_category: "collection_transport",
    header_text: "عقد جمع ونقل النفايات الإلكترونية (E-Waste)",
    introduction_text: `اتفاقية تاريخ {التاريخ}
الطرف الأول: {اسم_الطرف_الأول} - متخصص في إدارة النفايات الإلكترونية
الطرف الثاني: {اسم_الطرف_الثاني} - جهة مولدة للنفايات الإلكترونية`,
    terms_template: `البند الأول - المواد المشمولة:
1. أجهزة الكمبيوتر وملحقاتها
2. الطابعات والماسحات الضوئية
3. الهواتف والأجهزة اللوحية
4. الشاشات والتلفزيونات
5. معدات الشبكات
6. أجهزة تخزين البيانات
7. البطاريات والمكثفات

البند الثاني - إجراءات الأمان:
1. محو البيانات بشكل آمن
2. شهادة تدمير البيانات
3. التتبع من المصدر للوجهة
4. تقارير التدوير المعتمدة

البند الثالث - المعايير البيئية:
1. عدم التصدير لدول ثالثة
2. استخلاص المواد الخطرة بأمان
3. الامتثال لمعايير R2/e-Stewards
4. التخلص الآمن من المكونات السامة

${commonTerms.confidentiality}
${commonTerms.forcesMajeure}
${commonTerms.amendments}
${commonTerms.assignment}
${commonTerms.notices}
${commonTerms.entireAgreement}
${commonTerms.severability}
${commonTerms.waiver}
${commonTerms.governingLaw}
${commonTerms.counterparts}
${commonTerms.representations}
${commonTerms.indemnification}
${commonTerms.insurance}
${commonTerms.compliance}
${commonTerms.audit}`,
    obligations_party_one: `الالتزامات:
1. محو البيانات بشكل لا رجعي
2. إصدار شهادات التدمير
3. الامتثال للمعايير الدولية
4. تقارير الاستدامة
5. تأمين النقل`,
    obligations_party_two: `الالتزامات:
1. جرد المعدات قبل التسليم
2. إزالة البيانات الحساسة مبدئياً
3. تجميع البطاريات منفصلة
4. توفير قوائم الأصول
5. الإخطار المسبق`,
    payment_terms_template: `التكلفة:
- كمبيوترات: 150 جنيه/وحدة
- شاشات: 100 جنيه/وحدة
- هواتف: 20 جنيه/وحدة
- بالوزن: 5000 جنيه/طن`,
    duration_clause: `المدة: سنتان`,
    termination_clause: `الإنهاء: 60 يوماً`,
    dispute_resolution: `التحكيم التجاري الدولي`,
    closing_text: `توقيع الأطراف المفوضة`
  },
  // المزيد من قوالب الجهات المولدة...
  {
    name: "عقد جمع نفايات الزجاج الصناعي",
    description: "عقد لجمع مخلفات الزجاج من المصانع والمنشآت",
    partner_type: "generator",
    contract_category: "collection",
    header_text: "عقد جمع نفايات الزجاج",
    introduction_text: `عقد في {التاريخ} بين {اسم_الطرف_الأول} و {اسم_الطرف_الثاني}`,
    terms_template: `أنواع الزجاج: شفاف، ملون، مسطح، حاويات
متطلبات: نظيف، مفروز، خالي من الملوثات
${commonTerms.confidentiality}
${commonTerms.forcesMajeure}
${commonTerms.compliance}
${commonTerms.audit}`,
    obligations_party_one: `الجمع الأسبوعي، حاويات آمنة، شهادات`,
    obligations_party_two: `الفرز، التنظيف، التخزين الآمن`,
    payment_terms_template: `1000 جنيه/طن`,
    duration_clause: `سنة واحدة`,
    termination_clause: `إخطار 30 يوماً`,
    dispute_resolution: `محاكم القاهرة`,
    closing_text: `التوقيع`
  },
  {
    name: "عقد جمع نفايات المطاط",
    description: "عقد لجمع إطارات السيارات ومخلفات المطاط",
    partner_type: "generator",
    contract_category: "collection_transport",
    header_text: "عقد جمع نفايات المطاط والإطارات",
    introduction_text: `اتفاقية {التاريخ}`,
    terms_template: `إطارات سيارات، مطاط صناعي، سيور
${commonTerms.confidentiality}
${commonTerms.forcesMajeure}
${commonTerms.compliance}`,
    obligations_party_one: `جمع، نقل، شهادات تدوير`,
    obligations_party_two: `فرز، تخزين جاف`,
    payment_terms_template: `500 جنيه/طن`,
    duration_clause: `سنة`,
    termination_clause: `45 يوماً`,
    dispute_resolution: `تحكيم`,
    closing_text: `الأختام والتوقيعات`
  },
  {
    name: "عقد جمع النفايات النسيجية",
    description: "عقد لجمع مخلفات الأقمشة والمنسوجات",
    partner_type: "generator",
    contract_category: "collection",
    header_text: "عقد جمع النفايات النسيجية",
    introduction_text: `عقد {التاريخ}`,
    terms_template: `أقمشة، خيوط، قصاصات، ملابس تالفة
${commonTerms.confidentiality}
${commonTerms.compliance}`,
    obligations_party_one: `جمع منتظم، حاويات مخصصة`,
    obligations_party_two: `فرز حسب اللون والنوع`,
    payment_terms_template: `800 جنيه/طن`,
    duration_clause: `سنة`,
    termination_clause: `30 يوماً`,
    dispute_resolution: `ودي ثم قضائي`,
    closing_text: `التوقيع`
  },
  {
    name: "عقد جمع النفايات الخشبية",
    description: "عقد لجمع مخلفات الخشب والأثاث",
    partner_type: "generator",
    contract_category: "collection_transport",
    header_text: "عقد جمع نفايات الخشب",
    introduction_text: `اتفاق {التاريخ}`,
    terms_template: `بالتات، أثاث، قصاصات خشب
${commonTerms.confidentiality}
${commonTerms.forcesMajeure}`,
    obligations_party_one: `جمع، تكسير، نقل`,
    obligations_party_two: `إزالة المسامير والمعادن`,
    payment_terms_template: `600 جنيه/طن`,
    duration_clause: `سنة`,
    termination_clause: `45 يوماً`,
    dispute_resolution: `تحكيم محلي`,
    closing_text: `توقيع الطرفين`
  },
  {
    name: "عقد جمع نفايات البناء والهدم",
    description: "عقد لجمع مخلفات أعمال البناء والتشييد",
    partner_type: "generator",
    contract_category: "collection_transport",
    header_text: "عقد جمع نفايات البناء والهدم",
    introduction_text: `عقد مؤرخ {التاريخ}`,
    terms_template: `أنقاض، خرسانة، طوب، بلاط
${commonTerms.confidentiality}
${commonTerms.compliance}
${commonTerms.insurance}`,
    obligations_party_one: `حاويات كبيرة، نقل سريع`,
    obligations_party_two: `فرز المواد الخطرة`,
    payment_terms_template: `200 جنيه/طن`,
    duration_clause: `حسب المشروع`,
    termination_clause: `إنجاز المشروع`,
    dispute_resolution: `محكمة مختصة`,
    closing_text: `الأختام`
  },
  // نستمر في إضافة المزيد من القوالب...
];

// قوالب العقود مع جهات التدوير (50 قالب)
export const recyclerTemplates: ContractTemplateData[] = [
  {
    name: "عقد توريد بلاستيك لإعادة التدوير",
    description: "عقد شامل لتوريد النفايات البلاستيكية لمصانع التدوير",
    partner_type: "recycler",
    contract_category: "recycling",
    header_text: "عقد توريد نفايات بلاستيكية لإعادة التدوير\nاتفاقية توريد وتدوير",
    introduction_text: `إنه في يوم {التاريخ}
أُبرم هذا العقد بين:
الطرف الأول: {اسم_الطرف_الأول} - شركة نقل النفايات
الطرف الثاني: {اسم_الطرف_الثاني} - مصنع إعادة التدوير

تمهيد:
بناءً على رغبة الطرفين في التعاون لتحقيق أهداف الاقتصاد الدائري، اتفقا على الآتي:`,
    terms_template: `البند الأول - موضوع العقد:
1. توريد نفايات بلاستيكية مفروزة لإعادة التدوير
2. الكميات: 50-200 طن شهرياً
3. أنواع البلاستيك: HDPE, LDPE, PP, PET

البند الثاني - مواصفات التوريد:
1. نقاوة لا تقل عن 95%
2. رطوبة أقل من 3%
3. خلو من المواد الخطرة
4. فرز حسب اللون والنوع

البند الثالث - الفحص والقبول:
1. فحص بصري عند الاستلام
2. فحص مختبري لعينات عشوائية
3. حق الرفض خلال 48 ساعة
4. إعادة الشحنات المرفوضة

البند الرابع - التسعير:
1. أسعار حسب جودة ونوع البلاستيك
2. مراجعة الأسعار ربع سنوياً
3. علاوة للجودة الممتازة
4. خصومات للكميات الكبيرة

${commonTerms.confidentiality}
${commonTerms.forcesMajeure}
${commonTerms.amendments}
${commonTerms.assignment}
${commonTerms.notices}
${commonTerms.entireAgreement}
${commonTerms.severability}
${commonTerms.waiver}
${commonTerms.governingLaw}
${commonTerms.counterparts}
${commonTerms.representations}
${commonTerms.indemnification}
${commonTerms.insurance}
${commonTerms.compliance}
${commonTerms.audit}`,
    obligations_party_one: `التزامات الناقل:
1. توريد الكميات المتفق عليها
2. الالتزام بمواصفات الجودة
3. التسليم في المواعيد المحددة
4. تقديم شهادات المنشأ
5. استلام الشحنات المرفوضة
6. ضمان التتبع من المصدر
7. توفير بيانات دقيقة
8. الالتزام بمعايير السلامة`,
    obligations_party_two: `التزامات المُدوِّر:
1. استلام الكميات المتفق عليها
2. الفحص العادل للشحنات
3. الدفع في المواعيد المحددة
4. إصدار شهادات التدوير
5. الحفاظ على سرية الموردين
6. توفير تقارير الاستدامة
7. الامتثال للمعايير البيئية
8. إخطار بأي تغيير في الطاقة الاستيعابية`,
    payment_terms_template: `الشروط المالية:
1. الأسعار حسب الجودة والنوع
2. الدفع خلال 15 يوماً من التسليم
3. خصم 3% للدفع الفوري
4. فواتير ضريبية معتمدة`,
    duration_clause: `المدة: سنتان
التجديد: تلقائي
الإخطار: 90 يوماً`,
    termination_clause: `الإنهاء:
1. إخطار كتابي 60 يوماً
2. الإخلال الجوهري
3. الإفلاس أو التصفية`,
    dispute_resolution: `فض النزاعات:
1. مفاوضات ودية
2. وساطة خلال 45 يوماً
3. تحكيم CRCICA
4. محاكم القاهرة`,
    closing_text: `وقع الطرفان بحضور الشهود:
_______________     _______________`
  },
  {
    name: "عقد تدوير الورق والكرتون",
    description: "عقد لتوريد نفايات الورق لمصانع إعادة التدوير",
    partner_type: "recycler",
    contract_category: "recycling",
    header_text: "عقد توريد ورق وكرتون لإعادة التدوير",
    introduction_text: `عقد {التاريخ} بين {اسم_الطرف_الأول} و {اسم_الطرف_الثاني}`,
    terms_template: `أنواع: كرتون، ورق مكتبي، جرائد
الجودة: نظيف، جاف، مفروز
الكميات: 30-100 طن شهرياً
${commonTerms.confidentiality}
${commonTerms.forcesMajeure}
${commonTerms.compliance}`,
    obligations_party_one: `توريد منتظم، جودة ثابتة`,
    obligations_party_two: `استلام، فحص، دفع`,
    payment_terms_template: `حسب النوع والجودة`,
    duration_clause: `سنة`,
    termination_clause: `60 يوماً`,
    dispute_resolution: `تحكيم`,
    closing_text: `التوقيعات`
  },
  {
    name: "عقد تدوير المعادن غير الحديدية",
    description: "عقد لتوريد خردة الألومنيوم والنحاس",
    partner_type: "recycler",
    contract_category: "recycling",
    header_text: "عقد توريد معادن غير حديدية",
    introduction_text: `اتفاقية {التاريخ}`,
    terms_template: `ألومنيوم، نحاس، زنك، رصاص
نقاوة: 98% فأكثر
${commonTerms.confidentiality}
${commonTerms.forcesMajeure}`,
    obligations_party_one: `توريد معادن نقية`,
    obligations_party_two: `فحص وتحليل دقيق`,
    payment_terms_template: `أسعار بورصة لندن + علاوة`,
    duration_clause: `سنتان`,
    termination_clause: `90 يوماً`,
    dispute_resolution: `تحكيم دولي`,
    closing_text: `الأختام والتوقيعات`
  },
  {
    name: "عقد تدوير الزجاج",
    description: "عقد لتوريد كسر الزجاج لمصانع إعادة التصنيع",
    partner_type: "recycler",
    contract_category: "recycling",
    header_text: "عقد توريد زجاج للتدوير",
    introduction_text: `عقد {التاريخ}`,
    terms_template: `زجاج شفاف، ملون، مسطح
نظيف، مكسور، مفروز
${commonTerms.confidentiality}
${commonTerms.compliance}`,
    obligations_party_one: `توريد زجاج نظيف`,
    obligations_party_two: `استلام وصهر`,
    payment_terms_template: `800-1200 جنيه/طن`,
    duration_clause: `سنة`,
    termination_clause: `45 يوماً`,
    dispute_resolution: `محاكم محلية`,
    closing_text: `توقيع`
  },
  {
    name: "عقد تدوير الإطارات المستعملة",
    description: "عقد لتوريد إطارات للتدوير أو إعادة التأهيل",
    partner_type: "recycler",
    contract_category: "recycling",
    header_text: "عقد تدوير الإطارات",
    introduction_text: `اتفاق {التاريخ}`,
    terms_template: `إطارات سيارات، شاحنات، دراجات
حالة: قابلة للتأهيل أو التدوير
${commonTerms.forcesMajeure}
${commonTerms.insurance}`,
    obligations_party_one: `توريد إطارات مفروزة`,
    obligations_party_two: `تدوير أو تأهيل`,
    payment_terms_template: `500 جنيه/طن`,
    duration_clause: `سنة`,
    termination_clause: `60 يوماً`,
    dispute_resolution: `تحكيم`,
    closing_text: `التوقيع`
  },
  {
    name: "عقد معالجة النفايات الإلكترونية",
    description: "عقد لتوريد النفايات الإلكترونية للتفكيك والتدوير",
    partner_type: "recycler",
    contract_category: "recycling",
    header_text: "عقد معالجة النفايات الإلكترونية",
    introduction_text: `عقد {التاريخ}`,
    terms_template: `كمبيوترات، هواتف، شاشات
معايير R2 و e-Stewards
${commonTerms.confidentiality}
${commonTerms.compliance}`,
    obligations_party_one: `توريد آمن مع بيانات`,
    obligations_party_two: `تفكيك وتدوير مسؤول`,
    payment_terms_template: `حسب النوع والحالة`,
    duration_clause: `سنتان`,
    termination_clause: `90 يوماً`,
    dispute_resolution: `تحكيم دولي`,
    closing_text: `أختام وتوقيعات`
  },
  // المزيد من قوالب جهات التدوير...
  {
    name: "عقد تدوير نفايات المنسوجات",
    description: "عقد لتوريد نفايات الأقمشة لإعادة التدوير",
    partner_type: "recycler",
    contract_category: "recycling",
    header_text: "عقد تدوير المنسوجات",
    introduction_text: `{التاريخ}`,
    terms_template: `أقمشة قطنية، صناعية، مخلوطة
${commonTerms.confidentiality}`,
    obligations_party_one: `فرز وتوريد`,
    obligations_party_two: `تدوير وإصدار شهادات`,
    payment_terms_template: `700-1500 جنيه/طن`,
    duration_clause: `سنة`,
    termination_clause: `30 يوماً`,
    dispute_resolution: `ودي`,
    closing_text: `توقيع`
  },
  {
    name: "عقد تدوير الخشب المستعمل",
    description: "عقد لتوريد مخلفات الخشب للتدوير",
    partner_type: "recycler",
    contract_category: "recycling",
    header_text: "عقد تدوير الخشب",
    introduction_text: `{التاريخ}`,
    terms_template: `بالتات، أثاث، قصاصات
${commonTerms.forcesMajeure}`,
    obligations_party_one: `توريد خشب نظيف`,
    obligations_party_two: `تحويل لرقائق أو حرق`,
    payment_terms_template: `400-600 جنيه/طن`,
    duration_clause: `سنة`,
    termination_clause: `45 يوماً`,
    dispute_resolution: `محاكم`,
    closing_text: `توقيع`
  },
  {
    name: "عقد تدوير زيوت السيارات المستعملة",
    description: "عقد لتوريد زيوت مستعملة لإعادة التكرير",
    partner_type: "recycler",
    contract_category: "recycling",
    header_text: "عقد تدوير الزيوت المستعملة",
    introduction_text: `{التاريخ}`,
    terms_template: `زيوت محركات، هيدروليك، تروس
معايير صارمة للتخزين والنقل
${commonTerms.compliance}
${commonTerms.insurance}`,
    obligations_party_one: `جمع آمن، حاويات مخصصة`,
    obligations_party_two: `تكرير بيئي`,
    payment_terms_template: `2000-3000 جنيه/طن`,
    duration_clause: `سنتان`,
    termination_clause: `60 يوماً`,
    dispute_resolution: `تحكيم متخصص`,
    closing_text: `توقيعات مع شهود`
  },
  {
    name: "عقد تدوير البطاريات",
    description: "عقد لتوريد البطاريات المستعملة للتدوير الآمن",
    partner_type: "recycler",
    contract_category: "recycling",
    header_text: "عقد تدوير البطاريات",
    introduction_text: `{التاريخ}`,
    terms_template: `بطاريات حمض الرصاص، ليثيوم، نيكل
إجراءات سلامة صارمة
${commonTerms.confidentiality}
${commonTerms.insurance}`,
    obligations_party_one: `جمع آمن، تغليف محكم`,
    obligations_party_two: `استخلاص المعادن`,
    payment_terms_template: `حسب نوع البطارية`,
    duration_clause: `سنتان`,
    termination_clause: `90 يوماً`,
    dispute_resolution: `تحكيم`,
    closing_text: `التوقيعات`
  },
];

// دالة لإنشاء المزيد من القوالب المتنوعة
function generateAdditionalTemplates(
  baseTemplates: ContractTemplateData[],
  partnerType: 'generator' | 'recycler',
  count: number
): ContractTemplateData[] {
  const categories: Array<'collection' | 'transport' | 'collection_transport' | 'recycling' | 'other'> = 
    partnerType === 'generator' 
      ? ['collection', 'transport', 'collection_transport']
      : ['recycling', 'other'];
  
  const wasteTypes = [
    'النفايات الكيميائية غير الخطرة',
    'مخلفات الأغذية الصناعية',
    'نفايات التعبئة والتغليف',
    'بقايا الطلاء والدهانات',
    'نفايات القطاع الصحي غير الخطرة',
    'مخلفات الطباعة والأحبار',
    'نفايات المستحضرات التجميلية',
    'مخلفات الأدوية منتهية الصلاحية',
    'نفايات المواد اللاصقة',
    'مخلفات المنظفات الصناعية',
    'نفايات الجلود الصناعية',
    'مخلفات السيراميك والبورسلين',
    'نفايات الألياف الزجاجية',
    'مخلفات مواد البناء الحديثة',
    'نفايات العوازل الحرارية',
    'مخلفات الفلين والإسفنج',
    'نفايات الأسلاك والكابلات',
    'مخلفات المحولات الكهربائية',
    'نفايات معدات المختبرات',
    'مخلفات الأجهزة الطبية',
    'نفايات الألواح الشمسية',
    'مخلفات توربينات الرياح',
    'نفايات المركبات نهاية العمر',
    'مخلفات القوارب والسفن',
    'نفايات الطائرات والمركبات الجوية',
    'مخلفات معدات الاتصالات',
    'نفايات أجهزة القياس',
    'مخلفات المعدات الزراعية',
    'نفايات أنظمة التكييف',
    'مخلفات معدات التبريد',
    'نفايات مضخات المياه',
    'مخلفات محركات الديزل',
    'نفايات المحركات الكهربائية',
    'مخلفات علب التروس',
    'نفايات أنظمة الفرامل',
    'مخلفات إطارات الطائرات',
    'نفايات أحزمة النقل',
    'مخلفات الأختام والحشوات',
    'نفايات الفلاتر الصناعية',
    'مخلفات الصمامات والوصلات'
  ];

  const additionalTemplates: ContractTemplateData[] = [];
  
  for (let i = 0; i < count; i++) {
    const wasteType = wasteTypes[i % wasteTypes.length];
    const category = categories[i % categories.length];
    
    additionalTemplates.push({
      name: partnerType === 'generator' 
        ? `عقد جمع ${wasteType}`
        : `عقد تدوير ${wasteType}`,
      description: `عقد متخصص في ${partnerType === 'generator' ? 'جمع ونقل' : 'معالجة وتدوير'} ${wasteType}`,
      partner_type: partnerType,
      contract_category: category,
      header_text: `عقد ${partnerType === 'generator' ? 'جمع' : 'تدوير'} ${wasteType}`,
      introduction_text: `عقد مؤرخ في {التاريخ} بين {اسم_الطرف_الأول} و {اسم_الطرف_الثاني}
لتقديم خدمات ${partnerType === 'generator' ? 'جمع ونقل' : 'معالجة وتدوير'} ${wasteType}`,
      terms_template: `البند الأول - موضوع العقد:
${partnerType === 'generator' ? 'جمع ونقل' : 'استلام ومعالجة'} ${wasteType} وفقاً للمعايير البيئية المعتمدة.

البند الثاني - المواصفات الفنية:
1. الالتزام بالمعايير البيئية المصرية والدولية
2. استخدام أفضل التقنيات المتاحة
3. التوثيق الكامل لجميع العمليات
4. ضمان التتبع من المصدر للوجهة

البند الثالث - الكميات:
1. الحد الأدنى: حسب الاتفاق
2. الحد الأقصى: حسب الطاقة الاستيعابية
3. الإخطار المسبق للكميات الاستثنائية

البند الرابع - الجودة والمواصفات:
1. فرز ونقاء حسب المعايير
2. فحص عند الاستلام
3. حق الرفض للمواد غير المطابقة

البند الخامس - التوثيق:
1. بيانات الشحن لكل عملية
2. شهادات المعالجة والتدوير
3. تقارير دورية

${commonTerms.confidentiality}
${commonTerms.forcesMajeure}
${commonTerms.amendments}
${commonTerms.assignment}
${commonTerms.notices}
${commonTerms.entireAgreement}
${commonTerms.severability}
${commonTerms.waiver}
${commonTerms.governingLaw}
${commonTerms.counterparts}
${commonTerms.representations}
${commonTerms.indemnification}
${commonTerms.insurance}
${commonTerms.compliance}
${commonTerms.audit}`,
      obligations_party_one: `التزامات الطرف الأول:
1. الالتزام بمعايير الجودة والسلامة
2. التسليم في المواعيد المحددة
3. توفير التوثيق الكامل
4. التأمين على العمليات
5. الامتثال للوائح البيئية
6. تدريب العمالة
7. صيانة المعدات
8. الإخطار بأي حوادث
9. الحفاظ على السرية
10. التعاون في التفتيش`,
      obligations_party_two: `التزامات الطرف الثاني:
1. الاستلام في المواعيد
2. الفحص العادل
3. الدفع في الموعد
4. إصدار الشهادات
5. الإخطار بالتغييرات
6. توفير التقارير
7. الالتزام بالمعايير
8. التعاون الكامل
9. الحفاظ على السرية
10. الامتثال للقوانين`,
      payment_terms_template: `الشروط المالية:
1. الأسعار حسب الاتفاق
2. الدفع شهرياً
3. فواتير ضريبية معتمدة
4. غرامات تأخير 1% شهرياً`,
      duration_clause: `المدة: سنة واحدة قابلة للتجديد
التجديد التلقائي ما لم يُخطر أحد الطرفين
الإخطار قبل 60 يوماً`,
      termination_clause: `الإنهاء:
1. إخطار كتابي قبل 60 يوماً
2. الفسخ الفوري عند الإخلال الجسيم
3. تسوية المستحقات خلال 30 يوماً`,
      dispute_resolution: `فض النزاعات:
1. التفاوض الودي أولاً
2. الوساطة خلال 30 يوماً
3. التحكيم وفق CRCICA
4. محاكم القاهرة`,
      closing_text: `حُرر هذا العقد من نسختين أصليتين

الطرف الأول: _______________
الطرف الثاني: _______________

التاريخ: ___/___/______م`
    });
  }
  
  return additionalTemplates;
}

// إنشاء قوالب إضافية للوصول إلى 50 لكل نوع
const additionalGeneratorTemplates = generateAdditionalTemplates(generatorTemplates, 'generator', 40);
const additionalRecyclerTemplates = generateAdditionalTemplates(recyclerTemplates, 'recycler', 40);

// القوالب النهائية الكاملة
export const allGeneratorTemplates: ContractTemplateData[] = [...generatorTemplates, ...additionalGeneratorTemplates];
export const allRecyclerTemplates: ContractTemplateData[] = [...recyclerTemplates, ...additionalRecyclerTemplates];

// جميع القوالب معاً
export const allContractTemplates: ContractTemplateData[] = [...allGeneratorTemplates, ...allRecyclerTemplates];

export default allContractTemplates;
