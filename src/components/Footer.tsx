import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
import PlatformLogo from "@/components/common/PlatformLogo";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-foreground text-background pt-8 sm:pt-16 pb-6 sm:pb-8">
      <div className="container px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-12 mb-8 sm:mb-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <PlatformLogo size="lg" showText inverted />
            </div>
            <p className="text-background/70 leading-relaxed mb-4 sm:mb-6 text-sm">{t('footer.brandDesc')}</p>
            <div className="flex gap-3 sm:gap-4">
              <SocialIcon icon={Facebook} /><SocialIcon icon={Twitter} /><SocialIcon icon={Linkedin} /><SocialIcon icon={Instagram} />
            </div>
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-bold mb-3 sm:mb-6">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2 sm:space-y-3">
              <FooterLink href="#">{t('nav.home')}</FooterLink>
              <FooterLink href="#features">{t('nav.features')}</FooterLink>
              <FooterLink href="#services">{t('nav.services')}</FooterLink>
              <FooterLink href="#stats">{t('nav.stats')}</FooterLink>
            </ul>
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-bold mb-3 sm:mb-6">{t('footer.ourServices')}</h4>
            <ul className="space-y-2 sm:space-y-3">
              <FooterLink href="#">{t('footer.shipmentMgmt')}</FooterLink>
              <FooterLink href="#">{t('footer.transportTracking')}</FooterLink>
              <FooterLink href="#">{t('footer.recyclingService')}</FooterLink>
              <FooterLink href="#">{t('footer.envReports')}</FooterLink>
            </ul>
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-bold mb-3 sm:mb-6">{t('footer.contactUs')}</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 sm:gap-3 text-background/70 text-sm"><MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 mt-0.5" /><span>{t('footer.address')}</span></li>
              <li className="flex items-center gap-2 sm:gap-3 text-background/70 text-sm"><Phone className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" /><span dir="ltr">+20 2 1234 5678</span></li>
              <li className="flex items-center gap-2 sm:gap-3 text-background/70 text-sm"><Mail className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" /><span>info@irecycle.eg</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-background/10 pt-8 text-center">
          <p className="text-background/50 text-sm">© {new Date().getFullYear()} {t('footer.allRightsReserved')}</p>
        </div>
      </div>
    </footer>
  );
};

const SocialIcon = ({ icon: Icon }: { icon: typeof Facebook }) => (
  <a href="#" className="w-10 h-10 rounded-full bg-background/10 hover:bg-primary hover:scale-110 hover:-translate-y-0.5 flex items-center justify-center transition-all duration-200">
    <Icon className="w-5 h-5" />
  </a>
);

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <li><a href={href} className="text-background/70 hover:text-primary hover:translate-x-[-4px] transition-all inline-block">{children}</a></li>
);

export default Footer;
