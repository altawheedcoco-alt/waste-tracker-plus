import { memo, useState, useRef, useCallback } from "react";
import { Menu, X, LogIn, UserPlus, Globe, ChevronDown, BookOpen, HelpCircle, GraduationCap, Factory, Recycle, Rocket, Map, MapPin, Route, Scale, Building2, ShieldCheck, Layers, Users, Sparkles, Landmark, MessageCircle, BarChart3, FileCheck, Brain, Shield, Wallet, ClipboardCheck, Headphones, Database, Eye, LayoutDashboard, LogOut, User, FileText, Sun, Moon, Newspaper, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import GuideButton from "@/components/guide/GuideButton";
import PlatformLogo from "@/components/common/PlatformLogo";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeSettings } from "@/contexts/ThemeSettingsContext";
import { supabase } from "@/integrations/supabase/client";
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
  footer?: { label: string; href: string; icon: React.ElementType };
}

const Header = memo(() => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const { user, profile, signOut } = useAuth();
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
      icon: Zap,
      columns: 2,
      megaShowcase: true,
      items: [
        { label: t('header.smartDashboards'), href: '#features', icon: BarChart3, 
          desc: t('header.smartDashboardsDesc'),
          longDesc: t('header.smartDashboardsLong'),
          badge: t('header.pro') },
        { label: t('header.advancedDocHub'), href: '#doc-ai', icon: FileCheck, 
          desc: t('header.advancedDocHubDesc'),
          longDesc: t('header.advancedDocHubLong'),
          badge: 'AI' },
        { label: t('header.aiEngine'), href: '#smart-agent', icon: Brain, 
          desc: t('header.aiEngineDesc'),
          longDesc: t('header.aiEngineLong'),
          badge: 'AI' },
        { label: t('header.regulatoryOversight'), href: '#features', icon: Shield, 
          desc: t('header.regulatoryOversightDesc'),
          longDesc: t('header.regulatoryOversightLong') },
        { label: t('header.smartFinancial'), href: '#features', icon: Wallet, 
          desc: t('header.smartFinancialDesc'),
          longDesc: t('header.smartFinancialLong') },
        { label: t('header.digitalChain'), href: '#features', icon: ClipboardCheck, 
          desc: t('header.digitalChainDesc'),
          longDesc: t('header.digitalChainLong') },
        { label: t('header.smartCallCenter'), href: '#features', icon: Headphones, 
          desc: t('header.smartCallCenterDesc'),
          longDesc: t('header.smartCallCenterLong') },
        { label: t('header.myDataHub'), href: '#features', icon: Database, 
          desc: t('header.myDataHubDesc'),
          longDesc: t('header.myDataHubLong') },
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
      items: [
        { label: 'منشورات المنصة', href: '/posts', icon: FileText, desc: 'آخر المقالات والإعلانات الرسمية من فريق المنصة', badge: 'جديد' },
        { label: t('header.blog'), href: '/blog', icon: BookOpen, desc: t('header.blogDesc') },
        { label: t('header.recyclingHistory'), href: '/recycling-history', icon: Landmark, desc: t('header.recyclingHistoryDesc'), badge: t('header.new') },
        { label: t('header.helpCenter'), href: '/help', icon: HelpCircle, desc: t('header.helpCenterDesc') },
        { label: t('header.recyclingAcademy'), href: '/academy', icon: GraduationCap, desc: t('header.recyclingAcademyDesc') },
        { label: t('header.legislation'), href: '/legislation', icon: Scale, desc: t('header.legislationDesc') },
        { label: t('header.aboutUs'), href: '/about', icon: Building2, desc: t('header.aboutUsDesc') },
        { label: 'رحلة المنصة', href: '/journey', icon: Rocket, desc: 'الإصدارات والإنجازات والقائمون على المشروع', badge: 'جديد' },
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
    <header className="fixed top-0 left-0 right-0 z-[60] animate-fade-in">
      {/* Premium gradient accent - thinner, more refined */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-eco-ocean to-primary opacity-80" />
      
      <div className="bg-background/95 backdrop-blur-xl border-b border-border/20 shadow-[0_1px_3px_0_hsl(var(--foreground)/0.04)]">
        <div className="w-full mx-auto px-3 sm:px-5 max-w-[1400px]">
          <div className="flex items-center h-14 sm:h-16 gap-3">
            
            {/* Mobile toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-foreground/70 hover:text-foreground hover:bg-accent/60 transition-all touch-manipulation flex-shrink-0"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Logo - compact and clean */}
            <div
              className="flex items-center cursor-pointer group flex-shrink-0"
              onClick={() => navigate('/')}
            >
              <div className="transition-transform duration-300 group-hover:scale-[1.03]">
                <PlatformLogo size="lg" showText priority />
              </div>
            </div>

            {/* Subtle separator */}
            <div className="hidden lg:block w-px h-7 bg-border/40 flex-shrink-0" />

            {/* Desktop Navigation - clean pill style */}
            <nav className="hidden lg:flex items-center gap-0.5 flex-1 min-w-0 justify-center overflow-visible">
              {dropdowns.map((dropdown, index) => (
                <div
                  key={dropdown.label}
                  className={`relative ${index >= 4 ? 'hidden xl:block' : ''}`}
                  onMouseEnter={() => handleDropdownEnter(dropdown.label)}
                  onMouseLeave={handleDropdownLeave}
                >
                  <button
                    className={`group flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 text-[12px] xl:text-[12.5px] font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${
                      openDropdown === dropdown.label
                        ? 'text-primary bg-primary/8 shadow-sm shadow-primary/5'
                        : 'text-foreground/65 hover:text-foreground/90 hover:bg-accent/40'
                    }`}
                    onClick={() => setOpenDropdown(openDropdown === dropdown.label ? null : dropdown.label)}
                  >
                    <dropdown.icon className={`w-3.5 h-3.5 transition-colors ${openDropdown === dropdown.label ? 'text-primary' : 'text-foreground/40 group-hover:text-foreground/60'}`} />
                    {dropdown.label}
                    <ChevronDown className={`w-3 h-3 opacity-50 transition-transform duration-300 ${openDropdown === dropdown.label ? 'rotate-180 opacity-100 text-primary' : ''}`} />
                  </button>

                  {/* Dropdown Panel */}
                  {openDropdown === dropdown.label && (
                    <div
                      className={`absolute top-full mt-1.5 bg-background/98 backdrop-blur-xl border border-border/30 rounded-xl shadow-xl shadow-foreground/5 z-50 overflow-hidden animate-fade-in ${
                        dropdown.megaShowcase ? 'w-[620px]' : dropdown.columns === 2 ? 'w-[500px]' : 'w-[280px]'
                      }`}
                      style={{ [language === 'ar' ? 'right' : 'left']: 0 }}
                      onMouseEnter={() => handleDropdownEnter(dropdown.label)}
                      onMouseLeave={handleDropdownLeave}
                    >
                      {/* Dropdown header - minimal */}
                      <div className="px-4 pt-3.5 pb-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <dropdown.icon className="w-3.5 h-3.5 text-primary/60" />
                          <p className="text-[10.5px] font-bold text-muted-foreground/50 uppercase tracking-[0.08em]">{dropdown.label}</p>
                        </div>
                        {dropdown.megaShowcase && (
                          <span className="text-[9px] font-bold text-primary/80 bg-primary/6 px-2 py-0.5 rounded-full border border-primary/10">
                            {t('header.integratedSystems')}
                          </span>
                        )}
                      </div>

                      <div className={`px-1.5 pb-1.5 ${dropdown.columns === 2 || dropdown.megaShowcase ? 'grid grid-cols-2 gap-px' : 'flex flex-col gap-px'} ${dropdown.megaShowcase ? 'max-h-[65vh] overflow-y-auto scrollbar-thin' : ''}`}>
                        {dropdown.items.map((item) => (
                          <button
                            key={item.href + item.label}
                            onClick={() => handleNavClick(item.href)}
                            className={`flex items-start gap-2.5 w-full p-2.5 rounded-lg hover:bg-accent/50 transition-all duration-150 text-start group/item ${dropdown.megaShowcase ? 'p-3' : ''}`}
                          >
                            <div className={`rounded-lg bg-primary/6 flex items-center justify-center flex-shrink-0 group-hover/item:bg-primary/12 group-hover/item:shadow-sm transition-all ${dropdown.megaShowcase ? 'w-9 h-9' : 'w-8 h-8'}`}>
                              <item.icon className={`text-primary/70 group-hover/item:text-primary transition-colors ${dropdown.megaShowcase ? 'w-4.5 h-4.5' : 'w-3.5 h-3.5'}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className="text-[12.5px] font-semibold text-foreground/85 group-hover/item:text-foreground transition-colors">{item.label}</p>
                                {item.badge && (
                                  <span className="px-1.5 py-px text-[8px] font-bold rounded bg-primary/8 text-primary/80 leading-none border border-primary/10">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              {dropdown.megaShowcase && item.longDesc ? (
                                <p className="text-[10.5px] text-muted-foreground/70 mt-0.5 leading-[1.5] line-clamp-2">{item.longDesc}</p>
                              ) : (
                                <p className="text-[10.5px] text-muted-foreground/60 mt-0.5 leading-relaxed line-clamp-1">{item.desc}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Footer */}
                      {dropdown.footer && (
                        <div className="border-t border-border/20 px-2 py-1.5">
                          <button
                            onClick={() => handleNavClick(dropdown.footer!.href)}
                            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[12px] font-semibold text-primary/80 hover:text-primary hover:bg-primary/5 transition-colors"
                          >
                            <dropdown.footer.icon className="w-3.5 h-3.5" />
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

            {/* Subtle separator */}
            <div className="hidden lg:block w-px h-7 bg-border/40 flex-shrink-0" />

            {/* Right Actions - grouped and organized */}
            <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
              {/* News pill */}
              <button
                onClick={() => handleNavClick('#ticker')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-primary/80 hover:text-primary bg-primary/5 hover:bg-primary/8 border border-primary/10 hover:border-primary/20 transition-all duration-200"
              >
                <Newspaper className="w-3 h-3" />
                {language === 'ar' ? 'الأخبار' : 'News'}
              </button>

              {/* Utility group */}
              <div className="flex items-center bg-muted/30 rounded-lg border border-border/20 p-0.5">
                <button
                  onClick={toggleDarkMode}
                  className="relative flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-background/80 transition-all duration-300"
                  aria-label={settings.isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  <Sun className={`w-3.5 h-3.5 absolute transition-all duration-400 ${settings.isDarkMode ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
                  <Moon className={`w-3.5 h-3.5 absolute transition-all duration-400 ${settings.isDarkMode ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`} />
                </button>
                <div className="w-px h-4 bg-border/30" />
                <button
                  onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold text-muted-foreground/70 hover:text-foreground hover:bg-background/80 transition-all duration-200"
                  aria-label="Switch language"
                >
                  <Globe className="w-3 h-3" />
                  {language === 'ar' ? 'EN' : 'عر'}
                </button>
              </div>

              {/* Auth actions */}
              {user ? (
                <div className="flex items-center gap-1 ms-0.5">
                  <Button variant="default" size="sm" onClick={handleGoToDashboard} className="gap-1.5 text-[11px] font-bold rounded-lg h-7 px-3 shadow-sm whitespace-nowrap">
                    <LayoutDashboard className="w-3 h-3" />
                    {t('nav.dashboard') || 'لوحة التحكم'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1 text-[11px] font-semibold rounded-lg h-7 px-2 text-destructive/70 hover:text-destructive hover:bg-destructive/8">
                    <LogOut className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1 ms-0.5">
                  <Button variant="default" size="sm" onClick={handleLogin} className="gap-1.5 text-[11px] font-bold rounded-lg h-7 px-3 shadow-sm whitespace-nowrap">
                    <LogIn className="w-3 h-3" />
                    {t('nav.login')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleEmployeeLogin} className="hidden xl:flex gap-1 text-[11px] font-semibold rounded-lg h-7 px-2 text-muted-foreground/70 hover:text-foreground">
                    <UserPlus className="w-3 h-3" />
                    {t('nav.employeeLogin')}
                  </Button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Menu - redesigned */}
      {isMenuOpen && (
        <div className="lg:hidden bg-background/98 backdrop-blur-xl border-t border-border/20 animate-fade-in max-h-[80vh] overflow-y-auto shadow-xl relative z-50 overscroll-contain">
          <div className="mx-auto px-4 py-3">
            <nav className="flex flex-col gap-0.5">
              {/* Quick actions row */}
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/20">
                <button
                  onClick={() => handleNavClick('#ticker')}
                  className="flex items-center gap-1.5 flex-1 px-3 py-2.5 text-[12px] font-bold rounded-lg text-primary bg-primary/6 hover:bg-primary/10 border border-primary/10 transition-all touch-manipulation"
                >
                  <Newspaper className="w-3.5 h-3.5" />
                  {language === 'ar' ? 'آخر الأخبار' : 'Latest News'}
                </button>
                <button
                  onClick={() => handleNavClick('/posts')}
                  className="flex items-center gap-1.5 flex-1 px-3 py-2.5 text-[12px] font-bold rounded-lg text-foreground/70 bg-accent/40 hover:bg-accent/60 border border-border/20 transition-all touch-manipulation"
                >
                  <FileText className="w-3.5 h-3.5" />
                  منشورات
                  <span className="ms-auto px-1 py-px text-[8px] font-bold rounded bg-primary/10 text-primary leading-none">جديد</span>
                </button>
              </div>

              {/* Navigation dropdowns */}
              {dropdowns.map((dropdown) => (
                <MobileDropdown key={dropdown.label} dropdown={dropdown} onNavigate={handleNavClick} />
              ))}

              {/* Bottom actions */}
              <div className="flex flex-col gap-2 pt-3 border-t border-border/20 mt-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                    className="flex items-center justify-center gap-1.5 h-10 rounded-lg border border-border/30 bg-muted/20 text-[12px] font-semibold text-muted-foreground hover:text-foreground hover:border-border/50 transition-all touch-manipulation"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    {language === 'ar' ? 'English' : 'عربي'}
                  </button>
                  <button
                    onClick={toggleDarkMode}
                    className="flex items-center justify-center gap-1.5 h-10 rounded-lg border border-border/30 bg-muted/20 text-[12px] font-semibold text-muted-foreground hover:text-foreground hover:border-border/50 transition-all touch-manipulation"
                    aria-label={settings.isDarkMode ? 'وضع نهاري' : 'وضع ليلي'}
                  >
                    {settings.isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    {settings.isDarkMode ? 'نهاري' : 'ليلي'}
                  </button>
                </div>
                <GuideButton />
                {user ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="eco" className="gap-1.5 h-10 rounded-lg touch-manipulation font-bold text-[12px] shadow-sm" onClick={() => { setIsMenuOpen(false); handleGoToDashboard(); }}>
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      {t('nav.dashboard') || 'لوحة التحكم'}
                    </Button>
                    <Button variant="outline" className="gap-1.5 h-10 rounded-lg touch-manipulation font-semibold text-[12px] border-destructive/20 text-destructive/80 hover:bg-destructive/8" onClick={() => { setIsMenuOpen(false); handleLogout(); }}>
                      <LogOut className="w-3.5 h-3.5" />
                      {t('nav.logout') || 'خروج'}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="gap-1.5 h-10 rounded-lg touch-manipulation font-semibold text-[12px]" onClick={handleEmployeeLogin}>
                      <UserPlus className="w-3.5 h-3.5" />
                      {t('nav.employee')}
                    </Button>
                    <Button variant="eco" className="gap-1.5 h-10 rounded-lg touch-manipulation font-bold text-[12px] shadow-sm" onClick={handleLogin}>
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
        className={`flex items-center justify-between w-full px-3 py-3 text-[13px] font-semibold rounded-lg transition-all touch-manipulation ${
          open ? 'text-primary bg-primary/6' : 'text-foreground/60 hover:text-foreground/80 hover:bg-accent/30'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${open ? 'bg-primary/10' : 'bg-muted/40'}`}>
            <dropdown.icon className={`w-3.5 h-3.5 ${open ? 'text-primary' : 'text-muted-foreground/50'}`} />
          </div>
          {dropdown.label}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="ps-3 pe-1 pb-2 flex flex-col gap-px animate-fade-in">
          {dropdown.items.map((item) => (
            <button
              key={item.href + item.label}
              onClick={() => onNavigate(item.href)}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg hover:bg-accent/40 active:bg-accent/60 transition-colors text-start touch-manipulation group"
            >
              <div className="w-7 h-7 rounded-md bg-primary/5 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                <item.icon className="w-3.5 h-3.5 text-primary/60 group-hover:text-primary transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[12.5px] font-medium text-foreground/80">{item.label}</p>
                  {item.badge && (
                    <span className="px-1 py-px text-[8px] font-bold rounded bg-primary/8 text-primary/70 leading-none">
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground/50 line-clamp-1 mt-0.5">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Header;
