import { memo, useState, useRef, useCallback } from "react";
import { Menu, X, LogIn, UserPlus, Globe, ChevronDown, BookOpen, HelpCircle, GraduationCap, Factory, Recycle, Rocket, Map, MapPin, Route, Scale, Building2, ShieldCheck, Layers, Users, Sparkles, Landmark, MessageCircle, BarChart3, FileCheck, Brain, Shield, Wallet, ClipboardCheck, Headphones, Database, Eye, LayoutDashboard, LogOut, FileText, Sun, Moon, Newspaper, ArrowLeft, ExternalLink, Command, Megaphone, Briefcase, Gavel } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import GuideButton from "@/components/guide/GuideButton";
import PlatformLogo from "@/components/common/PlatformLogo";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeSettings } from "@/contexts/ThemeSettingsContext";
import { toast } from "sonner";

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
  featured?: { title: string; desc: string; href: string; icon: React.ElementType };
  footer?: { label: string; href: string; icon: React.ElementType };
}

const Header = memo(() => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const { user, signOut } = useAuth();
  const { settings, toggleDarkMode } = useThemeSettings();
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout>>();

  const handleLogin = () => navigate('/auth?mode=login');
  const handleEmployeeLogin = () => navigate('/auth?mode=employee');
  const handleGoToDashboard = () => navigate('/dashboard');
  const handleLogout = async () => {
    await signOut();
    toast.success('تم تسجيل الخروج بنجاح');
    navigate('/');
  };

  const dropdowns: NavDropdown[] = [
    {
      label: t('header.discover'),
      icon: Command,
      columns: 2,
      megaShowcase: true,
      featured: {
        title: language === 'ar' ? 'منصة متكاملة' : 'All-in-One Platform',
        desc: language === 'ar' ? 'اكتشف كيف تُحوّل iRecycle إدارة المخلفات بالذكاء الاصطناعي' : 'Discover how iRecycle transforms waste management with AI',
        href: '#features',
        icon: Sparkles,
      },
      items: [
        { label: t('header.smartDashboards'), href: '#features', icon: BarChart3, desc: t('header.smartDashboardsDesc'), longDesc: t('header.smartDashboardsLong'), badge: t('header.pro') },
        { label: t('header.advancedDocHub'), href: '#doc-ai', icon: FileCheck, desc: t('header.advancedDocHubDesc'), longDesc: t('header.advancedDocHubLong'), badge: 'AI' },
        { label: t('header.aiEngine'), href: '#smart-agent', icon: Brain, desc: t('header.aiEngineDesc'), longDesc: t('header.aiEngineLong'), badge: 'AI' },
        { label: t('header.regulatoryOversight'), href: '#features', icon: Shield, desc: t('header.regulatoryOversightDesc'), longDesc: t('header.regulatoryOversightLong') },
        { label: t('header.smartFinancial'), href: '#features', icon: Wallet, desc: t('header.smartFinancialDesc'), longDesc: t('header.smartFinancialLong') },
        { label: t('header.digitalChain'), href: '#features', icon: ClipboardCheck, desc: t('header.digitalChainDesc'), longDesc: t('header.digitalChainLong') },
        { label: t('header.smartCallCenter'), href: '#features', icon: Headphones, desc: t('header.smartCallCenterDesc'), longDesc: t('header.smartCallCenterLong') },
        { label: t('header.myDataHub'), href: '#features', icon: Database, desc: t('header.myDataHubDesc'), longDesc: t('header.myDataHubLong') },
      ],
    },
    {
      label: t('header.sections'),
      icon: Layers,
      columns: 2,
      items: [
        { label: t('header.trustedPartners'), href: '#partners', icon: Building2, desc: t('header.trustedPartnersDesc') },
        { label: t('header.platformStats'), href: '#stats', icon: Rocket, desc: t('header.platformStatsDesc') },
        { label: t('header.docVerification'), href: '#verify', icon: Scale, desc: t('header.docVerificationDesc') },
        { label: t('header.consultants'), href: '#consultants', icon: GraduationCap, desc: t('header.consultantsDesc') },
        { label: t('header.nationalInitiative'), href: '#initiative', icon: Globe, desc: t('header.nationalInitiativeDesc') },
        { label: t('header.platformFeatures'), href: '#features', icon: Sparkles, desc: t('header.platformFeaturesDesc') },
        { label: t('header.aiTools'), href: '#doc-ai', icon: BookOpen, desc: t('header.aiToolsDesc'), badge: 'AI' },
        { label: t('header.servicesNav'), href: '#services', icon: Recycle, desc: t('header.servicesNavDesc') },
        { label: t('header.omaluna'), href: '#omaluna', icon: Users, desc: t('header.omalunaDesc'), badge: t('header.new') },
        { label: t('header.whatsappAlerts'), href: '#whatsapp-notifications', icon: MessageCircle, desc: t('header.whatsappAlertsDesc'), badge: t('header.new') },
        { label: t('header.testimonials'), href: '#testimonials', icon: HelpCircle, desc: t('header.testimonialsDesc') },
      ],
    },
    {
      label: t('nav.resources'),
      icon: BookOpen,
      columns: 2,
      items: [
        { label: 'منشورات المنصة', href: '/posts', icon: FileText, desc: 'آخر المقالات والإعلانات', badge: 'جديد' },
        { label: t('header.blog'), href: '/blog', icon: BookOpen, desc: t('header.blogDesc') },
        { label: t('header.recyclingHistory'), href: '/recycling-history', icon: Landmark, desc: t('header.recyclingHistoryDesc'), badge: t('header.new') },
        { label: t('header.helpCenter'), href: '/help', icon: HelpCircle, desc: t('header.helpCenterDesc') },
        { label: t('header.recyclingAcademy'), href: '/academy', icon: GraduationCap, desc: t('header.recyclingAcademyDesc') },
        { label: t('header.legislation'), href: '/legislation', icon: Scale, desc: t('header.legislationDesc') },
        { label: t('header.aboutUs'), href: '/about', icon: Building2, desc: t('header.aboutUsDesc') },
        { label: 'رحلة المنصة', href: '/journey', icon: Rocket, desc: 'الإنجازات والقائمون على المشروع', badge: 'جديد' },
        { label: t('header.policies'), href: '/policies', icon: ShieldCheck, desc: t('header.policiesDesc') },
        { label: t('header.termsConditions'), href: '/terms', icon: Scale, desc: t('header.termsConditionsDesc') },
      ],
      footer: { label: t('header.viewAllResources'), href: '/help', icon: BookOpen },
    },
    {
      label: t('nav.partners'),
      icon: Factory,
      items: [
        { label: t('header.forFactories'), href: '/partnerships', icon: Factory, desc: t('header.forFactoriesDesc') },
        { label: t('header.forCollectors'), href: '/partnerships', icon: Recycle, desc: t('header.forCollectorsDesc') },
        { label: t('header.forGovernment'), href: '/partnerships', icon: Building2, desc: t('header.forGovernmentDesc') },
      ],
    },
    {
      label: t('header.maps'),
      icon: MapPin,
      items: [
        { label: t('header.collectionPoints'), href: '/map', icon: MapPin, desc: t('header.collectionPointsDesc') },
        { label: t('header.transportPlanning'), href: '/track', icon: Route, desc: t('header.transportPlanningDesc') },
        { label: t('header.liveMap'), href: '/map', icon: Map, desc: t('header.liveMapDesc'), badge: 'Live' },
      ],
    },
  ];

  const handleDropdownEnter = useCallback((label: string) => {
    clearTimeout(dropdownTimeout.current);
    setOpenDropdown(label);
  }, []);

  const handleDropdownLeave = useCallback(() => {
    dropdownTimeout.current = setTimeout(() => setOpenDropdown(null), 200);
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
    <header className="fixed top-0 left-0 right-0 z-[60] animate-fade-in">
      {/* Golden version bar */}
      <div className="h-7 bg-gradient-to-r from-amber-950/90 via-amber-900/80 to-amber-950/90 dark:from-amber-950/95 dark:via-amber-900/85 dark:to-amber-950/95 border-b border-amber-700/30 overflow-hidden relative">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(251,191,36,0.08)_40%,rgba(251,191,36,0.15)_50%,rgba(251,191,36,0.08)_60%,transparent_100%)] animate-[shimmer_3s_ease-in-out_infinite]" />
        <div className="relative h-full flex items-center justify-center gap-2.5">
          <Sparkles className="w-3 h-3 text-amber-400/70 animate-pulse" />
          <span className="text-[10px] sm:text-[11px] font-semibold text-amber-200/70 tracking-wide">
            {language === 'ar' ? 'منصة iRecycle — الإصدار' : 'iRecycle Platform — Version'}
          </span>
          <span className="relative inline-flex items-center">
            <span className="absolute inset-0 blur-lg bg-amber-400/40 rounded-full scale-150" />
            <span className="absolute inset-0 blur-sm bg-amber-300/30 rounded-full scale-125" />
            <span className="relative px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-amber-950 text-[10px] sm:text-[11px] font-black tracking-wider shadow-[0_0_15px_rgba(251,191,36,0.5),0_0_30px_rgba(251,191,36,0.25)] border border-amber-300/50">
              v5.1
            </span>
          </span>
          <span className="hidden sm:inline text-[10px] font-medium text-amber-300/50 tracking-wide">
            {language === 'ar' ? '— النضج المتكامل' : '— Full Maturity'}
          </span>
          <Sparkles className="w-3 h-3 text-amber-400/70 animate-pulse" />
        </div>
      </div>

      {/* Top utility bar - corporate style */}
      <div className="hidden lg:block bg-foreground/[0.03] dark:bg-foreground/[0.04] border-b border-border/15">
        <div className="w-full mx-auto px-5 max-w-[1400px]">
          <div className="flex items-center justify-between h-8">
            {/* Left: Quick links */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleNavClick('#ticker')}
                className="flex items-center gap-1.5 text-[10.5px] font-bold text-primary/70 hover:text-primary transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {language === 'ar' ? 'آخر الأخبار والتحديثات' : 'Latest News & Updates'}
              </button>
              <span className="w-px h-3 bg-border/30" />
              <button
                onClick={() => handleNavClick('/posts')}
                className="text-[10.5px] font-bold text-muted-foreground/60 hover:text-foreground/80 transition-colors"
              >
                {language === 'ar' ? 'المنشورات' : 'Posts'}
              </button>
              <button
                onClick={() => handleNavClick('/help')}
                className="text-[10.5px] font-bold text-muted-foreground/60 hover:text-foreground/80 transition-colors"
              >
                {language === 'ar' ? 'مركز المساعدة' : 'Help Center'}
              </button>
            </div>

            {/* Right: Utilities */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleDarkMode}
                className="relative flex items-center justify-center w-6 h-6 rounded text-muted-foreground/50 hover:text-foreground/70 transition-all duration-300"
                aria-label="Toggle theme"
              >
                <Sun className={`w-3 h-3 absolute transition-all duration-400 ${settings.isDarkMode ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
                <Moon className={`w-3 h-3 absolute transition-all duration-400 ${settings.isDarkMode ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`} />
              </button>
              <span className="w-px h-3 bg-border/20" />
              <button
                onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                className="flex items-center gap-1 text-[10.5px] font-bold text-muted-foreground/50 hover:text-foreground/70 transition-colors"
              >
                <Globe className="w-3 h-3" />
                {language === 'ar' ? 'English' : 'عربي'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation bar */}
      <div className="bg-background dark:bg-card border-b border-border/30 shadow-[0_1px_4px_0_hsl(var(--foreground)/0.06),0_0_0_1px_hsl(var(--border)/0.1)]">
        <div className="w-full mx-auto px-3 sm:px-5 max-w-[1400px]">
          <div className="flex items-center h-[52px] sm:h-[60px]">
            
            {/* Mobile toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-foreground/60 hover:text-foreground hover:bg-accent/50 transition-all touch-manipulation flex-shrink-0"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Logo */}
            <div
              className="flex items-center cursor-pointer group flex-shrink-0"
              onClick={() => navigate('/')}
            >
              <div className="transition-transform duration-300 group-hover:scale-[1.02]">
                <PlatformLogo size="lg" showText priority />
              </div>
            </div>

            {/* Vertical divider */}
            <div className="hidden lg:block w-px h-8 bg-gradient-to-b from-transparent via-border/40 to-transparent mx-3 flex-shrink-0" />

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-0 flex-1 min-w-0 overflow-visible">
              {dropdowns.map((dropdown, index) => (
                <div
                  key={dropdown.label}
                  className={`relative ${index >= 4 ? 'hidden xl:block' : ''}`}
                  onMouseEnter={() => handleDropdownEnter(dropdown.label)}
                  onMouseLeave={handleDropdownLeave}
                >
                  <button
                    className={`group flex items-center gap-1.5 px-3 xl:px-3.5 h-[52px] sm:h-[60px] text-[12.5px] xl:text-[13px] font-semibold transition-all duration-200 whitespace-nowrap border-b-2 ${
                      openDropdown === dropdown.label
                        ? 'text-primary border-primary'
                        : 'text-foreground/60 border-transparent hover:text-foreground/85 hover:border-border/60'
                    }`}
                    onClick={() => setOpenDropdown(openDropdown === dropdown.label ? null : dropdown.label)}
                  >
                    <dropdown.icon className={`w-4 h-4 transition-colors ${openDropdown === dropdown.label ? 'text-primary' : 'text-foreground/35 group-hover:text-foreground/55'}`} />
                    {dropdown.label}
                    <ChevronDown className={`w-3 h-3 transition-all duration-300 ${openDropdown === dropdown.label ? 'rotate-180 text-primary' : 'text-foreground/30'}`} />
                  </button>

                  {/* Corporate Mega Dropdown */}
                  {openDropdown === dropdown.label && (
                    <div
                      className={`absolute top-full bg-background border border-border/40 rounded-b-xl shadow-[0_20px_60px_-15px_hsl(var(--foreground)/0.15),0_0_0_1px_hsl(var(--border)/0.2)] z-50 overflow-hidden animate-fade-in ${
                        dropdown.megaShowcase ? 'w-[720px]' : dropdown.columns === 2 ? 'w-[540px]' : 'w-[300px]'
                      }`}
                      style={{ [language === 'ar' ? 'right' : 'left']: '-1rem' }}
                      onMouseEnter={() => handleDropdownEnter(dropdown.label)}
                      onMouseLeave={handleDropdownLeave}
                    >
                      {/* Featured banner for mega showcase */}
                      {dropdown.megaShowcase && dropdown.featured && (
                        <button
                          onClick={() => handleNavClick(dropdown.featured!.href)}
                          className="w-full flex items-center gap-3 px-5 py-3.5 bg-gradient-to-l from-primary/8 via-primary/4 to-transparent border-b border-border/20 hover:from-primary/12 hover:via-primary/6 transition-all group/feat text-start"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md shadow-primary/20 flex-shrink-0">
                            <dropdown.featured.icon className="w-5 h-5 text-primary-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-foreground">{dropdown.featured.title}</p>
                            <p className="text-[11px] text-muted-foreground/70 mt-0.5">{dropdown.featured.desc}</p>
                          </div>
                          <ArrowLeft className={`w-4 h-4 text-primary/40 group-hover/feat:text-primary transition-colors flex-shrink-0 ${language !== 'ar' ? 'rotate-180' : ''}`} />
                        </button>
                      )}

                      {/* Category label */}
                      <div className="px-5 pt-3 pb-1 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.12em]">{dropdown.label}</p>
                        {dropdown.megaShowcase && (
                          <span className="text-[9px] font-bold text-primary/60 bg-primary/5 px-2 py-0.5 rounded-full">
                            {t('header.integratedSystems')}
                          </span>
                        )}
                      </div>

                      {/* Items grid */}
                      <div className={`px-2 pb-2 ${dropdown.columns === 2 || dropdown.megaShowcase ? 'grid grid-cols-2 gap-0' : 'flex flex-col gap-0'} ${dropdown.megaShowcase ? 'max-h-[55vh] overflow-y-auto scrollbar-thin' : ''}`}>
                        {dropdown.items.map((item) => (
                          <button
                            key={item.href + item.label}
                            onClick={() => handleNavClick(item.href)}
                            className="flex items-start gap-3 w-full p-3 rounded-lg hover:bg-accent/50 transition-all duration-150 text-start group/item"
                          >
                            <div className="w-9 h-9 rounded-lg bg-muted/50 dark:bg-muted/30 flex items-center justify-center flex-shrink-0 group-hover/item:bg-primary/10 group-hover/item:shadow-sm transition-all border border-border/10 group-hover/item:border-primary/15">
                              <item.icon className="w-4 h-4 text-foreground/40 group-hover/item:text-primary transition-colors" />
                            </div>
                            <div className="min-w-0 flex-1 pt-0.5">
                              <div className="flex items-center gap-1.5">
                                <p className="text-[12.5px] font-semibold text-foreground/80 group-hover/item:text-foreground transition-colors leading-tight">{item.label}</p>
                                {item.badge && (
                                  <span className="px-1.5 py-px text-[8px] font-bold rounded-sm bg-primary/8 text-primary/70 leading-none">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10.5px] text-muted-foreground/50 mt-0.5 leading-relaxed line-clamp-1">{dropdown.megaShowcase && item.longDesc ? item.longDesc : item.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Footer */}
                      {dropdown.footer && (
                        <div className="border-t border-border/20 px-3 py-2 bg-muted/20">
                          <button
                            onClick={() => handleNavClick(dropdown.footer!.href)}
                            className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-[11.5px] font-semibold text-primary/70 hover:text-primary hover:bg-primary/5 transition-colors"
                          >
                            <dropdown.footer.icon className="w-3.5 h-3.5" />
                            {dropdown.footer.label}
                            <ExternalLink className="w-3 h-3 ms-auto opacity-40" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
              {user ? (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleGoToDashboard}
                    className="gap-2 text-[12px] font-bold rounded-lg h-9 px-4 shadow-md shadow-primary/15 whitespace-nowrap"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    {t('nav.dashboard') || 'لوحة التحكم'}
                  </Button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/8 border border-border/20 hover:border-destructive/20 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleEmployeeLogin}
                    className="hidden xl:flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground/60 hover:text-foreground/80 transition-colors px-3 h-9"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {t('nav.employeeLogin')}
                  </button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleLogin}
                    className="gap-2 text-[12px] font-bold rounded-lg h-9 px-5 shadow-md shadow-primary/15 whitespace-nowrap"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    {t('nav.login')}
                  </Button>
                </>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-background border-t border-border/30 animate-fade-in max-h-[80vh] overflow-y-auto shadow-xl relative z-50 overscroll-contain">
          <div className="mx-auto px-4 py-3">
            <nav className="flex flex-col gap-0.5">
              {/* Quick access */}
              <div className="grid grid-cols-2 gap-2 mb-3 pb-3 border-b border-border/20">
                <button
                  onClick={() => handleNavClick('#ticker')}
                  className="flex items-center gap-2 px-3 py-2.5 text-[11px] font-bold rounded-lg text-primary bg-primary/5 border border-primary/10 transition-all touch-manipulation"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                  {language === 'ar' ? 'الأخبار' : 'News'}
                </button>
                <button
                  onClick={() => handleNavClick('/posts')}
                  className="flex items-center gap-2 px-3 py-2.5 text-[11px] font-bold rounded-lg text-foreground/60 bg-muted/30 border border-border/15 transition-all touch-manipulation"
                >
                  <FileText className="w-3 h-3 flex-shrink-0" />
                  {language === 'ar' ? 'المنشورات' : 'Posts'}
                </button>
              </div>

              {dropdowns.map((dropdown) => (
                <MobileDropdown key={dropdown.label} dropdown={dropdown} onNavigate={handleNavClick} />
              ))}

              {/* Bottom bar */}
              <div className="flex flex-col gap-2.5 pt-3 border-t border-border/20 mt-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                    className="flex items-center justify-center gap-1.5 h-10 rounded-lg border border-border/25 bg-muted/15 text-[11px] font-semibold text-muted-foreground/70 hover:text-foreground transition-all touch-manipulation"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    {language === 'ar' ? 'English' : 'عربي'}
                  </button>
                  <button
                    onClick={toggleDarkMode}
                    className="flex items-center justify-center gap-1.5 h-10 rounded-lg border border-border/25 bg-muted/15 text-[11px] font-semibold text-muted-foreground/70 hover:text-foreground transition-all touch-manipulation"
                  >
                    {settings.isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    {settings.isDarkMode ? 'نهاري' : 'ليلي'}
                  </button>
                </div>
                <GuideButton />
                {user ? (
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="eco" className="col-span-2 gap-1.5 h-10 rounded-lg touch-manipulation font-bold text-[11px] shadow-sm" onClick={() => { setIsMenuOpen(false); handleGoToDashboard(); }}>
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      {t('nav.dashboard') || 'لوحة التحكم'}
                    </Button>
                    <Button variant="outline" className="gap-1 h-10 rounded-lg touch-manipulation font-semibold text-[11px] border-destructive/20 text-destructive/70 hover:bg-destructive/8" onClick={() => { setIsMenuOpen(false); handleLogout(); }}>
                      <LogOut className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-5 gap-2">
                    <Button variant="outline" className="col-span-2 gap-1.5 h-10 rounded-lg touch-manipulation font-semibold text-[11px]" onClick={handleEmployeeLogin}>
                      <UserPlus className="w-3.5 h-3.5" />
                      {t('nav.employee')}
                    </Button>
                    <Button variant="eco" className="col-span-3 gap-1.5 h-10 rounded-lg touch-manipulation font-bold text-[11px] shadow-sm" onClick={handleLogin}>
                      <LogIn className="w-3.5 h-3.5" />
                      {t('nav.login')}
                    </Button>
                  </div>
                )}
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
    <div className="rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between w-full px-3 py-3 text-[12.5px] font-semibold rounded-lg transition-all touch-manipulation ${
          open ? 'text-primary bg-primary/5' : 'text-foreground/55 hover:text-foreground/75 hover:bg-accent/30'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-md flex items-center justify-center border transition-colors ${open ? 'bg-primary/8 border-primary/15' : 'bg-muted/30 border-border/10'}`}>
            <dropdown.icon className={`w-3.5 h-3.5 ${open ? 'text-primary' : 'text-muted-foreground/40'}`} />
          </div>
          {dropdown.label}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="ps-3 pe-1 pb-2 flex flex-col gap-0 animate-fade-in">
          {dropdown.items.map((item) => (
            <button
              key={item.href + item.label}
              onClick={() => onNavigate(item.href)}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-md hover:bg-accent/40 active:bg-accent/60 transition-colors text-start touch-manipulation group"
            >
              <div className="w-7 h-7 rounded-md bg-muted/25 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/8 border border-border/5 group-hover:border-primary/10 transition-all">
                <item.icon className="w-3.5 h-3.5 text-foreground/35 group-hover:text-primary transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[12px] font-medium text-foreground/75">{item.label}</p>
                  {item.badge && (
                    <span className="px-1 py-px text-[7.5px] font-bold rounded-sm bg-primary/6 text-primary/60 leading-none">
                      {item.badge}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Header;
