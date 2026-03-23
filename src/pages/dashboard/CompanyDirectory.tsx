import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Building2, Search, MapPin, Phone, Mail, Globe, Download, Factory, Recycle, Truck, ExternalLink, Shield, User, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface Company {
  name: string;
  name_en: string;
  zone: string;
  sector: string;
  address: string;
  phone: string;
  mobile: string;
  manager: string;
  position: string;
  website: string;
  email: string;
  description: string;
}

const COMPANIES_DATA: Company[] = [
  // ============ السادس من أكتوبر - تدوير بلاستيك ============
  { name: "مصنع بريق لإعادة تدوير البلاستيك", name_en: "Bareeq Plastic Recycling", zone: "السادس من أكتوبر", sector: "تدوير بلاستيك", address: "قسم ثان 6 أكتوبر، الجيزة", phone: "02-38642424", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج المواد البلاستيكية المعاد تدويرها وأكياس النفايات والحاويات" },
  { name: "الشركة المصرية الرومانية لتدوير البلاستيك", name_en: "Egyptian Romanian Plastic Recycling", zone: "السادس من أكتوبر", sector: "تدوير بلاستيك", address: "المنطقة الصناعية الثالثة، قطعة 493", phone: "02-39124171", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج مستلزمات بلاستيكية من مواد معاد تدويرها" },
  { name: "مصنع زايد تكنو بلاست", name_en: "Zayed Techno Plast", zone: "السادس من أكتوبر", sector: "بلاستيك", address: "المنطقة الصناعية الثانية، السادس من أكتوبر", phone: "02-38202188", mobile: "", manager: "", position: "", website: "", email: "", description: "عبوات بلاستيكية للأدوية والمستلزمات الطبية ومستحضرات التجميل" },
  { name: "شركة ماس لتخريز البلاستيك", name_en: "Mass Plastic", zone: "السادس من أكتوبر", sector: "تدوير بلاستيك", address: "قسم أول 6 أكتوبر", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج تصميمات بلاستيكية متنوعة بأسعار تنافسية" },
  { name: "المجموعة الدولية للتكنولوجيا ITG", name_en: "International Technology Group ITG", zone: "السادس من أكتوبر", sector: "بلاستيك", address: "قسم ثان 6 أكتوبر", phone: "03-8243328", mobile: "", manager: "", position: "", website: "", email: "", description: "شركات تكنولوجية لإنتاج خدمات بلاستيكية متنوعة" },
  { name: "6 أكتوبر لصناعات البلاستيك والرى الحديث", name_en: "6th October Plastic & Modern Irrigation", zone: "السادس من أكتوبر", sector: "بلاستيك", address: "المنطقة الصناعية الثانية، 6 أكتوبر", phone: "02-38344259", mobile: "", manager: "", position: "", website: "", email: "", description: "صناعات بلاستيكية ومنتجات الري الحديث" },
  { name: "الوليد للبلاستيك", name_en: "Al-Waleed Plastic", zone: "السادس من أكتوبر", sector: "تدوير بلاستيك", address: "215 حمادة، المنطقة الصناعية الثالثة", phone: "", mobile: "01000954061", manager: "", position: "", website: "", email: "", description: "رائد في تدوير مخلفات البولي بروبلين والبولي ايثلين وتصنيع الصناديق" },
  { name: "الأقصى 6 أكتوبر لصناعة وطباعة البلاستيك", name_en: "Al-Aqsa October Plastic", zone: "السادس من أكتوبر", sector: "بلاستيك", address: "قسم الجيزة، مدينة 6 أكتوبر", phone: "02-38341399", mobile: "", manager: "", position: "", website: "", email: "", description: "عبوات بلاستيكية وأكياس وصناديق متنوعة" },
  { name: "الليثي لصناعة البلاستيك", name_en: "Al-Laithy Plastic", zone: "السادس من أكتوبر", sector: "بلاستيك", address: "قطعة 200، المنطقة الصناعية الثالثة", phone: "02-38201578", mobile: "", manager: "", position: "", website: "", email: "", description: "أكواب بلاستيكية ومستلزمات طبية ومستحضرات تجميل" },
  { name: "الشركة الدولية للكهرباء والبلاستيك", name_en: "International Electric & Plastic Co.", zone: "السادس من أكتوبر", sector: "بلاستيك", address: "قسم ثان 6 أكتوبر", phone: "02-38332816", mobile: "01001111385", manager: "", position: "", website: "", email: "", description: "زجاجات وعلب بلاستيكية بمختلف الأشكال والأحجام" },
  { name: "المصرية الالمانية للبلاستيك", name_en: "Egyptian German Plastic", zone: "السادس من أكتوبر", sector: "بلاستيك", address: "المنطقة الصناعية، قسم ثان 6 أكتوبر", phone: "02-38202263", mobile: "", manager: "", position: "", website: "", email: "", description: "توريد علب بلاستيكية لشركات الدهانات ومصانع الجبن الكبرى" },
  { name: "دلتا مصر للبلاستيك", name_en: "Delta Egypt Plastic", zone: "السادس من أكتوبر", sector: "بلاستيك", address: "المنطقة الرابعة، 6 أكتوبر", phone: "02-38330724", mobile: "", manager: "", position: "", website: "", email: "", description: "تصنيع وتوريد عبوات بلاستيكية بالحقن والنفخ - خبرة 25 عام" },
  { name: "العسراوي للبلاستيك", name_en: "Al-Asrawy Plastic", zone: "السادس من أكتوبر", sector: "تدوير بلاستيك", address: "المنطقة الصناعية الثالثة، 6 أكتوبر", phone: "02-38314282", mobile: "", manager: "", position: "", website: "", email: "", description: "إعادة تدوير المواد البلاستيكية لإنتاج منتجات جديدة" },
  { name: "شركة صقر لصناعة البلاستيك", name_en: "Saqr Plastic", zone: "السادس من أكتوبر", sector: "تدوير بلاستيك", address: "السادس من أكتوبر، الجيزة", phone: "02-38305440", mobile: "", manager: "", position: "", website: "", email: "", description: "تدوير القطع البلاستيكية التالفة وإنتاج منتجات جديدة" },
  { name: "مصنع بلاستيك كليوباترا", name_en: "Cleopatra Plastic Factory", zone: "السادس من أكتوبر", sector: "بلاستيك", address: "قسم الجيزة، مدينة 6 أكتوبر", phone: "02-38201513", mobile: "", manager: "", position: "", website: "", email: "", description: "منتجات بلاستيكية متنوعة بجودة عالية" },
  { name: "برانيك بلاستيك وليد أبو عامر", name_en: "Braneek Plastic", zone: "السادس من أكتوبر", sector: "بلاستيك", address: "رقم 2، قسم ثان، مدينة 6 أكتوبر", phone: "", mobile: "01101949388", manager: "وليد أبو عامر", position: "صاحب المصنع", website: "", email: "", description: "برانيك بلاستيك لتحميل الفاكهة والخضروات" },
  { name: "النجم الذهبي للبلاستيك", name_en: "Golden Star Plastic", zone: "السادس من أكتوبر", sector: "بلاستيك", address: "قسم ثان، منطقة 6 أكتوبر", phone: "", mobile: "01004019080", manager: "", position: "", website: "", email: "", description: "كراسي وطاولات نزهات وسلات مهملات بلاستيكية" },
  { name: "مصنع القاهرة للبلاستيك", name_en: "Cairo Plastic Factory", zone: "السادس من أكتوبر", sector: "بلاستيك", address: "مجمع أضواء العاصمة، السادس من أكتوبر", phone: "02-39123002", mobile: "", manager: "", position: "", website: "", email: "", description: "تصنيع جميع أنواع الشنط والأكياس السادة والمطبوعة" },
  { name: "الدولية لخامات البلاستيك", name_en: "International Plastic Materials", zone: "السادس من أكتوبر", sector: "بلاستيك", address: "المنطقة الصناعية، السادس من أكتوبر", phone: "", mobile: "01065354633", manager: "", position: "", website: "", email: "", description: "خامات بلاستيك - بولي إيثيلين - بولي بروبيلين - ماستر باتش" },
  // ============ السادس من أكتوبر - حديد ومعادن ============
  { name: "مصنع حديد عز", name_en: "Ezz Steel", zone: "السادس من أكتوبر", sector: "حديد وصلب", address: "المنطقة الصناعية، السادس من أكتوبر", phone: "02-38310000", mobile: "", manager: "أحمد عز", position: "رئيس مجلس الإدارة", website: "www.ezzsteel.com", email: "info@ezzsteel.com", description: "أكبر منتج للحديد والصلب في الشرق الأوسط وشمال أفريقيا" },
  { name: "6 أكتوبر للصناعات المعدنية - سوميكو", name_en: "SOMICO", zone: "السادس من أكتوبر", sector: "حديد وصلب", address: "المنطقة الصناعية، السادس من أكتوبر", phone: "", mobile: "", manager: "فيكتور عياد", position: "رئيس مجلس الإدارة", website: "", email: "", description: "تصنيع المنتجات الحديدية من الزوى والكمر" },
  { name: "6 أكتوبر للصناعة - أجولة بولي بروبلين", name_en: "6th October Industry - PP Bags", zone: "السادس من أكتوبر", sector: "بلاستيك", address: "المنطقة الصناعية، السادس من أكتوبر", phone: "", mobile: "01001996729", manager: "حسين فؤاد زايد", position: "رئيس مجلس الإدارة", website: "", email: "", description: "أجولة منسوجة من البولي بروبلين" },
  // ============ السادس من أكتوبر - صناعات أخرى ============
  { name: "الشركة الحديثة لصناعة مواد البناء", name_en: "Modern Building Materials Co.", zone: "السادس من أكتوبر", sector: "مواد بناء", address: "المنطقة الصناعية، السادس من أكتوبر", phone: "02-38248221", mobile: "", manager: "", position: "", website: "", email: "", description: "مواد بناء - رخام - جرانيت" },
  { name: "الشركة الدولية لقص وتحويل الورق - فوكس", name_en: "Fox International Paper", zone: "السادس من أكتوبر", sector: "ورق وكرتون", address: "المنطقة الصناعية، السادس من أكتوبر", phone: "02-38206648", mobile: "", manager: "", position: "", website: "", email: "", description: "تحويل وقص ورق - أكياس ورقية - كشاكيل - مستلزمات مطاعم ورقية" },
  { name: "مصر أكتوبر الصناعية MOIC", name_en: "MOIC", zone: "السادس من أكتوبر", sector: "ورق وكرتون", address: "المنطقة الصناعية، السادس من أكتوبر", phone: "", mobile: "01000083394", manager: "", position: "", website: "www.moic-egypt.com", email: "info@moic-egypt.com", description: "تصنيع المنتجات الورقية والطباعة" },
  { name: "اكتوبر فارما", name_en: "October Pharma", zone: "السادس من أكتوبر", sector: "أدوية", address: "المنطقة الصناعية، السادس من أكتوبر", phone: "", mobile: "01211191742", manager: "هشام عبد العزيز", position: "رئيس مجلس الإدارة", website: "", email: "", description: "إنتاج الأدوية البشرية" },
  { name: "مصنع التوحيد للأخشاب", name_en: "Al-Tawheed Wood Factory", zone: "السادس من أكتوبر", sector: "أخشاب وأثاث", address: "المنطقة الصناعية، السادس من أكتوبر", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "تصنيع الأخشاب والأثاث" },
  { name: "محطة تدوير النفايات - أكتوبر", name_en: "October Waste Recycling Station", zone: "السادس من أكتوبر", sector: "تدوير نفايات", address: "المنطقة الصناعية، السادس من أكتوبر", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "تدوير ومعالجة النفايات الصلبة" },
  { name: "شركة إرتقاء للخدمات المتكاملة وتدوير المخلفات", name_en: "Ertekaa Integrated Services", zone: "السادس من أكتوبر", sector: "إدارة مخلفات", address: "مدينة أو ويست، 6 أكتوبر / العاصمة الإدارية", phone: "", mobile: "01210504849", manager: "يسرية لوزا حنا", position: "رئيس مجلس الإدارة", website: "www.ertekaa.org", email: "info@ertekaa.org", description: "خدمات متكاملة لإدارة وتدوير المخلفات الصلبة والخطرة" },
  { name: "شريدر مصر لتصنيع المعدات الثقيلة", name_en: "Shredder Egypt", zone: "السادس من أكتوبر", sector: "معدات تدوير", address: "المنطقة الصناعية، 6 أكتوبر", phone: "", mobile: "", manager: "", position: "", website: "shredder-egypt.com", email: "", description: "تصنيع خطوط إعادة التدوير ومعدات التخلص الآمن من المخلفات الصلبة" },
  { name: "داماس إنجنيرز", name_en: "Damas Engineers", zone: "السادس من أكتوبر", sector: "تدوير ورق", address: "6 أكتوبر، الجيزة", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "هندسة اللب والورق - تدوير نفايات الورق" },
  // ============ العاشر من رمضان ============
  { name: "مصنع البلاستيك - العاشر من رمضان", name_en: "10th Ramadan Plastic Factory", zone: "العاشر من رمضان", sector: "بلاستيك", address: "المنطقة الصناعية، العاشر من رمضان", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "تصنيع منتجات بلاستيكية متنوعة" },
  { name: "المدفن الصحي - العاشر من رمضان", name_en: "10th Ramadan Sanitary Landfill", zone: "العاشر من رمضان", sector: "مدافن صحية", address: "المنطقة الصناعية، العاشر من رمضان", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "مدفن صحي للتخلص الآمن من النفايات" },
  { name: "مصنع المحروسة للبلاستيك", name_en: "Al-Mahrousa Plastic", zone: "العاشر من رمضان", sector: "تدوير بلاستيك", address: "المنطقة الصناعية، العاشر من رمضان", phone: "", mobile: "01001987779", manager: "", position: "", website: "", email: "", description: "حاويات بلاستيكية للمواد الكيميائية والأدوية" },
  // ============ برج العرب - الإسكندرية ============
  { name: "مصنع تدوير البلاستيك - برج العرب", name_en: "Borg El Arab Plastic Recycling", zone: "برج العرب", sector: "تدوير بلاستيك", address: "المنطقة الصناعية، برج العرب", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "تدوير البلاستيك" },
  { name: "مصنع الصفوة للبلاستيك", name_en: "Al-Safwa Plastic", zone: "برج العرب", sector: "تدوير بلاستيك", address: "المنطقة الصناعية الثالثة، برج العرب", phone: "", mobile: "01279999359", manager: "", position: "", website: "", email: "", description: "إنتاج وإعادة تدوير البلاستيك" },
  // ============ أبو رواش ============
  { name: "جرينر لإعادة تدوير المخلفات الإلكترونية", name_en: "Greener E-Waste Recycling", zone: "أبو رواش", sector: "تدوير إلكترونيات", address: "القطعة 2 – منطقة 124 فدان – المنطقة الصناعية أبو رواش", phone: "", mobile: "01204004600", manager: "", position: "", website: "greener.com.eg", email: "info@greener.com.eg", description: "التخلص الآمن وإعادة تدوير المخلفات الإلكترونية والكهربائية" },
  { name: "مصنع الزجاج - أبو رواش", name_en: "Abu Rawash Glass Factory", zone: "أبو رواش", sector: "زجاج", address: "المنطقة الصناعية، أبو رواش", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "تصنيع الزجاج" },
  { name: "مجمع الصناعات الغذائية - أبو رواش", name_en: "Abu Rawash Food Industries Complex", zone: "أبو رواش", sector: "صناعات غذائية", address: "المنطقة الصناعية، أبو رواش", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "مجمع للصناعات الغذائية المتنوعة" },
  { name: "محطة معالجة النفايات - أبو رواش", name_en: "Abu Rawash Waste Treatment Station", zone: "أبو رواش", sector: "معالجة نفايات", address: "المنطقة الصناعية، أبو رواش", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "معالجة النفايات والتخلص الآمن" },
  // ============ شركات إدارة مخلفات عامة ============
  { name: "إكوكنسرف - Eco Con Serv", name_en: "Eco Con Serv", zone: "القاهرة", sector: "إدارة مخلفات", address: "القاهرة", phone: "02-27360633", mobile: "", manager: "", position: "", website: "ecoconserv-eg.com", email: "ecs-services@ecoconserv.com", description: "إعادة التدوير - التخلص النهائي الآمن - المعالجة - الجمع والنقل" },
  { name: "الشمس لإعادة التدوير", name_en: "El Shams Recycling", zone: "القاهرة", sector: "تدوير وقود بديل", address: "القاهرة", phone: "", mobile: "01208020202", manager: "", position: "", website: "elshamsrecycling.com", email: "info@elshamsrecycling.com", description: "رواد إعادة تدوير المخلفات في مصر منذ 2011 - وقود بديل وحلول مستدامة" },
  { name: "جرين فالي للبيئة", name_en: "Green Valley Environmental", zone: "القاهرة", sector: "إدارة مخلفات خطرة", address: "القاهرة", phone: "", mobile: "", manager: "", position: "", website: "gv-envi.com", email: "", description: "نقل وتخلص آمن من النفايات الخطرة - موافقة وزارة البيئة" },
  { name: "بيكيا", name_en: "Bekia", zone: "القاهرة", sector: "جمع مخلفات", address: "42 المدينة المنورة، الدقي، الجيزة", phone: "", mobile: "01125428292", manager: "", position: "", website: "bekia-egypt.com", email: "hello@bekia-egypt.com", description: "جمع المخلفات الصلبة المفصولة من المنازل مجاناً" },
  // ============ العبور ============
  { name: "مصنع تدوير الورق - العبور", name_en: "Obour Paper Recycling", zone: "العبور", sector: "تدوير ورق", address: "المنطقة الصناعية، العبور", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "تدوير الورق والكرتون" },
  { name: "ECARU إيكارو", name_en: "ECARU", zone: "العبور", sector: "إدارة مخلفات صلبة", address: "المنطقة الصناعية الأولى، العبور", phone: "02-44891061", mobile: "", manager: "", position: "", website: "ecaru.net", email: "info@ecaru.net", description: "الكتلة الحيوية والمخلفات الصلبة البلدية - خبرة 27 سنة" },
  // ============ حلوان ============
  { name: "مصنع الحديد والصلب - حلوان", name_en: "Helwan Iron & Steel", zone: "حلوان", sector: "حديد وصلب", address: "حلوان، القاهرة", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج الحديد والصلب" },
  // ============ نجع حمادي ============
  { name: "مصنع الألومنيوم - نجع حمادي", name_en: "Nag Hammadi Aluminum", zone: "نجع حمادي", sector: "ألومنيوم", address: "نجع حمادي، قنا", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج الألومنيوم ومنتجاته" },
  // ============ المحلة الكبرى ============
  { name: "مصانع النسيج - المحلة الكبرى", name_en: "Mahalla Textile", zone: "المحلة الكبرى", sector: "غزل ونسيج", address: "المنطقة الصناعية، المحلة الكبرى", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "صناعة الغزل والنسيج" },
  // ============ كفر الدوار ============
  { name: "مصانع الغزل والنسيج - كفر الدوار", name_en: "Kafr El-Dawwar Textile", zone: "كفر الدوار", sector: "غزل ونسيج", address: "كفر الدوار، البحيرة", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "صناعة الغزل والنسيج" },
  // ============ طلخا ============
  { name: "مصنع الأسمدة - طلخا", name_en: "Talkha Fertilizers", zone: "طلخا", sector: "أسمدة كيماوية", address: "طلخا، الدقهلية", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج الأسمدة الكيماوية" },
  // ============ مسطرد ============
  { name: "مصانع البترول - مسطرد", name_en: "Mostorod Petroleum", zone: "مسطرد", sector: "بترول", address: "مسطرد، القليوبية", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "تكرير البترول ومشتقاته" },
  // ============ السويس ============
  { name: "مصنع الأسمنت - السويس", name_en: "Suez Cement", zone: "السويس", sector: "أسمنت", address: "المنطقة الصناعية، السويس", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج الأسمنت" },
  { name: "مصنع السيراميك - السويس", name_en: "Suez Ceramic", zone: "السويس", sector: "سيراميك", address: "المنطقة الصناعية، السويس", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج السيراميك والبلاط" },
  // ============ طرة ============
  { name: "مصنع الأسمنت - طرة", name_en: "Tora Cement", zone: "طرة", sector: "أسمنت", address: "طرة، القاهرة", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "من أقدم مصانع الأسمنت في مصر" },
  // ============ الحوامدية ============
  { name: "مصنع السكر - الحوامدية", name_en: "Hawamdiya Sugar", zone: "الحوامدية", sector: "سكر", address: "الحوامدية، الجيزة", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج السكر والصناعات التكاملية" },
  // ============ قنا ============
  { name: "مصنع الورق - قنا", name_en: "Qena Paper", zone: "قنا", sector: "ورق", address: "قنا", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج الورق" },
];

const getTypeIcon = (sector: string) => {
  if (sector.includes('تدوير') || sector.includes('إدارة مخلفات')) return Recycle;
  if (sector.includes('نقل') || sector.includes('جمع')) return Truck;
  return Factory;
};

const getSectorColor = (sector: string): string => {
  if (sector.includes('بلاستيك')) return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
  if (sector.includes('حديد') || sector.includes('ألومنيوم') || sector.includes('معادن')) return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
  if (sector.includes('ورق') || sector.includes('كرتون')) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
  if (sector.includes('إلكترونيات')) return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
  if (sector.includes('مخلفات') || sector.includes('نفايات') || sector.includes('تدوير')) return 'bg-green-500/10 text-green-600 dark:text-green-400';
  if (sector.includes('أدوية')) return 'bg-red-500/10 text-red-600 dark:text-red-400';
  return 'bg-muted text-muted-foreground';
};

const CompanyDirectory = () => {
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const zones = useMemo(() => [...new Set(COMPANIES_DATA.map(c => c.zone))], []);
  const sectors = useMemo(() => [...new Set(COMPANIES_DATA.map(c => c.sector))].sort(), []);

  const filtered = useMemo(() => {
    return COMPANIES_DATA.filter(c => {
      const matchSearch = !search ||
        c.name.includes(search) || c.name_en.toLowerCase().includes(search.toLowerCase()) ||
        c.description.includes(search) || c.address.includes(search) || c.manager.includes(search);
      const matchZone = zoneFilter === 'all' || c.zone === zoneFilter;
      const matchSector = sectorFilter === 'all' || c.sector === sectorFilter;
      return matchSearch && matchZone && matchSector;
    });
  }, [search, zoneFilter, sectorFilter]);

  const zoneCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    COMPANIES_DATA.forEach(c => { counts[c.zone] = (counts[c.zone] || 0) + 1; });
    return counts;
  }, []);

  const exportData = () => {
    const bom = '\uFEFF';
    const headers = ['الاسم', 'الاسم بالإنجليزية', 'المنطقة الصناعية', 'القطاع', 'العنوان', 'تليفون', 'موبايل', 'المسؤول', 'المنصب', 'الموقع', 'الإيميل', 'الوصف'];
    const rows = filtered.map(c => [c.name, c.name_en, c.zone, c.sector, c.address, c.phone, c.mobile, c.manager, c.position, c.website, c.email, c.description]);
    const csv = bom + [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `دليل-المصانع-حسب-المنطقة-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success('تم تصدير الدليل');
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 p-3 md:p-6">
        <BackButton />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold">دليل المصانع والشركات حسب المنطقة الصناعية</h1>
                <p className="text-muted-foreground text-xs sm:text-sm">{COMPANIES_DATA.length} شركة/مصنع في {zones.length} منطقة صناعية</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={exportData} className="hidden sm:flex">
              <Download className="w-4 h-4 ml-1" /> تصدير CSV
            </Button>
          </div>
        </motion.div>

        {/* Zone Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {Object.entries(zoneCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([zone, count]) => (
              <Card key={zone} className={`cursor-pointer transition-all ${zoneFilter === zone ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
                onClick={() => setZoneFilter(zoneFilter === zone ? 'all' : zone)}>
                <CardContent className="p-2 text-center">
                  <MapPin className="w-4 h-4 mx-auto mb-0.5 text-muted-foreground" />
                  <p className="text-base font-bold">{count}</p>
                  <p className="text-[9px] text-muted-foreground truncate">{zone}</p>
                </CardContent>
              </Card>
            ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو المسؤول أو العنوان..." className="pr-9" />
          </div>
          <Select value={zoneFilter} onValueChange={setZoneFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="المنطقة الصناعية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المناطق ({COMPANIES_DATA.length})</SelectItem>
              {zones.map(z => <SelectItem key={z} value={z}>{z} ({zoneCounts[z]})</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sectorFilter} onValueChange={setSectorFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="القطاع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل القطاعات</SelectItem>
              {sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={exportData} className="sm:hidden shrink-0">
            <Download className="w-4 h-4" />
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">عرض {filtered.length} من {COMPANIES_DATA.length}</div>

        {/* Companies List */}
        <div className="grid gap-3">
          {filtered.map((company, i) => {
            const Icon = getTypeIcon(company.sector);
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.5) }}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCompany(company)}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-sm">{company.name}</h3>
                            <p className="text-xs text-muted-foreground" dir="ltr">{company.name_en}</p>
                          </div>
                          <div className="flex flex-col gap-1 items-end shrink-0">
                            <Badge className={`text-[9px] ${getSectorColor(company.sector)}`} variant="outline">{company.sector}</Badge>
                            <Badge variant="secondary" className="text-[9px]"><MapPin className="w-2.5 h-2.5 ml-0.5" />{company.zone}</Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{company.description}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                          {company.manager && (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <User className="w-3 h-3" /> {company.manager} - {company.position}
                            </span>
                          )}
                          {(company.phone || company.mobile) && (
                            <a href={`tel:${company.phone || company.mobile}`} className="flex items-center gap-1 text-[10px] text-primary hover:underline" onClick={e => e.stopPropagation()}>
                              <Phone className="w-3 h-3" /> {company.phone || company.mobile}
                            </a>
                          )}
                          {company.email && (
                            <a href={`mailto:${company.email}`} className="flex items-center gap-1 text-[10px] text-primary hover:underline" onClick={e => e.stopPropagation()}>
                              <Mail className="w-3 h-3" /> {company.email}
                            </a>
                          )}
                          {company.website && (
                            <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[10px] text-primary hover:underline" onClick={e => e.stopPropagation()}>
                              <Globe className="w-3 h-3" /> الموقع <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>لا توجد نتائج مطابقة</p>
          </div>
        )}

        {/* Sources */}
        <Card className="mt-6">
          <CardHeader className="pb-2"><CardTitle className="text-sm">مصادر البيانات</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {[
              { name: 'EGYDIR - إيجي داير: دليل المصانع والشركات المصرية', url: 'https://www.egydir.com/' },
              { name: 'دليل الصناعات المصرية - Egyptian Industry', url: 'https://www.egyptianindustry.com/' },
              { name: 'إيكونوميا - دليل مصانع إعادة تدوير البلاستيك', url: 'https://economya.net/' },
              { name: 'جهاز تنظيم إدارة المخلفات WMRA', url: 'https://www.wmra.gov.eg/' },
              { name: 'دليل مصر - InfoEG', url: 'https://infoeg.com/' },
              { name: 'CBMI Egypt - سجل الشركات', url: 'https://cbmiegypt.com/' },
            ].map(s => (
              <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[10px] text-primary hover:underline">
                <ExternalLink className="w-3 h-3 shrink-0" /> {s.name}
              </a>
            ))}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={!!selectedCompany} onOpenChange={() => setSelectedCompany(null)}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" /> تفاصيل الشركة
              </DialogTitle>
            </DialogHeader>
            {selectedCompany && (
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <h3 className="font-bold text-lg">{selectedCompany.name}</h3>
                  <p className="text-sm text-muted-foreground" dir="ltr">{selectedCompany.name_en}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge className={getSectorColor(selectedCompany.sector)}>{selectedCompany.sector}</Badge>
                    <Badge variant="secondary"><MapPin className="w-3 h-3 ml-1" />{selectedCompany.zone}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {selectedCompany.address && <DetailRow icon={<MapPin className="w-4 h-4" />} label="العنوان" value={selectedCompany.address} />}
                  {selectedCompany.phone && <DetailRow icon={<Phone className="w-4 h-4" />} label="تليفون أرضي" value={selectedCompany.phone} />}
                  {selectedCompany.mobile && <DetailRow icon={<Phone className="w-4 h-4" />} label="موبايل" value={selectedCompany.mobile} />}
                  {selectedCompany.manager && <DetailRow icon={<User className="w-4 h-4" />} label="المسؤول" value={`${selectedCompany.manager} - ${selectedCompany.position}`} />}
                  {selectedCompany.email && <DetailRow icon={<Mail className="w-4 h-4" />} label="البريد" value={selectedCompany.email} />}
                  {selectedCompany.website && <DetailRow icon={<Globe className="w-4 h-4" />} label="الموقع" value={selectedCompany.website} />}
                </div>
                {selectedCompany.description && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">وصف النشاط</p>
                    <p className="text-sm">{selectedCompany.description}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

const DetailRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-2 p-2 rounded bg-background border">
    <span className="text-muted-foreground mt-0.5">{icon}</span>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-sm">{value}</p>
    </div>
  </div>
);

export default CompanyDirectory;
