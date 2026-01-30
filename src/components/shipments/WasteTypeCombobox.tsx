import { useState, useEffect, useMemo } from 'react';
import { Check, ChevronsUpDown, Search, Star, AlertTriangle, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { getStoredCustomWasteTypes, CustomWasteType } from '@/hooks/useCustomWasteTypes';
import type { Database } from '@/integrations/supabase/types';

type WasteType = Database['public']['Enums']['waste_type'];

// Hazardous waste types with subcategories - Updated with "مخلف" prefix according to Egyptian Environmental Law
const hazardousWasteCategories = [
  {
    category: 'chemical',
    categoryLabel: 'مخلفات كيميائية صناعية',
    items: [
      { value: 'chemical', label: 'مخلف المذيبات العضوية', code: 'CH-01' },
      { value: 'chemical', label: 'مخلف الأحماض والقلويات', code: 'CH-02' },
      { value: 'chemical', label: 'مخلف المبيدات الحشرية', code: 'CH-03' },
      { value: 'chemical', label: 'مخلف الأسمدة الكيميائية المنتهية', code: 'CH-04' },
      { value: 'chemical', label: 'مخلف المواد المؤكسدة', code: 'CH-05' },
      { value: 'chemical', label: 'مخلف المواد الكاوية', code: 'CH-06' },
      { value: 'chemical', label: 'مخلف المواد السامة', code: 'CH-07' },
      { value: 'chemical', label: 'مخلف المختبرات الكيميائية', code: 'CH-08' },
      { value: 'chemical', label: 'مخلف الزيوت والشحوم الملوثة', code: 'CH-09' },
      { value: 'chemical', label: 'مخلف الطلاءات والدهانات', code: 'CH-10' },
      { value: 'chemical', label: 'مخلف براميل كيميائية ملوثة', code: 'CH-11' },
      { value: 'chemical', label: 'مخلف حاويات مواد خطرة فارغة', code: 'CH-12' },
      { value: 'chemical', label: 'مخلف التنظيف الصناعي', code: 'CH-13' },
      { value: 'chemical', label: 'مخلف غازات مضغوطة ملوثة', code: 'CH-14' },
      { value: 'chemical', label: 'مخلف مواد لاصقة صناعية', code: 'CH-15' },
      { value: 'chemical', label: 'مخلف راتنجات ومواد ايبوكسي', code: 'CH-16' },
      { value: 'chemical', label: 'مخلف التبريد والتكييف', code: 'CH-17' },
      { value: 'chemical', label: 'مخلف زيوت هيدروليكية مستعملة', code: 'CH-18' },
      { value: 'chemical', label: 'مخلف الطباعة والأحبار', code: 'CH-19' },
      { value: 'chemical', label: 'مخلف معالجة الأسطح', code: 'CH-20' },
      { value: 'chemical', label: 'مخلف حمض الكبريتيك', code: 'CH-21' },
      { value: 'chemical', label: 'مخلف حمض النيتريك', code: 'CH-22' },
      { value: 'chemical', label: 'مخلف هيدروكسيد الصوديوم', code: 'CH-23' },
      { value: 'chemical', label: 'مخلف الكلور والمركبات الكلورية', code: 'CH-24' },
      { value: 'chemical', label: 'مخلف الفورمالدهيد', code: 'CH-25' },
      { value: 'chemical', label: 'مخلف الأمونيا', code: 'CH-26' },
      { value: 'chemical', label: 'مخلف السيانيد', code: 'CH-27' },
      { value: 'chemical', label: 'مخلف الزرنيخ ومركباته', code: 'CH-28' },
      { value: 'chemical', label: 'مخلف الكروم السداسي', code: 'CH-29' },
      { value: 'chemical', label: 'مخلف الزئبق ومركباته', code: 'CH-30' },
      { value: 'chemical', label: 'مخلف الفينولات', code: 'CH-31' },
      { value: 'chemical', label: 'مخلف البنزين ومشتقاته', code: 'CH-32' },
      { value: 'chemical', label: 'مخلف التولوين', code: 'CH-33' },
      { value: 'chemical', label: 'مخلف الزيلين', code: 'CH-34' },
      { value: 'chemical', label: 'مخلف ثنائي كلورو الميثان', code: 'CH-35' },
      { value: 'chemical', label: 'مخلف رباعي كلوريد الكربون', code: 'CH-36' },
      { value: 'chemical', label: 'مخلف الأسبستوس', code: 'CH-37' },
      { value: 'chemical', label: 'مخلف PCBs (ثنائي الفينيل متعدد الكلور)', code: 'CH-38' },
      { value: 'chemical', label: 'مخلف مواد تبييض صناعية', code: 'CH-39' },
      { value: 'chemical', label: 'مخلف محاليل الجلفنة', code: 'CH-40' },
    ],
  },
  {
    category: 'electronic',
    categoryLabel: 'مخلفات إلكترونية وكهربائية',
    items: [
      { value: 'electronic', label: 'مخلف البطاريات (رصاص-حمض)', code: 'EL-01' },
      { value: 'electronic', label: 'مخلف البطاريات الليثيوم', code: 'EL-02' },
      { value: 'electronic', label: 'مخلف الشاشات CRT', code: 'EL-03' },
      { value: 'electronic', label: 'مخلف اللوحات الإلكترونية', code: 'EL-04' },
      { value: 'electronic', label: 'مخلف الكابلات والأسلاك', code: 'EL-05' },
      { value: 'electronic', label: 'مخلف أجهزة الحاسوب', code: 'EL-06' },
      { value: 'electronic', label: 'مخلف الهواتف المحمولة', code: 'EL-07' },
      { value: 'electronic', label: 'مخلف الطابعات وخراطيش الحبر', code: 'EL-08' },
      { value: 'electronic', label: 'مخلف المصابيح الفلورية', code: 'EL-09' },
      { value: 'electronic', label: 'مخلف الأجهزة المنزلية الإلكترونية', code: 'EL-10' },
      { value: 'electronic', label: 'مخلف مكيفات هواء مستعملة', code: 'EL-11' },
      { value: 'electronic', label: 'مخلف ثلاجات ومبردات', code: 'EL-12' },
      { value: 'electronic', label: 'مخلف معدات طبية إلكترونية', code: 'EL-13' },
      { value: 'electronic', label: 'مخلف أجهزة اتصالات وشبكات', code: 'EL-14' },
      { value: 'electronic', label: 'مخلف شاشات LCD/LED', code: 'EL-15' },
      { value: 'electronic', label: 'مخلف محولات كهربائية', code: 'EL-16' },
      { value: 'electronic', label: 'مخلف UPS وبطاريات احتياطية', code: 'EL-17' },
      { value: 'electronic', label: 'مخلف ألواح طاقة شمسية تالفة', code: 'EL-18' },
      { value: 'electronic', label: 'مخلف موتورات كهربائية', code: 'EL-19' },
      { value: 'electronic', label: 'مخلف أسلاك نحاسية معزولة', code: 'EL-20' },
      { value: 'electronic', label: 'مخلف مكثفات كهربائية', code: 'EL-21' },
      { value: 'electronic', label: 'مخلف قواطع كهربائية', code: 'EL-22' },
      { value: 'electronic', label: 'مخلف لوحات توزيع كهربائية', code: 'EL-23' },
      { value: 'electronic', label: 'مخلف مولدات كهربائية', code: 'EL-24' },
      { value: 'electronic', label: 'مخلف أجهزة قياس إلكترونية', code: 'EL-25' },
    ],
  },
  {
    category: 'medical',
    categoryLabel: 'مخلفات طبية خطرة',
    items: [
      { value: 'medical', label: 'مخلف النفايات المعدية', code: 'MD-01' },
      { value: 'medical', label: 'مخلف الأدوات الحادة (إبر، مشارط)', code: 'MD-02' },
      { value: 'medical', label: 'مخلف الأدوية منتهية الصلاحية', code: 'MD-03' },
      { value: 'medical', label: 'مخلف المواد الكيميائية الصيدلانية', code: 'MD-04' },
      { value: 'medical', label: 'مخلف النفايات التشريحية', code: 'MD-05' },
      { value: 'medical', label: 'مخلف نفايات العلاج الكيميائي', code: 'MD-06' },
      { value: 'medical', label: 'مخلف النفايات المشعة الطبية', code: 'MD-07' },
      { value: 'medical', label: 'مخلف أكياس الدم ومشتقاته', code: 'MD-08' },
      { value: 'medical', label: 'مخلف المستلزمات الطبية الملوثة', code: 'MD-09' },
      { value: 'medical', label: 'مخلف نفايات غسيل الكلى', code: 'MD-10' },
      { value: 'medical', label: 'مخلف قفازات طبية ملوثة', code: 'MD-11' },
      { value: 'medical', label: 'مخلف أقنعة ومعدات وقاية شخصية', code: 'MD-12' },
      { value: 'medical', label: 'مخلف عبوات أدوية فارغة', code: 'MD-13' },
      { value: 'medical', label: 'مخلف نفايات مختبرات التحاليل', code: 'MD-14' },
      { value: 'medical', label: 'مخلف نفايات الأسنان', code: 'MD-15' },
      { value: 'medical', label: 'مخلف نفايات العيادات البيطرية', code: 'MD-16' },
      { value: 'medical', label: 'مخلف أنابيب ومحاقن مستعملة', code: 'MD-17' },
      { value: 'medical', label: 'مخلف ضمادات وقطن ملوث', code: 'MD-18' },
      { value: 'medical', label: 'مخلف نفايات غرف العمليات', code: 'MD-19' },
      { value: 'medical', label: 'مخلف مخلفات التعقيم', code: 'MD-20' },
      { value: 'medical', label: 'مخلف نفايات وحدات العناية المركزة', code: 'MD-21' },
      { value: 'medical', label: 'مخلف نفايات أقسام العزل', code: 'MD-22' },
      { value: 'medical', label: 'مخلف نفايات أقسام الأورام', code: 'MD-23' },
      { value: 'medical', label: 'مخلف نفايات مختبرات الباثولوجي', code: 'MD-24' },
      { value: 'medical', label: 'مخلف نفايات بنوك الدم', code: 'MD-25' },
      { value: 'medical', label: 'مخلف نفايات مراكز الأشعة', code: 'MD-26' },
      { value: 'medical', label: 'مخلف أفلام أشعة تالفة', code: 'MD-27' },
      { value: 'medical', label: 'مخلف محاليل تحميض الأشعة', code: 'MD-28' },
      { value: 'medical', label: 'مخلف نفايات طب النووي', code: 'MD-29' },
      { value: 'medical', label: 'مخلف نفايات العلاج الإشعاعي', code: 'MD-30' },
      { value: 'medical', label: 'مخلف أجهزة طبية ملوثة', code: 'MD-31' },
      { value: 'medical', label: 'مخلف مستلزمات جراحية مستعملة', code: 'MD-32' },
      { value: 'medical', label: 'مخلف أنابيب تغذية وريدية', code: 'MD-33' },
      { value: 'medical', label: 'مخلف قساطر طبية مستعملة', code: 'MD-34' },
      { value: 'medical', label: 'مخلف أكياس بول ملوثة', code: 'MD-35' },
      { value: 'medical', label: 'مخلف نفايات الولادة', code: 'MD-36' },
      { value: 'medical', label: 'مخلف المشيمة والأنسجة البشرية', code: 'MD-37' },
      { value: 'medical', label: 'مخلف أعضاء بشرية مبتورة', code: 'MD-38' },
      { value: 'medical', label: 'مخلف نفايات صالات التشريح', code: 'MD-39' },
      { value: 'medical', label: 'مخلف حيوانات تجارب مختبرية', code: 'MD-40' },
      { value: 'medical', label: 'مخلف مزارع بكتيرية وفيروسية', code: 'MD-41' },
      { value: 'medical', label: 'مخلف لقاحات منتهية الصلاحية', code: 'MD-42' },
      { value: 'medical', label: 'مخلف أمصال ومنتجات مناعية', code: 'MD-43' },
      { value: 'medical', label: 'مخلف نفايات مختبرات الميكروبيولوجي', code: 'MD-44' },
      { value: 'medical', label: 'مخلف نفايات الحمض النووي DNA', code: 'MD-45' },
      { value: 'medical', label: 'مخلف مواد تخدير منتهية', code: 'MD-46' },
      { value: 'medical', label: 'مخلف أدوية مخدرة تالفة', code: 'MD-47' },
      { value: 'medical', label: 'مخلف مضادات حيوية منتهية', code: 'MD-48' },
      { value: 'medical', label: 'مخلف هرمونات ومستحضرات بيولوجية', code: 'MD-49' },
      { value: 'medical', label: 'مخلف مواد تطهير مستعملة', code: 'MD-50' },
    ],
  },
  {
    category: 'chemical',
    categoryLabel: 'مخلفات صناعية خاصة',
    items: [
      { value: 'chemical', label: 'مخلف صناعات النسيج الكيميائية', code: 'IN-01' },
      { value: 'chemical', label: 'مخلف صناعات الجلود', code: 'IN-02' },
      { value: 'chemical', label: 'مخلف صناعات الورق', code: 'IN-03' },
      { value: 'chemical', label: 'مخلف مصافي البترول', code: 'IN-04' },
      { value: 'chemical', label: 'مخلف صناعات البتروكيماويات', code: 'IN-05' },
      { value: 'chemical', label: 'مخلف صناعات الأسمدة', code: 'IN-06' },
      { value: 'chemical', label: 'مخلف صناعات الأدوية', code: 'IN-07' },
      { value: 'chemical', label: 'مخلف صناعات مستحضرات التجميل', code: 'IN-08' },
      { value: 'chemical', label: 'مخلف صناعات الصابون والمنظفات', code: 'IN-09' },
      { value: 'chemical', label: 'مخلف صناعات الأسمنت', code: 'IN-10' },
      { value: 'chemical', label: 'مخلف صناعات السيراميك', code: 'IN-11' },
      { value: 'chemical', label: 'مخلف صناعات الزجاج', code: 'IN-12' },
      { value: 'chemical', label: 'مخلف صناعات الحديد والصلب', code: 'IN-13' },
      { value: 'chemical', label: 'مخلف صناعات الألومنيوم', code: 'IN-14' },
      { value: 'chemical', label: 'مخلف صناعات النحاس', code: 'IN-15' },
      { value: 'chemical', label: 'مخلف صناعات الطلاء الكهربائي', code: 'IN-16' },
      { value: 'chemical', label: 'مخلف صناعات البطاريات', code: 'IN-17' },
      { value: 'chemical', label: 'مخلف صناعات المطاط', code: 'IN-18' },
      { value: 'chemical', label: 'مخلف صناعات البلاستيك الخطرة', code: 'IN-19' },
      { value: 'chemical', label: 'مخلف محطات معالجة المياه', code: 'IN-20' },
      { value: 'chemical', label: 'مخلف محطات الصرف الصناعي', code: 'IN-21' },
      { value: 'chemical', label: 'مخلف حمأة الصرف الصناعي', code: 'IN-22' },
      { value: 'chemical', label: 'مخلف أفران الصهر', code: 'IN-23' },
      { value: 'chemical', label: 'مخلف خبث المعادن', code: 'IN-24' },
      { value: 'chemical', label: 'مخلف رماد الحرق الصناعي', code: 'IN-25' },
      { value: 'chemical', label: 'مخلف فلاتر صناعية ملوثة', code: 'IN-26' },
      { value: 'chemical', label: 'مخلف مواد عازلة ملوثة', code: 'IN-27' },
      { value: 'chemical', label: 'مخلف مواد حرارية ملوثة', code: 'IN-28' },
      { value: 'chemical', label: 'مخلف محفزات كيميائية مستهلكة', code: 'IN-29' },
      { value: 'chemical', label: 'مخلف كربون منشط مستهلك', code: 'IN-30' },
    ],
  },
];

// Non-hazardous waste types with subcategories - Updated with "مخلف" prefix
const nonHazardousWasteCategories = [
  {
    category: 'plastic',
    categoryLabel: 'مخلفات بلاستيكية',
    items: [
      { value: 'plastic', label: 'مخلف PET (زجاجات المياه)', code: 'PL-01' },
      { value: 'plastic', label: 'مخلف HDPE (عبوات الحليب)', code: 'PL-02' },
      { value: 'plastic', label: 'مخلف PVC (أنابيب)', code: 'PL-03' },
      { value: 'plastic', label: 'مخلف LDPE (أكياس بلاستيكية)', code: 'PL-04' },
      { value: 'plastic', label: 'مخلف PP (علب الطعام)', code: 'PL-05' },
      { value: 'plastic', label: 'مخلف PS (الستايروفوم)', code: 'PL-06' },
      { value: 'plastic', label: 'مخلف البلاستيك المختلط', code: 'PL-07' },
      { value: 'plastic', label: 'مخلف الأغشية البلاستيكية', code: 'PL-08' },
      { value: 'plastic', label: 'مخلف بلاستيك صناعي', code: 'PL-09' },
      { value: 'plastic', label: 'مخلف خراطيم بلاستيكية', code: 'PL-10' },
    ],
  },
  {
    category: 'paper',
    categoryLabel: 'مخلفات ورقية',
    items: [
      { value: 'paper', label: 'مخلف الورق المكتبي الأبيض', code: 'PA-01' },
      { value: 'paper', label: 'مخلف الصحف والمجلات', code: 'PA-02' },
      { value: 'paper', label: 'مخلف الكرتون المموج', code: 'PA-03' },
      { value: 'paper', label: 'مخلف الكرتون المضغوط', code: 'PA-04' },
      { value: 'paper', label: 'مخلف أكياس الورق', code: 'PA-05' },
      { value: 'paper', label: 'مخلف ورق التغليف', code: 'PA-06' },
      { value: 'paper', label: 'مخلف المناديل الورقية المستعملة', code: 'PA-07' },
      { value: 'paper', label: 'مخلف الورق المشمع أو المغلف', code: 'PA-08' },
      { value: 'paper', label: 'مخلف ورق طباعة ملون', code: 'PA-09' },
      { value: 'paper', label: 'مخلف كتب ومستندات قديمة', code: 'PA-10' },
    ],
  },
  {
    category: 'metal',
    categoryLabel: 'مخلفات معدنية',
    items: [
      { value: 'metal', label: 'مخلف الألومنيوم (علب المشروبات)', code: 'MT-01' },
      { value: 'metal', label: 'مخلف الحديد والصلب', code: 'MT-02' },
      { value: 'metal', label: 'مخلف النحاس', code: 'MT-03' },
      { value: 'metal', label: 'مخلف الرصاص', code: 'MT-04' },
      { value: 'metal', label: 'مخلف الزنك', code: 'MT-05' },
      { value: 'metal', label: 'مخلف الستانلس ستيل', code: 'MT-06' },
      { value: 'metal', label: 'مخلف البرونز والنحاس الأصفر', code: 'MT-07' },
      { value: 'metal', label: 'مخلف الخردة المعدنية المختلطة', code: 'MT-08' },
      { value: 'metal', label: 'مخلف براميل معدنية', code: 'MT-09' },
      { value: 'metal', label: 'مخلف أنابيب معدنية', code: 'MT-10' },
    ],
  },
  {
    category: 'glass',
    categoryLabel: 'مخلفات زجاجية',
    items: [
      { value: 'glass', label: 'مخلف الزجاج الشفاف', code: 'GL-01' },
      { value: 'glass', label: 'مخلف الزجاج البني', code: 'GL-02' },
      { value: 'glass', label: 'مخلف الزجاج الأخضر', code: 'GL-03' },
      { value: 'glass', label: 'مخلف زجاج النوافذ', code: 'GL-04' },
      { value: 'glass', label: 'مخلف المرايا', code: 'GL-05' },
      { value: 'glass', label: 'مخلف الزجاج المقوى', code: 'GL-06' },
      { value: 'glass', label: 'مخلف الأواني الزجاجية', code: 'GL-07' },
      { value: 'glass', label: 'مخلف زجاجات مشروبات', code: 'GL-08' },
    ],
  },
  {
    category: 'organic',
    categoryLabel: 'مخلفات عضوية',
    items: [
      { value: 'organic', label: 'مخلف بقايا الطعام', code: 'OR-01' },
      { value: 'organic', label: 'مخلف قشور الفواكه والخضروات', code: 'OR-02' },
      { value: 'organic', label: 'مخلف الحدائق', code: 'OR-03' },
      { value: 'organic', label: 'مخلف الأخشاب غير المعالجة', code: 'OR-04' },
      { value: 'organic', label: 'مخلف القش والتبن', code: 'OR-05' },
      { value: 'organic', label: 'مخلف روث الحيوانات', code: 'OR-06' },
      { value: 'organic', label: 'مخلف المخلفات الزراعية', code: 'OR-07' },
      { value: 'organic', label: 'مخلف سماد عضوي متحلل', code: 'OR-08' },
    ],
  },
  {
    category: 'construction',
    categoryLabel: 'مخلفات البناء والهدم',
    items: [
      { value: 'construction', label: 'مخلف الخرسانة والأسمنت', code: 'CN-01' },
      { value: 'construction', label: 'مخلف الطوب والبلاط', code: 'CN-02' },
      { value: 'construction', label: 'مخلف الأخشاب المعالجة', code: 'CN-03' },
      { value: 'construction', label: 'مخلف الجبس', code: 'CN-04' },
      { value: 'construction', label: 'مخلف الأسفلت', code: 'CN-05' },
      { value: 'construction', label: 'مخلف الحفر والتسوية', code: 'CN-06' },
      { value: 'construction', label: 'مخلف مواد العزل', code: 'CN-07' },
      { value: 'construction', label: 'مخلف أنقاض الهدم المختلطة', code: 'CN-08' },
      { value: 'construction', label: 'مخلف مواد السباكة', code: 'CN-09' },
      { value: 'construction', label: 'مخلف مواد كهربائية بناء', code: 'CN-10' },
    ],
  },
  {
    category: 'other',
    categoryLabel: 'مخلفات أخرى',
    items: [
      { value: 'other', label: 'مخلف متنوع غير مصنف', code: 'OT-01' },
      { value: 'other', label: 'مخلف منسوجات وأقمشة', code: 'OT-02' },
      { value: 'other', label: 'مخلف مطاط وإطارات', code: 'OT-03' },
      { value: 'other', label: 'مخلف جلود طبيعية', code: 'OT-04' },
      { value: 'other', label: 'مخلف أثاث قديم', code: 'OT-05' },
    ],
  },
];

// Helper to determine if waste type is hazardous
const isHazardousWasteType = (wasteType: WasteType | ''): boolean => {
  if (!wasteType) return false;
  return ['chemical', 'electronic', 'medical'].includes(wasteType);
};

// Helper to determine hazard level from waste type
const getHazardLevelFromWasteType = (wasteType: WasteType | ''): string => {
  if (!wasteType) return '';
  return isHazardousWasteType(wasteType) ? 'hazardous' : 'non_hazardous';
};

interface WasteItem {
  value: string;
  label: string;
  code: string;
  category: string;
  categoryLabel: string;
  isHazardous: boolean;
  isCustom?: boolean;
}

interface WasteTypeComboboxProps {
  value: string;
  onChange: (wasteType: string, hazardLevel: string, wasteDescription: string) => void;
}

const WasteTypeCombobox = ({ value, onChange }: WasteTypeComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customWasteTypes, setCustomWasteTypes] = useState<CustomWasteType[]>([]);

  useEffect(() => {
    setCustomWasteTypes(getStoredCustomWasteTypes());
    const interval = setInterval(() => {
      setCustomWasteTypes(getStoredCustomWasteTypes());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Build flat list of all waste items for searching
  const allWasteItems = useMemo(() => {
    const items: WasteItem[] = [];

    // Add custom waste types first
    customWasteTypes.forEach(custom => {
      items.push({
        value: `${custom.parentCategory}:${custom.code}`,
        label: custom.name.startsWith('مخلف') ? custom.name : `مخلف ${custom.name}`,
        code: custom.code,
        category: custom.parentCategory,
        categoryLabel: 'أنواع مخصصة',
        isHazardous: custom.category === 'hazardous',
        isCustom: true,
      });
    });

    // Add hazardous waste
    hazardousWasteCategories.forEach(cat => {
      cat.items.forEach(item => {
        items.push({
          value: `${item.value}:${item.code}`,
          label: item.label,
          code: item.code,
          category: cat.category,
          categoryLabel: cat.categoryLabel,
          isHazardous: true,
        });
      });
    });

    // Add non-hazardous waste
    nonHazardousWasteCategories.forEach(cat => {
      cat.items.forEach(item => {
        items.push({
          value: `${item.value}:${item.code}`,
          label: item.label,
          code: item.code,
          category: cat.category,
          categoryLabel: cat.categoryLabel,
          isHazardous: false,
        });
      });
    });

    return items;
  }, [customWasteTypes]);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return allWasteItems;
    const query = searchQuery.toLowerCase();
    return allWasteItems.filter(
      item =>
        item.label.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query) ||
        item.categoryLabel.toLowerCase().includes(query)
    );
  }, [allWasteItems, searchQuery]);

  // Group filtered items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, WasteItem[]> = {};
    filteredItems.forEach(item => {
      const key = item.isCustom ? 'custom' : item.isHazardous ? 'hazardous' : 'non-hazardous';
      const groupKey = `${key}-${item.categoryLabel}`;
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });
    return groups;
  }, [filteredItems]);

  const selectedItem = allWasteItems.find(item => item.value === value);

  const handleSelect = (selectedValue: string) => {
    const item = allWasteItems.find(i => i.value === selectedValue);
    if (item) {
      const [wasteType] = selectedValue.split(':');
      const hazardLevel = getHazardLevelFromWasteType(wasteType as WasteType);
      const wasteLabel = `${item.code} - ${item.label}`;
      onChange(wasteType, hazardLevel, wasteLabel);
    }
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-10 py-2"
          dir="rtl"
        >
          {selectedItem ? (
            <div className="flex items-center gap-2 text-right">
              {selectedItem.isCustom && <Star className="w-3 h-3 text-primary shrink-0" />}
              {selectedItem.isHazardous ? (
                <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />
              ) : (
                <Leaf className="w-3 h-3 text-green-600 shrink-0" />
              )}
              <span className="text-xs font-mono text-muted-foreground shrink-0">
                {selectedItem.code}
              </span>
              <span className="truncate">{selectedItem.label}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">اختر نوع المخلف...</span>
          )}
          <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start" dir="rtl">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder="ابحث عن نوع المخلف بالاسم أو الكود..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList className="max-h-[300px] overflow-y-auto">
            {filteredItems.length === 0 ? (
              <CommandEmpty>لا توجد نتائج مطابقة</CommandEmpty>
            ) : (
              <>
                {/* Custom Waste Types */}
                {Object.entries(groupedItems)
                  .filter(([key]) => key.startsWith('custom'))
                  .map(([key, items]) => (
                    <CommandGroup key={key} heading={
                      <div className="flex items-center gap-2 text-primary">
                        <Star className="w-4 h-4" />
                        أنواع مخصصة
                      </div>
                    }>
                      {items.map(item => (
                        <CommandItem
                          key={item.value}
                          value={item.value}
                          onSelect={handleSelect}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "ml-2 h-4 w-4",
                              value === item.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <Star className="w-3 h-3 text-primary ml-2" />
                          <span className="text-xs font-mono text-muted-foreground ml-2">
                            {item.code}
                          </span>
                          <span>{item.label}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}

                {/* Hazardous Waste */}
                {Object.entries(groupedItems)
                  .filter(([key]) => key.startsWith('hazardous'))
                  .length > 0 && (
                  <div className="px-2 py-1.5 text-sm font-semibold text-destructive bg-destructive/5 sticky top-0 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    مخلفات خطرة
                  </div>
                )}
                {Object.entries(groupedItems)
                  .filter(([key]) => key.startsWith('hazardous'))
                  .map(([key, items]) => (
                    <CommandGroup key={key} heading={items[0].categoryLabel}>
                      {items.map(item => (
                        <CommandItem
                          key={item.value}
                          value={item.value}
                          onSelect={handleSelect}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "ml-2 h-4 w-4",
                              value === item.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="text-xs font-mono text-muted-foreground ml-2">
                            {item.code}
                          </span>
                          <span>{item.label}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}

                {/* Non-Hazardous Waste */}
                {Object.entries(groupedItems)
                  .filter(([key]) => key.startsWith('non-hazardous'))
                  .length > 0 && (
                  <div className="px-2 py-1.5 text-sm font-semibold text-green-700 bg-green-50 dark:bg-green-900/20 sticky top-0 flex items-center gap-2 border-t mt-1">
                    <Leaf className="w-4 h-4" />
                    مخلفات غير خطرة
                  </div>
                )}
                {Object.entries(groupedItems)
                  .filter(([key]) => key.startsWith('non-hazardous'))
                  .map(([key, items]) => (
                    <CommandGroup key={key} heading={items[0].categoryLabel}>
                      {items.map(item => (
                        <CommandItem
                          key={item.value}
                          value={item.value}
                          onSelect={handleSelect}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "ml-2 h-4 w-4",
                              value === item.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="text-xs font-mono text-muted-foreground ml-2">
                            {item.code}
                          </span>
                          <span>{item.label}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default WasteTypeCombobox;
export { hazardousWasteCategories, nonHazardousWasteCategories, isHazardousWasteType, getHazardLevelFromWasteType };
