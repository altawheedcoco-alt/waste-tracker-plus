import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import BackButton from '@/components/ui/back-button';
import { useCustomWasteTypes, CustomWasteType } from '@/hooks/useCustomWasteTypes';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Leaf,
  Recycle,
  Beaker,
  Cpu,
  Stethoscope,
  Building2,
  Package,
  FileText,
  Trash2,
  Droplets,
  Skull,
  ShieldAlert,
  ShieldCheck,
  Info,
  CheckCircle,
  XCircle,
  Plus,
  Star,
  X,
} from 'lucide-react';

// Hazardous waste categories based on environmental regulations
const hazardousWasteCategories = [
  {
    id: 'chemical',
    name: 'المخلفات الكيميائية',
    icon: Beaker,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    description: 'المواد الكيميائية الخطرة والسامة',
    wasteState: 'mixed', // صلبة وسائلة
    subcategories: [
      { name: 'المذيبات العضوية', code: 'CH-01', hazardLevel: 'high', wasteState: 'liquid' },
      { name: 'الأحماض والقلويات', code: 'CH-02', hazardLevel: 'high', wasteState: 'liquid' },
      { name: 'المبيدات الحشرية', code: 'CH-03', hazardLevel: 'critical', wasteState: 'liquid' },
      { name: 'الأسمدة الكيميائية المنتهية', code: 'CH-04', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'المواد المؤكسدة', code: 'CH-05', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'المواد الكاوية', code: 'CH-06', hazardLevel: 'high', wasteState: 'liquid' },
      { name: 'المواد السامة', code: 'CH-07', hazardLevel: 'critical', wasteState: 'mixed' },
      { name: 'مخلفات المختبرات الكيميائية', code: 'CH-08', hazardLevel: 'high', wasteState: 'mixed' },
      { name: 'الزيوت والشحوم الملوثة', code: 'CH-09', hazardLevel: 'medium', wasteState: 'liquid' },
      { name: 'الطلاءات والدهانات', code: 'CH-10', hazardLevel: 'medium', wasteState: 'liquid' },
      { name: 'براميل كيميائية ملوثة', code: 'CH-11', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'حاويات مواد خطرة فارغة', code: 'CH-12', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'مخلفات التنظيف الصناعي', code: 'CH-13', hazardLevel: 'medium', wasteState: 'liquid' },
      { name: 'غازات مضغوطة ملوثة', code: 'CH-14', hazardLevel: 'critical', wasteState: 'gas' },
      { name: 'مواد لاصقة صناعية', code: 'CH-15', hazardLevel: 'medium', wasteState: 'semi_solid' },
      { name: 'راتنجات ومواد ايبوكسي', code: 'CH-16', hazardLevel: 'medium', wasteState: 'semi_solid' },
      { name: 'مخلفات التبريد والتكييف', code: 'CH-17', hazardLevel: 'high', wasteState: 'gas' },
      { name: 'زيوت هيدروليكية مستعملة', code: 'CH-18', hazardLevel: 'medium', wasteState: 'liquid' },
      { name: 'مخلفات الطباعة والأحبار', code: 'CH-19', hazardLevel: 'medium', wasteState: 'liquid' },
      { name: 'مخلفات معالجة الأسطح', code: 'CH-20', hazardLevel: 'high', wasteState: 'liquid' },
    ],
  },
  {
    id: 'electronic',
    name: 'المخلفات الإلكترونية',
    icon: Cpu,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    description: 'الأجهزة والمكونات الإلكترونية',
    wasteState: 'solid',
    subcategories: [
      { name: 'البطاريات (رصاص-حمض)', code: 'EL-01', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'البطاريات الليثيوم', code: 'EL-02', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'الشاشات CRT', code: 'EL-03', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'اللوحات الإلكترونية', code: 'EL-04', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'الكابلات والأسلاك', code: 'EL-05', hazardLevel: 'low', wasteState: 'solid' },
      { name: 'أجهزة الحاسوب', code: 'EL-06', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'الهواتف المحمولة', code: 'EL-07', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'الطابعات وخراطيش الحبر', code: 'EL-08', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'المصابيح الفلورية', code: 'EL-09', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'الأجهزة المنزلية الإلكترونية', code: 'EL-10', hazardLevel: 'low', wasteState: 'solid' },
      { name: 'مكيفات هواء مستعملة', code: 'EL-11', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'ثلاجات ومبردات', code: 'EL-12', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'معدات طبية إلكترونية', code: 'EL-13', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'أجهزة اتصالات وشبكات', code: 'EL-14', hazardLevel: 'low', wasteState: 'solid' },
      { name: 'شاشات LCD/LED', code: 'EL-15', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'محولات كهربائية', code: 'EL-16', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'UPS وبطاريات احتياطية', code: 'EL-17', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'ألواح طاقة شمسية تالفة', code: 'EL-18', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'موتورات كهربائية', code: 'EL-19', hazardLevel: 'low', wasteState: 'solid' },
      { name: 'أسلاك نحاسية معزولة', code: 'EL-20', hazardLevel: 'low', wasteState: 'solid' },
    ],
  },
  {
    id: 'medical',
    name: 'المخلفات الطبية العامة',
    icon: Stethoscope,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    description: 'المخلفات الصحية والطبية العامة',
    wasteState: 'mixed',
    subcategories: [
      { name: 'النفايات المعدية', code: 'MD-01', hazardLevel: 'critical', wasteState: 'solid' },
      { name: 'الأدوات الحادة (إبر، مشارط)', code: 'MD-02', hazardLevel: 'critical', wasteState: 'solid' },
      { name: 'الأدوية منتهية الصلاحية', code: 'MD-03', hazardLevel: 'high', wasteState: 'mixed' },
      { name: 'المواد الكيميائية الصيدلانية', code: 'MD-04', hazardLevel: 'high', wasteState: 'liquid' },
      { name: 'النفايات التشريحية', code: 'MD-05', hazardLevel: 'critical', wasteState: 'solid' },
      { name: 'نفايات العلاج الكيميائي', code: 'MD-06', hazardLevel: 'critical', wasteState: 'liquid' },
      { name: 'النفايات المشعة الطبية', code: 'MD-07', hazardLevel: 'critical', wasteState: 'mixed' },
      { name: 'أكياس الدم ومشتقاته', code: 'MD-08', hazardLevel: 'high', wasteState: 'liquid' },
      { name: 'المستلزمات الطبية الملوثة', code: 'MD-09', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'نفايات غسيل الكلى', code: 'MD-10', hazardLevel: 'high', wasteState: 'liquid' },
      { name: 'قفازات طبية ملوثة', code: 'MD-11', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'أقنعة ومعدات وقاية شخصية', code: 'MD-12', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'عبوات أدوية فارغة', code: 'MD-13', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'نفايات مختبرات التحاليل', code: 'MD-14', hazardLevel: 'high', wasteState: 'mixed' },
      { name: 'نفايات الأسنان', code: 'MD-15', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'نفايات العيادات البيطرية', code: 'MD-16', hazardLevel: 'high', wasteState: 'mixed' },
      { name: 'أنابيب ومحاقن مستعملة', code: 'MD-17', hazardLevel: 'critical', wasteState: 'solid' },
      { name: 'ضمادات وقطن ملوث', code: 'MD-18', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'نفايات غرف العمليات', code: 'MD-19', hazardLevel: 'critical', wasteState: 'mixed' },
      { name: 'مخلفات التعقيم', code: 'MD-20', hazardLevel: 'medium', wasteState: 'liquid' },
    ],
  },
  {
    id: 'medical_infectious',
    name: 'المخلفات الطبية المعدية',
    icon: Stethoscope,
    color: 'text-red-700',
    bgColor: 'bg-red-200 dark:bg-red-900/40',
    description: 'المخلفات الطبية الملوثة بالعوامل المعدية',
    wasteState: 'mixed',
    subcategories: [
      { name: 'نفايات العزل الطبي', code: 'MI-01', hazardLevel: 'critical', wasteState: 'solid' },
      { name: 'مسحات وعينات مخبرية ملوثة', code: 'MI-02', hazardLevel: 'critical', wasteState: 'solid' },
      { name: 'أنابيب اختبار بكتيريولوجية', code: 'MI-03', hazardLevel: 'critical', wasteState: 'solid' },
      { name: 'مزارع ميكروبية', code: 'MI-04', hazardLevel: 'critical', wasteState: 'semi_solid' },
      { name: 'نفايات الأمراض المعدية', code: 'MI-05', hazardLevel: 'critical', wasteState: 'mixed' },
      { name: 'نفايات مرضى كورونا', code: 'MI-06', hazardLevel: 'critical', wasteState: 'solid' },
      { name: 'نفايات مرضى السل', code: 'MI-07', hazardLevel: 'critical', wasteState: 'solid' },
      { name: 'نفايات مرضى الإيدز', code: 'MI-08', hazardLevel: 'critical', wasteState: 'mixed' },
      { name: 'نفايات التهاب الكبد الوبائي', code: 'MI-09', hazardLevel: 'critical', wasteState: 'mixed' },
      { name: 'فلاتر HEPA ملوثة', code: 'MI-10', hazardLevel: 'critical', wasteState: 'solid' },
      { name: 'مخلفات غرف العناية المركزة المعدية', code: 'MI-11', hazardLevel: 'critical', wasteState: 'mixed' },
      { name: 'نفايات الحجر الصحي', code: 'MI-12', hazardLevel: 'critical', wasteState: 'solid' },
    ],
  },
  {
    id: 'medical_sharps',
    name: 'المخلفات الطبية الحادة',
    icon: AlertTriangle,
    color: 'text-rose-700',
    bgColor: 'bg-rose-200 dark:bg-rose-900/40',
    description: 'الأدوات الحادة القابلة للوخز والجرح',
    wasteState: 'solid',
    subcategories: [
      { name: 'إبر الحقن المستعملة', code: 'MS-01', hazardLevel: 'critical', wasteState: 'solid' },
      { name: 'مشارط جراحية', code: 'MS-02', hazardLevel: 'critical', wasteState: 'solid' },
      { name: 'شفرات حلاقة طبية', code: 'MS-03', hazardLevel: 'critical', wasteState: 'solid' },
      { name: 'إبر خياطة الجروح', code: 'MS-04', hazardLevel: 'critical', wasteState: 'solid' },
      { name: 'أنابيب شعرية زجاجية', code: 'MS-05', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'شرائح مجهرية مكسورة', code: 'MS-06', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'إبر سحب الدم', code: 'MS-07', hazardLevel: 'critical', wasteState: 'solid' },
      { name: 'قسطرات حادة', code: 'MS-08', hazardLevel: 'critical', wasteState: 'solid' },
      { name: 'أمبولات زجاجية مكسورة', code: 'MS-09', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'مسامير ودبابيس جراحية', code: 'MS-10', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'إبر الوخز بالإبر', code: 'MS-11', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'أدوات أسنان حادة', code: 'MS-12', hazardLevel: 'critical', wasteState: 'solid' },
    ],
  },
  {
    id: 'medical_pharmaceutical',
    name: 'المخلفات الصيدلانية',
    icon: Beaker,
    color: 'text-violet-700',
    bgColor: 'bg-violet-200 dark:bg-violet-900/40',
    description: 'الأدوية والمستحضرات الصيدلانية الخطرة',
    wasteState: 'mixed',
    subcategories: [
      { name: 'أدوية منتهية الصلاحية (صلبة)', code: 'MP-01', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'أدوية منتهية الصلاحية (سائلة)', code: 'MP-02', hazardLevel: 'high', wasteState: 'liquid' },
      { name: 'مخلفات العلاج الكيميائي السائلة', code: 'MP-03', hazardLevel: 'critical', wasteState: 'liquid' },
      { name: 'أدوية السرطان الملوثة', code: 'MP-04', hazardLevel: 'critical', wasteState: 'mixed' },
      { name: 'لقاحات منتهية الصلاحية', code: 'MP-05', hazardLevel: 'high', wasteState: 'liquid' },
      { name: 'أنسولين منتهي الصلاحية', code: 'MP-06', hazardLevel: 'high', wasteState: 'liquid' },
      { name: 'مخدرات ومواد مراقبة', code: 'MP-07', hazardLevel: 'critical', wasteState: 'mixed' },
      { name: 'مضادات حيوية ملوثة', code: 'MP-08', hazardLevel: 'high', wasteState: 'mixed' },
      { name: 'كريمات ومراهم منتهية', code: 'MP-09', hazardLevel: 'medium', wasteState: 'semi_solid' },
      { name: 'قطرات ومحاليل عينية', code: 'MP-10', hazardLevel: 'medium', wasteState: 'liquid' },
      { name: 'بخاخات صيدلانية', code: 'MP-11', hazardLevel: 'high', wasteState: 'gas' },
      { name: 'تحاميل ولبوسات', code: 'MP-12', hazardLevel: 'medium', wasteState: 'solid' },
    ],
  },
  {
    id: 'medical_radioactive',
    name: 'المخلفات الطبية المشعة',
    icon: Skull,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-200 dark:bg-yellow-900/40',
    description: 'المواد المشعة المستخدمة في التشخيص والعلاج',
    wasteState: 'mixed',
    subcategories: [
      { name: 'نظائر مشعة تشخيصية', code: 'MR-01', hazardLevel: 'critical', wasteState: 'liquid' },
      { name: 'مصادر العلاج الإشعاعي', code: 'MR-02', hazardLevel: 'critical', wasteState: 'solid' },
      { name: 'نفايات اليود المشع', code: 'MR-03', hazardLevel: 'critical', wasteState: 'liquid' },
      { name: 'تكنيشيوم-99m', code: 'MR-04', hazardLevel: 'critical', wasteState: 'liquid' },
      { name: 'حاويات مواد مشعة', code: 'MR-05', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'محاقن وأدوات ملوثة إشعاعياً', code: 'MR-06', hazardLevel: 'critical', wasteState: 'solid' },
      { name: 'قفازات وملابس ملوثة إشعاعياً', code: 'MR-07', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'سوائل جسم مريض مشع', code: 'MR-08', hazardLevel: 'critical', wasteState: 'liquid' },
      { name: 'فلاتر تنقية هواء مشعة', code: 'MR-09', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'كاشفات إشعاعية مستعملة', code: 'MR-10', hazardLevel: 'medium', wasteState: 'solid' },
    ],
  },
  {
    id: 'industrial',
    name: 'المخلفات الصناعية الخطرة',
    icon: AlertTriangle,
    color: 'text-rose-600',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30',
    description: 'مخلفات العمليات الصناعية الخطرة',
    wasteState: 'mixed',
    subcategories: [
      { name: 'براميل صناعية ملوثة', code: 'IN-01', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'حمأة صناعية سامة', code: 'IN-02', hazardLevel: 'critical', wasteState: 'semi_solid' },
      { name: 'مخلفات الدباغة', code: 'IN-03', hazardLevel: 'high', wasteState: 'liquid' },
      { name: 'رماد أفران صناعية', code: 'IN-04', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'مخلفات صناعة البتروكيماويات', code: 'IN-05', hazardLevel: 'critical', wasteState: 'liquid' },
      { name: 'مخلفات الطلاء الكهربائي', code: 'IN-06', hazardLevel: 'high', wasteState: 'liquid' },
      { name: 'حمأة معالجة المياه الصناعية', code: 'IN-07', hazardLevel: 'high', wasteState: 'semi_solid' },
      { name: 'مخلفات صناعة النسيج الملوثة', code: 'IN-08', hazardLevel: 'medium', wasteState: 'liquid' },
      { name: 'فلاتر صناعية ملوثة', code: 'IN-09', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'مخلفات اللحام والقطع', code: 'IN-10', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'خبث المعادن الثقيلة', code: 'IN-11', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'مخلفات التصنيع الغذائي الملوثة', code: 'IN-12', hazardLevel: 'medium', wasteState: 'semi_solid' },
      { name: 'إطارات مستعملة ملوثة', code: 'IN-13', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'مخلفات الأسبستوس', code: 'IN-14', hazardLevel: 'critical', wasteState: 'solid' },
      { name: 'مخلفات صناعة الأسمنت', code: 'IN-15', hazardLevel: 'medium', wasteState: 'solid' },
    ],
  },
  {
    id: 'liquid_hazardous',
    name: 'المخلفات السائلة الخطرة',
    icon: Droplets,
    color: 'text-blue-700',
    bgColor: 'bg-blue-200 dark:bg-blue-900/40',
    description: 'المخلفات السائلة الخطرة والملوثة',
    wasteState: 'liquid',
    subcategories: [
      { name: 'مياه صرف صناعي ملوثة', code: 'LH-01', hazardLevel: 'high', wasteState: 'liquid' },
      { name: 'زيوت محركات مستعملة', code: 'LH-02', hazardLevel: 'medium', wasteState: 'liquid' },
      { name: 'زيوت قطع معدنية', code: 'LH-03', hazardLevel: 'medium', wasteState: 'liquid' },
      { name: 'سوائل تبريد ملوثة', code: 'LH-04', hazardLevel: 'high', wasteState: 'liquid' },
      { name: 'مذيبات صناعية مستعملة', code: 'LH-05', hazardLevel: 'high', wasteState: 'liquid' },
      { name: 'أحماض مركزة مستعملة', code: 'LH-06', hazardLevel: 'critical', wasteState: 'liquid' },
      { name: 'قلويات مركزة مستعملة', code: 'LH-07', hazardLevel: 'critical', wasteState: 'liquid' },
      { name: 'ماء غسيل خزانات كيميائية', code: 'LH-08', hazardLevel: 'high', wasteState: 'liquid' },
      { name: 'سوائل إطفاء حريق', code: 'LH-09', hazardLevel: 'medium', wasteState: 'liquid' },
      { name: 'مياه غسيل معدات طبية', code: 'LH-10', hazardLevel: 'high', wasteState: 'liquid' },
      { name: 'سوائل تنظيف صناعية ملوثة', code: 'LH-11', hazardLevel: 'medium', wasteState: 'liquid' },
      { name: 'زيوت محولات كهربائية (PCB)', code: 'LH-12', hazardLevel: 'critical', wasteState: 'liquid' },
      { name: 'سوائل هيدروليكية مستعملة', code: 'LH-13', hazardLevel: 'medium', wasteState: 'liquid' },
      { name: 'وقود ديزل ملوث', code: 'LH-14', hazardLevel: 'high', wasteState: 'liquid' },
      { name: 'بنزين ملوث أو منتهي', code: 'LH-15', hazardLevel: 'high', wasteState: 'liquid' },
    ],
  },
];

