import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Search, MapPin, Phone, Mail, Globe, Download, Factory, Recycle, Truck, FileSpreadsheet, ExternalLink, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface Company {
  name: string;
  name_ar: string;
  type: string;
  type_en: string;
  governorate: string;
  governorate_en: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  certifications: string;
  specialty: string;
  experience?: string;
}

// Embedded company data from research
const COMPANIES_DATA: Company[] = [
  { name: "Outgreens", name_ar: "أوتجرينز", type: "استشارات بيئية", type_en: "Environmental Consulting", governorate: "القاهرة", governorate_en: "Cairo", address: "3 Road 159, Maadi 11728, Cairo", phone: "1200560000", email: "hello@outgreens.net", website: "https://outgreens.com/", certifications: "ISO 9001/14001/45001", specialty: "تحسين الأداء البيئي وتقليل البصمة الكربونية" },
  { name: "Integral Consult", name_ar: "انتجرال كونسلت", type: "استشارات بيئية", type_en: "Environmental Consulting", governorate: "القاهرة", governorate_en: "Cairo", address: "2075 Al Mearaj City, Maadi, Cairo", phone: "+20 2 2520 4515", email: "info@integral-egypt.com", website: "https://integral-egypt.com/", certifications: "", specialty: "تقييم الأثر البيئي والطاقة وإدارة المخلفات", experience: "20 سنة" },
  { name: "ECARU", name_ar: "إيكارو", type: "إدارة مخلفات صلبة", type_en: "Solid Waste Management", governorate: "القاهرة", governorate_en: "Cairo", address: "El Obour City - first industrial zone", phone: "+20244891061", email: "info@ecaru.net", website: "https://ecaru.net/", certifications: "ISO 9001/14001/18001", specialty: "الكتلة الحيوية والمخلفات الصلبة البلدية", experience: "27 سنة" },
  { name: "Ertekaa", name_ar: "ارتقاء", type: "إدارة مخلفات", type_en: "Waste Management", governorate: "الجيزة", governorate_en: "Giza", address: "Haram City, 6th of October, Giza", phone: "+201273758800", email: "ertekaa@ertekaa.org", website: "https://ertekaa.org/", certifications: "ISO 9001/14001/45001", specialty: "إدارة المخلفات الصلبة ومخلفات البناء", experience: "16 سنة" },
  { name: "Geocycle Egypt", name_ar: "جيوسايكل مصر", type: "معالجة مخلفات", type_en: "Waste Processing", governorate: "القاهرة", governorate_en: "Cairo", address: "Summit 15, El Teseen St., 5th Settlement", phone: "", email: "INFO-EGYPT@GEOCYCLE.COM", website: "https://www.geocycle.com/geocycle-egypt", certifications: "", specialty: "معالجة المخلفات الصناعية" },
  { name: "Bekia", name_ar: "بيكيا", type: "جمع مخلفات", type_en: "Waste Collection", governorate: "الجيزة", governorate_en: "Giza", address: "42 El Madina El Monawwara, Dokki, Giza", phone: "01125428292", email: "hello@bekia-egypt.com", website: "https://www.bekia-egypt.com/", certifications: "", specialty: "جمع المخلفات الصلبة المفصولة من المنازل مجاناً", experience: "6 سنوات" },
  { name: "Al Haram Metals", name_ar: "الهرم للمعادن", type: "تدوير معادن", type_en: "Metal Recycling", governorate: "كفر الشيخ", governorate_en: "Kafr El-Sheikh", address: "كفر الشيخ", phone: "", email: "", website: "", certifications: "", specialty: "تدوير النحاس والألومنيوم وإنتاج سبائك" },
  { name: "Plastics Egypt", name_ar: "بلاستيك إيجيبت", type: "تدوير بلاستيك", type_en: "Plastic Recycling", governorate: "الجيزة", governorate_en: "Giza", address: "القاهرة، الجيزة", phone: "", email: "", website: "", certifications: "", specialty: "تدوير البلاستيك الحراري منذ 1991" },
  { name: "EERC", name_ar: "المصرية لتدوير الإلكترونيات", type: "تدوير إلكترونيات", type_en: "E-Waste Recycling", governorate: "الجيزة", governorate_en: "Giza", address: "الجيزة", phone: "", email: "", website: "", certifications: "", specialty: "تدوير المخلفات الإلكترونية بطريقة مسؤولة بيئياً" },
  { name: "YASH Recycling", name_ar: "ياش ريسايكلينج", type: "تدوير بلاستيك", type_en: "Plastic Recycling", governorate: "الإسكندرية", governorate_en: "Alexandria", address: "الإسكندرية - منطقة حرة", phone: "", email: "", website: "", certifications: "", specialty: "إنتاج حبيبات بلاستيكية معاد تدويرها" },
  { name: "HiTech Casting", name_ar: "هايتك كاستينج", type: "تدوير ألومنيوم", type_en: "Aluminum Recycling", governorate: "القاهرة", governorate_en: "Cairo", address: "القاهرة", phone: "", email: "", website: "", certifications: "", specialty: "إنتاج سبائك ألومنيوم ثانوية" },
  { name: "مصنع الصفوة", name_ar: "مصنع الصفوة", type: "تدوير بلاستيك", type_en: "Plastic Recycling", governorate: "الإسكندرية", governorate_en: "Alexandria", address: "برج العرب - المنطقة الصناعية الثالثة", phone: "01279999359", email: "", website: "", certifications: "", specialty: "إنتاج وإعادة تدوير البلاستيك" },
  { name: "مصنع الأقصى", name_ar: "مصنع الأقصى للبلاستيك", type: "تدوير بلاستيك", type_en: "Plastic Recycling", governorate: "الجيزة", governorate_en: "Giza", address: "المنطقة الصناعية الثالثة، 6 أكتوبر", phone: "0238341399", email: "", website: "", certifications: "", specialty: "عبوات بلاستيكية وصناديق صناعية" },
  { name: "مصنع بريق", name_ar: "مصنع بريق", type: "تدوير بلاستيك", type_en: "Plastic Recycling", governorate: "الجيزة", governorate_en: "Giza", address: "المنطقة الصناعية السادسة، أكتوبر", phone: "02 38642424", email: "", website: "", certifications: "", specialty: "إعادة تدوير 10 مليار زجاجة بلاستيكية" },
  { name: "المصرية الألمانية", name_ar: "المصرية الألمانية للبلاستيك", type: "تدوير بلاستيك", type_en: "Plastic Recycling", governorate: "الجيزة", governorate_en: "Giza", address: "المنطقة الصناعية السادسة، أكتوبر", phone: "02 38202263", email: "", website: "", certifications: "", specialty: "خامات بلاستيكية عالية الجودة" },
  { name: "شركة أبو الهول", name_ar: "شركة أبو الهول للورق", type: "تدوير ورق", type_en: "Paper Recycling", governorate: "الجيزة", governorate_en: "Giza", address: "نزلة البطران، طريق سقارة، الجيزة", phone: "02-3854214", email: "", website: "", certifications: "", specialty: "إنتاج ورق الكرتون وورق اللف والأكياس" },
  { name: "Marso Chemicals", name_ar: "مارسو كيميكالز", type: "تدوير مطاط", type_en: "Rubber Recycling", governorate: "القاهرة", governorate_en: "Cairo", address: "مصر", phone: "", email: "", website: "", certifications: "", specialty: "تدوير المطاط منذ 1990" },
  { name: "Bee Green", name_ar: "بي جرين", type: "تصدير مخلفات", type_en: "Waste Export", governorate: "المنوفية", governorate_en: "Menoufia", address: "أشمون، المنوفية", phone: "", email: "", website: "", certifications: "", specialty: "تصدير مخلفات إلكترونية وإطارات وورق ومعادن" },
  { name: "مصنع المحروسة", name_ar: "مصنع المحروسة", type: "تدوير بلاستيك", type_en: "Plastic Recycling", governorate: "الشرقية", governorate_en: "Sharqia", address: "منطقة العاشر من رمضان", phone: "0100 198 7779", email: "", website: "", certifications: "", specialty: "حاويات بلاستيكية للمواد الكيميائية والأدوية" },
  { name: "مصنع الإتحاد للكرتون", name_ar: "مصنع الإتحاد للكرتون المضلع", type: "تدوير ورق", type_en: "Paper Recycling", governorate: "القليوبية", governorate_en: "Qalyubia", address: "الخانكة، القليوبية", phone: "02-4680598", email: "", website: "", certifications: "", specialty: "تصنيع الكرتون المضلع" },
];

