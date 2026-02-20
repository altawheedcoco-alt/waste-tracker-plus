import {
  Leaf, Recycle, BarChart3, Shield, Activity, FileCheck, Network,
  Package, Truck, Factory, Wallet, TrendingUp, Brain, Handshake,
  Phone, Users, Megaphone, Zap, Settings, Layers, Lock, Globe,
  ShieldCheck, CheckCircle2, Cpu, Server, Database, Monitor,
  Smartphone, Camera, QrCode, Wifi, Route, Building2, Scale,
  GraduationCap, Award, Star, Target, Gauge, Store, Umbrella,
  Wrench, Eye, BookOpen, Fingerprint, HeartPulse, AlertTriangle,
  Flame, Droplets, Wind, Sparkles, Clock, Mail, Boxes, Container,
  FileText, MapPin, Bell, Receipt, ClipboardList, Banknote,
  CircleDollarSign, Ship, Workflow, Radio, PieChart, CalendarCheck,
  Landmark, Scan, FileSpreadsheet, Cog, BadgeCheck, ThermometerSun, Trees,
} from 'lucide-react';

export interface BrochureFeature {
  name: string;
  nameEn: string;
  desc: string;
  descEn: string;
}

export interface BrochureSection {
  title: string;
  titleEn: string;
  subtitle: string;
  icon: any;
  color: string;
  badgeColor: string;
  category: 'environment' | 'operations';
  features: BrochureFeature[];
}

export const platformStats = [
  { label: 'مؤشر بيئي', labelEn: 'Environmental KPI', value: '30+', desc: 'ESG, GRI, ISO, Basel' },
  { label: 'هدف SDG', labelEn: 'SDG Goals', value: '8', desc: 'Sustainable Development' },
  { label: 'نوع مخلف', labelEn: 'Waste Types', value: '10+', desc: 'IPCC Certified' },
  { label: 'شهادة رقمية', labelEn: 'Digital Certs', value: '5+', desc: 'Carbon, ESG, Compliance' },
  { label: 'معيار دولي', labelEn: 'Intl. Standards', value: 'ISO', desc: '14001 + 45001' },
  { label: 'وحدة وظيفية', labelEn: 'Functions', value: '150+', desc: 'Integrated Modules' },
  { label: 'نموذج AI', labelEn: 'AI Models', value: '10+', desc: 'GPT-5, Gemini' },
  { label: 'تكامل خارجي', labelEn: 'Integrations', value: '15+', desc: 'IoT, GPS, Maps, API' },
];

export const whyChooseUs = [
  { 
    title: 'حل شامل متكامل', titleEn: 'All-in-One Platform',
    desc: 'منصة واحدة تغطي سلسلة القيمة الكاملة بدلاً من 10+ أنظمة منفصلة',
    descEn: 'One platform covering the entire value chain instead of 10+ separate systems',
    icon: Layers 
  },
  { 
    title: 'امتثال دولي ومحلي', titleEn: 'Global & Local Compliance',
    desc: 'متوافقة مع ISO 14001, ISO 45001, GRI, Basel Convention, GDPR',
    descEn: 'Compliant with ISO 14001, ISO 45001, GRI, Basel Convention, GDPR',
    icon: ShieldCheck 
  },
  { 
    title: 'ذكاء اصطناعي متقدم', titleEn: 'Advanced AI',
    desc: '10+ نماذج AI لتصنيف المخلفات وتحسين المسارات وكشف الاحتيال',
    descEn: '10+ AI models for waste classification, route optimization & fraud detection',
    icon: Brain 
  },
  { 
    title: 'استدامة بيئية حقيقية', titleEn: 'Real Sustainability',
    desc: 'بصمة كربونية IPCC، اقتصاد دائري MCI، أرصدة كربون، تقارير ESG',
    descEn: 'IPCC carbon footprint, MCI circular economy, carbon credits, ESG reports',
    icon: Leaf 
  },
  { 
    title: 'أمان على أعلى مستوى', titleEn: 'Enterprise Security',
    desc: 'تشفير شامل، مصادقة بيومترية، blockchain-lite، GDPR',
    descEn: 'End-to-end encryption, biometric auth, blockchain-lite, GDPR',
    icon: Lock 
  },
  { 
    title: 'سحابية وسريعة', titleEn: 'Cloud-Native & Fast',
    desc: 'PWA بدون تثبيت، تحديثات فورية، بيانات لحظية، أداء عالٍ',
    descEn: 'PWA without installation, real-time updates, high performance',
    icon: Globe 
  },
];