// Non-hazardous waste categories
const nonHazardousWasteCategories = [
  {
    id: 'plastic',
    name: 'المخلفات البلاستيكية',
    icon: Package,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    description: 'جميع أنواع البلاستيك القابلة لإعادة التدوير',
    subcategories: [
      { name: 'PET (زجاجات المياه)', code: 'PL-01', recyclable: true },
      { name: 'HDPE (عبوات الحليب)', code: 'PL-02', recyclable: true },
      { name: 'PVC (أنابيب)', code: 'PL-03', recyclable: true },
      { name: 'LDPE (أكياس بلاستيكية)', code: 'PL-04', recyclable: true },
      { name: 'PP (علب الطعام)', code: 'PL-05', recyclable: true },
      { name: 'PS (الستايروفوم)', code: 'PL-06', recyclable: false },
      { name: 'البلاستيك المختلط', code: 'PL-07', recyclable: false },
      { name: 'الأغشية البلاستيكية', code: 'PL-08', recyclable: true },
      { name: 'براميل بلاستيكية نظيفة', code: 'PL-09', recyclable: true },
      { name: 'حاويات بلاستيكية صناعية', code: 'PL-10', recyclable: true },
      { name: 'خراطيم بلاستيكية', code: 'PL-11', recyclable: true },
      { name: 'شرائح وألواح بلاستيكية', code: 'PL-12', recyclable: true },
      { name: 'قطع غيار بلاستيكية', code: 'PL-13', recyclable: true },
      { name: 'عبوات مستحضرات التجميل', code: 'PL-14', recyclable: true },
      { name: 'صناديق بلاستيكية', code: 'PL-15', recyclable: true },
      { name: 'ألعاب بلاستيكية', code: 'PL-16', recyclable: true },
      { name: 'أثاث بلاستيكي', code: 'PL-17', recyclable: true },
      { name: 'مواسير ري بلاستيكية', code: 'PL-18', recyclable: true },
    ],
  },
  {
    id: 'paper',
    name: 'المخلفات الورقية',
    icon: FileText,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    description: 'الورق والكرتون بجميع أشكاله',
    subcategories: [
      { name: 'الورق المكتبي الأبيض', code: 'PA-01', recyclable: true },
      { name: 'الصحف والمجلات', code: 'PA-02', recyclable: true },
      { name: 'الكرتون المموج', code: 'PA-03', recyclable: true },
      { name: 'الكرتون المضغوط', code: 'PA-04', recyclable: true },
      { name: 'أكياس الورق', code: 'PA-05', recyclable: true },
      { name: 'ورق التغليف', code: 'PA-06', recyclable: true },
      { name: 'المناديل الورقية المستعملة', code: 'PA-07', recyclable: false },
      { name: 'الورق المشمع أو المغلف', code: 'PA-08', recyclable: false },
      { name: 'كراتين شحن', code: 'PA-09', recyclable: true },
      { name: 'ورق طباعة ملون', code: 'PA-10', recyclable: true },
      { name: 'دفاتر وكتب قديمة', code: 'PA-11', recyclable: true },
      { name: 'أنابيب ورقية (كور)', code: 'PA-12', recyclable: true },
      { name: 'علب كرتونية للأغذية', code: 'PA-13', recyclable: true },
      { name: 'ورق مقوى', code: 'PA-14', recyclable: true },
      { name: 'أظرف وملفات ورقية', code: 'PA-15', recyclable: true },
    ],
  },
  {
    id: 'metal',
    name: 'المخلفات المعدنية',
    icon: Recycle,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100 dark:bg-slate-900/30',
    description: 'المعادن الحديدية وغير الحديدية',
    subcategories: [
      { name: 'الألومنيوم (علب المشروبات)', code: 'MT-01', recyclable: true },
      { name: 'الحديد والصلب', code: 'MT-02', recyclable: true },
      { name: 'النحاس', code: 'MT-03', recyclable: true },
      { name: 'الرصاص', code: 'MT-04', recyclable: true },
      { name: 'الزنك', code: 'MT-05', recyclable: true },
      { name: 'الستانلس ستيل', code: 'MT-06', recyclable: true },
      { name: 'البرونز والنحاس الأصفر', code: 'MT-07', recyclable: true },
      { name: 'الخردة المعدنية المختلطة', code: 'MT-08', recyclable: true },
      { name: 'براميل معدنية نظيفة', code: 'MT-09', recyclable: true },
      { name: 'صفائح وألواح معدنية', code: 'MT-10', recyclable: true },
      { name: 'أسلاك معدنية', code: 'MT-11', recyclable: true },
      { name: 'أنابيب حديدية', code: 'MT-12', recyclable: true },
      { name: 'هياكل معدنية', code: 'MT-13', recyclable: true },
      { name: 'معدات صناعية مستعملة', code: 'MT-14', recyclable: true },
      { name: 'قطع غيار معدنية', code: 'MT-15', recyclable: true },
      { name: 'علب معدنية للأغذية', code: 'MT-16', recyclable: true },
      { name: 'رقائق الألومنيوم', code: 'MT-17', recyclable: true },
      { name: 'أسقف معدنية (صاج)', code: 'MT-18', recyclable: true },
      { name: 'سياج معدني', code: 'MT-19', recyclable: true },
      { name: 'خزانات معدنية', code: 'MT-20', recyclable: true },
    ],
  },
  {
    id: 'glass',
    name: 'المخلفات الزجاجية',
    icon: Droplets,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    description: 'الزجاج بجميع ألوانه وأشكاله',
    subcategories: [
      { name: 'الزجاج الشفاف', code: 'GL-01', recyclable: true },
      { name: 'الزجاج البني', code: 'GL-02', recyclable: true },
      { name: 'الزجاج الأخضر', code: 'GL-03', recyclable: true },
      { name: 'زجاج النوافذ', code: 'GL-04', recyclable: true },
      { name: 'المرايا', code: 'GL-05', recyclable: false },
      { name: 'الزجاج المقوى', code: 'GL-06', recyclable: false },
      { name: 'الأواني الزجاجية', code: 'GL-07', recyclable: true },
      { name: 'زجاجات عطور ومستحضرات', code: 'GL-08', recyclable: true },
      { name: 'زجاج سيارات', code: 'GL-09', recyclable: false },
      { name: 'كسر زجاج مختلط', code: 'GL-10', recyclable: true },
      { name: 'زجاج مختبرات نظيف', code: 'GL-11', recyclable: true },
      { name: 'واجهات زجاجية', code: 'GL-12', recyclable: true },
    ],
  },
  {
    id: 'organic',
    name: 'المخلفات العضوية',
    icon: Leaf,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    description: 'المخلفات الغذائية والنباتية',
    subcategories: [
      { name: 'بقايا الطعام', code: 'OR-01', recyclable: true },
      { name: 'قشور الفواكه والخضروات', code: 'OR-02', recyclable: true },
      { name: 'مخلفات الحدائق', code: 'OR-03', recyclable: true },
      { name: 'الأخشاب غير المعالجة', code: 'OR-04', recyclable: true },
      { name: 'القش والتبن', code: 'OR-05', recyclable: true },
      { name: 'روث الحيوانات', code: 'OR-06', recyclable: true },
      { name: 'المخلفات الزراعية', code: 'OR-07', recyclable: true },
      { name: 'أوراق الأشجار الجافة', code: 'OR-08', recyclable: true },
      { name: 'مخلفات المطاعم', code: 'OR-09', recyclable: true },
      { name: 'مخلفات المخابز', code: 'OR-10', recyclable: true },
      { name: 'مخلفات مصانع الأغذية', code: 'OR-11', recyclable: true },
      { name: 'فواكه وخضروات تالفة', code: 'OR-12', recyclable: true },
      { name: 'مخلفات مزارع الدواجن', code: 'OR-13', recyclable: true },
      { name: 'مخلفات مزارع الأسماك', code: 'OR-14', recyclable: true },
      { name: 'زيوت طبخ مستعملة', code: 'OR-15', recyclable: true },
    ],
  },
  {
    id: 'wood',
    name: 'مخلفات الأخشاب',
    icon: Trash2,
    color: 'text-amber-800',
    bgColor: 'bg-amber-50 dark:bg-amber-900/30',
    description: 'الأخشاب بجميع أنواعها وأشكالها',
    subcategories: [
      { name: 'ألواح خشب طبيعي', code: 'WD-01', recyclable: true },
      { name: 'خشب MDF', code: 'WD-02', recyclable: false },
      { name: 'خشب HDF', code: 'WD-03', recyclable: false },
      { name: 'خشب كونتر', code: 'WD-04', recyclable: true },
      { name: 'خشب أبلكاش', code: 'WD-05', recyclable: true },
      { name: 'بالتات خشبية', code: 'WD-06', recyclable: true },
      { name: 'صناديق خشبية', code: 'WD-07', recyclable: true },
      { name: 'أثاث خشبي مستعمل', code: 'WD-08', recyclable: true },
      { name: 'أبواب خشبية', code: 'WD-09', recyclable: true },
      { name: 'نوافذ خشبية', code: 'WD-10', recyclable: true },
      { name: 'خشب بناء (شدات)', code: 'WD-11', recyclable: true },
      { name: 'نشارة خشب', code: 'WD-12', recyclable: true },
      { name: 'رقائق خشب', code: 'WD-13', recyclable: true },
      { name: 'جذوع وأغصان أشجار', code: 'WD-14', recyclable: true },
      { name: 'خشب معالج بالضغط', code: 'WD-15', recyclable: false },
      { name: 'خشب مدهون أو ملمع', code: 'WD-16', recyclable: false },
      { name: 'ألواح OSB', code: 'WD-17', recyclable: false },
      { name: 'خشب الباركيه', code: 'WD-18', recyclable: true },
    ],
  },
  {
    id: 'drums',
    name: 'مخلفات البراميل والحاويات',
    icon: Package,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    description: 'البراميل والحاويات النظيفة القابلة لإعادة الاستخدام',
    subcategories: [
      { name: 'براميل حديد 200 لتر نظيفة', code: 'DR-01', recyclable: true },
      { name: 'براميل حديد 60 لتر نظيفة', code: 'DR-02', recyclable: true },
      { name: 'براميل بلاستيك 200 لتر نظيفة', code: 'DR-03', recyclable: true },
      { name: 'براميل بلاستيك 60 لتر نظيفة', code: 'DR-04', recyclable: true },
      { name: 'حاويات IBC (1000 لتر)', code: 'DR-05', recyclable: true },
      { name: 'جراكن بلاستيكية', code: 'DR-06', recyclable: true },
      { name: 'دلاء صناعية', code: 'DR-07', recyclable: true },
      { name: 'صهاريج صغيرة', code: 'DR-08', recyclable: true },
      { name: 'براميل فايبر جلاس', code: 'DR-09', recyclable: false },
      { name: 'براميل كرتونية', code: 'DR-10', recyclable: true },
      { name: 'براميل ستانلس ستيل', code: 'DR-11', recyclable: true },
      { name: 'أغطية براميل', code: 'DR-12', recyclable: true },
    ],
  },
  {
    id: 'construction',
    name: 'مخلفات البناء والهدم',
    icon: Building2,
    color: 'text-stone-600',
    bgColor: 'bg-stone-100 dark:bg-stone-900/30',
    description: 'مخلفات أعمال البناء والتشييد',
    subcategories: [
      { name: 'الخرسانة والأسمنت', code: 'CN-01', recyclable: true },
      { name: 'الطوب والبلاط', code: 'CN-02', recyclable: true },
      { name: 'الأخشاب المعالجة', code: 'CN-03', recyclable: false },
      { name: 'الجبس', code: 'CN-04', recyclable: true },
      { name: 'الأسفلت', code: 'CN-05', recyclable: true },
      { name: 'مخلفات الحفر والتسوية', code: 'CN-06', recyclable: true },
      { name: 'مواد العزل', code: 'CN-07', recyclable: false },
      { name: 'أنقاض الهدم المختلطة', code: 'CN-08', recyclable: false },
      { name: 'رمل ناعم', code: 'CN-09', recyclable: true },
      { name: 'حصى وبحص', code: 'CN-10', recyclable: true },
      { name: 'سيراميك مكسور', code: 'CN-11', recyclable: true },
      { name: 'رخام مكسور', code: 'CN-12', recyclable: true },
      { name: 'جرانيت مكسور', code: 'CN-13', recyclable: true },
      { name: 'أنابيب PVC للبناء', code: 'CN-14', recyclable: true },
      { name: 'أسلاك تسليح', code: 'CN-15', recyclable: true },
      { name: 'بلوك خرساني', code: 'CN-16', recyclable: true },
      { name: 'طوب أحمر', code: 'CN-17', recyclable: true },
      { name: 'مخلفات الترميم', code: 'CN-18', recyclable: false },
    ],
  },
  {
    id: 'textile',
    name: 'مخلفات المنسوجات',
    icon: Package,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    description: 'الأقمشة والملابس والمنسوجات',
    subcategories: [
      { name: 'ملابس مستعملة', code: 'TX-01', recyclable: true },
      { name: 'أقمشة قطنية', code: 'TX-02', recyclable: true },
      { name: 'أقمشة صناعية (بوليستر)', code: 'TX-03', recyclable: true },
      { name: 'مخلفات مصانع النسيج', code: 'TX-04', recyclable: true },
      { name: 'سجاد وموكيت', code: 'TX-05', recyclable: false },
      { name: 'ستائر ومفروشات', code: 'TX-06', recyclable: true },
      { name: 'أحذية وجلود صناعية', code: 'TX-07', recyclable: false },
      { name: 'حقائب قماشية', code: 'TX-08', recyclable: true },
      { name: 'مناشف وملايات', code: 'TX-09', recyclable: true },
      { name: 'خيوط وحبال', code: 'TX-10', recyclable: true },
      { name: 'قصاصات قماش', code: 'TX-11', recyclable: true },
      { name: 'أقمشة جينز', code: 'TX-12', recyclable: true },
    ],
  },
  {
    id: 'rubber',
    name: 'مخلفات المطاط',
    icon: Package,
    color: 'text-gray-700',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    description: 'المطاط والإطارات',
    subcategories: [
      { name: 'إطارات سيارات صغيرة', code: 'RB-01', recyclable: true },
      { name: 'إطارات شاحنات', code: 'RB-02', recyclable: true },
      { name: 'إطارات دراجات', code: 'RB-03', recyclable: true },
      { name: 'خراطيم مطاطية', code: 'RB-04', recyclable: true },
      { name: 'سيور ناقلة مطاطية', code: 'RB-05', recyclable: true },
      { name: 'حشوات مطاطية', code: 'RB-06', recyclable: true },
      { name: 'أرضيات مطاطية', code: 'RB-07', recyclable: true },
      { name: 'قفازات مطاطية صناعية', code: 'RB-08', recyclable: true },
      { name: 'فتات المطاط', code: 'RB-09', recyclable: true },
      { name: 'مطاط سيليكون', code: 'RB-10', recyclable: false },
    ],
  },
  {
    id: 'other',
    name: 'مخلفات أخرى',
    icon: Trash2,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    description: 'مخلفات متنوعة غير مصنفة',
    subcategories: [
      { name: 'مخلفات مختلطة', code: 'OT-01', recyclable: false },
      { name: 'مخلفات تنظيف الشوارع', code: 'OT-02', recyclable: false },
      { name: 'رماد منزلي', code: 'OT-03', recyclable: false },
      { name: 'مخلفات الأسواق', code: 'OT-04', recyclable: false },
      { name: 'مخلفات المناسبات', code: 'OT-05', recyclable: false },
      { name: 'ألعاب مستعملة (غير بلاستيكية)', code: 'OT-06', recyclable: false },
      { name: 'أدوات منزلية مستعملة', code: 'OT-07', recyclable: false },
      { name: 'مخلفات تغليف مختلطة', code: 'OT-08', recyclable: false },
    ],
  },
];

