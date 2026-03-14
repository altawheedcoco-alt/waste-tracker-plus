import { memo, useState, useRef, useCallback } from "react";
import { Menu, X, LogIn, UserPlus, Globe, ChevronDown, BookOpen, HelpCircle, GraduationCap, Factory, Recycle, Rocket, Map, MapPin, Route, Scale, Building2, ShieldCheck, Layers, Users, Sparkles, Landmark, MessageCircle, BarChart3, FileCheck, Brain, Shield, Wallet, ClipboardCheck, Headphones, Database, Eye, LayoutDashboard, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import GuideButton from "@/components/guide/GuideButton";
import PlatformLogo from "@/components/common/PlatformLogo";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
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
  const { user, profile } = useAuth();
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout>>();

  const handleLogin = () => navigate('/auth?mode=login');
  const handleEmployeeLogin = () => navigate('/auth?mode=employee');
  const handleGoToDashboard = () => navigate('/dashboard');
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('تم تسجيل الخروج بنجاح');
    navigate('/');
  };

  const dropdowns: NavDropdown[] = [
    {
      label: t('header.discover'),
      icon: Eye,
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
    <header className="fixed top-0 left-0 right-0 z-[60] border-b border-border/30 animate-fade-in">
      {/* v3.0 Gradient top accent line — bolder */}
      <div className="absolute top-0 left-0 right-0 h-[2px] sm:h-[2.5px] bg-gradient-to-r from-eco-ocean via-primary to-eco-emerald opacity-90" />
      
      <div className="bg-background dark:bg-card backdrop-blur-none shadow-sm">
        <div className="w-full mx-auto px-3 sm:px-4 max-w-[1400px]">
          <div className="flex items-center h-14 sm:h-[72px] gap-2">
            {/* Mobile toggle - appears first (right side in RTL) */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl text-foreground hover:bg-accent/50 transition-colors touch-manipulation flex-shrink-0"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Logo */}
            <div
              className="flex items-center gap-2 sm:gap-3 cursor-pointer group flex-shrink-0"
              onClick={() => navigate('/')}
            >
              <div className="transition-transform duration-300 group-hover:scale-105">
                <PlatformLogo size="md" showText priority />
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-0.5 flex-1 min-w-0 justify-center overflow-hidden">
              {dropdowns.map((dropdown, index) => (
                <div
                  key={dropdown.label}
                  className={`relative ${index >= 3 ? 'hidden xl:block' : ''}`}
                  onMouseEnter={() => handleDropdownEnter(dropdown.label)}
                  onMouseLeave={handleDropdownLeave}
                >
                  <button
                    className={`group flex items-center gap-1 px-2 xl:px-3 py-2 text-[12px] xl:text-[13px] font-semibold rounded-xl transition-all duration-200 whitespace-nowrap ${
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
                      className={`absolute top-full mt-2 bg-background border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in ${
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
                            {t('header.integratedSystems')}
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
            <div className="hidden lg:flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                className="flex items-center gap-1 px-2 py-1.5 rounded-xl border border-border/50 bg-background/60 text-xs font-bold text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                aria-label="Switch language"
              >
                <Globe className="w-3.5 h-3.5" />
                {language === 'ar' ? 'EN' : 'عربي'}
              </button>
              {user ? (
                <>
                  <Button variant="default" size="sm" onClick={handleGoToDashboard} className="gap-1 text-xs font-semibold rounded-xl h-8 px-3 shadow-md whitespace-nowrap">
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    {t('nav.dashboard') || 'لوحة التحكم'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1 text-xs font-semibold rounded-xl h-8 px-2.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50">
                    <LogOut className="w-3.5 h-3.5" />
                    {t('nav.logout') || 'خروج'}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="default" size="sm" onClick={handleLogin} className="gap-1 text-xs font-semibold rounded-xl h-8 px-3 shadow-md whitespace-nowrap">
                    <LogIn className="w-3.5 h-3.5" />
                    {t('nav.login')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleEmployeeLogin} className="hidden xl:flex gap-1 text-xs font-semibold rounded-xl h-8 px-2.5 border-border/50 hover:border-primary/30 hover:bg-primary/5 hover:text-primary">
                    <UserPlus className="w-3.5 h-3.5" />
                    {t('nav.employeeLogin')}
                  </Button>
                </>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-background border-t border-border/40 animate-fade-in max-h-[80vh] overflow-y-auto shadow-2xl relative z-50 overscroll-contain">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col gap-1">
              {dropdowns.map((dropdown) => (
                <MobileDropdown key={dropdown.label} dropdown={dropdown} onNavigate={handleNavClick} />
              ))}
              <div className="flex flex-col gap-2.5 pt-4 border-t border-border/40 mt-3">
                <button
                  onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                  className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-border/50 bg-muted/30 text-sm font-semibold text-muted-foreground hover:text-primary hover:border-primary/30 transition-all touch-manipulation"
                >
                  <Globe className="w-4 h-4" />
                  {language === 'ar' ? 'English' : 'عربي'}
                </button>
                <GuideButton />
                {user ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    <Button variant="eco" className="gap-1.5 h-11 rounded-xl touch-manipulation font-semibold text-sm shadow-md shadow-primary/20" onClick={() => { setIsMenuOpen(false); handleGoToDashboard(); }}>
                      <LayoutDashboard className="w-4 h-4" />
                      {t('nav.dashboard') || 'لوحة التحكم'}
                    </Button>
                    <Button variant="outline" className="gap-1.5 h-11 rounded-xl touch-manipulation font-semibold text-sm border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => { setIsMenuOpen(false); handleLogout(); }}>
                      <LogOut className="w-4 h-4" />
                      {t('nav.logout') || 'خروج'}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    <Button variant="outline" className="gap-1.5 h-11 rounded-xl touch-manipulation font-semibold text-sm" onClick={handleEmployeeLogin}>
                      <UserPlus className="w-4 h-4" />
                      {t('nav.employee')}
                    </Button>
                    <Button variant="eco" className="gap-1.5 h-11 rounded-xl touch-manipulation font-semibold text-sm shadow-md shadow-primary/20" onClick={handleLogin}>
                      <LogIn className="w-4 h-4" />
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