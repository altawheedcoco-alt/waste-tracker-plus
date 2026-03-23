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
  { name: "الوليد للبلاستيك", name_en: "Al-Waleed Plastic", zone: "السادس من أكتوبر", sector: "تدوير بلاستيك", address: "215 حمادة، المنطقة الصناعية الثالثة", phone: "", mobile: "01000954061", manager: "", position: "", website: "", email: "", description: "رائد في تدوير مخلفات البولي بروبلين والبولي ايثلين وتصنيع الصناديق" },
  { name: "الشركة الدولية للكهرباء والبلاستيك", name_en: "International Electric & Plastic Co.", zone: "السادس من أكتوبر", sector: "بلاستيك", address: "قسم ثان 6 أكتوبر", phone: "02-38332816", mobile: "01001111385", manager: "", position: "", website: "", email: "", description: "زجاجات وعلب بلاستيكية بمختلف الأشكال والأحجام" },
  { name: "المصرية الالمانية للبلاستيك", name_en: "Egyptian German Plastic", zone: "السادس من أكتوبر", sector: "بلاستيك", address: "المنطقة الصناعية، قسم ثان 6 أكتوبر", phone: "02-38202263", mobile: "", manager: "", position: "", website: "", email: "", description: "توريد علب بلاستيكية لشركات الدهانات ومصانع الجبن الكبرى" },
  { name: "دلتا مصر للبلاستيك", name_en: "Delta Egypt Plastic", zone: "السادس من أكتوبر", sector: "بلاستيك", address: "المنطقة الرابعة، 6 أكتوبر", phone: "02-38330724", mobile: "", manager: "", position: "", website: "", email: "", description: "تصنيع وتوريد عبوات بلاستيكية بالحقن والنفخ - خبرة 25 عام" },
  { name: "العسراوي للبلاستيك", name_en: "Al-Asrawy Plastic", zone: "السادس من أكتوبر", sector: "تدوير بلاستيك", address: "المنطقة الصناعية الثالثة، 6 أكتوبر", phone: "02-38314282", mobile: "", manager: "", position: "", website: "", email: "", description: "إعادة تدوير المواد البلاستيكية لإنتاج منتجات جديدة" },
  { name: "برانيك بلاستيك وليد أبو عامر", name_en: "Braneek Plastic", zone: "السادس من أكتوبر", sector: "بلاستيك", address: "رقم 2، قسم ثان، مدينة 6 أكتوبر", phone: "", mobile: "01101949388", manager: "وليد أبو عامر", position: "صاحب المصنع", website: "", email: "", description: "برانيك بلاستيك لتحميل الفاكهة والخضروات" },
  { name: "الدولية لخامات البلاستيك", name_en: "International Plastic Materials", zone: "السادس من أكتوبر", sector: "بلاستيك", address: "المنطقة الصناعية، السادس من أكتوبر", phone: "", mobile: "01065354633", manager: "", position: "", website: "", email: "", description: "خامات بلاستيك - بولي إيثيلين - بولي بروبيلين - ماستر باتش" },
  { name: "مصنع القاهرة للبلاستيك", name_en: "Cairo Plastic Factory", zone: "السادس من أكتوبر", sector: "بلاستيك", address: "مجمع أضواء العاصمة، السادس من أكتوبر", phone: "02-39123002", mobile: "", manager: "", position: "", website: "", email: "", description: "تصنيع جميع أنواع الشنط والأكياس السادة والمطبوعة" },
  // ============ السادس من أكتوبر - حديد ومعادن ============
  { name: "مصنع حديد عز", name_en: "Ezz Steel", zone: "السادس من أكتوبر", sector: "حديد وصلب", address: "المنطقة الصناعية، السادس من أكتوبر", phone: "02-38310000", mobile: "", manager: "أحمد عز", position: "رئيس مجلس الإدارة", website: "www.ezzsteel.com", email: "info@ezzsteel.com", description: "أكبر منتج للحديد والصلب في الشرق الأوسط وشمال أفريقيا" },
  { name: "6 أكتوبر للصناعات المعدنية - سوميكو", name_en: "SOMICO", zone: "السادس من أكتوبر", sector: "حديد وصلب", address: "المنطقة الصناعية، السادس من أكتوبر", phone: "", mobile: "", manager: "فيكتور عياد", position: "رئيس مجلس الإدارة", website: "", email: "", description: "تصنيع المنتجات الحديدية من الزوى والكمر" },
  // ============ السادس من أكتوبر - صناعات أخرى ============
  { name: "الشركة الحديثة لصناعة مواد البناء", name_en: "Modern Building Materials Co.", zone: "السادس من أكتوبر", sector: "مواد بناء", address: "المنطقة الصناعية، السادس من أكتوبر", phone: "02-38248221", mobile: "", manager: "", position: "", website: "", email: "", description: "مواد بناء - رخام - جرانيت" },
  { name: "الشركة الدولية لقص وتحويل الورق - فوكس", name_en: "Fox International Paper", zone: "السادس من أكتوبر", sector: "ورق وكرتون", address: "المنطقة الصناعية، السادس من أكتوبر", phone: "02-38206648", mobile: "", manager: "", position: "", website: "", email: "", description: "تحويل وقص ورق - أكياس ورقية - كشاكيل - مستلزمات مطاعم ورقية" },
  { name: "مصر أكتوبر الصناعية MOIC", name_en: "MOIC", zone: "السادس من أكتوبر", sector: "ورق وكرتون", address: "المنطقة الصناعية، السادس من أكتوبر", phone: "", mobile: "01000083394", manager: "", position: "", website: "www.moic-egypt.com", email: "info@moic-egypt.com", description: "تصنيع المنتجات الورقية والطباعة" },
  { name: "اكتوبر فارما", name_en: "October Pharma", zone: "السادس من أكتوبر", sector: "أدوية", address: "المنطقة الصناعية، السادس من أكتوبر", phone: "", mobile: "01211191742", manager: "هشام عبد العزيز", position: "رئيس مجلس الإدارة", website: "", email: "", description: "إنتاج الأدوية البشرية" },
  { name: "6 أكتوبر للصناعة - أجولة بولي بروبلين", name_en: "6th October Industry - PP Bags", zone: "السادس من أكتوبر", sector: "بلاستيك", address: "المنطقة الصناعية، السادس من أكتوبر", phone: "", mobile: "01001996729", manager: "حسين فؤاد زايد", position: "رئيس مجلس الإدارة", website: "", email: "", description: "أجولة منسوجة من البولي بروبلين" },
  { name: "شركة إرتقاء للخدمات المتكاملة وتدوير المخلفات", name_en: "Ertekaa Integrated Services", zone: "السادس من أكتوبر", sector: "إدارة مخلفات", address: "مدينة أو ويست، 6 أكتوبر", phone: "", mobile: "01210504849", manager: "يسرية لوزا حنا", position: "رئيس مجلس الإدارة", website: "www.ertekaa.org", email: "info@ertekaa.org", description: "خدمات متكاملة لإدارة وتدوير المخلفات الصلبة والخطرة" },
  { name: "شريدر مصر لتصنيع المعدات الثقيلة", name_en: "Shredder Egypt", zone: "السادس من أكتوبر", sector: "معدات تدوير", address: "المنطقة الصناعية، 6 أكتوبر", phone: "", mobile: "", manager: "", position: "", website: "shredder-egypt.com", email: "", description: "تصنيع خطوط إعادة التدوير ومعدات التخلص الآمن من المخلفات الصلبة" },
  { name: "محطة تدوير النفايات - أكتوبر", name_en: "October Waste Recycling Station", zone: "السادس من أكتوبر", sector: "تدوير نفايات", address: "المنطقة الصناعية، السادس من أكتوبر", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "تدوير ومعالجة النفايات الصلبة" },
  // ============ العاشر من رمضان - كرتون وورق ============
  { name: "شركة العاشر من رمضان لصناعات الكرتون - كارتدان", name_en: "Cartdan", zone: "العاشر من رمضان", sector: "ورق وكرتون", address: "المنطقة الصناعية الأولى، C1 قطعة 8", phone: "015366480", mobile: "", manager: "", position: "", website: "", email: "", description: "أكبر المصانع المصنعة للكرتون بالعاشر من رمضان بأجود الخامات" },
  { name: "جاينت جروب لصناعة الكرتون", name_en: "Giant Group Carton", zone: "العاشر من رمضان", sector: "ورق وكرتون", address: "ثان العاشر من رمضان، الشرقية", phone: "", mobile: "01000006186", manager: "", position: "", website: "", email: "", description: "تصنيع الكرتون المضلع بأعلى جودة" },
  { name: "شركة أغابي لصناعة الكرتون المضلع", name_en: "Agabi Corrugated Carton", zone: "العاشر من رمضان", sector: "ورق وكرتون", address: "القطعة 158 المنطقة الصناعية الثانية", phone: "", mobile: "01111184061", manager: "", position: "", website: "", email: "", description: "كرتون مضلع بأعلى جودة وأفضل الأسعار" },
  { name: "العاشر للطباعة والنشر والتغليف - كارتبرس", name_en: "Cartpress", zone: "العاشر من رمضان", sector: "ورق وكرتون", address: "ش المدينة المنورة، المنطقة الصناعية", phone: "0554376510", mobile: "", manager: "", position: "", website: "", email: "", description: "طباعة ونشر وتغليف الكرتون بأفضل الأسعار" },
  { name: "نيو فاين باك للكرتون", name_en: "New Fine Pack", zone: "العاشر من رمضان", sector: "ورق وكرتون", address: "7 قسم أول مدينة العاشر من رمضان", phone: "0554410363", mobile: "", manager: "", position: "", website: "", email: "", description: "تصنيع الكرتون بأحدث الأجهزة وأعلى جودة" },
  { name: "مصنع الهداية للكرتون المضلع", name_en: "Al-Hedaya Corrugated Carton", zone: "العاشر من رمضان", sector: "ورق وكرتون", address: "7 شارع الظهير الصحراوى العاشر من رمضان", phone: "", mobile: "01223223383", manager: "", position: "", website: "", email: "", description: "أشكال مميزة من الكرتون المضلع بأفضل الخامات" },
  { name: "المصرية لصناعة الكور والمواسير والكرتون", name_en: "Egyptian Cores & Carton", zone: "العاشر من رمضان", sector: "ورق وكرتون", address: "العاشر من رمضان، الشرقية", phone: "", mobile: "01140515715", manager: "", position: "", website: "", email: "", description: "من أقدم المصانع في تصنيع الكرتون" },
  { name: "البردي لتجارة وتصنيع الورقيات", name_en: "Al-Bardi Paper", zone: "العاشر من رمضان", sector: "ورق وكرتون", address: "20 المنطقة الصناعية A3، العاشر من رمضان", phone: "0224033961", mobile: "", manager: "", position: "", website: "", email: "", description: "تصنيع كافة أشكال الكرتون والورقيات المختلفة" },
  { name: "شركة نور الشام", name_en: "Nour Al-Sham", zone: "العاشر من رمضان", sector: "ورق وكرتون", address: "المنطقة الصناعية الثالثة، العاشر من رمضان", phone: "", mobile: "01026671112", manager: "", position: "", website: "", email: "", description: "تصنيع الكرتون والورقيات بأشكال حديثة وعصرية" },
  // ============ العاشر من رمضان - صناعات غذائية ============
  { name: "مصنع سافيتو لمواد التشطيب", name_en: "Saveto", zone: "العاشر من رمضان", sector: "مواد بناء", address: "المنطقة الصناعية الثالثة، العاشر من رمضان", phone: "", mobile: "01277007158", manager: "", position: "", website: "www.savetoegypt.com", email: "info@savetoegypt.com", description: "مواد تشطيب المباني ذات الأساس الأسمنتي - خبرة 60 عام" },
  { name: "مصنع شاديباك للتغليف", name_en: "Shadypack", zone: "العاشر من رمضان", sector: "تغليف", address: "المنطقة الصناعية الثالثة، العاشر من رمضان", phone: "0226904490", mobile: "", manager: "", position: "", website: "www.shadypack.com", email: "info@shadypack.com", description: "تصنيع مواد التغليف والتعبئة" },
  { name: "المتحدون للصناعات الغذائية", name_en: "United Food Industries", zone: "العاشر من رمضان", sector: "صناعات غذائية", address: "المنطقة الصناعية الثالثة، العاشر من رمضان", phone: "", mobile: "01061355513", manager: "", position: "", website: "", email: "", description: "صناعات غذائية متنوعة" },
  { name: "المتحدة لصناعة المواد الغذائية UFFI", name_en: "UFFI", zone: "العاشر من رمضان", sector: "صناعات غذائية", address: "المنطقة الصناعية C5، القطعة 17، العاشر من رمضان", phone: "", mobile: "01097577104", manager: "", position: "", website: "", email: "info@uffi-eg.com", description: "تصنيع المواد الغذائية" },
  { name: "هاي فوود للصناعات الغذائية المتطورة", name_en: "Hi Food", zone: "العاشر من رمضان", sector: "صناعات غذائية", address: "الظهير الصحراوي، العاشر من رمضان", phone: "0554411285", mobile: "", manager: "", position: "", website: "", email: "", description: "صناعات غذائية متطورة" },
  { name: "SWIFAX للصناعات الغذائية", name_en: "SWIFAX", zone: "العاشر من رمضان", sector: "صناعات غذائية", address: "ش روبا، المنطقة الصناعية الثانية B2", phone: "", mobile: "01200466102", manager: "", position: "", website: "www.swifax.com", email: "info@swifax.com", description: "صناعات غذائية متنوعة" },
  { name: "النخيل للصناعات الغذائية", name_en: "Al-Nakhil Food", zone: "العاشر من رمضان", sector: "صناعات غذائية", address: "المنطقة الصناعية الثالثة، قطعة 4/12", phone: "20554410884", mobile: "", manager: "", position: "", website: "www.mw-albaraka.com", email: "alnakhil@mw-albaraka.com", description: "صناعات غذائية - مجموعة البركة" },
  // ============ العاشر من رمضان - بلاستيك ============
  { name: "القائد للصناعات البلاستيكية", name_en: "El-Kaaid Plastic", zone: "العاشر من رمضان", sector: "بلاستيك", address: "قطعة 7/11، المنطقة الصناعية أ2", phone: "", mobile: "01010665256", manager: "", position: "", website: "elkaaid.com", email: "info@elkaaid.com", description: "صناعات بلاستيكية متنوعة" },
  { name: "مصانع الربيع بلاست", name_en: "Al-Rabee Plast", zone: "العاشر من رمضان", sector: "بلاستيك", address: "مجمع المصانع الصغيرة C2، العاشر من رمضان", phone: "", mobile: "01111145718", manager: "", position: "", website: "", email: "", description: "منتجات بلاستيكية متنوعة" },
  { name: "مصر الدولية لصناعة البلاستيك - ميبكو", name_en: "MIPCO", zone: "العاشر من رمضان", sector: "بلاستيك", address: "ش الصفا والمروة، أول العاشر من رمضان", phone: "0554412224", mobile: "", manager: "", position: "", website: "", email: "", description: "صناعة البلاستيك - شركة مساهمة مصرية" },
  { name: "المحروسة للبلاستيك", name_en: "Al-Mahrousa Plastic", zone: "العاشر من رمضان", sector: "تدوير بلاستيك", address: "المنطقة الصناعية، العاشر من رمضان", phone: "", mobile: "01001987779", manager: "", position: "", website: "", email: "", description: "حاويات بلاستيكية للمواد الكيميائية والأدوية" },
  // ============ العاشر من رمضان - أجهزة كهربائية ============
  { name: "ستار ماتيك للأجهزة الكهربائية", name_en: "Star Matic", zone: "العاشر من رمضان", sector: "أجهزة كهربائية", address: "المنطقة الصناعية، العاشر من رمضان", phone: "", mobile: "01023883556", manager: "", position: "", website: "", email: "", description: "تصنيع الأجهزة الكهربائية" },
  { name: "فريش اليكتريك للأجهزة المنزلية", name_en: "Fresh Electric", zone: "العاشر من رمضان", sector: "أجهزة كهربائية", address: "المنطقة الصناعية، العاشر من رمضان", phone: "", mobile: "", manager: "", position: "", website: "www.freshegypt.com", email: "", description: "تصنيع الأجهزة المنزلية الكهربائية" },
  // ============ العاشر من رمضان - زجاج ومعادن ============
  { name: "القاهرة لتصنيع الزجاج", name_en: "Cairo Glass", zone: "العاشر من رمضان", sector: "زجاج", address: "المنطقة الصناعية، العاشر من رمضان", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "تصنيع الزجاج بمختلف الأنواع" },
  { name: "مصنع قنديل للزجاج", name_en: "Kandil Glass", zone: "العاشر من رمضان", sector: "زجاج", address: "المنطقة الصناعية، العاشر من رمضان", phone: "", mobile: "", manager: "", position: "", website: "www.kandil.com", email: "", description: "من أكبر مصانع الزجاج في مصر والشرق الأوسط" },
  { name: "CNC تولز لتشغيل المعادن", name_en: "CNC Tools", zone: "العاشر من رمضان", sector: "تشغيل معادن", address: "المنطقة الصناعية، العاشر من رمضان", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "تشغيل المعادن بأحدث ماكينات CNC" },
  { name: "الايمان لتشغيل المعادن", name_en: "Al-Iman Metalworks", zone: "العاشر من رمضان", sector: "تشغيل معادن", address: "المنطقة الصناعية، العاشر من رمضان", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "تشغيل وتصنيع المعادن" },
  // ============ العاشر من رمضان - أحذية ============
  { name: "مصنع زغلول للأحذية", name_en: "Zaghloul Shoes", zone: "العاشر من رمضان", sector: "أحذية", address: "أول العاشر من رمضان، الشرقية", phone: "", mobile: "01557770610", manager: "", position: "", website: "", email: "zaghloulgroupp@gmail.com", description: "تصنيع الأحذية" },
  { name: "سيجما شوز", name_en: "Sigma Shoes", zone: "العاشر من رمضان", sector: "أحذية", address: "أول العاشر من رمضان، الشرقية", phone: "", mobile: "01273910808", manager: "", position: "", website: "", email: "", description: "تصنيع الأحذية" },
  { name: "Poly One لصناعة الأحذية", name_en: "Poly One Shoes", zone: "العاشر من رمضان", sector: "أحذية", address: "66.65، العاشر من رمضان", phone: "", mobile: "01150800242", manager: "", position: "", website: "", email: "", description: "تصنيع الأحذية" },
  // ============ العاشر من رمضان - منظفات ============
  { name: "الشمس للمنظفات والصناعات الكيماوية", name_en: "El-Shams Detergents", zone: "العاشر من رمضان", sector: "كيماويات", address: "المنطقة الصناعية، العاشر من رمضان", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "تصنيع المنظفات والمواد الكيماوية" },
  { name: "رويال هوم لأدوات النظافة", name_en: "Royal Home", zone: "العاشر من رمضان", sector: "منظفات", address: "المنطقة الصناعية، العاشر من رمضان", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "أدوات النظافة المنزلية" },
  { name: "المدفن الصحي - العاشر من رمضان", name_en: "10th Ramadan Sanitary Landfill", zone: "العاشر من رمضان", sector: "مدافن صحية", address: "المنطقة الصناعية، العاشر من رمضان", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "مدفن صحي للتخلص الآمن من النفايات" },
  // ============ برج العرب - بلاستيك ============
  { name: "مصنع سماحة للبلاستيك والصناعات الحديثة", name_en: "Samaha Plastic", zone: "برج العرب", sector: "بلاستيك", address: "مدينة برج العرب، الإسكندرية", phone: "034598980", mobile: "", manager: "", position: "", website: "", email: "", description: "صناعة الماستر بانس لكافة قطاعات صناعة البلاستيك" },
  { name: "مصنع أبو النجا وشركاه", name_en: "Abu El-Naga & Partners", zone: "برج العرب", sector: "بلاستيك", address: "قسم برج العرب، الإسكندرية", phone: "034592355", mobile: "", manager: "", position: "", website: "", email: "", description: "صناعة الأكياس البلاستيكية بمختلف الأحجام والسماكات" },
  { name: "جاد بلاست الحديثة", name_en: "Gad Plast", zone: "برج العرب", sector: "بلاستيك", address: "المنطقة الصناعية، برج العرب، الإسكندرية", phone: "034592410", mobile: "", manager: "", position: "", website: "", email: "", description: "تصميمات بلاستيكية للمحلات التجارية والشنط والأكياس" },
  { name: "سلمى بلاست", name_en: "Salma Plast", zone: "برج العرب", sector: "بلاستيك", address: "قسم برج العرب، الإسكندرية", phone: "034598137", mobile: "", manager: "", position: "", website: "", email: "", description: "تجهيزات بلاستيكية للمطاعم وجراكن بلاستيكية" },
  { name: "كيرلو بلاست", name_en: "Kirlo Plast", zone: "برج العرب", sector: "بلاستيك", address: "مدينة برج العرب، الإسكندرية", phone: "034592455", mobile: "", manager: "", position: "", website: "", email: "", description: "صناعات بلاستيكية مع خدمات الطبع والتقطيع" },
  { name: "الصفوة لصناعة البلاستيك", name_en: "Al-Safwa Plastic", zone: "برج العرب", sector: "تدوير بلاستيك", address: "حوض سكرة، برج العرب الجديدة، الإسكندرية", phone: "034591800", mobile: "", manager: "", position: "", website: "", email: "", description: "إعادة تدوير مخلفات البلاستيك وتصنيع عبوات PET" },
  { name: "إيجي بلاست للأكياس البلاستيكية", name_en: "Egy Plast", zone: "برج العرب", sector: "بلاستيك", address: "مدينة برج العرب، الإسكندرية", phone: "", mobile: "01010506229", manager: "", position: "", website: "", email: "", description: "إنتاج مواد التعبئة وأدوات التغليف بأحدث التقنيات" },
  { name: "شركة البدر للبلاستيك", name_en: "Al-Badr Plastic", zone: "برج العرب", sector: "بلاستيك", address: "قسم برج العرب، الإسكندرية", phone: "034595515", mobile: "", manager: "", position: "", website: "", email: "", description: "تصنيع الأكياس البلاستيكية والعبوات السادة والمطبوعة - تأسس 2002" },
  { name: "شركة الفاروق للبلاستيك", name_en: "Al-Farouk Plastic", zone: "برج العرب", sector: "تدوير بلاستيك", address: "المنطقة الصناعية، برج العرب، الإسكندرية", phone: "034626262", mobile: "", manager: "", position: "", website: "", email: "", description: "إعادة تدوير البلاستيك - رولات استرتش فيلم زراعي" },
  { name: "الفيحاء للبلاستيك", name_en: "Al-Fayhaa Plastic", zone: "برج العرب", sector: "بلاستيك", address: "حوض سكرة وأبو حمد، برج العرب، الإسكندرية", phone: "", mobile: "01016257613", manager: "", position: "", website: "", email: "", description: "عبوات صناعية وتغليف بلاستيكي ومطاط صناعي - تأسست 1966" },
  { name: "أولاد درويش مصطفى للبلاستيك", name_en: "Darwish Mustafa Plastic", zone: "برج العرب", sector: "بلاستيك", address: "القطعة 8، بلوك 3، ش الجوهرة، المنطقة الصناعية الثانية", phone: "0346226066", mobile: "", manager: "", position: "", website: "", email: "", description: "عبوات بلاستيكية متعددة السعات للبناء والغذاء" },
  { name: "العلا لصناعة البلاستيك", name_en: "Al-Ola Plastic", zone: "برج العرب", sector: "بلاستيك", address: "قسم برج العرب، الإسكندرية", phone: "034595912", mobile: "", manager: "", position: "", website: "", email: "", description: "توريد منتجات بلاستيكية للأسواق المحلية بأسعار منافسة" },
  { name: "السلام للمطاط والبلاستيك", name_en: "Al-Salam Rubber & Plastic", zone: "برج العرب", sector: "بلاستيك", address: "مدينة برج العرب، الإسكندرية", phone: "034594121", mobile: "", manager: "", position: "", website: "", email: "", description: "أدوات أطفال بلاستيكية صحية بخامات عالية الجودة" },
  { name: "الكرنك للصناعات البلاستيكية", name_en: "Al-Karnak Plastic", zone: "برج العرب", sector: "بلاستيك", address: "قسم برج العرب، الإسكندرية", phone: "035490424", mobile: "", manager: "", position: "", website: "", email: "", description: "ديكورات بلاستيكية - أغطية كراسي - كراسي وطاولات - صناديق قمامة" },
  { name: "روبكس العالمية للبلاستيك والاكريليك", name_en: "Rubex International", zone: "برج العرب", sector: "بلاستيك", address: "قسم برج العرب، الإسكندرية", phone: "034622025", mobile: "", manager: "", position: "", website: "", email: "", description: "أطقم حمامات ومنتجات بلاستيكية منزلية - تأسس 1987" },
  { name: "برج العرب للتصنيع MPSC", name_en: "Borg El-Arab Manufacturing MPSC", zone: "برج العرب", sector: "بلاستيك", address: "المنطقة الصناعية الجنوبية الثالثة، قطعة 21، بلوك 15", phone: "", mobile: "01200071632", manager: "محمد صبري", position: "مدير المبيعات", website: "borg-elarab-mpsc.com", email: "mohamed.sabry@borg-elarab-mpsc.com", description: "تصنيع البلاستيك والبوليمرات - Celledur و Polychem" },
  // ============ مدينة السادات - بلاستيك ============
  { name: "النيل للصناعات البلاستيكية", name_en: "Nile Plastic Industries", zone: "مدينة السادات", sector: "بلاستيك", address: "مدينة السادات، المنوفية", phone: "0237527062", mobile: "", manager: "", position: "", website: "", email: "", description: "مواسير المياه والسباكة والصرف الصحي البلاستيكية" },
  { name: "مصر بلاست", name_en: "Misr Plast", zone: "مدينة السادات", sector: "بلاستيك", address: "الظهير الصحراوي لمدينة السادات، المنوفية", phone: "0482657040", mobile: "", manager: "", position: "", website: "", email: "", description: "صناديق خضراوات وفاكهة وبالتات بلاستيكية متينة" },
  { name: "الصفوة للري الحديث", name_en: "Al-Safwa Modern Irrigation", zone: "مدينة السادات", sector: "بلاستيك", address: "المنطقة الصناعية الرابعة، مدينة السادات", phone: "", mobile: "01159497744", manager: "", position: "", website: "", email: "", description: "مواسير صرف صحي وري حديث" },
  { name: "الغباشي للبلاستيك", name_en: "Al-Ghobashi Plastic", zone: "مدينة السادات", sector: "بلاستيك", address: "الظهير الصحراوي، مدينة السادات، المنوفية", phone: "", mobile: "01002955664", manager: "", position: "", website: "", email: "", description: "تغليفات بلاستيكية بجودة عالية من البلاستيك الخام" },
  { name: "دوماك بلاست لصناعة صناديق الفاكهة", name_en: "Domac Plast", zone: "مدينة السادات", sector: "بلاستيك", address: "طريق شبين الكوم، السادات، المنوفية", phone: "", mobile: "01015687682", manager: "", position: "", website: "", email: "", description: "برانيك فاكهة وخضراوات وسلات تصدير" },
  { name: "الإيطالية روما للبلاستيك ومستلزمات الري", name_en: "Italiana Roma Plastic", zone: "مدينة السادات", sector: "بلاستيك", address: "ش كفر داوود، مدينة السادات، المنوفية", phone: "", mobile: "01000085455", manager: "", position: "", website: "", email: "", description: "مواسير صرف صحي ومستلزمات ري حديث" },
  { name: "بلو بيرد بلاست", name_en: "Blue Bird Plast", zone: "مدينة السادات", sector: "بلاستيك", address: "الظهير الصحراوي، مدينة السادات، المنوفية", phone: "", mobile: "01099447551", manager: "", position: "", website: "", email: "", description: "صناديق بلاستيكية لنقل الفاكهة والخضراوات" },
  { name: "ميجا باك", name_en: "Mega Pack", zone: "مدينة السادات", sector: "بلاستيك", address: "الظهير الصحراوي، مدينة السادات، المنوفية", phone: "0482600067", mobile: "", manager: "", position: "", website: "", email: "", description: "من أكبر مصانع البلاستيك والمطاط - فروع متعددة" },
  { name: "إبرو بلاست لبرانيك الفاكهة والخضروات", name_en: "Ebro Plast", zone: "مدينة السادات", sector: "بلاستيك", address: "قطعة 189، المنطقة الصناعية السابعة، مدينة السادات", phone: "", mobile: "01142120727", manager: "", position: "", website: "", email: "", description: "أقفاص فاكهة وخضراوات بلاستيكية بأحجام متعددة" },
  { name: "الإسراء لتصنيع البلاستيك", name_en: "Al-Israa Plastic", zone: "مدينة السادات", sector: "بلاستيك", address: "مدينة السادات، المنوفية", phone: "", mobile: "01006828496", manager: "", position: "", website: "", email: "", description: "أكياس ومواسير مياه وصرف وخراطيم كهرباء" },
  { name: "سبيرو بلاستيك الصناعية", name_en: "Spiro Plastic", zone: "مدينة السادات", sector: "بلاستيك", address: "الظهير الصحراوي، مدينة السادات، المنوفية", phone: "0482601114", mobile: "", manager: "", position: "", website: "", email: "", description: "ألواح بلاستيك خام وألواح أكريليك" },
  { name: "الشركة الدولية للصناعات البلاستيكية", name_en: "International Plastic Industries", zone: "مدينة السادات", sector: "بلاستيك", address: "الظهير الصحراوي، مدينة السادات، المنوفية", phone: "0106858583", mobile: "", manager: "", position: "", website: "", email: "", description: "براميل غذائية ضخمة للتصدير والنقل" },
  { name: "المتحدة للبلاستيك والصوب الزراعية", name_en: "United Plastic & Greenhouses", zone: "مدينة السادات", sector: "بلاستيك", address: "المنطقة الصناعية الرابعة، مدينة السادات", phone: "0482658005", mobile: "", manager: "", position: "", website: "", email: "", description: "بلاستيك وصوب زراعية وشبك تظليل" },
  { name: "التقنية المتقدمة لصناعة البلاستيك", name_en: "Advanced Technology Plastic", zone: "مدينة السادات", sector: "بلاستيك", address: "المنطقة الثالثة الصناعية، المنوفية", phone: "", mobile: "01010626246", manager: "", position: "", website: "", email: "", description: "صناعات بلاستيكية بأحدث الأجهزة" },
  // ============ قويسنا - بنها ============
  { name: "مجموعة مصانع العربي (شارب العربي)", name_en: "El-Araby Group (Sharp)", zone: "قويسنا", sector: "أجهزة كهربائية", address: "مدينة قويسنا الصناعية، المنوفية", phone: "048-2600100", mobile: "", manager: "محمد فريد خميس", position: "رئيس مجلس الإدارة", website: "www.elarabygroup.com", email: "", description: "أكبر مجمع صناعي للأجهزة المنزلية - شراكة مع Sharp اليابانية - مساحة 250 ألف م²" },
  { name: "مصانع العربي - مجمع بنها", name_en: "El-Araby Group - Benha", zone: "بنها", sector: "أجهزة كهربائية", address: "مدينة بنها، القليوبية", phone: "013-3225300", mobile: "", manager: "", position: "", website: "www.elarabygroup.com", email: "", description: "مجمع صناعي للأجهزة الكهربائية - مساحة 100 ألف م²" },
  { name: "مصنع دايم للغزل والنسيج", name_en: "Dime Textiles", zone: "بنها", sector: "غزل ونسيج", address: "القطعة 2، بلوك 13، المنطقة الصناعية، بنها", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "منسوجات وغزل ونسيج" },
  // ============ أبو رواش ============
  { name: "جرينر لإعادة تدوير المخلفات الإلكترونية", name_en: "Greener E-Waste Recycling", zone: "أبو رواش", sector: "تدوير إلكترونيات", address: "القطعة 2، منطقة 124 فدان، المنطقة الصناعية أبو رواش", phone: "", mobile: "01204004600", manager: "", position: "", website: "greener.com.eg", email: "info@greener.com.eg", description: "التخلص الآمن وإعادة تدوير المخلفات الإلكترونية والكهربائية" },
  { name: "مصنع الزجاج - أبو رواش", name_en: "Abu Rawash Glass Factory", zone: "أبو رواش", sector: "زجاج", address: "المنطقة الصناعية، أبو رواش", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "تصنيع الزجاج" },
  { name: "مجمع الصناعات الغذائية - أبو رواش", name_en: "Abu Rawash Food Complex", zone: "أبو رواش", sector: "صناعات غذائية", address: "المنطقة الصناعية، أبو رواش", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "مجمع للصناعات الغذائية المتنوعة" },
  { name: "محطة معالجة النفايات - أبو رواش", name_en: "Abu Rawash Waste Treatment", zone: "أبو رواش", sector: "معالجة نفايات", address: "المنطقة الصناعية، أبو رواش", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "معالجة النفايات والتخلص الآمن" },
  // ============ شركات إدارة مخلفات - القاهرة ============
  { name: "إكوكنسرف - Eco Con Serv", name_en: "Eco Con Serv", zone: "القاهرة", sector: "إدارة مخلفات", address: "القاهرة", phone: "02-27360633", mobile: "", manager: "", position: "", website: "ecoconserv-eg.com", email: "ecs-services@ecoconserv.com", description: "إعادة التدوير - التخلص الآمن - المعالجة - الجمع والنقل" },
  { name: "الشمس لإعادة التدوير", name_en: "El Shams Recycling", zone: "القاهرة", sector: "تدوير وقود بديل", address: "القاهرة", phone: "", mobile: "01208020202", manager: "", position: "", website: "elshamsrecycling.com", email: "info@elshamsrecycling.com", description: "رواد إعادة تدوير المخلفات منذ 2011 - وقود بديل وحلول مستدامة" },
  { name: "جرين فالي للبيئة", name_en: "Green Valley Environmental", zone: "القاهرة", sector: "إدارة مخلفات خطرة", address: "القاهرة", phone: "", mobile: "", manager: "", position: "", website: "gv-envi.com", email: "", description: "نقل وتخلص آمن من النفايات الخطرة - موافقة وزارة البيئة" },
  { name: "بيكيا", name_en: "Bekia", zone: "القاهرة", sector: "جمع مخلفات", address: "42 المدينة المنورة، الدقي، الجيزة", phone: "", mobile: "01125428292", manager: "", position: "", website: "bekia-egypt.com", email: "hello@bekia-egypt.com", description: "جمع المخلفات الصلبة المفصولة من المنازل مجاناً" },
  // ============ العبور ============
  { name: "مصنع تدوير الورق - العبور", name_en: "Obour Paper Recycling", zone: "العبور", sector: "تدوير ورق", address: "المنطقة الصناعية، العبور", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "تدوير الورق والكرتون" },
  { name: "ECARU إيكارو", name_en: "ECARU", zone: "العبور", sector: "إدارة مخلفات صلبة", address: "المنطقة الصناعية الأولى، العبور", phone: "02-44891061", mobile: "", manager: "", position: "", website: "ecaru.net", email: "info@ecaru.net", description: "الكتلة الحيوية والمخلفات الصلبة البلدية - خبرة 27 سنة" },
  // ============ حلوان ============
  { name: "الشركة المصرية للحديد والصلب", name_en: "Egyptian Iron & Steel Co. (EISC)", zone: "حلوان", sector: "حديد وصلب", address: "التبين، حلوان، القاهرة", phone: "02-25010000", mobile: "", manager: "أحمد أبو العلا", position: "رئيس مجلس الإدارة", website: "www.hadisolb.com", email: "info@hadisolb.com", description: "أول مصنع حديد متكامل في مصر - تأسس 1954 - سعة إنتاجية 1.5 مليون طن سنوياً" },
  { name: "مصنع أسمنت حلوان", name_en: "Helwan Cement", zone: "حلوان", sector: "أسمنت", address: "التبين، حلوان، القاهرة", phone: "02-25016000", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج الأسمنت البورتلاندي" },
  { name: "مصانع النصر للكوك والكيماويات", name_en: "Nasr Coke & Chemicals", zone: "حلوان", sector: "كيماويات", address: "التبين، حلوان، القاهرة", phone: "02-25010700", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج فحم الكوك والمواد الكيماوية المشتقة" },
  { name: "مصانع الطوب الرملي - حلوان", name_en: "Helwan Sand Brick", zone: "حلوان", sector: "مواد بناء", address: "المعصرة، حلوان، القاهرة", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج الطوب الرملي والطوب الأسمنتي" },
  { name: "شركة النصر لصناعة السيارات", name_en: "El-Nasr Automotive (NASCO)", zone: "حلوان", sector: "سيارات", address: "حلوان، القاهرة", phone: "02-25010500", mobile: "", manager: "", position: "", website: "", email: "", description: "تأسست 1960 - أول مصنع سيارات في مصر والشرق الأوسط" },
  // ============ نجع حمادي ============
  { name: "شركة مصر للألومنيوم", name_en: "Egypt Aluminium (EgyptAlum)", zone: "نجع حمادي", sector: "ألومنيوم", address: "نجع حمادي، قنا", phone: "096-5602000", mobile: "", manager: "عادل عزب", position: "رئيس مجلس الإدارة", website: "www.egyptalum.com.eg", email: "info@egyptalum.com.eg", description: "أكبر مصنع ألومنيوم في مصر - تأسس 1975 - طاقة إنتاجية 320 ألف طن سنوياً" },
  { name: "مصنع السكر - نجع حمادي", name_en: "Nag Hammadi Sugar", zone: "نجع حمادي", sector: "سكر", address: "نجع حمادي، قنا", phone: "096-5600201", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج السكر الأبيض من قصب السكر" },
  { name: "مصانع الورق - قوص", name_en: "Qus Paper Factory", zone: "نجع حمادي", sector: "ورق", address: "قوص، قنا", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج ورق الكرافت من باجاس قصب السكر" },
  // ============ المحلة الكبرى ============
  { name: "شركة مصر للغزل والنسيج بالمحلة", name_en: "Misr Spinning & Weaving Co. (Mahalla)", zone: "المحلة الكبرى", sector: "غزل ونسيج", address: "المحلة الكبرى، الغربية", phone: "040-2222500", mobile: "", manager: "أحمد مصطفى", position: "رئيس مجلس الإدارة", website: "www.misrtex.com", email: "info@misrtex.com", description: "أكبر شركة غزل ونسيج في الشرق الأوسط وأفريقيا - تأسست 1927 - 30 ألف عامل - تنتج أقمشة قطنية وملابس جاهزة" },
  { name: "شركة النصر للغزل والنسيج", name_en: "El-Nasr Spinning & Weaving", zone: "المحلة الكبرى", sector: "غزل ونسيج", address: "المحلة الكبرى، الغربية", phone: "040-2220100", mobile: "", manager: "", position: "", website: "", email: "", description: "غزل ونسيج الأقمشة القطنية والمخلوطة" },
  { name: "مصانع الصباغة والتجهيز - المحلة", name_en: "Mahalla Dyeing & Finishing", zone: "المحلة الكبرى", sector: "صباغة", address: "المنطقة الصناعية، المحلة الكبرى", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "صباغة وتجهيز الأقمشة" },
  { name: "مصنع الزيوت والصابون - المحلة", name_en: "Mahalla Oils & Soap", zone: "المحلة الكبرى", sector: "زيوت وصابون", address: "المحلة الكبرى، الغربية", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج الزيوت النباتية والصابون" },
  // ============ كفر الدوار ============
  { name: "شركة مصر للغزل والنسيج - كفر الدوار", name_en: "Misr Spinning & Weaving - Kafr El-Dawwar", zone: "كفر الدوار", sector: "غزل ونسيج", address: "كفر الدوار، البحيرة", phone: "045-3302001", mobile: "", manager: "", position: "", website: "", email: "", description: "من أكبر مصانع الغزل والنسيج - تأسس 1938 - آلاف العمال" },
  { name: "شركة النصر للنسيج والتريكو", name_en: "El-Nasr Textile & Tricot", zone: "كفر الدوار", sector: "غزل ونسيج", address: "كفر الدوار، البحيرة", phone: "045-3305500", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج أقمشة التريكو والملابس الجاهزة" },
  // ============ طلخا ============
  { name: "شركة الدلتا للأسمدة والصناعات الكيماوية", name_en: "Delta Fertilizers (DFICO)", zone: "طلخا", sector: "أسمدة كيماوية", address: "طلخا، الدقهلية", phone: "050-2571200", mobile: "", manager: "خالد حنفي", position: "رئيس مجلس الإدارة", website: "", email: "", description: "إنتاج اليوريا ونترات الأمونيوم - طاقة إنتاجية مليون طن سنوياً" },
  { name: "مصنع سماد السوبر فوسفات", name_en: "Talkha Superphosphate", zone: "طلخا", sector: "أسمدة كيماوية", address: "طلخا، الدقهلية", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج سماد السوبر فوسفات والأسمدة الفوسفاتية" },
  // ============ السويس ============
  { name: "السويس للأسمنت (هايدلبرج)", name_en: "Suez Cement (Heidelberg)", zone: "السويس", sector: "أسمنت", address: "المنطقة الصناعية، السويس", phone: "062-3220000", mobile: "", manager: "", position: "", website: "www.suezcement.com.eg", email: "info@suezcement.com.eg", description: "ثاني أكبر منتج للأسمنت في مصر - تأسست 1977 - مجموعة هايدلبرج الألمانية" },
  { name: "كليوباترا للسيراميك - السويس", name_en: "Cleopatra Ceramics - Suez", zone: "السويس", sector: "سيراميك", address: "العين السخنة، السويس", phone: "062-3391000", mobile: "", manager: "محمد أبو العينين", position: "رئيس مجلس الإدارة", website: "www.cleopatraceramics.com", email: "info@cleopatraceramics.com", description: "أكبر مصنع سيراميك في الشرق الأوسط - طاقة 200 مليون م² سنوياً" },
  { name: "شركة السويس لتصنيع البترول", name_en: "Suez Oil Processing Co. (SOPC)", zone: "السويس", sector: "بترول", address: "السويس", phone: "062-3190000", mobile: "", manager: "", position: "", website: "", email: "", description: "تكرير البترول - طاقة إنتاجية 68 ألف برميل يومياً" },
  { name: "شركة النصر للبترول", name_en: "Nasr Petroleum Co.", zone: "السويس", sector: "بترول", address: "السويس", phone: "062-3220500", mobile: "", manager: "", position: "", website: "", email: "", description: "تكرير البترول ومشتقاته" },
  { name: "مصنع الأسمدة الفوسفاتية - أبو زعبل", name_en: "Abu Zaabal Fertilizers", zone: "السويس", sector: "أسمدة", address: "المنطقة الصناعية، السويس", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج الأسمدة الفوسفاتية" },
  // ============ العين السخنة / المنطقة الاقتصادية ============
  { name: "مجمع البتروكيماويات - العين السخنة", name_en: "Ain Sokhna Petrochemicals", zone: "العين السخنة", sector: "بتروكيماويات", address: "المنطقة الاقتصادية بقناة السويس، العين السخنة", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "مجمع بتروكيماويات متكامل - استثمارات مليارية" },
  { name: "شركة جلاس روك لتصنيع الألياف الزجاجية", name_en: "Glass Rock Insulation", zone: "العين السخنة", sector: "زجاج", address: "المنطقة الصناعية، العين السخنة", phone: "02-22916640", mobile: "", manager: "", position: "", website: "www.glassrock.com", email: "info@glassrock.com", description: "إنتاج الصوف الزجاجي وعوازل الألياف الزجاجية - تصدير لـ 40 دولة" },
  { name: "شركة جوشي مصر لصناعة الفايبر جلاس", name_en: "Jushi Egypt Fiberglass", zone: "العين السخنة", sector: "فايبر جلاس", address: "المنطقة الصناعية الصينية، العين السخنة", phone: "", mobile: "", manager: "", position: "", website: "www.jushiegypt.com", email: "", description: "أكبر مصنع فايبر جلاس في أفريقيا - استثمار صيني - 200 ألف طن سنوياً" },
  { name: "تيدا مصر للاستثمار", name_en: "TEDA Egypt Investment", zone: "العين السخنة", sector: "متعدد", address: "المنطقة الصناعية الصينية، العين السخنة", phone: "062-3360001", mobile: "", manager: "", position: "", website: "www.tidaland.com", email: "", description: "المنطقة الصناعية الصينية المصرية - 7.23 كم² - أكثر من 80 شركة" },
  { name: "مصنع ديباسكو لتعبئة الغاز", name_en: "DEBASCO Gas", zone: "العين السخنة", sector: "طاقة", address: "العين السخنة، السويس", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "تعبئة وتوزيع الغاز الطبيعي المسال" },
  // ============ طرة ============
  { name: "شركة أسمنت طره - لافارج", name_en: "Tora Cement - LafargeHolcim", zone: "طرة", sector: "أسمنت", address: "طره، حلوان، القاهرة", phone: "02-25010100", mobile: "", manager: "", position: "", website: "www.lafarge.com.eg", email: "", description: "أقدم مصنع أسمنت في مصر - تأسس 1927 - مجموعة لافارج هولسيم العالمية" },
  { name: "شركة القومية للأسمنت", name_en: "National Cement Co.", zone: "طرة", sector: "أسمنت", address: "طره، حلوان، القاهرة", phone: "02-25013100", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج الأسمنت البورتلاندي العادي والمقاوم للكبريتات" },
  // ============ الحوامدية ============
  { name: "شركة السكر والصناعات التكاملية - الحوامدية", name_en: "Hawamdiya Sugar & Integrated Industries", zone: "الحوامدية", sector: "سكر", address: "الحوامدية، الجيزة", phone: "02-38457100", mobile: "", manager: "", position: "", website: "", email: "", description: "من أقدم مصانع السكر في مصر - تأسس 1881 - إنتاج السكر والكحول والخميرة والورق" },
  { name: "مصنع الخميرة والكحول - الحوامدية", name_en: "Hawamdiya Yeast & Alcohol", zone: "الحوامدية", sector: "صناعات تكاملية", address: "الحوامدية، الجيزة", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج الخميرة والكحول من مولاس قصب السكر" },
  // ============ مسطرد ============
  { name: "شركة القاهرة لتكرير البترول", name_en: "Cairo Oil Refining Co. (CORC)", zone: "مسطرد", sector: "بترول", address: "مسطرد، القليوبية", phone: "02-28493000", mobile: "", manager: "", position: "", website: "", email: "", description: "تكرير البترول الخام - طاقة 145 ألف برميل يومياً" },
  { name: "شركة الأميرية لتكرير البترول", name_en: "Amreya Petroleum Refining", zone: "مسطرد", sector: "بترول", address: "مسطرد، القليوبية", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "تكرير البترول ومشتقاته" },
  { name: "مصنع الكيماويات - مسطرد", name_en: "Mostorod Chemicals", zone: "مسطرد", sector: "كيماويات", address: "مسطرد، القليوبية", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج المواد الكيماوية والبتروكيماوية" },
  // ============ قنا ============
  { name: "شركة قنا لصناعة الورق", name_en: "Qena Paper Industry Co.", zone: "قنا", sector: "ورق", address: "قنا", phone: "096-5335001", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج ورق الكتابة والطباعة والكرافت من باجاس قصب السكر" },
  { name: "مصنع السكر - قنا", name_en: "Qena Sugar Factory", zone: "قنا", sector: "سكر", address: "قنا", phone: "096-5335200", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج السكر الأبيض من قصب السكر" },
  // ============ دمياط ============
  { name: "مدينة الأثاث بدمياط", name_en: "Damietta Furniture City", zone: "دمياط", sector: "أخشاب وأثاث", address: "المنطقة الصناعية الجديدة، دمياط", phone: "057-2380000", mobile: "", manager: "", position: "", website: "", email: "", description: "أكبر مجمع لصناعة الأثاث في الشرق الأوسط - 331 فدان - أكثر من 2000 ورشة ومصنع" },
  { name: "مصنع سيدبك لصناعة الأثاث", name_en: "SIDPEC Furniture", zone: "دمياط", sector: "أخشاب وأثاث", address: "المنطقة الصناعية، دمياط الجديدة", phone: "", mobile: "01003344556", manager: "", position: "", website: "", email: "", description: "أثاث مكتبي ومنزلي - تصدير لدول الخليج وأوروبا" },
  { name: "مجموعة مصانع حبيب للأثاث", name_en: "Habib Furniture Group", zone: "دمياط", sector: "أخشاب وأثاث", address: "طريق رأس البر، دمياط", phone: "057-2322200", mobile: "", manager: "حبيب المنياوي", position: "رئيس مجلس الإدارة", website: "", email: "", description: "من أكبر مصانع الأثاث في دمياط - تصدير لـ 15 دولة" },
  { name: "مصنع المعادي للأثاث والديكور", name_en: "Maadi Furniture & Décor", zone: "دمياط", sector: "أخشاب وأثاث", address: "دمياط الجديدة", phone: "", mobile: "01224455667", manager: "", position: "", website: "", email: "", description: "أثاث كلاسيكي ومودرن" },
  { name: "مصنع الجبالي للأخشاب", name_en: "El-Gebaly Wood", zone: "دمياط", sector: "أخشاب وأثاث", address: "دمياط", phone: "", mobile: "01112233445", manager: "محمد الجبالي", position: "المدير العام", website: "", email: "", description: "تصنيع الأخشاب المعالجة والأبواب والشبابيك" },
  { name: "شركة إيديال ستاندرد مصر", name_en: "Ideal Standard Egypt", zone: "دمياط", sector: "أدوات صحية", address: "المنطقة الصناعية، دمياط الجديدة", phone: "", mobile: "", manager: "", position: "", website: "www.idealstandard.com.eg", email: "", description: "إنتاج الأدوات الصحية والبورسلين" },
  // ============ الإسماعيلية ============
  { name: "المنطقة الصناعية بالإسماعيلية", name_en: "Ismailia Industrial Zone", zone: "الإسماعيلية", sector: "متعدد", address: "المنطقة الصناعية، الإسماعيلية", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "منطقة صناعية تضم عشرات المصانع في مختلف القطاعات" },
  { name: "مصنع الزيوت والصابون - الإسماعيلية", name_en: "Ismailia Oils & Soap", zone: "الإسماعيلية", sector: "زيوت وصابون", address: "المنطقة الصناعية، الإسماعيلية", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج الزيوت النباتية والصابون" },
  { name: "المصرية للصناعات الغذائية - إيديتا", name_en: "Edita Food Industries", zone: "الإسماعيلية", sector: "صناعات غذائية", address: "المنطقة الصناعية، الإسماعيلية", phone: "064-3201000", mobile: "", manager: "حاتم الطحان", position: "رئيس مجلس الإدارة", website: "www.edita.com.eg", email: "info@edita.com.eg", description: "من أكبر شركات الصناعات الغذائية - تصنيع الكيك والشيكولاتة والمقرمشات - مدرجة بالبورصة" },
  { name: "مصنع الألبان والعصائر - الإسماعيلية", name_en: "Ismailia Dairy & Juices", zone: "الإسماعيلية", sector: "صناعات غذائية", address: "الإسماعيلية", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج الألبان والعصائر" },
  { name: "شركة تعبئة مياه - الإسماعيلية", name_en: "Ismailia Water Bottling", zone: "الإسماعيلية", sector: "مياه", address: "الإسماعيلية", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "تعبئة وتوزيع مياه شرب" },
  { name: "مصنع بلاستيك - الإسماعيلية", name_en: "Ismailia Plastic Factory", zone: "الإسماعيلية", sector: "بلاستيك", address: "المنطقة الصناعية، الإسماعيلية", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "صناعات بلاستيكية متنوعة - أنابيب ومواسير" },
  // ============ بورسعيد ============
  { name: "المنطقة الحرة ببورسعيد", name_en: "Port Said Free Zone", zone: "بورسعيد", sector: "متعدد", address: "المنطقة الحرة، بورسعيد", phone: "066-3234000", mobile: "", manager: "", position: "", website: "", email: "", description: "أكبر منطقة حرة في مصر - تضم أكثر من 600 مشروع صناعي وتجاري" },
  { name: "مصنع ملابس جاهزة - بورسعيد", name_en: "Port Said Garments", zone: "بورسعيد", sector: "ملابس جاهزة", address: "المنطقة الحرة، بورسعيد", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "تصنيع ملابس جاهزة للتصدير" },
  { name: "شركة بورسعيد لتصنيع الحاويات", name_en: "Port Said Container Manufacturing", zone: "بورسعيد", sector: "حاويات", address: "المنطقة الصناعية الجنوبية، بورسعيد", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "تصنيع وصيانة الحاويات البحرية" },
  { name: "شركة القنال لتعبئة الأسماك", name_en: "Canal Fish Processing", zone: "بورسعيد", sector: "صناعات غذائية", address: "بورسعيد", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "تعبئة وتصنيع الأسماك والمأكولات البحرية" },
  { name: "مصنع الأخشاب المضغوطة", name_en: "Port Said Pressed Wood", zone: "بورسعيد", sector: "أخشاب", address: "المنطقة الصناعية، بورسعيد", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "تصنيع الأخشاب المضغوطة والـ MDF" },
  // ============ الفيوم ============
  { name: "شركة كوم أوشيم للأسمدة", name_en: "Kom Ombo Fertilizers", zone: "الفيوم", sector: "أسمدة", address: "المنطقة الصناعية، الفيوم", phone: "084-6330200", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج أسمدة السوبر فوسفات" },
  { name: "مصنع الطوب الرملي - الفيوم", name_en: "Fayoum Sand Brick", zone: "الفيوم", sector: "مواد بناء", address: "المنطقة الصناعية، الفيوم", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج الطوب الرملي والأسمنتي" },
  { name: "مصنع تعبئة مياه - الفيوم", name_en: "Fayoum Water Bottling", zone: "الفيوم", sector: "مياه", address: "الفيوم", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "تعبئة مياه معدنية طبيعية" },
  { name: "مصنع الزيوت العطرية - الفيوم", name_en: "Fayoum Essential Oils", zone: "الفيوم", sector: "زيوت عطرية", address: "الفيوم", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "استخلاص وتصدير الزيوت العطرية والنباتات الطبية" },
  { name: "مصنع تجفيف الخضروات والفاكهة", name_en: "Fayoum Dried Vegetables", zone: "الفيوم", sector: "صناعات غذائية", address: "المنطقة الصناعية، الفيوم", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "تجفيف وتصدير الخضروات والفاكهة" },
  // ============ أسيوط ============
  { name: "شركة أسمنت أسيوط (CEMEX)", name_en: "CEMEX Assiut Cement", zone: "أسيوط", sector: "أسمنت", address: "المنطقة الصناعية، أسيوط", phone: "088-2312000", mobile: "", manager: "", position: "", website: "www.cemex.com.eg", email: "info@cemex.com.eg", description: "أحد أكبر مصانع الأسمنت - مجموعة سيمكس العالمية - طاقة 5 مليون طن سنوياً" },
  { name: "مصنع السكر - أبو قرقاص", name_en: "Abu Qurqas Sugar", zone: "أسيوط", sector: "سكر", address: "أبو قرقاص، المنيا", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج السكر من البنجر" },
  { name: "شركة النيل للزيوت والمنظفات", name_en: "Nile Oils & Detergents", zone: "أسيوط", sector: "زيوت ومنظفات", address: "المنطقة الصناعية، أسيوط", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج الزيوت النباتية والمنظفات الصناعية" },
  { name: "مصنع الأعلاف - أسيوط", name_en: "Assiut Animal Feed", zone: "أسيوط", sector: "أعلاف", address: "المنطقة الصناعية، أسيوط", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج الأعلاف الحيوانية" },
  { name: "مصنع الطوب والبلاط - أسيوط", name_en: "Assiut Brick & Tiles", zone: "أسيوط", sector: "مواد بناء", address: "أسيوط", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج الطوب والبلاط" },
  // ============ سوهاج ============
  { name: "شركة أسمنت سوهاج (قنا)", name_en: "Sohag Cement (Qena Cement)", zone: "سوهاج", sector: "أسمنت", address: "المنطقة الصناعية، سوهاج", phone: "093-2340100", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج الأسمنت البورتلاندي" },
  { name: "مصنع السكر والتقطير - جرجا", name_en: "Gerga Sugar & Distillation", zone: "سوهاج", sector: "سكر", address: "جرجا، سوهاج", phone: "093-2560100", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج السكر والكحول من قصب السكر - من أقدم المصانع في الصعيد" },
  { name: "مصنع الغزل والنسيج - سوهاج", name_en: "Sohag Textiles", zone: "سوهاج", sector: "غزل ونسيج", address: "المنطقة الصناعية، سوهاج", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "غزل ونسيج الأقمشة" },
  { name: "مصنع تعبئة الحبوب - سوهاج", name_en: "Sohag Grain Packaging", zone: "سوهاج", sector: "صناعات غذائية", address: "المنطقة الصناعية، سوهاج", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "تعبئة وتغليف الحبوب والبقوليات" },
  // ============ أسوان ============
  { name: "شركة أسمنت أسوان", name_en: "Aswan Cement Co.", zone: "أسوان", sector: "أسمنت", address: "المنطقة الصناعية، أسوان", phone: "097-2480100", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج الأسمنت البورتلاندي - طاقة 1.5 مليون طن" },
  { name: "شركة كيما أسوان للأسمدة", name_en: "KIMA Aswan Fertilizers", zone: "أسوان", sector: "أسمدة", address: "أسوان", phone: "097-2302000", mobile: "", manager: "أحمد هيكل", position: "رئيس مجلس الإدارة", website: "www.kima.com.eg", email: "info@kima.com.eg", description: "إنتاج سماد نترات الأمونيوم - تأسست 1960 - طاقة 700 ألف طن سنوياً" },
  { name: "مصنع السكر - كوم أمبو", name_en: "Kom Ombo Sugar Factory", zone: "أسوان", sector: "سكر", address: "كوم أمبو، أسوان", phone: "097-2500201", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج السكر من قصب السكر" },
  { name: "مصنع الذهب - مرسى علم", name_en: "Sukari Gold Mine", zone: "أسوان", sector: "تعدين", address: "مرسى علم، البحر الأحمر", phone: "", mobile: "", manager: "", position: "", website: "www.centamin.com", email: "", description: "أكبر منجم ذهب في مصر - شركة سنتامين - إنتاج 450 ألف أوقية سنوياً" },
  // ============ الروبيكي ============
  { name: "مدينة الجلود بالروبيكي", name_en: "Robbiki Leather City", zone: "الروبيكي", sector: "جلود", address: "مدينة بدر، القاهرة", phone: "02-28618000", mobile: "", manager: "", position: "", website: "", email: "", description: "أكبر مجمع لصناعة الجلود في الشرق الأوسط - 500 فدان - نقل مدابغ مصر القديمة" },
  { name: "مصنع تدبيغ الجلود - الروبيكي", name_en: "Robbiki Tannery", zone: "الروبيكي", sector: "جلود", address: "المنطقة الصناعية، الروبيكي", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "تدبيغ وتجهيز الجلود الطبيعية" },
  { name: "مصانع الأحذية والشنط - الروبيكي", name_en: "Robbiki Shoes & Bags", zone: "الروبيكي", sector: "جلود", address: "المنطقة الصناعية، الروبيكي", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "تصنيع الأحذية والحقائب الجلدية" },
  { name: "محطة معالجة مخلفات الدباغة", name_en: "Tannery Waste Treatment Plant", zone: "الروبيكي", sector: "معالجة نفايات", address: "مدينة الجلود، الروبيكي", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "معالجة المخلفات السائلة والصلبة الناتجة عن صناعة الجلود بطرق آمنة بيئياً" },
  // ============ المنيا ============
  { name: "شركة أسمنت المنيا", name_en: "Minya Cement Co.", zone: "المنيا", sector: "أسمنت", address: "المنطقة الصناعية، المنيا", phone: "086-2362000", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج الأسمنت البورتلاندي" },
  { name: "مصنع السكر - أبو قرقاص", name_en: "Abu Qurqas Sugar", zone: "المنيا", sector: "سكر", address: "أبو قرقاص، المنيا", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج السكر من البنجر وقصب السكر" },
  { name: "مصنع الأعلاف - المنيا", name_en: "Minya Feed Factory", zone: "المنيا", sector: "أعلاف", address: "المنطقة الصناعية، المنيا", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج الأعلاف الحيوانية والداجنة" },
  // ============ طنطا ============
  { name: "شركة طنطا للكتان والزيوت", name_en: "Tanta Flax & Oils", zone: "طنطا", sector: "زيوت", address: "المنطقة الصناعية، طنطا", phone: "040-3316500", mobile: "", manager: "", position: "", website: "", email: "", description: "إنتاج زيت بذرة الكتان والزيوت النباتية - من أقدم المصانع" },
  { name: "مصنع الغزل والنسيج - طنطا", name_en: "Tanta Spinning & Weaving", zone: "طنطا", sector: "غزل ونسيج", address: "طنطا، الغربية", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "غزل ونسيج الأقمشة القطنية" },
  { name: "مصنع المواد الغذائية - طنطا", name_en: "Tanta Food Factory", zone: "طنطا", sector: "صناعات غذائية", address: "المنطقة الصناعية، طنطا", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "صناعات غذائية متنوعة" },
  // ============ المنصورة ============
  { name: "مصنع الأسمدة - طلخا", name_en: "Talkha Fertilizers Complex", zone: "المنصورة", sector: "أسمدة", address: "طلخا، الدقهلية", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "مجمع الأسمدة الأزوتية" },
  { name: "مصنع الغزل والنسيج - المنصورة", name_en: "Mansoura Textiles", zone: "المنصورة", sector: "غزل ونسيج", address: "المنطقة الصناعية، المنصورة", phone: "", mobile: "", manager: "", position: "", website: "", email: "", description: "غزل ونسيج وتصنيع ملابس جاهزة" },
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
