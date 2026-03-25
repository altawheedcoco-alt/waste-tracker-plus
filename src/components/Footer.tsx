import { 
  Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram, 
  Newspaper, BookOpen, Map, Shield, Scale, FileText, Landmark, 
  GraduationCap, Handshake, Leaf, Recycle, Truck, Factory, 
  BarChart3, Brain, Globe, ChevronUp, Footprints, History, 
  Clock, ArrowRight, Smartphone, Wallet, Star, Building2,
  Users, PackageSearch, Gavel, FileCheck, HelpCircle, Search,
  MessageSquare, Megaphone, Zap, Monitor, BadgeCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PlatformLogo from "@/components/common/PlatformLogo";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect, useCallback } from "react";

const Footer = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const isAr = language === 'ar';
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavigate = useCallback((href: string) => {
    if (href.startsWith('#')) {
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
  }, [navigate]);

  /* ─── Link Groups ─── */

  // 1) المنصة — تتوافق مع أقسام الصفحة الرئيسية
  const platformLinks = [
    { label: isAr ? 'الرئيسية' : 'Home', href: '/', icon: Globe },
    { label: isAr ? 'منشورات المنصة' : 'Posts', href: '/posts', icon: Newspaper },
    { label: isAr ? 'المدونة' : 'Blog', href: '/blog', icon: BookOpen },
    { label: isAr ? 'خريطة الجهات' : 'Partners Map', href: '/map', icon: Map },
    { label: isAr ? 'من نحن' : 'About Us', href: '/about', icon: Landmark },
    { label: isAr ? 'رحلة المنصة' : 'Journey', href: '/journey', icon: History },
  ];

  // 2) الحلول والخدمات — تتوافق مع أقسام Features/Services/Showcases
  const solutionLinks = [
    { label: isAr ? 'إدارة الشحنات' : 'Shipment Management', href: '#services', icon: Recycle },
    { label: isAr ? 'تتبع النقل' : 'Transport Tracking', href: '/track', icon: Truck },
    { label: isAr ? 'منظومة السائقين' : 'Driver Ecosystem', href: '#driver-ecosystem', icon: Users },
    { label: isAr ? 'السوق والمزادات' : 'Marketplace', href: '#marketplace', icon: PackageSearch },
    { label: isAr ? 'المحفظة والمالية' : 'Wallet & Finance', href: '#wallet-finance', icon: Wallet },
    { label: isAr ? 'التقييم والثقة' : 'Rating & Trust', href: '#rating-trust', icon: Star },
  ];

  // 3) التقنية والذكاء الاصطناعي — SaaS/AI/Doc showcases
  const techLinks = [
    { label: isAr ? 'الوكيل الذكي' : 'Smart Agent', href: '#smart-agent', icon: Brain },
    { label: isAr ? 'استوديو المستندات' : 'Document AI', href: '#doc-ai', icon: FileCheck },
    { label: isAr ? 'إشعارات واتساب' : 'WhatsApp Alerts', href: '#whatsapp-notifications', icon: Smartphone },
    { label: isAr ? 'التقارير البيئية' : 'Env Reports', href: '#stats', icon: BarChart3 },
    { label: isAr ? 'البصمة الكربونية' : 'Carbon Footprint', href: '/recycling-history', icon: Footprints },
    { label: isAr ? 'البنية التقنية SaaS' : 'SaaS Platform', href: '#saas-tech', icon: Monitor },
  ];

  // 4) الجهات الرقابية والشراكات
  const regulatorLinks = [
    { label: isAr ? 'الجهات الرقابية' : 'Regulators', href: '#features', icon: Building2 },
    { label: isAr ? 'الشراكات' : 'Partnerships', href: '/partnerships', icon: Handshake },
    { label: isAr ? 'الاستشاريون' : 'Consultants', href: '/consultant-portal', icon: BadgeCheck },
    { label: isAr ? 'المبادرة الوطنية' : 'National Initiative', href: '#features', icon: Megaphone },
    { label: isAr ? 'الاستدامة البيئية' : 'Sustainability', href: '#features', icon: Leaf },
  ];

  // 5) الموارد والتعليم
  const resourceLinks = [
    { label: isAr ? 'الأكاديمية' : 'Academy', href: '/academy', icon: GraduationCap },
    { label: isAr ? 'التشريعات' : 'Legislation', href: '/legislation', icon: Scale },
    { label: isAr ? 'القوانين' : 'Laws', href: '/laws', icon: Gavel },
    { label: isAr ? 'دليل المولّد' : 'Generator Guide', href: '/guide/generator', icon: FileText },
    { label: isAr ? 'دليل الناقل' : 'Transporter Guide', href: '/guide/transporter', icon: Truck },
    { label: isAr ? 'دليل المُدوّر' : 'Recycler Guide', href: '/guide/recycler', icon: Factory },
  ];

  // 6) الدعم والقانوني
  const supportLinks = [
    { label: isAr ? 'مركز المساعدة' : 'Help Center', href: '/help', icon: HelpCircle },
    { label: isAr ? 'تتبع شحنة' : 'Track Shipment', href: '/track', icon: Search },
    { label: isAr ? 'التحقق من وثيقة' : 'Verify Document', href: '/verify', icon: Shield },
    { label: isAr ? 'التحقق من الختم' : 'Verify Seal', href: '/verify-seal', icon: BadgeCheck },
  ];

  const legalLinks = [
    { label: isAr ? 'شروط الاستخدام' : 'Terms of Use', href: '/terms' },
    { label: isAr ? 'سياسة الخصوصية' : 'Privacy Policy', href: '/privacy' },
    { label: isAr ? 'سياسات المنصة' : 'Policies', href: '/policies' },
    { label: isAr ? 'التراخيص' : 'Licenses', href: '/legislation' },
  ];

  return (
    <footer className="relative bg-foreground text-background">
      {/* Top wave */}
      <div className="absolute -top-px left-0 right-0 overflow-hidden">
        <svg viewBox="0 0 1440 40" className="w-full h-6 sm:h-10 fill-background" preserveAspectRatio="none">
          <path d="M0,20 C360,40 720,0 1080,20 C1260,30 1380,15 1440,20 L1440,0 L0,0 Z" />
        </svg>
      </div>

      <div className="container px-4 pt-12 sm:pt-16 pb-6">
        
        {/* CTA Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-primary/15 to-primary/5 border border-primary/20 p-5 sm:p-8 mb-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
          <div className="flex-1 text-center sm:text-start">
            <h3 className="text-lg sm:text-xl font-bold mb-1">
              {isAr ? '🌱 انضم إلى منظومة iRecycle' : '🌱 Join the iRecycle Ecosystem'}
            </h3>
            <p className="text-background/60 text-sm">
              {isAr ? 'أول منصة SaaS متكاملة لإدارة المخلفات في مصر والشرق الأوسط' : 'The first integrated SaaS platform for waste management in Egypt & MENA'}
            </p>
          </div>
          <button 
            onClick={() => navigate('/auth')}
            className="shrink-0 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all hover:scale-105 flex items-center gap-2"
          >
            {isAr ? 'سجّل مجاناً' : 'Register Free'}
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>

        {/* ─── Main Grid ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-x-5 gap-y-8 mb-10">
          
          {/* Brand — 2 cols */}
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <PlatformLogo size="lg" showText inverted showSubtitle />
            </div>
            <p className="text-background/55 leading-relaxed mb-4 text-xs max-w-xs">
              {t('footer.brandDesc')}
            </p>

            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <StatMini label={isAr ? 'جهة' : 'Orgs'} value="500+" />
              <StatMini label={isAr ? 'شحنة' : 'Shipments'} value="10K+" />
              <StatMini label={isAr ? 'طن' : 'Tons'} value="50K+" />
            </div>

            {/* Contact info */}
            <ul className="space-y-1.5 mb-4">
              <ContactItem icon={MapPin}>{t('footer.address')}</ContactItem>
              <ContactItem icon={Phone}><span dir="ltr">+20 2 1234 5678</span></ContactItem>
              <ContactItem icon={Mail}>info@irecycle.eg</ContactItem>
              <ContactItem icon={Clock}>{isAr ? 'الأحد - الخميس 9ص - 5م' : 'Sun-Thu 9AM-5PM'}</ContactItem>
            </ul>

            {/* Social */}
            <div className="flex gap-2">
              <SocialIcon icon={Facebook} label="Facebook" />
              <SocialIcon icon={Twitter} label="X" />
              <SocialIcon icon={Linkedin} label="LinkedIn" />
              <SocialIcon icon={Instagram} label="Instagram" />
            </div>
          </div>

          {/* المنصة */}
          <FooterColumn title={isAr ? 'المنصة' : 'Platform'} links={platformLinks} onNavigate={handleNavigate} />

          {/* الحلول */}
          <FooterColumn title={isAr ? 'الحلول' : 'Solutions'} links={solutionLinks} onNavigate={handleNavigate} />

          {/* التقنية */}
          <FooterColumn title={isAr ? 'التقنية والذكاء' : 'Tech & AI'} links={techLinks} onNavigate={handleNavigate} />

          {/* الشراكات والجهات */}
          <div>
            <FooterHeading>{isAr ? 'الجهات والشراكات' : 'Partners'}</FooterHeading>
            <ul className="space-y-1.5">
              {regulatorLinks.map(l => (
                <FooterLink key={l.href + l.label} onClick={() => handleNavigate(l.href)} icon={l.icon}>{l.label}</FooterLink>
              ))}
            </ul>
            <FooterHeading className="mt-4">{isAr ? 'الموارد' : 'Resources'}</FooterHeading>
            <ul className="space-y-1.5">
              {resourceLinks.map(l => (
                <FooterLink key={l.href + l.label} onClick={() => handleNavigate(l.href)} icon={l.icon}>{l.label}</FooterLink>
              ))}
            </ul>
          </div>

          {/* الدعم */}
          <div>
            <FooterHeading>{isAr ? 'الدعم' : 'Support'}</FooterHeading>
            <ul className="space-y-1.5">
              {supportLinks.map(l => (
                <FooterLink key={l.href + l.label} onClick={() => handleNavigate(l.href)} icon={l.icon}>{l.label}</FooterLink>
              ))}
            </ul>
          </div>
        </div>

        {/* ─── Legal Bar ─── */}
        <div className="border-t border-background/10 pt-4">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mb-3">
            {legalLinks.map((link, i) => (
              <span key={link.href} className="flex items-center gap-3">
                <button onClick={() => handleNavigate(link.href)} className="text-background/45 hover:text-primary transition-colors text-[11px]">
                  {link.label}
                </button>
                {i < legalLinks.length - 1 && <span className="text-background/15">·</span>}
              </span>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 text-background/35 text-[11px]">
            <div className="flex items-center gap-2">
              <span>© {new Date().getFullYear()} iRecycle. {t('footer.allRightsReserved')}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[9px] font-black tracking-wide">v5.1</span>
            </div>
            <span className="text-background/25 text-[10px]">
              {isAr ? 'صُنع بـ 💚 لمستقبل أنظف في مصر' : 'Made with 💚 for a cleaner future in Egypt'}
            </span>
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

/* ─── Sub-components ─── */

const FooterHeading = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <h4 className={`font-bold text-xs text-background/80 mb-2.5 ${className || ''}`}>{children}</h4>
);

const FooterColumn = ({ title, links, onNavigate }: { 
  title: string; 
  links: { label: string; href: string; icon: any }[];
  onNavigate: (href: string) => void;
}) => (
  <div>
    <FooterHeading>{title}</FooterHeading>
    <ul className="space-y-1.5">
      {links.map(l => (
        <FooterLink key={l.href + l.label} onClick={() => onNavigate(l.href)} icon={l.icon}>{l.label}</FooterLink>
      ))}
    </ul>
  </div>
);

const StatMini = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-background/5 p-1.5 text-center">
    <div className="text-primary font-black text-xs">{value}</div>
    <div className="text-background/45 text-[8px] leading-tight">{label}</div>
  </div>
);

const ContactItem = ({ icon: Icon, children }: { icon: typeof MapPin; children: React.ReactNode }) => (
  <li className="flex items-start gap-1.5 text-background/55 text-[11px]">
    <Icon className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
    <span>{children}</span>
  </li>
);

const SocialIcon = ({ icon: Icon, label }: { icon: typeof Facebook; label: string }) => (
  <button className="w-8 h-8 rounded-full bg-background/8 hover:bg-primary hover:scale-110 flex items-center justify-center transition-all duration-200" aria-label={label} title={label}>
    <Icon className="w-3.5 h-3.5" />
  </button>
);

const FooterLink = ({ children, onClick, icon: Icon }: { children: React.ReactNode; onClick: () => void; icon?: any }) => (
  <li>
    <button onClick={onClick} className="text-background/55 hover:text-primary transition-all inline-flex items-center gap-1 cursor-pointer text-[11px] group">
      {Icon && <Icon className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0" />}
      <span>{children}</span>
    </button>
  </li>
);

export default Footer;
