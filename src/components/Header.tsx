import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogIn, UserPlus, Factory, Recycle, Truck, Building2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import GuideButton from "@/components/guide/GuideButton";
import logo from "@/assets/logo.png";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/auth?mode=login');
  };

  const handleEmployeeLogin = () => {
    navigate('/auth?mode=employee');
  };

  const handleQuickLogin = (type: string) => {
    navigate(`/auth?mode=login&type=${type}`);
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 glass-eco"
    >
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <img src={logo} alt="آي ريسايكل" className="h-10 w-10 sm:h-12 sm:w-12 object-contain" />
            <div className="flex flex-col">
              <span className="text-sm sm:text-base lg:text-lg font-bold text-primary tracking-wide">
                iRecycle Waste Management System
              </span>
              <span className="text-xs sm:text-sm lg:text-base font-semibold text-foreground/80">
                نظام آي ريسايكل لإدارة المخلفات
              </span>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-8">
            <NavLink href="#features">المميزات</NavLink>
            <NavLink href="#services">الخدمات</NavLink>
            <NavLink href="#stats">الإحصائيات</NavLink>
            <NavLink href="#contact">تواصل معنا</NavLink>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            <GuideButton />
            
            {/* Quick Login Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="default" className="gap-2 text-sm">
                  <Factory className="w-4 h-4" />
                  دخول سريع
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleQuickLogin('generator')} className="gap-2 cursor-pointer">
                  <Building2 className="w-4 h-4 text-primary" />
                  جهة مولدة
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleQuickLogin('transporter')} className="gap-2 cursor-pointer">
                  <Truck className="w-4 h-4 text-primary" />
                  جهة ناقلة
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleQuickLogin('recycler')} className="gap-2 cursor-pointer">
                  <Recycle className="w-4 h-4 text-primary" />
                  جهة تدوير
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleQuickLogin('disposal')} className="gap-2 cursor-pointer">
                  <Factory className="w-4 h-4 text-destructive" />
                  جهة تخلص نهائي
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              variant="outline" 
              size="default"
              onClick={handleEmployeeLogin}
              className="gap-2 text-sm lg:text-base"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden lg:inline">دخول كموظف</span>
              <span className="lg:hidden">موظف</span>
            </Button>
            <Button 
              variant="eco" 
              size="default"
              onClick={handleLogin}
              className="gap-2 text-sm lg:text-base"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden lg:inline">تسجيل الدخول</span>
              <span className="lg:hidden">دخول</span>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-foreground touch-manipulation"
            aria-label="فتح القائمة"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden py-4 border-t border-border"
            >
              <nav className="flex flex-col gap-3">
                <NavLink href="#features" mobile>المميزات</NavLink>
                <NavLink href="#services" mobile>الخدمات</NavLink>
                <NavLink href="#stats" mobile>الإحصائيات</NavLink>
                <NavLink href="#contact" mobile>تواصل معنا</NavLink>
                <div className="flex flex-col gap-3 pt-4">
                  <GuideButton />
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 h-11 touch-manipulation" 
                    onClick={handleEmployeeLogin}
                  >
                    <UserPlus className="w-4 h-4" />
                    دخول كموظف
                  </Button>
                  <Button 
                    variant="eco" 
                    className="w-full gap-2 h-11 touch-manipulation" 
                    onClick={handleLogin}
                  >
                    <LogIn className="w-4 h-4" />
                    تسجيل الدخول
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
