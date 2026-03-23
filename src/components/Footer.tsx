import { 
  Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram, 
  ExternalLink, Newspaper, BookOpen, Map, HelpCircle, Shield, 
  Scale, FileText, Landmark, GraduationCap, Handshake, Leaf,
  Recycle, Truck, Factory, BarChart3, Brain, Globe, ChevronUp,
  Footprints, History, Clock, ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PlatformLogo from "@/components/common/PlatformLogo";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";

const Footer = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const isAr = language === 'ar';
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Detect scroll for back-to-top
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', () => {
      setShowScrollTop(window.scrollY > 400);
    }, { passive: true });
  }

  const platformLinks = [
    { label: isAr ? 'الرئيسية' : 'Home', href: '/', icon: Globe },
    { label: isAr ? 'منشورات المنصة' : 'Platform Posts', href: '/posts', icon: Newspaper },
    { label: isAr ? 'المدونة' : 'Blog', href: '/blog', icon: BookOpen },
    { label: isAr ? 'خريطة الجهات' : 'Map', href: '/map', icon: Map },
    { label: isAr ? 'من نحن' : 'About Us', href: '/about', icon: Landmark },
    { label: isAr ? 'رحلة المنصة' : 'Our Journey', href: '/journey', icon: History },
  ];

  const serviceLinks = [
    { label: t('footer.shipmentMgmt'), href: '#services', icon: Recycle },
    { label: t('footer.transportTracking'), href: '#services', icon: Truck },
    { label: t('footer.recyclingService'), href: '#services', icon: Factory },
    { label: t('footer.envReports'), href: '#services', icon: BarChart3 },
    { label: isAr ? 'البصمة الكربونية' : 'Carbon Footprint', href: '/recycling-history', icon: Footprints },
    { label: isAr ? 'الاستدامة البيئية' : 'Environmental Sustainability', href: '#features', icon: Leaf },
  ];

  const resourceLinks = [
    { label: isAr ? 'الأكاديمية' : 'Academy', href: '/academy', icon: GraduationCap },
    { label: isAr ? 'الشراكات' : 'Partnerships', href: '/partnerships', icon: Handshake },
    { label: isAr ? 'التشريعات واللوائح' : 'Legislation', href: '/legislation', icon: Scale },
    { label: isAr ? 'القوانين' : 'Laws', href: '/laws', icon: FileText },
    { label: isAr ? 'أدلة الاستخدام' : 'User Guides', href: '/guide/generator', icon: BookOpen },
    { label: isAr ? 'الأدوات الذكية' : 'AI Tools', href: '#features', icon: Brain },
  ];

  const legalLinks = [
    { label: t('footerExtra.termsOfUse'), href: '/terms' },
    { label: t('footerExtra.privacyPolicy'), href: '/privacy' },
    { label: isAr ? 'سياسات المنصة' : 'Platform Policies', href: '/policies' },
    { label: isAr ? 'التشريعات والتراخيص' : 'Licenses & Legislation', href: '/legislation' },
  ];

  const supportLinks = [
    { label: isAr ? 'مركز المساعدة' : 'Help Center', href: '/help' },
    { label: isAr ? 'الأسئلة الشائعة' : 'FAQ', href: '/help' },
    { label: isAr ? 'تواصل معنا' : 'Contact Us', href: '/help' },
    { label: isAr ? 'تتبع الشحنة' : 'Track Shipment', href: '/track' },
    { label: isAr ? 'التحقق من الوثائق' : 'Verify Documents', href: '/verify' },
  ];

  const handleNavigate = (href: string) => {
    if (href === '#top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (href.startsWith('#')) {
      const targetId = href.slice(1);
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        navigate('/');
        setTimeout(() => {
          document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500);
      }
    } else {
      navigate(href);
      window.scrollTo({ top: 0 });
    }
  };

  return (
    <footer className="relative bg-foreground text-background">
      {/* Decorative top wave */}
      <div className="absolute -top-px left-0 right-0 overflow-hidden">
        <svg viewBox="0 0 1440 40" className="w-full h-6 sm:h-10 fill-background" preserveAspectRatio="none">
          <path d="M0,20 C360,40 720,0 1080,20 C1260,30 1380,15 1440,20 L1440,0 L0,0 Z" />
        </svg>
      </div>

      {/* Newsletter / CTA Section */}
      <div className="container px-4 pt-12 sm:pt-16 pb-8">
        <div className="rounded-2xl bg-primary/10 border border-primary/20 p-6 sm:p-8 mb-10 sm:mb-14 flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
          <div className="flex-1 text-center sm:text-start">
            <h3 className="text-lg sm:text-xl font-bold mb-1">
              {isAr ? '🌱 انضم إلى مجتمع iRecycle' : '🌱 Join the iRecycle Community'}
            </h3>
            <p className="text-background/60 text-sm">
              {isAr ? 'ابدأ رحلتك نحو إدارة مخلفات أكثر استدامة وكفاءة' : 'Start your journey towards more sustainable waste management'}
            </p>
          </div>
          <button 
            onClick={() => navigate('/auth')}
            className="shrink-0 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all hover:scale-105 flex items-center gap-2"
          >
            {isAr ? 'سجّل الآن' : 'Register Now'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-8 mb-10">
          
          {/* Brand Column */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <PlatformLogo size="lg" showText inverted showSubtitle />
            </div>
            <p className="text-background/60 leading-relaxed mb-5 text-sm max-w-sm">
              {t('footer.brandDesc')}
            </p>
            
            {/* Stats mini */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <StatMini label={isAr ? 'جهة مسجلة' : 'Organizations'} value="500+" />
              <StatMini label={isAr ? 'شحنة مكتملة' : 'Shipments'} value="10K+" />
              <StatMini label={isAr ? 'طن مُدار' : 'Tons Managed'} value="50K+" />
            </div>

            {/* Social Icons */}
            <div className="flex gap-2.5">
              <SocialIcon icon={Facebook} label="Facebook" />
              <SocialIcon icon={Twitter} label="X / Twitter" />
              <SocialIcon icon={Linkedin} label="LinkedIn" />
              <SocialIcon icon={Instagram} label="Instagram" />
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <FooterHeading>{isAr ? 'المنصة' : 'Platform'}</FooterHeading>
            <ul className="space-y-2">
              {platformLinks.map(link => (
                <FooterLink key={link.href + link.label} onClick={() => handleNavigate(link.href)} icon={link.icon}>
                  {link.label}
                </FooterLink>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <FooterHeading>{t('footer.ourServices')}</FooterHeading>
            <ul className="space-y-2">
              {serviceLinks.map(link => (
                <FooterLink key={link.href + link.label} onClick={() => handleNavigate(link.href)} icon={link.icon}>
                  {link.label}
                </FooterLink>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <FooterHeading>{isAr ? 'الموارد' : 'Resources'}</FooterHeading>
            <ul className="space-y-2">
              {resourceLinks.map(link => (
                <FooterLink key={link.href + link.label} onClick={() => handleNavigate(link.href)} icon={link.icon}>
                  {link.label}
                </FooterLink>
              ))}
            </ul>
          </div>

          {/* Contact + Support */}
          <div>
            <FooterHeading>{t('footer.contactUs')}</FooterHeading>
            <ul className="space-y-2.5 mb-5">
              <li className="flex items-start gap-2 text-background/60 text-xs">
                <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                <span>{t('footer.address')}</span>
              </li>
              <li className="flex items-center gap-2 text-background/60 text-xs">
                <Phone className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span dir="ltr">+20 2 1234 5678</span>
              </li>
              <li className="flex items-center gap-2 text-background/60 text-xs">
                <Mail className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>info@irecycle.eg</span>
              </li>
              <li className="flex items-center gap-2 text-background/60 text-xs">
                <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>{isAr ? 'الأحد - الخميس: 9ص - 5م' : 'Sun - Thu: 9AM - 5PM'}</span>
              </li>
            </ul>

            <FooterHeading small>{isAr ? 'الدعم' : 'Support'}</FooterHeading>
            <ul className="space-y-2">
              {supportLinks.map(link => (
                <FooterLink key={link.href + link.label} onClick={() => handleNavigate(link.href)}>
                  {link.label}
                </FooterLink>
              ))}
            </ul>
          </div>
        </div>

        {/* Legal bar */}
        <div className="border-t border-background/10 pt-5 pb-2">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mb-4">
            {legalLinks.map((link, i) => (
              <span key={link.href + link.label} className="flex items-center gap-3">
                <button 
                  onClick={() => handleNavigate(link.href)} 
                  className="text-background/50 hover:text-primary transition-colors text-xs"
                >
                  {link.label}
                </button>
                {i < legalLinks.length - 1 && <span className="text-background/20">·</span>}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-background/40 text-xs">
            <div className="flex items-center gap-2">
              <p>© {new Date().getFullYear()} iRecycle. {t('footer.allRightsReserved')}</p>
              <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[9px] font-black tracking-wide">v5.1</span>
            </div>
            <p className="text-background/30 text-[10px]">
              {isAr ? 'صُنع بـ 💚 لمستقبل أنظف في مصر' : 'Made with 💚 for a cleaner future in Egypt'}
            </p>
          </div>
        </div>
      </div>

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-20 end-4 z-40 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </footer>
  );
};

/* ── Sub-components ── */

const FooterHeading = ({ children, small }: { children: React.ReactNode; small?: boolean }) => (
  <h4 className={`font-bold mb-3 ${small ? 'text-xs text-background/70' : 'text-sm text-background/90'}`}>
    {children}
  </h4>
);

const StatMini = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-background/5 p-2 text-center">
    <div className="text-primary font-black text-sm">{value}</div>
    <div className="text-background/50 text-[9px] leading-tight mt-0.5">{label}</div>
  </div>
);

const SocialIcon = ({ icon: Icon, label }: { icon: typeof Facebook; label: string }) => (
  <button 
    className="w-9 h-9 rounded-full bg-background/10 hover:bg-primary hover:scale-110 flex items-center justify-center transition-all duration-200 cursor-pointer" 
    aria-label={label}
    title={label}
  >
    <Icon className="w-4 h-4" />
  </button>
);

const FooterLink = ({ children, onClick, icon: Icon }: { children: React.ReactNode; onClick: () => void; icon?: typeof Facebook }) => (
  <li>
    <button onClick={onClick} className="text-background/60 hover:text-primary transition-all inline-flex items-center gap-1.5 cursor-pointer text-xs group">
      {Icon && <Icon className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />}
      <span>{children}</span>
    </button>
  </li>
);

export default Footer;
