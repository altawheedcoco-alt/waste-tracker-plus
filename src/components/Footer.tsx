import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background pt-16 pb-8">
      <div className="container px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <img src={logo} alt="آي ريسايكل" className="h-12 w-12 object-contain brightness-0 invert" />
              <span className="text-xl font-bold">آي ريسايكل</span>
            </div>
            <p className="text-background/70 leading-relaxed mb-6">
              نظام متكامل لإدارة النفايات والحفاظ على البيئة. نقدم حلولاً ذكية لبيئة نظيفة ومستدامة.
            </p>
            <div className="flex gap-4">
              <SocialIcon icon={Facebook} />
              <SocialIcon icon={Twitter} />
              <SocialIcon icon={Linkedin} />
              <SocialIcon icon={Instagram} />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-6">روابط سريعة</h4>
            <ul className="space-y-3">
              <FooterLink href="#">الرئيسية</FooterLink>
              <FooterLink href="#features">المميزات</FooterLink>
              <FooterLink href="#services">الخدمات</FooterLink>
              <FooterLink href="#stats">الإحصائيات</FooterLink>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-bold mb-6">خدماتنا</h4>
            <ul className="space-y-3">
              <FooterLink href="#">إدارة الشحنات</FooterLink>
              <FooterLink href="#">تتبع النقل</FooterLink>
              <FooterLink href="#">إعادة التدوير</FooterLink>
              <FooterLink href="#">التقارير البيئية</FooterLink>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-bold mb-6">تواصل معنا</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-background/70">
                <MapPin className="w-5 h-5 text-primary" />
                <span>القاهرة، جمهورية مصر العربية</span>
              </li>
              <li className="flex items-center gap-3 text-background/70">
                <Phone className="w-5 h-5 text-primary" />
                <span dir="ltr">+20 2 1234 5678</span>
              </li>
              <li className="flex items-center gap-3 text-background/70">
                <Mail className="w-5 h-5 text-primary" />
                <span>info@irecycle.eg</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-background/10 pt-8 text-center">
          <p className="text-background/50 text-sm">
            © {new Date().getFullYear()} آي ريسايكل. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
};

const SocialIcon = ({ icon: Icon }: { icon: typeof Facebook }) => (
  <motion.a
    href="#"
    whileHover={{ scale: 1.1, y: -2 }}
    className="w-10 h-10 rounded-full bg-background/10 hover:bg-primary flex items-center justify-center transition-colors"
  >
    <Icon className="w-5 h-5" />
  </motion.a>
);

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <li>
    <motion.a
      href={href}
      whileHover={{ x: -4 }}
      className="text-background/70 hover:text-primary transition-colors inline-block"
    >
      {children}
    </motion.a>
  </li>
);

export default Footer;
