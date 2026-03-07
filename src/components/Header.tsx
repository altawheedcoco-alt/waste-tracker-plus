import { memo, useState, useRef, useCallback } from "react";
import { Menu, X, LogIn, UserPlus, Globe, ChevronDown, BookOpen, HelpCircle, GraduationCap, Factory, Recycle, Rocket, Map, MapPin, Route, Scale, Building2, ShieldCheck, Layers, Users, Sparkles, Landmark, MessageCircle, BarChart3, FileCheck, Brain, Shield, Wallet, ClipboardCheck, Headphones, Database, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import GuideButton from "@/components/guide/GuideButton";
import PlatformLogo from "@/components/common/PlatformLogo";
import { useLanguage } from "@/contexts/LanguageContext";

interface DropdownItem {
  label: string;
  href: string;
  icon: React.ElementType;
  desc: string;
  longDesc?: string;
  badge?: string;
}

interface NavDropdown {
  label: string;
  icon: React.ElementType;
  items: DropdownItem[];
  columns?: number;
  megaShowcase?: boolean;
  footer?: { label: string; href: string; icon: React.ElementType };
}

interface NavDropdown {
  label: string;
  icon: React.ElementType;
  items: DropdownItem[];
  columns?: number;
  footer?: { label: string; href: string; icon: React.ElementType };
}

const Header = memo(() => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout>>();

  const handleLogin = () => navigate('/auth?mode=login');
  const handleEmployeeLogin = () => navigate('/auth?mode=employee');

  const dropdowns: NavDropdown[] = [
    {
      label: language === 'ar' ? 'اكتشف المنصة' : 'Discover',
      icon: Eye,
      columns: 2,
      megaShowcase: true,
      items: [
        { label: language === 'ar' ? 'لوحات التحكم الذكية' : 'Smart Dashboards', href: '#features', icon: BarChart3, 
          desc: language === 'ar' ? '58 ودجت تخصصي وتحليلات لحظية' : '58 specialized widgets & real-time analytics',
          longDesc: language === 'ar' ? 'تحكّم بكل تفصيلة — 7 تبويبات تحليلية (مالية، تشغيلية، بيئية، اتجاهات) مع تقارير يومية قابلة للطباعة بثلاثة أنماط: إيصال حراري، A4 عادي، وتقرير شامل مفصّل' : 'Control every detail — 7 analytics tabs with printable daily reports in 3 formats',
          badge: language === 'ar' ? 'متقدم' : 'Pro' },
        { label: language === 'ar' ? 'إدارة المستندات المتقدمة' : 'Advanced Document Hub', href: '#doc-ai', icon: FileCheck, 
          desc: language === 'ar' ? 'رفع ذكي وتصنيف تلقائي وأرشفة رقمية' : 'Smart upload, auto-categorize & digital archive',
          longDesc: language === 'ar' ? 'ارفع عشرات الملفات دفعة واحدة — يُصنّفها النظام تلقائياً حسب نوع مؤسستك (تراخيص، سجلات، موافقات بيئية) مع أرشيف رقمي كامل وبحث فوري' : 'Bulk upload files — auto-categorized by entity type with full digital archive',
          badge: 'AI' },
        { label: language === 'ar' ? 'محرك الذكاء الاصطناعي' : 'AI Engine', href: '#smart-agent', icon: Brain, 
          desc: language === 'ar' ? 'وكيل ذكي يدير عملياتك ويجيب عملائك' : 'Smart agent for operations & customer support',
          longDesc: language === 'ar' ? 'وكيل ذكي يعمل على مدار الساعة — يحلل مستنداتك ويجيب عملائك عبر واتساب وتليجرام ويتنبأ بالمشكلات قبل وقوعها ويُنشئ الطلبات تلقائياً' : 'AI agent working 24/7 — analyzes docs, answers customers & predicts issues',
          badge: 'AI' },
        { label: language === 'ar' ? 'النظام الرقابي المتكامل' : 'Regulatory Oversight', href: '#features', icon: Shield, 
          desc: language === 'ar' ? 'رصد الامتثال والتفتيش والمخالفات' : 'Compliance monitoring & field inspections',
          longDesc: language === 'ar' ? '11 وحدة رقابية متخصصة — من رصد الامتثال وجدولة التفتيش الميداني إلى إصدار المخالفات والعقوبات وتتبع سلسلة الحفظ الرقمية لكل جهة رقابية' : '11 regulatory modules — from compliance to field inspections & penalty tracking' },
        { label: language === 'ar' ? 'النظام المالي الذكي' : 'Smart Financial System', href: '#features', icon: Wallet, 
          desc: language === 'ar' ? 'فوترة آلية ودفتر أستاذ ذكي' : 'Auto-invoicing & smart ledger',
          longDesc: language === 'ar' ? 'فواتير تُصدر تلقائياً مع كل شحنة — دفتر أستاذ يتتبع كل حركة مالية، وإدارة إيداعات ومطالبات وفترات محاسبية بدقة 100% بدون أخطاء بشرية' : 'Auto-invoices per shipment — ledger tracking every transaction with 100% accuracy' },
        { label: language === 'ar' ? 'سلسلة الحفظ الرقمية' : 'Digital Chain of Custody', href: '#features', icon: ClipboardCheck, 
          desc: language === 'ar' ? 'تتبع كل كيلوجرام من المصدر للتدوير' : 'Track every kg from source to recycling',
          longDesc: language === 'ar' ? 'شفافية لا تقبل التلاعب — تتبع كل شحنة من لحظة خروجها من المولّد حتى وصولها للمُدوّر، مع توثيق الأوزان والتوقيعات والصور في كل محطة' : 'Tamper-proof transparency — track shipments with weight, signatures & photos at every stop' },
        { label: language === 'ar' ? 'مركز الاتصالات الذكي' : 'Smart Call Center', href: '#features', icon: Headphones, 
          desc: language === 'ar' ? 'تسجيل وتحليل وتقييم أداء الفريق' : 'Record, analyze & rate team performance',
          longDesc: language === 'ar' ? 'سجّل كل مكالمة وحلّل أداء فريقك بالذكاء الاصطناعي — مؤشرات KPI فورية ومتوسط زمن الاستجابة وتقييم رضا العملاء وترتيب الوكلاء حسب الأداء' : 'Record calls & analyze team with AI — instant KPIs, response time & satisfaction scores' },
        { label: language === 'ar' ? 'مركز بياناتي' : 'My Data Hub', href: '#features', icon: Database, 
          desc: language === 'ar' ? 'كل بياناتك وتراخيصك في مكان واحد' : 'All your data & licenses in one place',
          longDesc: language === 'ar' ? 'لوحة واحدة تجمع كل شيء — بيانات مؤسستك، تراخيصك ومواعيد تجديدها، درجة امتثالك، شركائك، وإحصائياتك المالية والتشغيلية بنظرة واحدة' : 'One dashboard for everything — org data, licenses, compliance score & partner stats' },
      ],
    },
    {
      label: language === 'ar' ? 'أقسام الصفحة' : 'Sections',
      icon: Layers,
      columns: 2,
      items: [
        { label: language === 'ar' ? 'شركاء النجاح' : 'Trusted Partners', href: '#partners', icon: Building2, desc: language === 'ar' ? 'الجهات الرسمية الشريكة' : 'Official partner organizations' },
        { label: language === 'ar' ? 'إحصائيات المنصة' : 'Platform Stats', href: '#stats', icon: Rocket, desc: language === 'ar' ? 'أرقام وإنجازات المنصة' : 'Platform numbers & achievements' },
        { label: language === 'ar' ? 'التحقق من المستندات' : 'Document Verification', href: '#verify', icon: Scale, desc: language === 'ar' ? 'تحقق من صحة الشهادات' : 'Verify certificates authenticity' },
        { label: language === 'ar' ? 'دليل الاستشاريين' : 'Consultants', href: '#consultants', icon: GraduationCap, desc: language === 'ar' ? 'استشاريون ومكاتب معتمدة' : 'Certified consultants' },
        { label: language === 'ar' ? 'المبادرة الوطنية' : 'National Initiative', href: '#initiative', icon: Globe, desc: language === 'ar' ? 'رؤية مصر 2030' : 'Egypt Vision 2030' },
        { label: language === 'ar' ? 'مميزات المنصة' : 'Features', href: '#features', icon: Sparkles, desc: language === 'ar' ? 'إمكانيات وأدوات المنصة' : 'Platform capabilities' },
        { label: language === 'ar' ? 'الذكاء الاصطناعي' : 'AI Tools', href: '#doc-ai', icon: BookOpen, desc: language === 'ar' ? 'تحليل ذكي للمستندات' : 'AI document analysis', badge: 'AI' },
        { label: language === 'ar' ? 'الخدمات' : 'Services', href: '#services', icon: Recycle, desc: language === 'ar' ? 'خدمات إدارة المخلفات' : 'Waste services' },
        { label: language === 'ar' ? 'منصة عُمالنا' : 'Omaluna', href: '#omaluna', icon: Users, desc: language === 'ar' ? 'نظام التوظيف المتكامل' : 'Recruitment system', badge: language === 'ar' ? 'جديد' : 'New' },
        { label: language === 'ar' ? 'إشعارات واتساب' : 'WhatsApp Alerts', href: '#whatsapp-notifications', icon: MessageCircle, desc: language === 'ar' ? 'إشعارات فورية عبر واتساب' : 'Instant WhatsApp notifications', badge: language === 'ar' ? 'جديد' : 'New' },
        { label: language === 'ar' ? 'قصص النجاح' : 'Testimonials', href: '#testimonials', icon: HelpCircle, desc: language === 'ar' ? 'تجارب العملاء' : 'Customer stories' },
      ],
    },
    {
      label: t('nav.resources') || (language === 'ar' ? 'المصادر' : 'Resources'),
      icon: BookOpen,
      items: [
        { label: language === 'ar' ? 'المدونة' : 'Blog', href: '/blog', icon: BookOpen, desc: language === 'ar' ? 'مقالات ونصائح بيئية' : 'Environmental articles & tips' },
        { label: language === 'ar' ? 'تاريخ التدوير' : 'Recycling History', href: '/recycling-history', icon: Landmark, desc: language === 'ar' ? 'من الفراعنة للعصر الرقمي' : 'From Pharaohs to digital age', badge: language === 'ar' ? 'جديد' : 'New' },
        { label: language === 'ar' ? 'مركز المساعدة' : 'Help Center', href: '/help', icon: HelpCircle, desc: language === 'ar' ? 'أسئلة شائعة ودعم فني' : 'FAQ & technical support' },
        { label: language === 'ar' ? 'أكاديمية التدوير' : 'Recycling Academy', href: '/academy', icon: GraduationCap, desc: language === 'ar' ? 'تعلم تصنيف المخلفات' : 'Learn waste classification' },
        { label: language === 'ar' ? 'التشريعات' : 'Legislation', href: '/legislation', icon: Scale, desc: language === 'ar' ? 'الضوابط القانونية' : 'Legal regulations' },
        { label: language === 'ar' ? 'عن المنصة' : 'About Us', href: '/about', icon: Building2, desc: language === 'ar' ? 'الرؤية والمهمة' : 'Vision & mission' },
        { label: language === 'ar' ? 'سياسات المنصة' : 'Policies', href: '/policies', icon: ShieldCheck, desc: language === 'ar' ? 'الإطار القانوني الشامل' : 'Legal framework' },
        { label: language === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions', href: '/terms', icon: Scale, desc: language === 'ar' ? 'شروط استخدام المنصة والالتزام القانوني' : 'Platform usage terms & legal compliance' },
      ],
      footer: { label: language === 'ar' ? 'عرض جميع المصادر' : 'View all resources', href: '/help', icon: BookOpen },
    },
    {
      label: t('nav.partners') || (language === 'ar' ? 'الشركاء' : 'Partners'),
      icon: Factory,
      items: [
        { label: language === 'ar' ? 'حلول للمصانع' : 'For Factories', href: '/partnerships', icon: Factory, desc: language === 'ar' ? 'إدارة عوادم الإنتاج' : 'Production waste management' },
        { label: language === 'ar' ? 'لجامعي المخلفات' : 'For Collectors', href: '/partnerships', icon: Recycle, desc: language === 'ar' ? 'انضم كشريك لوجستي' : 'Join as logistics partner' },
        { label: language === 'ar' ? 'للجهات الحكومية' : 'For Government', href: '/partnerships', icon: Building2, desc: language === 'ar' ? 'تقارير وبيانات جغرافية' : 'Analytics & geodata' },
      ],
    },
    {
      label: language === 'ar' ? 'الخرائط' : 'Maps',
      icon: MapPin,
      items: [
        { label: language === 'ar' ? 'نقاط الاستلام' : 'Collection Points', href: '/map', icon: MapPin, desc: language === 'ar' ? 'أقرب نقطة تجميع' : 'Nearest collection point' },
        { label: language === 'ar' ? 'تخطيط النقل' : 'Transport', href: '/track', icon: Route, desc: language === 'ar' ? 'خطط عمليات النقل' : 'Plan transport ops' },
        { label: language === 'ar' ? 'خريطة مباشرة' : 'Live Map', href: '/map', icon: Map, desc: language === 'ar' ? 'تتبع لحظي' : 'Real-time tracking', badge: 'Live' },
      ],
    },
  ];

  const handleDropdownEnter = useCallback((label: string) => {
    clearTimeout(dropdownTimeout.current);
    setOpenDropdown(label);
  }, []);

  const handleDropdownLeave = useCallback(() => {
    dropdownTimeout.current = setTimeout(() => setOpenDropdown(null), 250);
  }, []);

  const handleNavClick = useCallback((href: string) => {
    setOpenDropdown(null);
    setIsMenuOpen(false);
    if (href.startsWith('#')) {
      const el = document.getElementById(href.slice(1));
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate(href);
    }
  }, [navigate]);

  return (
    <header className="fixed top-0 left-0 right-0 z-[60] border-b border-border/30 animate-fade-in" style={{ WebkitBackdropFilter: 'blur(24px) saturate(1.8)' }}>
      {/* Gradient top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-emerald-400 to-primary opacity-80" />
      
      <div className="bg-white/85 dark:bg-card/85 backdrop-blur-2xl shadow-sm">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-16 sm:h-[72px]">
            {/* Logo */}
            <div
              className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
              onClick={() => navigate('/')}
            >
              <div className="transition-transform duration-300 group-hover:scale-105">
                <PlatformLogo size="md" showText priority />
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {dropdowns.map((dropdown) => (
                <div
                  key={dropdown.label}
                  className="relative"
                  onMouseEnter={() => handleDropdownEnter(dropdown.label)}
                  onMouseLeave={handleDropdownLeave}
                >
                  <button
                    className={`group flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold rounded-xl transition-all duration-200 ${
                      openDropdown === dropdown.label
                        ? 'text-primary bg-primary/8'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                    onClick={() => setOpenDropdown(openDropdown === dropdown.label ? null : dropdown.label)}
                  >
                    <dropdown.icon className={`w-3.5 h-3.5 transition-colors ${openDropdown === dropdown.label ? 'text-primary' : 'text-muted-foreground/60 group-hover:text-foreground/70'}`} />
                    {dropdown.label}
                    <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${openDropdown === dropdown.label ? 'rotate-180 text-primary' : ''}`} />
                  </button>

                  {/* Mega Dropdown */}
                  {openDropdown === dropdown.label && (
                    <div
                      className={`absolute top-full mt-2 bg-background border border-border/60 rounded-2xl shadow-2xl shadow-black/8 z-50 overflow-hidden animate-fade-in ${
                        dropdown.megaShowcase ? 'w-[640px]' : dropdown.columns === 2 ? 'w-[520px]' : 'w-[300px]'
                      }`}
                      style={{ [language === 'ar' ? 'right' : 'left']: 0 }}
                      onMouseEnter={() => handleDropdownEnter(dropdown.label)}
                      onMouseLeave={handleDropdownLeave}
                    >
                      {/* Dropdown header */}
                      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                        <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider">{dropdown.label}</p>
                        {dropdown.megaShowcase && (
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            {language === 'ar' ? '٨ أنظمة متكاملة' : '8 integrated systems'}
                          </span>
                        )}
                      </div>

                      <div className={`px-2 pb-2 ${dropdown.columns === 2 || dropdown.megaShowcase ? 'grid grid-cols-2 gap-0.5' : 'flex flex-col gap-0.5'} ${dropdown.megaShowcase ? 'max-h-[70vh] overflow-y-auto scrollbar-thin' : ''}`}>
                        {dropdown.items.map((item) => (
                          <button
                            key={item.href + item.label}
                            onClick={() => handleNavClick(item.href)}
                            className={`flex items-start gap-3 w-full p-3 rounded-xl hover:bg-accent/70 transition-all duration-150 text-start group/item ${dropdown.megaShowcase ? 'p-4' : ''}`}
                          >
                            <div className={`rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center flex-shrink-0 group-hover/item:from-primary/20 group-hover/item:to-primary/10 group-hover/item:shadow-sm transition-all ${dropdown.megaShowcase ? 'w-11 h-11' : 'w-9 h-9'}`}>
                              <item.icon className={`text-primary ${dropdown.megaShowcase ? 'w-5 h-5' : 'w-4 h-4'}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-semibold text-foreground group-hover/item:text-primary transition-colors">{item.label}</p>
                                {item.badge && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-primary/10 text-primary leading-none">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              {dropdown.megaShowcase && item.longDesc ? (
                                <p className="text-[11px] text-muted-foreground mt-1 leading-[1.6] line-clamp-3">{item.longDesc}</p>
                              ) : (
                                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-1">{item.desc}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Footer CTA */}
                      {dropdown.footer && (
                        <div className="border-t border-border/40 px-2 py-2">
                          <button
                            onClick={() => handleNavClick(dropdown.footer!.href)}
                            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
                          >
                            <dropdown.footer.icon className="w-4 h-4" />
                            {dropdown.footer.label}
                            <ChevronDown className={`w-3 h-3 ${language === 'ar' ? 'rotate-90' : '-rotate-90'}`} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border/50 bg-background/60 text-xs font-bold text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                aria-label="Switch language"
              >
                <Globe className="w-3.5 h-3.5" />
                {language === 'ar' ? 'EN' : 'عربي'}
              </button>
              <GuideButton />
              <Button variant="outline" size="sm" onClick={handleEmployeeLogin} className="gap-1.5 text-xs font-semibold rounded-xl h-9 px-3 border-border/50 hover:border-primary/30 hover:bg-primary/5 hover:text-primary">
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">{t('nav.employeeLogin')}</span>
                <span className="xl:hidden">{t('nav.employee')}</span>
              </Button>
              <Button variant="eco" size="sm" onClick={handleLogin} className="gap-1.5 text-xs font-semibold rounded-xl h-9 px-4 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-shadow">
                <LogIn className="w-3.5 h-3.5" />
                {t('nav.login')}
              </Button>
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl text-foreground hover:bg-accent/50 transition-colors touch-manipulation"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-background border-t border-border/30 animate-fade-in max-h-[75vh] overflow-y-auto shadow-2xl relative z-50">
          <div className="container mx-auto px-3 py-4">
            <nav className="flex flex-col gap-1">
              {dropdowns.map((dropdown) => (
                <MobileDropdown key={dropdown.label} dropdown={dropdown} onNavigate={handleNavClick} />
              ))}
              <div className="flex flex-col gap-2.5 pt-4 border-t border-border/40 mt-3">
                <button
                  onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                  className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-border/50 bg-background text-sm font-semibold text-muted-foreground hover:text-primary hover:border-primary/30 transition-all touch-manipulation"
                >
                  <Globe className="w-4 h-4" />
                  {language === 'ar' ? 'English' : 'عربي'}
                </button>
                <GuideButton />
                <Button variant="outline" className="w-full gap-2 h-11 rounded-xl touch-manipulation font-semibold" onClick={handleEmployeeLogin}>
                  <UserPlus className="w-4 h-4" />
                  {t('nav.employeeLogin')}
                </Button>
                <Button variant="eco" className="w-full gap-2 h-11 rounded-xl touch-manipulation font-semibold shadow-md shadow-primary/20" onClick={handleLogin}>
                  <LogIn className="w-4 h-4" />
                  {t('nav.login')}
                </Button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
});

Header.displayName = 'Header';

const MobileDropdown = ({ dropdown, onNavigate }: { dropdown: NavDropdown; onNavigate: (href: string) => void }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between w-full px-3 py-3 text-sm font-semibold rounded-xl transition-all touch-manipulation ${
          open ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
        }`}
      >
        <div className="flex items-center gap-2">
          <dropdown.icon className={`w-4 h-4 ${open ? 'text-primary' : 'text-muted-foreground/60'}`} />
          {dropdown.label}
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="ps-3 pe-1 pb-2 flex flex-col gap-0.5 animate-fade-in">
          {dropdown.items.map((item) => (
            <button
              key={item.href + item.label}
              onClick={() => onNavigate(item.href)}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-accent/60 transition-colors text-start touch-manipulation group"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                <item.icon className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-primary/10 text-primary leading-none">
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-1">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Header;