export const sections: BrochureSection[] = [
  // ===== ENVIRONMENT =====
  {
    title: '🌍 البصمة الكربونية وأرصدة الكربون',
    titleEn: 'Carbon Footprint & Carbon Credits',
    subtitle: 'Carbon Footprint & Credits Management',
    icon: Leaf,
    color: 'from-green-600 to-emerald-500',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    category: 'environment',
    features: [
      { name: 'حساب البصمة الكربونية للشحنة', nameEn: 'Shipment Carbon Footprint Calculator', desc: 'حساب تلقائي لانبعاثات CO₂ لكل شحنة بناءً على المسافة (Haversine)، الوزن، ونوع المخلف وفقاً لمعاملات IPCC 2006 و GHG Protocol', descEn: 'Automatic CO₂ emissions calculation per shipment based on distance (Haversine), weight, and waste type per IPCC 2006 & GHG Protocol coefficients' },
      { name: 'بصمة المنشأة الشاملة', nameEn: 'Facility Carbon Footprint', desc: 'تجميع البصمة الكربونية على مستوى المنشأة شهرياً/سنوياً مع مقارنة الأداء عبر الفترات', descEn: 'Aggregate facility-level carbon footprint monthly/annually with cross-period performance comparison' },
      { name: 'المكافئات البيئية الملموسة', nameEn: 'Tangible Environmental Equivalents', desc: 'ترجمة الانبعاثات إلى مكافئات: أشجار، سيارات مُزالة، منازل مصرية، فدادين ري', descEn: 'Translate emissions into equivalents: trees planted, cars removed, Egyptian homes, irrigation acres' },
      { name: 'أرصدة الكربون', nameEn: 'Carbon Credits', desc: 'حساب أرصدة الكربون المُكتسبة من التدوير مع تقييم مالي بالأسعار العالمية ($/طن CO₂e)', descEn: 'Calculate carbon credits earned from recycling with financial valuation at global prices ($/ton CO₂e)' },
      { name: 'شهادات البصمة الكربونية', nameEn: 'Carbon Footprint Certificates', desc: 'إصدار شهادات PCF و FCF رقمية مشفرة بـ QR Code للتحقق العام', descEn: 'Issue digital PCF & FCF certificates encrypted with QR Code for public verification' },
      { name: 'تقارير انبعاثات النقل', nameEn: 'Transport Emission Reports', desc: 'تحليل مفصل لانبعاثات النقل البري مع تحسين المسارات لتقليل البصمة الكربونية', descEn: 'Detailed analysis of road transport emissions with route optimization to reduce carbon footprint' },
      { name: 'معاملات انبعاثات مُعتمدة', nameEn: 'Certified Emission Factors', desc: 'قاعدة بيانات معاملات الانبعاثات لـ 10+ أنواع مخلفات', descEn: 'Database of emission factors for 10+ waste types (plastic, paper, metals, e-waste, medical, chemical...)' },
      { name: 'تقرير الحياد الكربوني', nameEn: 'Carbon Neutrality Report', desc: 'خارطة طريق لتحقيق الحياد الكربوني مع تتبع التقدم', descEn: 'Carbon neutrality roadmap with progress tracking and emissions gap identification' },
    ]
  },
  {
    title: '♻️ الاقتصاد الدائري والتكافل الصناعي',
    titleEn: 'Circular Economy & Industrial Symbiosis',
    subtitle: 'Circular Economy & Industrial Symbiosis',
    icon: Recycle,
    color: 'from-emerald-500 to-teal-500',
    badgeColor: 'bg-teal-100 text-teal-800',
    category: 'environment',
    features: [
      { name: 'مؤشر دائرية المواد (MCI)', nameEn: 'Material Circularity Indicator (MCI)', desc: 'حساب MCI لكل مادة وشحنة وفقاً لمنهجية Ellen MacArthur Foundation', descEn: 'Calculate MCI per material and shipment per Ellen MacArthur Foundation methodology' },
      { name: 'جواز المنتج الرقمي (DPP)', nameEn: 'Digital Product Passport (DPP)', desc: 'تتبع دورة حياة المادة من المصدر حتى إعادة التدوير وفقاً لمتطلبات الاتحاد الأوروبي', descEn: 'Track material lifecycle from source to recycling per EU Digital Product Passport requirements' },
      { name: 'شبكة التكافل الصناعي', nameEn: 'Industrial Symbiosis Network', desc: 'ربط المنشآت الصناعية لتبادل المخلفات كمدخلات إنتاج', descEn: 'Connect industrial facilities to exchange waste as production inputs' },
      { name: 'المطابقة الذكية AI', nameEn: 'AI Smart Matching', desc: 'خوارزمية ذكاء اصطناعي تطابق بين عارضي المخلفات وطالبيها', descEn: 'AI algorithm matches waste suppliers with waste seekers based on type, location & quantity' },
      { name: 'لوحة الدائرية', nameEn: 'Circularity Dashboard', desc: 'معدل الاسترداد، نسبة التحويل عن المدافن، كفاءة إعادة التدوير', descEn: 'Recovery rate, landfill diversion rate, recycling efficiency, raw material savings' },
      { name: 'تدفق المواد Sankey', nameEn: 'Sankey Material Flow', desc: 'رسوم بيانية تفاعلية تُظهر تدفق المخلفات من المصادر حتى الاستخدام النهائي', descEn: 'Interactive Sankey diagrams showing waste flow from sources through processing to end use' },
      { name: 'تقارير التحويل عن المدافن', nameEn: 'Landfill Diversion Reports', desc: 'حساب دقيق لنسبة المخلفات المُحوّلة عن الدفن مع أهداف Zero-Waste', descEn: 'Precise landfill diversion rates with trackable Zero-Waste targets' },
      { name: 'تحليل دورة الحياة (LCA)', nameEn: 'Life Cycle Assessment (LCA)', desc: 'تقييم الأثر البيئي الكامل للمادة عبر مراحل حياتها', descEn: 'Full environmental impact assessment across material lifecycle stages' },
    ]
  },
  {
    title: '📊 تقارير الاستدامة ESG',
    titleEn: 'ESG Reporting & Sustainability Intelligence',
    subtitle: 'ESG & Sustainability Reporting',
    icon: BarChart3,
    color: 'from-teal-500 to-cyan-600',
    badgeColor: 'bg-cyan-100 text-cyan-800',
    category: 'environment',
    features: [
      { name: 'تقارير GRI Standards', nameEn: 'GRI Standards Reports', desc: 'تقارير متوافقة مع معايير Global Reporting Initiative', descEn: 'Reports compliant with Global Reporting Initiative standards for environmental & social disclosures' },
      { name: 'مؤشرات ESG الدولية', nameEn: 'International ESG KPIs', desc: 'أكثر من 30 مؤشر ESG متوافقة مع GRI, ISO 14001, Basel Convention', descEn: '30+ ESG indicators compliant with GRI, ISO 14001, Basel Convention' },
      { name: 'أهداف التنمية المستدامة SDGs', nameEn: 'SDG Alignment', desc: 'ربط أداء المنظمة بـ 8 أهداف للتنمية المستدامة', descEn: 'Link organization performance to 8 UN Sustainable Development Goals (SDG 6,7,9,11,12,13,14,15)' },
      { name: 'الاستدامة على 3 مستويات', nameEn: '3-Level Sustainability', desc: 'تقارير على مستوى: المنظمة، الشحنة، ونوع المخلف', descEn: 'Reports at 3 levels: Organization (overview), Shipment (detailed), Waste Type (specialized)' },
      { name: '7 محاور تقييم', nameEn: '7 Assessment Pillars', desc: 'الامتثال، الأثر البيئي، كفاءة التشغيل، المسؤولية الاجتماعية، الابتكار، الشفافية، والحوكمة', descEn: 'Compliance, Environmental Impact, Operational Efficiency, Social Responsibility, Innovation, Transparency & Governance' },
      { name: 'شهادات الاستدامة الرقمية', nameEn: 'Digital Sustainability Certificates', desc: 'شهادات مشفرة بـ QR Code تضمن تتبع الأثر البيئي', descEn: 'QR-encrypted certificates ensuring traceable environmental impact per ton of waste' },
      { name: 'المكافئات البيئية المحلية', nameEn: 'Local Environmental Equivalents', desc: 'فدادين ري مصرية، منازل مصرية (كهرباء)، أشجار نخيل', descEn: 'Egyptian irrigation acres, Egyptian homes (electricity), date palm trees planted' },
      { name: 'لوحة ESG التنفيذية', nameEn: 'Executive ESG Dashboard', desc: 'لوحة للإدارة العليا مع مقارنة بمعايير الصناعة', descEn: 'C-suite dashboard with industry benchmarks and competitor comparisons' },
    ]
  },
  {
    title: '🛡️ السلامة المهنية والصحة',
    titleEn: 'Occupational Health & Safety — ISO 45001',
    subtitle: 'OHS Management System',
    icon: Shield,
    color: 'from-red-500 to-orange-500',
    badgeColor: 'bg-red-100 text-red-800',
    category: 'environment',
    features: [
      { name: 'نظام ISO 45001 متكامل', nameEn: 'Full ISO 45001 System', desc: 'منصة رقمية كاملة تطبق متطلبات ISO 45001', descEn: 'Complete digital platform implementing ISO 45001 OHS management requirements' },
      { name: 'مصفوفة المخاطر التفاعلية', nameEn: 'Interactive Risk Matrix', desc: 'تقييم المخاطر بنظام (الاحتمالية × التأثير) مع 5 مستويات', descEn: 'Risk assessment using Likelihood × Impact matrix with 5 severity levels and auto follow-up' },
      { name: 'الأفعال التصحيحية (CAR)', nameEn: 'Corrective Action Requests (CAR)', desc: 'سير عمل (فتح ← تحقيق ← إجراء تصحيحي ← تحقق ← إغلاق)', descEn: 'Workflow: Open → Investigation → Corrective Action → Verification → Close with audit trail' },
      { name: 'فحص ما قبل الرحلة', nameEn: 'Pre-Trip Inspection', desc: 'قائمة فحص إلزامية شاملة للمركبة والسائق', descEn: 'Mandatory comprehensive checklist for vehicle and driver before any waste transport trip' },
      { name: 'تقارير الحوادث والإصابات', nameEn: 'Incident & Injury Reports', desc: 'توثيق إلكتروني مع تحليل الأسباب الجذرية (RCA)', descEn: 'Electronic documentation with Root Cause Analysis (RCA) and preventive measures' },
      { name: 'سجل المخلفات الخطرة', nameEn: 'Hazardous Waste Register', desc: 'سجل رقمي يتوافق مع اللوائح الوطنية واتفاقية بازل', descEn: 'Digital register compliant with national regulations and Basel Convention' },
      { name: 'زر الطوارئ SOS', nameEn: 'SOS Emergency Button', desc: 'إبلاغ فوري مع إرسال الموقع الحي تلقائياً', descEn: 'Instant emergency alert with automatic live location sharing to control center' },
      { name: 'معدات الوقاية PPE', nameEn: 'PPE Tracking', desc: 'تتبع التزام العمال بمعدات الوقاية الشخصية', descEn: 'Track worker PPE compliance with alerts for non-compliance' },
      { name: 'الفحوصات الطبية الدورية', nameEn: 'Periodic Medical Exams', desc: 'جدولة وتتبع الفحوصات الطبية للعمال', descEn: 'Schedule and track periodic medical exams for workers handling hazardous materials' },
    ]
  },
  {
    title: '🏭 الرقابة البيئية للمنشآت',
    titleEn: 'Environmental Monitoring & Facility Management',
    subtitle: 'Environmental Monitoring',
    icon: Activity,
    color: 'from-orange-500 to-amber-500',
    badgeColor: 'bg-amber-100 text-amber-800',
    category: 'environment',
    features: [
      { name: 'مراقبة انبعاثات المحارق', nameEn: 'Incinerator Emissions Monitoring', desc: 'تتبع لحظي لدرجات الحرارة وانبعاثات CO₂ و NOx', descEn: 'Real-time tracking of temperatures and CO₂/NOx emissions with instant threshold alerts' },
      { name: 'إدارة خلايا الدفن', nameEn: 'Landfill Cell Management', desc: 'خريطة رقمية لخلايا الدفن مع تتبع السعة', descEn: 'Digital map of landfill cells with capacity tracking and status (active/closed/empty)' },
      { name: 'مراقبة مستويات الترشيح', nameEn: 'Leachate Level Monitoring', desc: 'رصد مستمر لمستويات الرشح في مدافن النفايات', descEn: 'Continuous leachate level monitoring in landfills with environmental alerts' },
      { name: 'التنبيهات البيئية الحية', nameEn: 'Live Environmental Alerts', desc: 'نظام تنبيهات آلي يراقب معايير الامتثال البيئي', descEn: 'Automated alert system monitoring environmental compliance parameters 24/7' },
      { name: 'سعة المنشآت', nameEn: 'Facility Capacity Tracking', desc: 'تتبع السعة المتبقية مع تنبيهات عند 80%', descEn: 'Real-time remaining capacity tracking with alerts at 80% maximum capacity' },
      { name: 'تتبع درجات الحرارة', nameEn: 'Temperature Monitoring', desc: 'مراقبة درجات حرارة التخزين للمخلفات الطبية والكيميائية', descEn: 'Storage temperature monitoring for medical and chemical waste' },
      { name: 'جودة الهواء المحيط', nameEn: 'Ambient Air Quality', desc: 'رصد جودة الهواء حول المنشآت مع مؤشرات AQI', descEn: 'Ambient air quality monitoring around facilities with AQI indicators and health alerts' },
    ]
  },
  {
    title: '📋 الامتثال التنظيمي والتدقيق',
    titleEn: 'Regulatory Compliance & Audit Management',
    subtitle: 'Compliance & Audit',
    icon: FileCheck,
    color: 'from-indigo-500 to-violet-500',
    badgeColor: 'bg-indigo-100 text-indigo-800',
    category: 'environment',
    features: [
      { name: 'نظام ISO 14001 الكامل', nameEn: 'Full ISO 14001 System', desc: 'تطبيق رقمي شامل لمتطلبات نظام الإدارة البيئية', descEn: 'Comprehensive digital implementation of ISO 14001:2015 EMS requirements' },
      { name: 'بوابة المراجع الخارجي', nameEn: 'External Auditor Portal', desc: 'وصول آمن محدد الزمن للمراجعين مع توقيع رقمي', descEn: 'Time-limited secure access for auditors to verify compliance evidence with digital signature' },
      { name: 'شهادات امتثال متدرجة', nameEn: 'Tiered Compliance Certificates', desc: 'ذهبية (≥90%) وفضية (≥80%) وبرونزية (≥70%)', descEn: 'Gold (≥90%), Silver (≥80%), Bronze (≥70%) based on compliance score with QR verification' },
      { name: 'درجة الامتثال القانوني', nameEn: 'Legal Compliance Score', desc: 'حساب تلقائي لدرجة الامتثال لكل شحنة وجهة', descEn: 'Automatic compliance scoring per shipment based on data completeness and documentation' },
      { name: 'سجلات المخلفات الرقمية', nameEn: 'Digital Waste Registers', desc: 'سجلات رقمية منظمة وفقاً لمتطلبات الجهات التنظيمية', descEn: 'Organized digital registers per regulatory authority requirements' },
      { name: 'تنبيهات الشحنات العالقة', nameEn: 'Stuck Shipment Alerts', desc: 'تنبيه آلي للشحنات المتأخرة أكثر من 48 ساعة', descEn: 'Automated alerts for shipments delayed more than 48 hours with escalation' },
      { name: 'حماية بيانات GDPR', nameEn: 'GDPR Data Protection', desc: 'تشفير شامل وحقوق الحذف والنسيان', descEn: 'End-to-end encryption with right to erasure and data portability' },
      { name: 'سلسلة الحفظ Blockchain-lite', nameEn: 'Chain of Custody Blockchain-lite', desc: 'تتبع سلسلة الحيازة بتقنية blockchain-lite', descEn: 'Blockchain-lite chain of custody tracking ensuring tamper-proof records' },
    ]
  },
  {
    title: '🌊 الذكاء البيئي وخرائط التدفق',
    titleEn: 'Environmental Intelligence & Waste Flow Mapping',
    subtitle: 'Environmental Intelligence',
    icon: Network,
    color: 'from-cyan-500 to-blue-500',
    badgeColor: 'bg-blue-100 text-blue-800',
    category: 'environment',
    features: [
      { name: 'خرائط حرارية تفاعلية', nameEn: 'Interactive Heatmaps', desc: 'كثافة توليد المخلفات جغرافياً مع النقاط الساخنة', descEn: 'Geographic waste generation density with hotspot identification' },
      { name: 'تدفق المخلفات الحي', nameEn: 'Live Waste Flow', desc: 'تتبع من المصادر عبر النقل حتى الوجهة النهائية', descEn: 'Track from sources through transport to final destination (recycling/disposal)' },
      { name: 'تحليل أنواع المخلفات', nameEn: 'Waste Type Analytics', desc: 'تصنيفات وإحصائيات مفصلة مع رسوم بيانية تفاعلية', descEn: 'Detailed classifications and statistics with interactive charts over time' },
      { name: 'بورصة السلع البيئية', nameEn: 'Environmental Commodity Exchange', desc: 'أسعار لحظية للمواد المعاد تدويرها عالمياً', descEn: 'Real-time global prices for recycled materials with analytics and trends' },
      { name: 'تقارير الأثر التراكمي', nameEn: 'Cumulative Impact Reports', desc: 'رؤية تراكمية للأثر البيئي الإجمالي', descEn: 'Cumulative view of total environmental impact across all partners' },
      { name: 'كشف الاحتيال البيئي', nameEn: 'Environmental Fraud Detection', desc: 'محرك AI لرصد التلاعب بالأوزان والشحنات المشبوهة', descEn: 'AI engine detecting weight tampering and suspicious shipments' },
      { name: 'التنبؤ بتوليد المخلفات', nameEn: 'Waste Generation Forecasting', desc: 'نماذج تنبؤية بناءً على الأنماط التاريخية', descEn: 'Predictive models forecasting future waste volumes based on historical patterns' },
    ]
  },
  // ===== OPERATIONS =====
  {
    title: 'إدارة الشحنات واللوجستيات',
    titleEn: 'Shipment & Logistics Management',
    subtitle: 'Shipment & Logistics',
    icon: Package,
    color: 'from-blue-600 to-cyan-500',
    badgeColor: 'bg-blue-100 text-blue-800',
    category: 'operations',
    features: [
      { name: 'إنشاء الشحنات الذكي', nameEn: 'Smart Shipment Creation', desc: 'تعبئة تلقائية للبيانات وتتبع لحظي عبر GPS ورموز QR', descEn: 'Auto-fill data with live GPS tracking and unique QR codes' },
      { name: 'سلسلة الموافقات المتعددة', nameEn: 'Multi-Party Approval Chain', desc: 'موافقات متسلسلة من المولد والناقل والمدور مع موافقة تلقائية بعد 6 ساعات', descEn: 'Sequential approvals from generator, transporter & recycler with auto-approve after 6 hours' },
      { name: 'المانيفست الرقمي الموحد', nameEn: 'Unified Digital Manifest', desc: 'مستند رقمي شامل يرافق الشحنة من المصدر حتى الوجهة', descEn: 'Comprehensive digital document accompanying shipment from source to destination with QR Chain' },
      { name: '7 مستندات قانونية تلقائية', nameEn: '7 Auto-Generated Legal Docs', desc: 'شهادات استلام وتسليم وإقرارات ومانيفست بختم وتوقيع رقمي', descEn: 'Receipts, declarations & manifests auto-generated with digital seal and signature' },
      { name: 'إدارة الشحنات المرفوضة', nameEn: 'Rejected Shipment Management', desc: 'معالجة الرفض مع أسباب وإعادة توجيه تلقائي', descEn: 'Rejection handling with reasons and automatic re-routing' },
      { name: 'تتبع سلسلة الحيازة', nameEn: 'Chain of Custody Tracking', desc: 'تتبع كامل من نقطة التوليد حتى التخلص النهائي', descEn: 'Full tracking from generation point to final disposal' },
      { name: 'الشحنات المجمّعة', nameEn: 'Consolidated Shipments', desc: 'تجميع شحنات صغيرة في رحلة واحدة لتحسين الكفاءة', descEn: 'Combine multiple small shipments into one trip for better efficiency and lower emissions' },
      { name: 'بوابة طلبات الجمع', nameEn: 'Collection Request Portal', desc: 'نظام يشبه أوبر لطلب جمع المخلفات مع تتبع لحظي', descEn: 'Uber-like system for requesting waste collection with live tracking' },
    ]
  },
  {
    title: 'إدارة السائقين والأسطول',
    titleEn: 'Fleet & Driver Management',
    subtitle: 'Fleet & Drivers',
    icon: Truck,
    color: 'from-amber-500 to-orange-500',
    badgeColor: 'bg-amber-100 text-amber-800',
    category: 'operations',
    features: [
      { name: 'لوحة تحكم السائق الذكية', nameEn: 'Smart Driver Dashboard', desc: '14+ تبويباً تشمل المهام والأداء والمكافآت والسلامة', descEn: '14+ tabs covering tasks, performance, rewards, safety & academy' },
      { name: 'التتبع اللحظي GPS', nameEn: 'Real-time GPS Tracking', desc: 'تتبع المواقع على خريطة حية كل 30 ثانية مع سجل المسارات', descEn: 'Live map tracking every 30 seconds with route history' },
      { name: 'أكاديمية السائقين', nameEn: 'Driver Academy', desc: 'دورات إلزامية وشهادات معتمدة واختبارات ومحتوى تفاعلي', descEn: 'Mandatory courses, certified certificates, tests & interactive content' },
      { name: 'نظام المكافآت والتحفيز', nameEn: 'Gamification & Rewards', desc: 'نقاط ومستويات وشارات وسلسلة أيام ولوحة متصدرين', descEn: 'Points, levels, badges, streaks, leaderboards & material rewards' },
      { name: 'الكاميرا الذكية AI', nameEn: 'AI Smart Camera', desc: 'تصنيف المخلفات بالكاميرا وتقدير الأوزان بالـ AI', descEn: 'Camera-based waste classification and AI weight estimation with instant report' },
      { name: 'إدارة المركبات', nameEn: 'Vehicle Management', desc: 'رخص، تأمين، صيانة، استهلاك وقود، تاريخ الشحنات', descEn: 'Licenses, insurance, maintenance, fuel consumption, shipment history' },
      { name: 'تقييم أداء السائقين', nameEn: 'Driver Performance Rating', desc: 'السرعة، الالتزام بالمواعيد، الجودة، السلامة، رضا العملاء', descEn: 'Speed, punctuality, quality, safety, customer satisfaction metrics' },
      { name: 'تنبيهات استباقية', nameEn: 'Proactive Alerts', desc: 'تنبيهات قبل انتهاء الرخص والتأمين والفحوصات', descEn: 'Smart alerts before license, insurance & inspection expiry with auto-scheduling' },
      { name: 'الصيانة التنبؤية', nameEn: 'Predictive Maintenance', desc: 'توقع الأعطال بناءً على بيانات التشغيل والاستهلاك', descEn: 'Predict failures based on operational data and consumption with smart scheduling' },
    ]
  },
  {
    title: 'إدارة المصانع والتدوير',
    titleEn: 'Factory & Recycling Operations',
    subtitle: 'Factory & Recycling',
    icon: Factory,
    color: 'from-lime-500 to-green-500',
    badgeColor: 'bg-lime-100 text-lime-800',
    category: 'operations',
    features: [
      { name: 'التوأم الرقمي للمصنع', nameEn: 'Factory Digital Twin', desc: 'مراقبة أرضية المصنع وخطوط الإنتاج في الوقت الفعلي', descEn: 'Real-time factory floor and production line monitoring with smart alerts' },
      { name: 'أوامر التشغيل', nameEn: 'Work Orders', desc: 'إدارة الدُفعات مع حساب التكلفة الفعلية للطن', descEn: 'Batch management with actual cost per ton (materials, labor, energy, overhead)' },
      { name: 'فحص الجودة بالـ AI', nameEn: 'AI Quality Inspection', desc: 'منع التلوث الخلطي وضمان جودة المنتجات المُعاد تدويرها', descEn: 'Prevent cross-contamination and ensure recycled product quality with auto-acceptance criteria' },
      { name: 'الصيانة التنبؤية', nameEn: 'Predictive Maintenance', desc: 'توقع الأعطال وتقليل وقت التوقف', descEn: 'Predict equipment failures and minimize downtime using operational data' },
      { name: 'شهادات المنتجات بـ QR', nameEn: 'QR Product Certificates', desc: 'شهادات تتبع سلسلة الحيازة مع كود تحقق عام', descEn: 'Chain of custody certificates from source to final product with public verification code' },
      { name: 'إدارة الطاقة', nameEn: 'Energy Management', desc: 'تتبع استهلاك الطاقة مع تحديد فرص التوفير', descEn: 'Track energy consumption per production line with saving opportunities and energy intensity per ton' },
      { name: 'التحليل المتقدم للإنتاج', nameEn: 'Advanced Production Analytics', desc: 'مؤشرات OEE مع تحليل أسباب التوقف وخسائر الجودة', descEn: 'OEE indicators with downtime cause analysis and quality loss tracking' },
    ]
  },
  {
    title: 'النظام المالي ERP المتكامل',
    titleEn: 'Enterprise Resource Planning & Finance',
    subtitle: 'ERP & Finance',
    icon: Wallet,
    color: 'from-violet-500 to-purple-500',
    badgeColor: 'bg-violet-100 text-violet-800',
    category: 'operations',
    features: [
      { name: 'المحاسبة المالية الكاملة', nameEn: 'Full Financial Accounting', desc: 'دفتر أستاذ وقوائم مالية تلقائية مع ترحيل آلي', descEn: 'General ledger and auto-generated financial statements (income, balance sheet, cash flow)' },
      { name: 'الفواتير الإلكترونية', nameEn: 'E-Invoicing', desc: 'فواتير بختم وتوقيع رقمي وإرسال تلقائي', descEn: 'Invoices with digital seal and signature, compliant with local and international standards' },
      { name: 'إدارة المخازن', nameEn: 'Inventory Management', desc: 'FIFO والمتوسط المرجح مع حساب COGS', descEn: 'FIFO and weighted average with COGS calculation and inventory alerts' },
      { name: 'الموارد البشرية', nameEn: 'HR Management', desc: 'الموظفين والرواتب والحضور والإجازات والمزايا', descEn: 'Employees, payroll, attendance, leaves & benefits with comprehensive reports' },
      { name: 'التأمين الذكي', nameEn: 'Smart Insurance', desc: 'احتساب آلي لأقساط التأمين بناءً على تحليل المخاطر', descEn: 'Auto-calculate insurance premiums based on shipment risk analysis (waste type, distance, value)' },
      { name: 'العقود الآجلة للنقل', nameEn: 'Transport Futures', desc: 'تأمين أسعار نقل مستقبلية للتحوط ضد تقلبات الأسعار', descEn: 'Lock in future transport prices to hedge against price volatility' },
      { name: 'المحفظة الإلكترونية', nameEn: 'Digital Wallet', desc: 'محفظة رقمية لكل منظمة مع تحويلات فورية', descEn: 'Digital wallet per organization with instant transfers and full transaction log' },
      { name: 'فترات الحساب المالية', nameEn: 'Financial Periods', desc: 'ترصيد تلقائي وترحيل أرصدة وتقارير مقارنة', descEn: 'Automatic balancing, balance carry-forward, and comparative period reports' },
      { name: 'تسعير ديناميكي', nameEn: 'Dynamic Pricing', desc: 'حساب أسعار النقل بناءً على المسافة والوزن والطلب', descEn: 'Auto-calculate transport prices based on distance, weight, demand & season' },
    ]
  },
  {
    title: 'الوساطة وبورصة المخلفات',
    titleEn: 'Waste Brokerage & Exchange Platform',
    subtitle: 'Brokerage & Exchange',
    icon: TrendingUp,
    color: 'from-fuchsia-500 to-pink-500',
    badgeColor: 'bg-fuchsia-100 text-fuchsia-800',
    category: 'operations',
    features: [
      { name: 'لوحة تحكم الوسيط', nameEn: 'Broker Mission Control', desc: 'رؤية شاملة للصفقات والأرباح والشركاء وفرص السوق', descEn: 'Comprehensive view of deals, profits, partners & market opportunities' },
      { name: 'بورصة المخلفات المفتوحة', nameEn: 'Open Waste Marketplace', desc: 'عروض بيع وشراء وتفاوض فوري', descEn: 'Marketplace for trading recyclable waste with instant buy/sell/negotiate' },
      { name: 'المزادات الإلكترونية', nameEn: 'E-Auctions', desc: 'مزادات عكسية وعادية مع نظام مزايدات آلي', descEn: 'Forward and reverse auctions with auto-bidding system and competitor notifications' },
      { name: 'تحليل الأرباح والهوامش', nameEn: 'Profit & Margin Analysis', desc: 'تقارير ربحية مفصلة لكل صفقة', descEn: 'Detailed profitability reports per deal with margin after operational costs' },
      { name: 'إدارة الصفقات', nameEn: 'Deal Management', desc: 'متابعة صفقات الشراء والبيع مع ربط الفواتير', descEn: 'Track buy/sell deals with linked invoices and shipments' },
      { name: 'أسعار السوق اللحظية', nameEn: 'Live Market Prices', desc: 'أسعار المواد المعاد تدويرها عالمياً ومحلياً', descEn: 'Global and local recycled material prices with charts and trends' },
    ]
  },
  {
    title: 'الذكاء الاصطناعي المتقدم',
    titleEn: 'Advanced AI & Machine Learning',
    subtitle: 'AI & ML',
    icon: Brain,
    color: 'from-pink-500 to-rose-500',
    badgeColor: 'bg-pink-100 text-pink-800',
    category: 'operations',
    features: [
      { name: 'مساعد AI التفاعلي', nameEn: 'Interactive AI Assistant', desc: 'يفهم العربية والإنجليزية ويحلل البيانات فوراً', descEn: 'Understands Arabic and English, answers instantly and analyzes data' },
      { name: 'تصنيف المخلفات بالصور', nameEn: 'Image-Based Waste Classification', desc: 'تحليل الصور وتحديد نسب النقاء والتلوث بدقة عالية', descEn: 'Analyze waste images, classify automatically with purity and contamination ratios' },
      { name: 'تحسين المسارات', nameEn: 'Route Optimization', desc: 'تقليل التكاليف والانبعاثات والوقت', descEn: 'Smart algorithms to reduce costs, emissions and travel time' },
      { name: 'محسّن الإنتاج الذكي', nameEn: 'Smart Production Optimizer', desc: 'رفع كفاءة الاستخلاص وتقليل الهالك', descEn: 'Boost extraction efficiency, reduce waste and improve output quality' },
      { name: 'تحليل المشاعر والمكالمات', nameEn: 'Sentiment & Call Analysis', desc: 'تقييم أداء خدمة العملاء بالـ AI', descEn: 'AI-powered customer service call analysis with performance scoring and suggestions' },
      { name: 'التنبؤات والتوقعات', nameEn: 'Predictions & Forecasting', desc: 'نماذج تنبؤية بدقة تتجاوز 85%', descEn: 'Predictive models for waste volume, pricing & demand with 85%+ accuracy' },
      { name: 'كشف الاحتيال الذكي', nameEn: 'Smart Fraud Detection', desc: 'رصد التلاعب بالأوزان والبيانات المشبوهة', descEn: 'AI engine detecting weight tampering and suspicious data patterns' },
      { name: '10+ نماذج AI', nameEn: '10+ AI Models', desc: 'GPT-5, Gemini 2.5 Pro, Gemini Flash', descEn: 'Support for GPT-5, Gemini 2.5 Pro, Gemini Flash for various tasks' },
    ]
  },
  {
    title: 'العقود والشركاء والتواصل',
    titleEn: 'Contracts, Partners & Communication',
    subtitle: 'Contracts & Partners',
    icon: Handshake,
    color: 'from-sky-500 to-blue-500',
    badgeColor: 'bg-sky-100 text-sky-800',
    category: 'operations',
    features: [
      { name: 'العقود الرقمية', nameEn: 'Digital Contracts', desc: 'قوالب جاهزة مع بنود تلقائية وتوقيعات رقمية', descEn: 'Ready templates with auto-clauses, digital signatures & stamps with auto-renewal' },
      { name: 'خطابات الترسية', nameEn: 'Award Letters', desc: 'بنود تفصيلية وأسعار مع ربط بالعقود', descEn: 'Detailed items and prices linked to contracts and shipments' },
      { name: 'شبكة الشركاء والتقييم', nameEn: 'Partner Network & Rating', desc: 'تقييم متبادل (5 نجوم) وتحليل مخاطر', descEn: 'Mutual 5-star ratings with partner risk analysis and reliability scoring' },
      { name: 'الشركاء الخارجيون', nameEn: 'External Partners', desc: 'إدارة الشركاء خارج المنصة مع حسابات مالية', descEn: 'Manage off-platform partners with contact data and independent financial accounts' },
      { name: 'بوابة العملاء', nameEn: 'Customer Portal', desc: 'خدمة ذاتية لتتبع الشحنات والفواتير', descEn: 'Self-service portal for tracking shipments, invoices & requesting new services' },
      { name: 'الملف التعريفي العام', nameEn: 'Public Organization Profile', desc: 'صفحة قابلة للمشاركة مع كود تحقق', descEn: 'Shareable page showing permitted org data with unique verification code' },
      { name: 'إشعارات متعددة القنوات', nameEn: 'Multi-Channel Notifications', desc: 'لحظية + واتساب + بريد + SMS + PWA', descEn: 'Real-time + WhatsApp + Email + SMS + PWA push notifications' },
      { name: 'الدردشة الداخلية', nameEn: 'Internal Chat', desc: 'رسائل فورية بين أطراف الشحنة', descEn: 'Instant messaging between shipment parties with attachments and history' },
      { name: 'قصص المنصة', nameEn: 'Platform Stories', desc: 'إعلانات وتحديثات مع تفاعلات ومشاهدات', descEn: 'Story-based announcements and updates with reactions and view counts' },
    ]
  },
  {
    title: 'مركز الاتصال الذكي',
    titleEn: 'Smart Call Center & CRM',
    subtitle: 'Call Center & CRM',
    icon: Phone,
    color: 'from-green-500 to-emerald-600',
    badgeColor: 'bg-green-100 text-green-800',
    category: 'operations',
    features: [
      { name: 'تسجيل المكالمات', nameEn: 'Call Recording', desc: 'أرشفة كافة المكالمات مع ربطها بالعملاء والشحنات', descEn: 'Archive all calls linked to customers, shipments & complaints' },
      { name: 'تحليل AI للمكالمات', nameEn: 'AI Call Analysis', desc: 'تحليل المحتوى والنبرة واستخراج النقاط الرئيسية', descEn: 'Analyze call content and tone, extract key points and action items' },
      { name: 'أداء الموظفين KPI', nameEn: 'Agent KPIs', desc: 'متوسط المدة، رضا العملاء، معدل الحل من أول اتصال', descEn: 'Average duration, customer satisfaction, first-call resolution rate' },
      { name: 'نظام التذاكر', nameEn: 'Ticket System', desc: 'تصنيف وأولوية وتتبع وتصعيد تلقائي', descEn: 'Classification, priority, tracking & automatic escalation' },
      { name: 'تنبيهات الجودة', nameEn: 'Quality Alerts', desc: 'تنبيهات عند انخفاض الجودة أو ارتفاع الانتظار', descEn: 'Instant alerts when service quality drops or wait times increase' },
    ]
  },
  {
    title: 'التوظيف ومنصة عُمالنا',
    titleEn: 'Omaluna Recruitment Platform',
    subtitle: 'Recruitment',
    icon: Users,
    color: 'from-indigo-500 to-blue-600',
    badgeColor: 'bg-indigo-100 text-indigo-800',
    category: 'operations',
    features: [
      { name: 'منصة عُمالنا', nameEn: 'Omaluna Platform', desc: 'ربط العمال وأصحاب العمل ومكاتب التوظيف', descEn: 'Connect workers, employers & recruitment agencies in the waste sector' },
      { name: 'ملفات العمال', nameEn: 'Worker Profiles', desc: 'مهارات، خبرات، شهادات، تقييمات، توفر', descEn: 'Skills, experience, certificates, ratings, location, availability' },
      { name: 'وكالات التوظيف', nameEn: 'Recruitment Agencies', desc: 'لوحة تحكم لإدارة المرشحين والعقود', descEn: 'Dashboard for managing candidates, contracts & commissions' },
      { name: 'البحث الذكي', nameEn: 'Smart Search', desc: 'بحث بالمهارات والموقع والخبرة والتقييم', descEn: 'Search by skills, location, experience & rating with relevance ranking' },
      { name: 'التطبيق والمطابقة', nameEn: 'Apply & Match', desc: 'مطابقة ذكية بين المتطلبات والمهارات', descEn: 'Smart matching between job requirements and worker skills' },
    ]
  },
  {
    title: 'الإعلانات والتسويق',
    titleEn: 'Advertising & Marketing Platform',
    subtitle: 'Ads & Marketing',
    icon: Megaphone,
    color: 'from-rose-500 to-red-500',
    badgeColor: 'bg-rose-100 text-rose-800',
    category: 'operations',
    features: [
      { name: 'نظام إعلانات متكامل', nameEn: 'Integrated Ad System', desc: 'خطط متعددة (أساسية، متقدمة، مميزة) بأسعار مرنة', descEn: 'Multiple plans (basic, advanced, premium) with flexible pricing' },
      { name: 'تحليلات الإعلانات', nameEn: 'Ad Analytics', desc: 'مشاهدات ونقرات ومعدل تحويل مع تقارير مفصلة', descEn: 'Views, clicks, conversion rate with detailed performance reports' },
      { name: 'كوبونات وعروض', nameEn: 'Coupons & Offers', desc: 'نظام خصومات مع تتبع الاستخدام والصلاحية', descEn: 'Discount system with usage tracking, validity & limits' },
      { name: 'استهداف الجمهور', nameEn: 'Audience Targeting', desc: 'استهداف حسب نوع المنظمة والموقع والنشاط', descEn: 'Target by organization type, location & activity for precise reach' },
    ]
  },
  {
    title: 'التكاملات والتقنيات',
    titleEn: 'Integrations & Technology Stack',
    subtitle: 'Tech & Integrations',
    icon: Zap,
    color: 'from-cyan-500 to-teal-500',
    badgeColor: 'bg-cyan-100 text-cyan-800',
    category: 'operations',
    features: [
      { name: 'إنترنت الأشياء IoT', nameEn: 'IoT Integration', desc: 'ربط الموازين والحساسات وأجهزة GPS', descEn: 'Connect scales, sensors & GPS devices for automatic data feed' },
      { name: 'تطبيق PWA متقدم', nameEn: 'Advanced PWA', desc: 'يعمل بدون إنترنت مع إشعارات فورية', descEn: 'Works offline with push notifications and native-like performance' },
      { name: 'ماسح QR / Barcode', nameEn: 'QR / Barcode Scanner', desc: 'قراءة عبر الكاميرا لتتبع فوري', descEn: 'Camera-based QR and barcode scanning for instant tracking' },
      { name: 'API مفتوح', nameEn: 'Open API', desc: 'RESTful API مع مفاتيح وصلاحيات وتوثيق شامل', descEn: 'RESTful API with keys, scoped permissions & comprehensive documentation' },
      { name: 'خرائط Google', nameEn: 'Google Maps', desc: 'تتبع حي، Geocoding، مسارات مُحسّنة', descEn: 'Live tracking, geocoding, optimized routes & distance calculation' },
      { name: 'تصدير Excel وPDF', nameEn: 'Excel & PDF Export', desc: 'تقارير بتنسيقات احترافية مع علامة مائية', descEn: 'Professional report exports with watermarks and branding' },
      { name: 'الوقت الحقيقي', nameEn: 'Real-time Updates', desc: 'WebSocket مع إشعارات لحظية', descEn: 'WebSocket real-time data updates without page refresh' },
    ]
  },
  {
    title: 'إدارة النظام والحوكمة',
    titleEn: 'System Administration & Governance',
    subtitle: 'Admin & Governance',
    icon: Settings,
    color: 'from-gray-600 to-slate-700',
    badgeColor: 'bg-gray-100 text-gray-800',
    category: 'operations',
    features: [
      { name: 'لوحة مدير النظام', nameEn: 'System Admin Dashboard', desc: '81+ فحصاً آلياً لسلامة النظام', descEn: '81+ automated system health checks with comprehensive status reports' },
      { name: 'إدارة المنظمات', nameEn: 'Organization Management', desc: 'أنواع متعددة: مولد، ناقل، مدور، وسيط، مدفن', descEn: 'Multiple types: generator, transporter, recycler, broker, landfill' },
      { name: 'الصلاحيات والأدوار', nameEn: 'Roles & Permissions', desc: 'مالك، مدير، مشغل، سائق، مراقب مع تخصيص كامل', descEn: 'Owner, admin, operator, driver, observer with full customization' },
      { name: 'سجلات التدقيق', nameEn: 'Audit Logs', desc: 'تسجيل كامل لكل إجراء مع بيانات IP والجهاز', descEn: 'Complete logging of every action with IP and device data' },
      { name: 'النسخ الاحتياطي', nameEn: 'Backup & Archive', desc: 'نسخ احتياطي تلقائي ويدوي مع أرشفة ذكية', descEn: 'Automatic and manual backup with smart archiving and retention policies' },
      { name: 'المصادقة البيومترية', nameEn: 'Biometric Authentication', desc: 'بصمة الإصبع و Face ID مع مصادقة ثنائية', descEn: 'Fingerprint and Face ID with two-factor authentication for maximum security' },
      { name: 'التوقيع والختم الرقمي', nameEn: 'Digital Signatures & Stamps', desc: 'إدارة التوقيعات والأختام مع توقيع تلقائي', descEn: 'Manage official signatures and stamps with auto-signing per settings' },
      { name: 'المفوضون بالتوقيع', nameEn: 'Authorized Signatories', desc: 'قائمة المفوضين بالتوقيع على المستندات', descEn: 'Manage authorized signatories for contracts, certificates & invoices with specific permissions' },
    ]
  },
];

