import { memo, useState, useRef, useEffect } from "react";
import { Menu, X, LogIn, UserPlus, Globe, ChevronDown, BookOpen, HelpCircle, GraduationCap, Factory, Recycle, Rocket, Map, MapPin, Route } from "lucide-react";
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
}

interface NavDropdown {
  label: string;
  items: DropdownItem[];
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
      label: t('nav.resources') || (language === 'ar' ? 'المصادر' : 'Resources'),
      items: [
        { label: language === 'ar' ? 'المدونة' : 'Blog', href: '/blog', icon: BookOpen, desc: language === 'ar' ? 'مقالات ونصائح بيئية' : 'Environmental articles & tips' },
        { label: language === 'ar' ? 'مركز المساعدة' : 'Help Center', href: '/help', icon: HelpCircle, desc: language === 'ar' ? 'أسئلة شائعة ودعم فني' : 'FAQ & technical support' },
        { label: language === 'ar' ? 'أكاديمية التدوير' : 'Recycling Academy', href: '/guide/generator', icon: GraduationCap, desc: language === 'ar' ? 'تعلم أساسيات إعادة التدوير' : 'Learn recycling fundamentals' },
      ],
    },
    {
      label: t('nav.partners') || (language === 'ar' ? 'الشركاء' : 'Partners'),
      items: [
        { label: language === 'ar' ? 'حلول للمصانع' : 'For Factories', href: '/guide/generator', icon: Factory, desc: language === 'ar' ? 'إدارة مخلفات المصانع' : 'Factory waste management' },
        { label: language === 'ar' ? 'لجامعي الخردة' : 'For Collectors', href: '/guide/recycler', icon: Recycle, desc: language === 'ar' ? 'منصة متكاملة للجمع والتدوير' : 'Integrated collection platform' },
        { label: language === 'ar' ? 'للشركات الناشئة' : 'For Startups', href: '/guide/transporter', icon: Rocket, desc: language === 'ar' ? 'ابدأ مشروعك في التدوير' : 'Start your recycling business' },
      ],
    },
    {
      label: language === 'ar' ? 'الخرائط' : 'Maps',
      items: [
        { label: language === 'ar' ? 'نقاط الاستلام' : 'Collection Points', href: '/map', icon: MapPin, desc: language === 'ar' ? 'اعثر على أقرب نقطة تجميع' : 'Find nearest collection point' },
        { label: language === 'ar' ? 'تخطيط النقل' : 'Transport Planning', href: '/track', icon: Route, desc: language === 'ar' ? 'خطط لعمليات نقل النفايات' : 'Plan waste transport operations' },
        { label: language === 'ar' ? 'خريطة مباشرة' : 'Live Map', href: '/map', icon: Map, desc: language === 'ar' ? 'تتبع مباشر للشحنات' : 'Real-time shipment tracking' },
      ],
    },
  ];

  const handleDropdownEnter = (label: string) => {
    clearTimeout(dropdownTimeout.current);
    setOpenDropdown(label);
  };

  const handleDropdownLeave = () => {
    dropdownTimeout.current = setTimeout(() => setOpenDropdown(null), 200);
  };

  const handleNavClick = (href: string) => {
    setOpenDropdown(null);
    setIsMenuOpen(false);
    if (href.startsWith('#')) {
      const targetId = href.slice(1);
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      navigate(href);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-card/80 backdrop-blur-xl border-b border-border/30 animate-fade-in shadow-sm" style={{ WebkitBackdropFilter: 'blur(20px) saturate(1.8)' }}>
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => navigate('/')}
          >
            <PlatformLogo size="md" showText priority />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {dropdowns.map((dropdown) => (
              <div
                key={dropdown.label}
                className="relative"
                onMouseEnter={() => handleDropdownEnter(dropdown.label)}
                onMouseLeave={handleDropdownLeave}
              >
                <button
                  className="flex items-center gap-1 px-3 py-2 text-sm lg:text-base font-medium text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-accent/50"
                  onClick={() => setOpenDropdown(openDropdown === dropdown.label ? null : dropdown.label)}
                >
                  {dropdown.label}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === dropdown.label ? 'rotate-180' : ''}`} />
                </button>

                {openDropdown === dropdown.label && (
                  <div
                    className="absolute top-full mt-1 w-72 bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-xl p-2 animate-fade-in z-50"
                    style={{ [language === 'ar' ? 'right' : 'left']: 0 }}
                    onMouseEnter={() => handleDropdownEnter(dropdown.label)}
                    onMouseLeave={handleDropdownLeave}
                  >
                    {dropdown.items.map((item) => (
                      <button
                        key={item.href + item.label}
                        onClick={() => handleNavClick(item.href)}
                        className="flex items-start gap-3 w-full p-3 rounded-lg hover:bg-accent/60 transition-colors text-start group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                          <item.icon className="w-4.5 h-4.5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">{item.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <NavLink href="#features" onClick={() => handleNavClick('#features')}>{t('nav.features')}</NavLink>
            <NavLink href="#services" onClick={() => handleNavClick('#services')}>{t('nav.services')}</NavLink>
          </nav>

          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-border/60 bg-background/80 backdrop-blur-sm text-sm font-medium text-muted-foreground hover:text-primary hover:border-primary/40 hover:scale-105 active:scale-95 transition-all duration-200"
              aria-label="Switch language"
            >
              <Globe className="w-4 h-4" />
              <span className="font-semibold text-xs">{language === 'ar' ? 'EN' : 'عربي'}</span>
            </button>
            <GuideButton />
            <Button variant="outline" size="default" onClick={handleEmployeeLogin} className="gap-2 text-sm lg:text-base">
              <UserPlus className="w-4 h-4" />
              <span className="hidden lg:inline">{t('nav.employeeLogin')}</span>
              <span className="lg:hidden">{t('nav.employee')}</span>
            </Button>
            <Button variant="eco" size="default" onClick={handleLogin} className="gap-2 text-sm lg:text-base">
              <LogIn className="w-4 h-4" />
              <span className="hidden lg:inline">{t('nav.login')}</span>
              <span className="lg:hidden">{t('nav.login')}</span>
            </Button>
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-foreground touch-manipulation"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in max-h-[70vh] overflow-y-auto">
            <nav className="flex flex-col gap-1">
              {dropdowns.map((dropdown) => (
                <MobileDropdown key={dropdown.label} dropdown={dropdown} onNavigate={handleNavClick} />
              ))}
              <a href="#features" onClick={(e) => { e.preventDefault(); handleNavClick('#features'); }} className="font-medium text-muted-foreground hover:text-primary py-2 px-3 rounded-lg hover:bg-accent/50 transition-colors">{t('nav.features')}</a>
              <a href="#services" onClick={(e) => { e.preventDefault(); handleNavClick('#services'); }} className="font-medium text-muted-foreground hover:text-primary py-2 px-3 rounded-lg hover:bg-accent/50 transition-colors">{t('nav.services')}</a>
              <div className="flex flex-col gap-3 pt-4 border-t border-border/50 mt-2">
                <button
                  onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                  className="flex items-center justify-center gap-2 w-full h-11 rounded-lg border border-border/60 bg-background/80 text-sm font-medium text-muted-foreground hover:text-primary transition-colors touch-manipulation"
                >
                  <Globe className="w-4 h-4" />
                  {language === 'ar' ? 'English' : 'عربي'}
                </button>
                <GuideButton />
                <Button variant="outline" className="w-full gap-2 h-11 touch-manipulation" onClick={handleEmployeeLogin}>
                  <UserPlus className="w-4 h-4" />
                  {t('nav.employeeLogin')}
                </Button>
                <Button variant="eco" className="w-full gap-2 h-11 touch-manipulation" onClick={handleLogin}>
                  <LogIn className="w-4 h-4" />
                  {t('nav.login')}
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
});

Header.displayName = 'Header';

const MobileDropdown = ({ dropdown, onNavigate }: { dropdown: NavDropdown; onNavigate: (href: string) => void }) => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-2 text-base font-medium text-muted-foreground hover:text-primary rounded-lg hover:bg-accent/50 transition-colors touch-manipulation"
      >
        {dropdown.label}
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="ps-4 flex flex-col gap-1 mt-1 animate-fade-in">
          {dropdown.items.map((item) => (
            <button
              key={item.href + item.label}
              onClick={() => onNavigate(item.href)}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors text-start touch-manipulation"
            >
              <item.icon className="w-4 h-4 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const NavLink = ({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) => (
  <a
    href={href}
    onClick={(e) => { e.preventDefault(); onClick?.(); }}
    className="px-3 py-2 text-sm lg:text-base font-medium text-muted-foreground hover:text-primary hover:bg-accent/50 rounded-lg transition-all touch-manipulation"
  >
    {children}
  </a>
);

export default Header;