const getTypeIcon = (type: string) => {
  if (type.includes('تدوير')) return Recycle;
  if (type.includes('نقل') || type.includes('تصدير')) return Truck;
  if (type.includes('استشار')) return Building2;
  return Factory;
};

const getTypeBadgeColor = (type: string): string => {
  if (type.includes('بلاستيك')) return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
  if (type.includes('معادن') || type.includes('ألومنيوم')) return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
  if (type.includes('ورق')) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
  if (type.includes('إلكترونيات')) return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
  if (type.includes('استشار')) return 'bg-teal-500/10 text-teal-600 dark:text-teal-400';
  if (type.includes('مخلفات') || type.includes('جمع')) return 'bg-green-500/10 text-green-600 dark:text-green-400';
  return 'bg-muted text-muted-foreground';
};

const CompanyDirectory = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [govFilter, setGovFilter] = useState('all');

  const types = useMemo(() => [...new Set(COMPANIES_DATA.map(c => c.type))].sort(), []);
  const governorates = useMemo(() => [...new Set(COMPANIES_DATA.map(c => c.governorate))].sort(), []);

  const filtered = useMemo(() => {
    return COMPANIES_DATA.filter(c => {
      const matchSearch = !search || 
        c.name_ar.includes(search) || c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.specialty.includes(search) || c.address.includes(search);
      const matchType = typeFilter === 'all' || c.type === typeFilter;
      const matchGov = govFilter === 'all' || c.governorate === govFilter;
      return matchSearch && matchType && matchGov;
    });
  }, [search, typeFilter, govFilter]);

  const stats = useMemo(() => ({
    total: COMPANIES_DATA.length,
    withEmail: COMPANIES_DATA.filter(c => c.email).length,
    withPhone: COMPANIES_DATA.filter(c => c.phone).length,
    withCert: COMPANIES_DATA.filter(c => c.certifications).length,
    governorates: governorates.length,
    types: types.length,
  }), [governorates, types]);

  const exportData = () => {
    const bom = '\uFEFF';
    const headers = ['الاسم العربي', 'الاسم الإنجليزي', 'النوع', 'المحافظة', 'العنوان', 'التليفون', 'الإيميل', 'الموقع', 'الشهادات', 'التخصص'];
    const rows = filtered.map(c => [c.name_ar, c.name, c.type, c.governorate, c.address, c.phone, c.email, c.website, c.certifications, c.specialty]);
    const csv = bom + [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `دليل-الشركات-${new Date().toISOString().slice(0, 10)}.csv`;
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
                <h1 className="text-lg sm:text-2xl font-bold">دليل الشركات والمصانع</h1>
                <p className="text-muted-foreground text-xs sm:text-sm">{stats.total} شركة في {stats.governorates} محافظة</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={exportData} className="hidden sm:flex">
              <Download className="w-4 h-4 ml-1" /> تصدير
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { label: 'إجمالي', value: stats.total, icon: Building2 },
            { label: 'إيميلات', value: stats.withEmail, icon: Mail },
            { label: 'تليفونات', value: stats.withPhone, icon: Phone },
            { label: 'شهادات ISO', value: stats.withCert, icon: Shield },
            { label: 'محافظات', value: stats.governorates, icon: MapPin },
            { label: 'أنواع', value: stats.types, icon: Factory },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-2 text-center">
                <s.icon className="w-4 h-4 mx-auto mb-0.5 text-muted-foreground" />
                <p className="text-base font-bold">{s.value}</p>
                <p className="text-[9px] text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو التخصص أو العنوان..."
              className="pr-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="النوع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأنواع</SelectItem>
              {types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={govFilter} onValueChange={setGovFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="المحافظة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المحافظات</SelectItem>
              {governorates.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={exportData} className="sm:hidden shrink-0">
            <Download className="w-4 h-4" />
          </Button>
        </div>

        {/* Results */}
        <div className="text-xs text-muted-foreground">
          عرض {filtered.length} من {COMPANIES_DATA.length} شركة
        </div>

        <div className="grid gap-3">
          {filtered.map((company, i) => {
            const Icon = getTypeIcon(company.type);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-sm">{company.name_ar}</h3>
                            {company.name !== company.name_ar && (
                              <p className="text-xs text-muted-foreground" dir="ltr">{company.name}</p>
                            )}
                          </div>
                          <Badge className={`text-[9px] shrink-0 ${getTypeBadgeColor(company.type)}`} variant="outline">
                            {company.type}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-1">{company.specialty}</p>
                        
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <MapPin className="w-3 h-3" /> {company.governorate} — {company.address}
                          </div>
                          {company.phone && (
                            <a href={`tel:${company.phone}`} className="flex items-center gap-1 text-[10px] text-primary hover:underline">
                              <Phone className="w-3 h-3" /> {company.phone}
                            </a>
                          )}
                          {company.email && (
                            <a href={`mailto:${company.email}`} className="flex items-center gap-1 text-[10px] text-primary hover:underline">
                              <Mail className="w-3 h-3" /> {company.email}
                            </a>
                          )}
                          {company.website && (
                            <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-primary hover:underline">
                              <Globe className="w-3 h-3" /> الموقع
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                          {company.certifications && (
                            <Badge variant="outline" className="text-[9px] bg-green-500/10 text-green-600 dark:text-green-400">
                              <Shield className="w-2.5 h-2.5 ml-0.5" /> {company.certifications}
                            </Badge>
                          )}
                          {company.experience && (
                            <Badge variant="outline" className="text-[9px]">
                              {company.experience} خبرة
                            </Badge>
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
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">مصادر البيانات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {[
              { name: 'LogCluster / WFP - Egypt Waste Management Companies', url: 'https://lca.logcluster.org/412-egypt-waste-management-companies-contact-list' },
              { name: 'ScrapMonster - Waste & Recycling Companies in Egypt', url: 'https://www.scrapmonster.com/companies/country/egypt/waste-recycling' },
              { name: 'إيكونوميا - دليل مصانع إعادة تدوير البلاستيك في مصر', url: 'https://economya.net/' },
              { name: 'ميدان المال - مصانع إعادة تدوير الورق في مصر', url: 'https://invest.midanalmal.com/' },
              { name: 'جهاز تنظيم إدارة المخلفات WMRA', url: 'https://www.wmra.gov.eg/' },
            ].map(s => (
              <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[10px] text-primary hover:underline">
                <ExternalLink className="w-3 h-3 shrink-0" /> {s.name}
              </a>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CompanyDirectory;