const hazardLevelConfig: Record<string, { label: string; color: string; icon: typeof AlertTriangle }> = {
  low: { label: 'منخفض', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: ShieldCheck },
  medium: { label: 'متوسط', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: ShieldAlert },
  high: { label: 'عالي', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300', icon: AlertTriangle },
  critical: { label: 'حرج', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: Skull },
};

// Waste state configuration
const wasteStateConfig: Record<string, { label: string; color: string; icon: string }> = {
  solid: { label: 'صلبة', color: 'bg-stone-100 text-stone-800 dark:bg-stone-900/30 dark:text-stone-300', icon: '🧱' },
  liquid: { label: 'سائلة', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: '💧' },
  semi_solid: { label: 'شبه صلبة', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', icon: '🫗' },
  gas: { label: 'غازية', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300', icon: '💨' },
  mixed: { label: 'مختلطة', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300', icon: '🔄' },
};

const parentCategoryOptions = {
  hazardous: [
    { id: 'chemical', name: 'المخلفات الكيميائية', prefix: 'CH' },
    { id: 'electronic', name: 'المخلفات الإلكترونية', prefix: 'EL' },
    { id: 'medical', name: 'المخلفات الطبية العامة', prefix: 'MD' },
    { id: 'medical_infectious', name: 'المخلفات الطبية المعدية', prefix: 'MI' },
    { id: 'medical_sharps', name: 'المخلفات الطبية الحادة', prefix: 'MS' },
    { id: 'medical_pharmaceutical', name: 'المخلفات الصيدلانية', prefix: 'MP' },
    { id: 'medical_radioactive', name: 'المخلفات الطبية المشعة', prefix: 'MR' },
    { id: 'industrial', name: 'المخلفات الصناعية الخطرة', prefix: 'IN' },
    { id: 'liquid_hazardous', name: 'المخلفات السائلة الخطرة', prefix: 'LH' },
  ],
  'non-hazardous': [
    { id: 'plastic', name: 'المخلفات البلاستيكية', prefix: 'PL' },
    { id: 'paper', name: 'المخلفات الورقية', prefix: 'PA' },
    { id: 'metal', name: 'المخلفات المعدنية', prefix: 'MT' },
    { id: 'glass', name: 'المخلفات الزجاجية', prefix: 'GL' },
    { id: 'organic', name: 'المخلفات العضوية', prefix: 'OR' },
    { id: 'wood', name: 'مخلفات الأخشاب', prefix: 'WD' },
    { id: 'drums', name: 'مخلفات البراميل والحاويات', prefix: 'DR' },
    { id: 'construction', name: 'مخلفات البناء والهدم', prefix: 'CN' },
    { id: 'textile', name: 'مخلفات المنسوجات', prefix: 'TX' },
    { id: 'rubber', name: 'مخلفات المطاط', prefix: 'RB' },
    { id: 'other', name: 'مخلفات أخرى', prefix: 'OT' },
  ],
};

// Function to generate unique code based on category
const generateUniqueCode = (
  parentCategory: string, 
  category: 'hazardous' | 'non-hazardous',
  existingCodes: string[]
): string => {
  const allOptions = [...parentCategoryOptions.hazardous, ...parentCategoryOptions['non-hazardous']];
  const categoryOption = allOptions.find(opt => opt.id === parentCategory);
  const prefix = categoryOption?.prefix || 'CU'; // CU for Custom
  
  // Find the highest existing number for this prefix
  const existingNumbers = existingCodes
    .filter(code => code.startsWith(prefix + '-'))
    .map(code => {
      const num = parseInt(code.split('-')[1], 10);
      return isNaN(num) ? 0 : num;
    });
  
  const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 11; // Start from 11 for custom types
  return `${prefix}-${nextNumber.toString().padStart(2, '0')}`;
};

const WasteTypesClassification = () => {
  const { customWasteTypes, addCustomWasteType, removeCustomWasteType, getCustomHazardousTypes, getCustomNonHazardousTypes } = useCustomWasteTypes();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newWasteType, setNewWasteType] = useState({
    name: '',
    category: 'hazardous' as 'hazardous' | 'non-hazardous',
    parentCategory: '',
    hazardLevel: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    recyclable: true,
  });
  
  // Get all existing codes for validation
  const getAllExistingCodes = () => [
    ...hazardousWasteCategories.flatMap(c => c.subcategories.map(s => s.code)),
    ...nonHazardousWasteCategories.flatMap(c => c.subcategories.map(s => s.code)),
    ...customWasteTypes.map(c => c.code),
  ];

  const handleAddWasteType = () => {
    if (!newWasteType.name.trim() || !newWasteType.parentCategory) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    // Generate unique code automatically
    const existingCodes = getAllExistingCodes();
    const generatedCode = generateUniqueCode(
      newWasteType.parentCategory, 
      newWasteType.category,
      existingCodes
    );

    addCustomWasteType({
      name: newWasteType.name.trim(),
      code: generatedCode,
      category: newWasteType.category,
      parentCategory: newWasteType.parentCategory,
      hazardLevel: newWasteType.category === 'hazardous' ? newWasteType.hazardLevel : undefined,
      recyclable: newWasteType.category === 'non-hazardous' ? newWasteType.recyclable : undefined,
    });

    toast.success(`تمت إضافة نوع المخلف بنجاح بالكود: ${generatedCode}`);
    setIsAddDialogOpen(false);
    setNewWasteType({
      name: '',
      category: 'hazardous',
      parentCategory: '',
      hazardLevel: 'medium',
      recyclable: true,
    });
  };

  const handleRemoveCustomType = (id: string, name: string) => {
    removeCustomWasteType(id);
    toast.success(`تم حذف "${name}" بنجاح`);
  };

  const customHazardous = getCustomHazardousTypes();
  const customNonHazardous = getCustomNonHazardousTypes();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-2xl font-bold text-foreground">تصنيف أنواع المخلفات</h1>
              <p className="text-muted-foreground">التصنيف البيئي للمخلفات وفقاً لمعايير وزارة البيئة</p>
            </div>
          </div>
          
          {/* Add Custom Type Button */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                إضافة نوع مخلف
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>إضافة نوع مخلف مخصص</DialogTitle>
                <DialogDescription>
                  أضف نوع مخلف جديد وسيتم توليد الكود البيئي تلقائياً وإضافته لخيارات إنشاء الشحنات
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="waste-name">اسم نوع المخلف *</Label>
                  <Input
                    id="waste-name"
                    placeholder="مثال: نفايات المنسوجات الصناعية"
                    value={newWasteType.name}
                    onChange={(e) => setNewWasteType(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="p-3 bg-muted/50 rounded-lg border border-dashed">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Info className="w-4 h-4" />
                    <span>سيتم توليد الكود البيئي تلقائياً بناءً على الفئة المختارة</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>التصنيف الرئيسي *</Label>
                  <Select
                    value={newWasteType.category}
                    onValueChange={(value: 'hazardous' | 'non-hazardous') => 
                      setNewWasteType(prev => ({ ...prev, category: value, parentCategory: '' }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hazardous">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          مخلفات خطرة
                        </div>
                      </SelectItem>
                      <SelectItem value="non-hazardous">
                        <div className="flex items-center gap-2">
                          <Leaf className="w-4 h-4 text-green-600" />
                          مخلفات غير خطرة
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>الفئة الفرعية *</Label>
                  <Select
                    value={newWasteType.parentCategory}
                    onValueChange={(value) => setNewWasteType(prev => ({ ...prev, parentCategory: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      {parentCategoryOptions[newWasteType.category].map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {newWasteType.category === 'hazardous' && (
                  <div className="space-y-2">
                    <Label>مستوى الخطورة</Label>
                    <Select
                      value={newWasteType.hazardLevel}
                      onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => 
                        setNewWasteType(prev => ({ ...prev, hazardLevel: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">منخفض</SelectItem>
                        <SelectItem value="medium">متوسط</SelectItem>
                        <SelectItem value="high">عالي</SelectItem>
                        <SelectItem value="critical">حرج</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {newWasteType.category === 'non-hazardous' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="recyclable"
                      checked={newWasteType.recyclable}
                      onChange={(e) => setNewWasteType(prev => ({ ...prev, recyclable: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="recyclable" className="cursor-pointer">قابل لإعادة التدوير</Label>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleAddWasteType}>
                  إضافة
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Info Banner */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-primary">دليل تصنيف المخلفات</p>
                <p className="text-sm text-muted-foreground mt-1">
                  هذا التصنيف معتمد وفقاً للوائح التنفيذية لنظام إدارة النفايات الصادرة عن وزارة البيئة والمياه والزراعة.
                  يتم تصنيف المخلفات إلى فئتين رئيسيتين: المخلفات الخطرة والمخلفات غير الخطرة، مع تحديد مستوى الخطورة وإمكانية إعادة التدوير.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{hazardousWasteCategories.length}</p>
                  <p className="text-sm text-muted-foreground">فئات خطرة</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Leaf className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{nonHazardousWasteCategories.length}</p>
                  <p className="text-sm text-muted-foreground">فئات غير خطرة</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <Skull className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {hazardousWasteCategories.reduce((sum, cat) => sum + cat.subcategories.length, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">نوع مخلف خطر</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Recycle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {nonHazardousWasteCategories.reduce((sum, cat) => sum + cat.subcategories.length, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">نوع قابل للتدوير</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Star className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{customWasteTypes.length}</p>
                  <p className="text-sm text-muted-foreground">أنواع مخصصة</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Custom Waste Types Section */}
        {customWasteTypes.length > 0 && (
          <Card className="border-primary/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                <CardTitle>أنواع المخلفات المخصصة</CardTitle>
              </div>
              <CardDescription>الأنواع التي تمت إضافتها يدوياً وستظهر في خيارات إنشاء الشحنات</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {customWasteTypes.map((wasteType) => {
                  const hazardConfig = wasteType.hazardLevel ? hazardLevelConfig[wasteType.hazardLevel] : null;
                  return (
                    <div
                      key={wasteType.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-muted-foreground bg-background px-1.5 py-0.5 rounded border">
                          {wasteType.code}
                        </span>
                        <div>
                          <span className="text-sm font-medium">{wasteType.name}</span>
                          <div className="flex items-center gap-1 mt-1">
                            {wasteType.category === 'hazardous' ? (
                              <Badge variant="destructive" className="text-xs">خطر</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">غير خطر</Badge>
                            )}
                            {hazardConfig && (
                              <Badge className={`text-xs ${hazardConfig.color}`}>
                                {hazardConfig.label}
                              </Badge>
                            )}
                            {wasteType.recyclable !== undefined && (
                              wasteType.recyclable ? (
                                <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                  <CheckCircle className="w-3 h-3 ml-1" />
                                  قابل
                                </Badge>
                              ) : (
                                <Badge className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
                                  <XCircle className="w-3 h-3 ml-1" />
                                  غير قابل
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveCustomType(wasteType.id, wasteType.name)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="hazardous" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="hazardous" className="gap-2">
              <AlertTriangle className="w-4 h-4" />
              المخلفات الخطرة
            </TabsTrigger>
            <TabsTrigger value="non-hazardous" className="gap-2">
              <Leaf className="w-4 h-4" />
              المخلفات غير الخطرة
            </TabsTrigger>
          </TabsList>

          {/* Hazardous Waste Tab */}
          <TabsContent value="hazardous" className="mt-6">
            <div className="space-y-6">
              {/* Warning */}
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
                <Skull className="w-5 h-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">تحذير: مخلفات خطرة</p>
                  <p className="text-sm text-muted-foreground">
                    تتطلب هذه المخلفات معالجة خاصة ونقل آمن وفقاً للوائح البيئية. يُحظر التخلص منها مع النفايات العادية.
                  </p>
                </div>
              </div>

              {/* Hazard Level Legend */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">مستويات الخطورة وحالات المخلف</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">مستويات الخطورة:</p>
                      <div className="flex flex-wrap gap-3">
                        {Object.entries(hazardLevelConfig).map(([key, config]) => (
                          <div key={key} className="flex items-center gap-2">
                            <Badge className={config.color}>
                              <config.icon className="w-3 h-3 ml-1" />
                              {config.label}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">حالة المخلف:</p>
                      <div className="flex flex-wrap gap-3">
                        {Object.entries(wasteStateConfig).map(([key, config]) => (
                          <div key={key} className="flex items-center gap-2">
                            <Badge className={config.color}>
                              <span className="ml-1">{config.icon}</span>
                              {config.label}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Categories */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {hazardousWasteCategories.map((category) => {
                  const categoryCustomTypes = customHazardous.filter(c => c.parentCategory === category.id);
                  return (
                    <Card key={category.id} className="border-destructive/20">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${category.bgColor}`}>
                            <category.icon className={`w-5 h-5 ${category.color}`} />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{category.name}</CardTitle>
                            <CardDescription>{category.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-64">
                          <div className="space-y-2">
                            {category.subcategories.map((sub) => {
                              const hazardConfig = hazardLevelConfig[sub.hazardLevel];
                              const stateConfig = sub.wasteState ? wasteStateConfig[sub.wasteState] : wasteStateConfig.solid;
                              return (
                                <div
                                  key={sub.code}
                                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-muted-foreground bg-background px-1.5 py-0.5 rounded">
                                      {sub.code}
                                    </span>
                                    <span className="text-sm">{sub.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Badge className={`text-xs ${stateConfig.color}`} title={`الحالة: ${stateConfig.label}`}>
                                      {stateConfig.icon}
                                    </Badge>
                                    <Badge className={`text-xs ${hazardConfig.color}`}>
                                      {hazardConfig.label}
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })}
                            {/* Custom types for this category */}
                            {categoryCustomTypes.map((customType) => {
                              const hazardConfig = customType.hazardLevel ? hazardLevelConfig[customType.hazardLevel] : hazardLevelConfig.medium;
                              return (
                                <div
                                  key={customType.id}
                                  className="flex items-center justify-between p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors border border-primary/20"
                                >
                                  <div className="flex items-center gap-2">
                                    <Star className="w-3 h-3 text-primary" />
                                    <span className="text-xs font-mono text-muted-foreground bg-background px-1.5 py-0.5 rounded">
                                      {customType.code}
                                    </span>
                                    <span className="text-sm">{customType.name}</span>
                                  </div>
                                  <Badge className={`text-xs ${hazardConfig.color}`}>
                                    {hazardConfig.label}
                                  </Badge>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* Non-Hazardous Waste Tab */}
          <TabsContent value="non-hazardous" className="mt-6">
            <div className="space-y-6">
              {/* Info */}
              <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
                <Recycle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-300">مخلفات قابلة للتدوير</p>
                  <p className="text-sm text-muted-foreground">
                    معظم هذه المخلفات قابلة لإعادة التدوير أو إعادة الاستخدام. يُنصح بفرزها من المصدر لتحقيق أعلى قيمة استرداد.
                  </p>
                </div>
              </div>

              {/* Recyclability Legend */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">إمكانية إعادة التدوير</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        <CheckCircle className="w-3 h-3 ml-1" />
                        قابل للتدوير
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
                        <XCircle className="w-3 h-3 ml-1" />
                        غير قابل للتدوير
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nonHazardousWasteCategories.map((category) => {
                  const categoryCustomTypes = customNonHazardous.filter(c => c.parentCategory === category.id);
                  return (
                    <Card key={category.id}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${category.bgColor}`}>
                            <category.icon className={`w-5 h-5 ${category.color}`} />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{category.name}</CardTitle>
                            <CardDescription>{category.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-52">
                          <div className="space-y-2">
                            {category.subcategories.map((sub) => (
                              <div
                                key={sub.code}
                                className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono text-muted-foreground bg-background px-1.5 py-0.5 rounded">
                                    {sub.code}
                                  </span>
                                  <span className="text-sm">{sub.name}</span>
                                </div>
                                {sub.recyclable ? (
                                  <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                    <CheckCircle className="w-3 h-3 ml-1" />
                                    قابل
                                  </Badge>
                                ) : (
                                  <Badge className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
                                    <XCircle className="w-3 h-3 ml-1" />
                                    غير قابل
                                  </Badge>
                                )}
                              </div>
                            ))}
                            {/* Custom types for this category */}
                            {categoryCustomTypes.map((customType) => (
                              <div
                                key={customType.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors border border-primary/20"
                              >
                                <div className="flex items-center gap-2">
                                  <Star className="w-3 h-3 text-primary" />
                                  <span className="text-xs font-mono text-muted-foreground bg-background px-1.5 py-0.5 rounded">
                                    {customType.code}
                                  </span>
                                  <span className="text-sm">{customType.name}</span>
                                </div>
                                {customType.recyclable ? (
                                  <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                    <CheckCircle className="w-3 h-3 ml-1" />
                                    قابل
                                  </Badge>
                                ) : (
                                  <Badge className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
                                    <XCircle className="w-3 h-3 ml-1" />
                                    غير قابل
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Note - Egyptian Environmental Law Reference */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-foreground mb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    المرجعية القانونية والتشريعية
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    هذا التصنيف البيئي للمخلفات معتمد وفقاً للتشريعات البيئية المصرية الرسمية ومعايير وزارة البيئة المصرية.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {/* Law No. 4 of 1994 */}
                  <div className="p-4 rounded-lg bg-background/80 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-primary text-primary-foreground">القانون الأساسي</Badge>
                    </div>
                    <h4 className="font-semibold text-foreground mb-1">قانون البيئة رقم 4 لسنة 1994</h4>
                    <p className="text-sm text-muted-foreground">
                      القانون الإطاري لحماية البيئة في جمهورية مصر العربية، والذي يحدد الأسس العامة لإدارة المخلفات الخطرة وغير الخطرة.
                    </p>
                  </div>

                  {/* Executive Regulations */}
                  <div className="p-4 rounded-lg bg-background/80 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">اللائحة التنفيذية</Badge>
                    </div>
                    <h4 className="font-semibold text-foreground mb-1">اللائحة التنفيذية لقانون البيئة</h4>
                    <p className="text-sm text-muted-foreground">
                      الصادرة بقرار رئيس مجلس الوزراء رقم 338 لسنة 1995 وتعديلاتها، والتي تحدد التصنيفات التفصيلية للمخلفات.
                    </p>
                  </div>

                  {/* Law No. 202 of 2020 */}
                  <div className="p-4 rounded-lg bg-background/80 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-green-600 text-white">قانون المخلفات</Badge>
                    </div>
                    <h4 className="font-semibold text-foreground mb-1">قانون تنظيم إدارة المخلفات رقم 202 لسنة 2020</h4>
                    <p className="text-sm text-muted-foreground">
                      القانون المتخصص في تنظيم منظومة إدارة المخلفات بأنواعها، ويحدد مسؤوليات كافة الأطراف في سلسلة الإدارة.
                    </p>
                  </div>

                  {/* Ministerial Decrees */}
                  <div className="p-4 rounded-lg bg-background/80 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">القرارات الوزارية</Badge>
                    </div>
                    <h4 className="font-semibold text-foreground mb-1">قرارات وزارة البيئة المصرية</h4>
                    <p className="text-sm text-muted-foreground">
                      القرارات المنظمة لترخيص منشآت إدارة المخلفات وتصنيف المواد الخطرة وفقاً للمعايير الدولية والمحلية.
                    </p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground border-t border-border">
                  <Info className="w-4 h-4" />
                  <span>
                    للاطلاع على النصوص الكاملة، يرجى زيارة الموقع الرسمي لـ 
                    <a 
                      href="https://www.eeaa.gov.eg" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline mx-1 font-medium"
                    >
                      جهاز شؤون البيئة المصري (EEAA)
                    </a>
                    أو بوابة التشريعات المصرية.
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default WasteTypesClassification;
