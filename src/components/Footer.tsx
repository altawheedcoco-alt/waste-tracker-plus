import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
import logo from "@/assets/logo.png";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-foreground text-background pt-10 sm:pt-16 pb-6 sm:pb-8">
      <div className="container px-4">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-12 mb-8 sm:mb-12">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <img src={logo} alt={t('footer.brandName')} className="h-12 w-12 object-contain brightness-0 invert" />
              <span className="text-xl font-bold">{t('footer.brandName')}</span>
            </div>
            <p className="text-background/70 leading-relaxed mb-6">{t('footer.brandDesc')}</p>
            <div className="flex gap-4">
              <SocialIcon icon={Facebook} /><SocialIcon icon={Twitter} /><SocialIcon icon={Linkedin} /><SocialIcon icon={Instagram} />
            </div>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-6">{t('footer.quickLinks')}</h4>
            <ul className="space-y-3">
              <FooterLink href="#">{t('nav.home')}</FooterLink>
              <FooterLink href="#features">{t('nav.features')}</FooterLink>
              <FooterLink href="#services">{t('nav.services')}</FooterLink>
              <FooterLink href="#stats">{t('nav.stats')}</FooterLink>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-6">{t('footer.ourServices')}</h4>
            <ul className="space-y-3">
              <FooterLink href="#">{t('footer.shipmentMgmt')}</FooterLink>
              <FooterLink href="#">{t('footer.transportTracking')}</FooterLink>
              <FooterLink href="#">{t('footer.recyclingService')}</FooterLink>
              <FooterLink href="#">{t('footer.envReports')}</FooterLink>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-6">{t('footer.contactUs')}</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-background/70"><MapPin className="w-5 h-5 text-primary" /><span>{t('footer.address')}</span></li>
              <li className="flex items-center gap-3 text-background/70"><Phone className="w-5 h-5 text-primary" /><span dir="ltr">+20 2 1234 5678</span></li>
              <li className="flex items-center gap-3 text-background/70"><Mail className="w-5 h-5 text-primary" /><span>info@irecycle.eg</span></li>
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
  <motion.a href="#" whileHover={{ scale: 1.1, y: -2 }} className="w-10 h-10 rounded-full bg-background/10 hover:bg-primary flex items-center justify-center transition-colors">
    <Icon className="w-5 h-5" />
  </motion.a>
);

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <li><motion.a href={href} whileHover={{ x: -4 }} className="text-background/70 hover:text-primary transition-colors inline-block">{children}</motion.a></li>
);

export default Footer;
