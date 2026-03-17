import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PlatformLogo from "@/components/common/PlatformLogo";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const quickLinks = [
    { label: t('nav.home'), href: '#top' },
    { label: t('nav.features'), href: '#features' },
    { label: t('nav.services'), href: '#services' },
    { label: t('footerExtra.blogLink'), href: '/blog' },
    { label: t('footerExtra.mapLink'), href: '/map' },
  ];

  const serviceLinks = [
    { label: t('footer.shipmentMgmt'), href: '#services' },
    { label: t('footer.transportTracking'), href: '#services' },
    { label: t('footer.recyclingService'), href: '#services' },
    { label: t('footer.envReports'), href: '#services' },
  ];

  const legalLinks = [
    { label: t('footerExtra.termsOfUse'), href: '/terms' },
    { label: t('footerExtra.privacyPolicy'), href: '/privacy' },
    { label: isAr ? 'سياسات المنصة' : 'Platform Policies', href: '/policies' },
    { label: t('footerExtra.licensesLegislation'), href: '/legislation' },
    { label: t('footerExtra.faq'), href: '/help' },
    { label: t('footerExtra.contactUsLink'), href: '/help' },
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
          const el2 = document.getElementById(targetId);
          el2?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500);
      }
    } else {
      navigate(href);
    }
  };

  return (
    <footer className="bg-foreground text-background pt-10 sm:pt-16 pb-6 sm:pb-8">
      <div className="container px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-10 mb-8 sm:mb-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <PlatformLogo size="lg" showText inverted showSubtitle />
            </div>
            <p className="text-background/70 leading-relaxed mb-4 sm:mb-6 text-sm max-w-sm">{t('footer.brandDesc')}</p>
            <div className="flex gap-3 sm:gap-4">
              <SocialIcon icon={Facebook} />
              <SocialIcon icon={Twitter} />
              <SocialIcon icon={Linkedin} />
              <SocialIcon icon={Instagram} />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-base sm:text-lg font-bold mb-3 sm:mb-5">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <FooterLink key={link.href + link.label} onClick={() => handleNavigate(link.href)}>{link.label}</FooterLink>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-base sm:text-lg font-bold mb-3 sm:mb-5">{t('footer.ourServices')}</h4>
            <ul className="space-y-2.5">
              {serviceLinks.map((link) => (
                <FooterLink key={link.href + link.label} onClick={() => handleNavigate(link.href)}>{link.label}</FooterLink>
              ))}
            </ul>
          </div>

          {/* Contact + Legal */}
          <div>
            <h4 className="text-base sm:text-lg font-bold mb-3 sm:mb-5">{t('footer.contactUs')}</h4>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2 text-background/70 text-sm">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>{t('footer.address')}</span>
              </li>
              <li className="flex items-center gap-2 text-background/70 text-sm">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                <span dir="ltr">+20 2 1234 5678</span>
              </li>
              <li className="flex items-center gap-2 text-background/70 text-sm">
                <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                <span>info@irecycle.eg</span>
              </li>
            </ul>

            <h4 className="text-sm font-bold mb-3 text-background/80">{t('footerExtra.legal')}</h4>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <FooterLink key={link.href + link.label} onClick={() => handleNavigate(link.href)}>{link.label}</FooterLink>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-background/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-background/50 text-sm">© {new Date().getFullYear()} {t('footer.allRightsReserved')}</p>
          <div className="flex gap-4 text-background/40 text-xs">
            <button onClick={() => handleNavigate('/terms')} className="hover:text-primary transition-colors">{t('footerExtra.terms')}</button>
            <span>·</span>
            <button onClick={() => handleNavigate('/privacy')} className="hover:text-primary transition-colors">{t('footerExtra.privacy')}</button>
            <span>·</span>
            <button onClick={() => handleNavigate('/help')} className="hover:text-primary transition-colors">{t('footerExtra.help')}</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

const SocialIcon = ({ icon: Icon }: { icon: typeof Facebook }) => (
  <button className="w-10 h-10 rounded-full bg-background/10 hover:bg-primary hover:scale-110 hover:-translate-y-0.5 flex items-center justify-center transition-all duration-200 cursor-pointer">
    <Icon className="w-5 h-5" />
  </button>
);

const FooterLink = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
  <li>
    <button onClick={onClick} className="text-background/70 hover:text-primary hover:translate-x-[-4px] transition-all inline-block cursor-pointer text-sm">
      {children}
    </button>
  </li>
);

export default Footer;