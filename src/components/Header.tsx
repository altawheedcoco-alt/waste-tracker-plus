import { memo } from "react";
import { Menu, X, LogIn, UserPlus, Globe } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import GuideButton from "@/components/guide/GuideButton";
import PlatformLogo from "@/components/common/PlatformLogo";
import { useLanguage } from "@/contexts/LanguageContext";

const Header = memo(() => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();

  const handleLogin = () => navigate('/auth?mode=login');
  const handleEmployeeLogin = () => navigate('/auth?mode=employee');

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-card/80 backdrop-blur-xl border-b border-border/30 animate-fade-in shadow-sm" style={{ WebkitBackdropFilter: 'blur(20px) saturate(1.8)' }}>
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => navigate('/')}
          >
            <PlatformLogo size="md" showText />
          </div>

          <nav className="hidden md:flex items-center gap-4 lg:gap-8">
            <NavLink href="#features">{t('nav.features')}</NavLink>
            <NavLink href="#services">{t('nav.services')}</NavLink>
            <NavLink href="#stats">{t('nav.stats')}</NavLink>
            <NavLink href="#contact">{t('nav.contact')}</NavLink>
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
            aria-label={t('nav.features')}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <nav className="flex flex-col gap-3">
              <NavLink href="#features" mobile>{t('nav.features')}</NavLink>
              <NavLink href="#services" mobile>{t('nav.services')}</NavLink>
              <NavLink href="#stats" mobile>{t('nav.stats')}</NavLink>
              <NavLink href="#contact" mobile>{t('nav.contact')}</NavLink>
              <div className="flex flex-col gap-3 pt-4">
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

const NavLink = ({ href, children, mobile = false }: { href: string; children: React.ReactNode; mobile?: boolean }) => (
  <a
    href={href}
    className={`font-medium text-muted-foreground hover:text-primary hover:scale-105 transition-all touch-manipulation ${
      mobile ? "text-base py-2" : "text-sm lg:text-base"
    }`}
  >
    {children}
  </a>
);

export default Header;
