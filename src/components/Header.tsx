import { motion } from "framer-motion";
import { Menu, X, LogIn, UserPlus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import GuideButton from "@/components/guide/GuideButton";
import logo from "@/assets/logo.png";
import { useLanguage } from "@/contexts/LanguageContext";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleLogin = () => navigate('/auth?mode=login');
  const handleEmployeeLogin = () => navigate('/auth?mode=employee');

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 glass-eco"
    >
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <img src={logo} alt={t('landing.systemNameAr')} className="h-10 w-10 sm:h-12 sm:w-12 object-contain" />
            <div className="flex flex-col">
              <span className="text-sm sm:text-base lg:text-lg font-bold text-primary tracking-wide">
                {t('landing.systemName')}
              </span>
              <span className="text-xs sm:text-sm lg:text-base font-semibold text-foreground/80">
                {t('landing.systemNameAr')}
              </span>
            </div>
          </motion.div>

          <nav className="hidden md:flex items-center gap-4 lg:gap-8">
            <NavLink href="#features">{t('nav.features')}</NavLink>
            <NavLink href="#services">{t('nav.services')}</NavLink>
            <NavLink href="#stats">{t('nav.stats')}</NavLink>
            <NavLink href="#contact">{t('nav.contact')}</NavLink>
          </nav>

          <div className="hidden md:flex items-center gap-2 lg:gap-3">
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
            aria-label={t('nav.features')}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden py-4 border-t border-border"
            >
              <nav className="flex flex-col gap-3">
                <NavLink href="#features" mobile>{t('nav.features')}</NavLink>
                <NavLink href="#services" mobile>{t('nav.services')}</NavLink>
                <NavLink href="#stats" mobile>{t('nav.stats')}</NavLink>
                <NavLink href="#contact" mobile>{t('nav.contact')}</NavLink>
                <div className="flex flex-col gap-3 pt-4">
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

import { AnimatePresence } from "framer-motion";

const NavLink = ({ href, children, mobile = false }: { href: string; children: React.ReactNode; mobile?: boolean }) => (
  <motion.a
    href={href}
    whileHover={{ scale: 1.05 }}
    className={`font-medium text-muted-foreground hover:text-primary transition-colors touch-manipulation ${
      mobile ? "text-base py-2" : "text-sm lg:text-base"
    }`}
  >
    {children}
  </motion.a>
);

export default Header;