export const industries = [
  { name: 'إدارة النفايات الصلبة', nameEn: 'Solid Waste Management', icon: Package },
  { name: 'إعادة التدوير', nameEn: 'Recycling', icon: Recycle },
  { name: 'النفايات الخطرة', nameEn: 'Hazardous Waste', icon: AlertTriangle },
  { name: 'النفايات الطبية', nameEn: 'Medical Waste', icon: HeartPulse },
  { name: 'البناء والهدم', nameEn: 'Construction & Demolition', icon: Building2 },
  { name: 'النفايات الإلكترونية', nameEn: 'E-Waste', icon: Cpu },
  { name: 'البلديات والمدن', nameEn: 'Municipalities', icon: Landmark },
  { name: 'المناطق الصناعية', nameEn: 'Industrial Zones', icon: Factory },
  { name: 'اللوجستيات البيئية', nameEn: 'Environmental Logistics', icon: Truck },
  { name: 'الاستشارات البيئية', nameEn: 'Environmental Consulting', icon: Target },
  { name: 'التأمين البيئي', nameEn: 'Environmental Insurance', icon: Umbrella },
  { name: 'الجهات الرقابية', nameEn: 'Regulatory Bodies', icon: Shield },
];

export const documentAIFeatures = [
  { name: 'التصنيف الذكي للمستندات', nameEn: 'Smart Document Classification', desc: 'تصنيف تلقائي لـ 15+ نوع مستند (فواتير، عقود، تراخيص، تذاكر وزن) بدقة 95%+', descEn: 'Auto-classify 15+ document types (invoices, contracts, licenses, weight tickets) with 95%+ accuracy' },
  { name: 'استخراج البيانات المهيكلة', nameEn: 'Structured Data Extraction', desc: 'استخراج تلقائي للأرقام المرجعية والتواريخ والمبالغ والأوزان والبيانات الجدولية', descEn: 'Auto-extract reference numbers, dates, amounts, weights & tabular data' },
  { name: 'الملخص الذكي', nameEn: 'Smart Summarization', desc: 'ملخص شامل ومفيد لكل مستند يوضح المحتوى والغرض والبيانات المهمة', descEn: 'Comprehensive summary for each document explaining content, purpose & key data' },
  { name: 'تحليل المخاطر والامتثال', nameEn: 'Risk & Compliance Analysis', desc: 'تقييم صلاحية المستند واكتمال البيانات والتوافق مع المتطلبات القانونية', descEn: 'Assess document validity, data completeness & legal compliance requirements' },
  { name: 'التحقق من التوقيعات والأختام', nameEn: 'Signature & Seal Verification', desc: 'التحقق البصري من وجود وصحة التوقيعات والأختام الرسمية على المستندات', descEn: 'Visual verification of signature and official seal presence and authenticity' },
  { name: 'دعم ثنائي اللغة', nameEn: 'Bilingual Support', desc: 'دعم كامل للمستندات العربية والإنجليزية والمختلطة', descEn: 'Full support for Arabic, English & mixed-language documents' },
];

export const impactNumbers = [
  { label: 'توفير في الوقت', labelEn: 'Time Saved', value: '85%', desc: 'مقارنة بالعمليات الورقية', descEn: 'vs. paper-based operations' },
  { label: 'دقة البيانات', labelEn: 'Data Accuracy', value: '99.2%', desc: 'بفضل الأتمتة والـ AI', descEn: 'thanks to automation & AI' },
  { label: 'تقليل الأخطاء', labelEn: 'Error Reduction', value: '95%', desc: 'في إدخال البيانات', descEn: 'in data entry' },
  { label: 'سرعة المعالجة', labelEn: 'Processing Speed', value: '10x', desc: 'أسرع من الطرق التقليدية', descEn: 'faster than traditional methods' },
  { label: 'تقليل التكاليف', labelEn: 'Cost Reduction', value: '60%', desc: 'في التكاليف التشغيلية', descEn: 'in operational costs' },
  { label: 'رضا العملاء', labelEn: 'Customer Satisfaction', value: '97%', desc: 'معدل رضا المستخدمين', descEn: 'user satisfaction rate' },
];
