import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowRight, Search, Map, BookOpen, HelpCircle, Shield } from "lucide-react";

const popularLinks = [
  { label: "الصفحة الرئيسية", path: "/", icon: Home },
  { label: "تتبع شحنة", path: "/track", icon: Search },
  { label: "الخريطة التفاعلية", path: "/map", icon: Map },
  { label: "الأكاديمية", path: "/academy", icon: BookOpen },
  { label: "المساعدة والدعم", path: "/help", icon: HelpCircle },
  { label: "التشريعات والقوانين", path: "/legislation", icon: Shield },
];

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background" dir="rtl">
      <div className="text-center space-y-8 p-8 max-w-lg mx-auto">
        <div className="text-9xl font-bold text-primary/15 select-none">404</div>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-foreground">الصفحة غير موجودة</h1>
          <p className="text-muted-foreground text-lg">
            الصفحة التي تبحث عنها غير متاحة أو تم نقلها.
          </p>
          <p className="text-muted-foreground/70 text-sm font-mono bg-muted/50 rounded-lg px-3 py-1.5 inline-block">
            {location.pathname}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Button onClick={() => navigate(-1)} variant="outline" size="lg" className="gap-2">
            <ArrowRight className="w-4 h-4" />
            رجوع
          </Button>
          <Button onClick={() => navigate('/')} size="lg" className="gap-2">
            <Home className="w-4 h-4" />
            الصفحة الرئيسية
          </Button>
        </div>

        <div className="pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">روابط قد تساعدك:</p>
          <div className="grid grid-cols-2 gap-2">
            {popularLinks.map((link) => (
              <Button
                key={link.path}
                variant="ghost"
                className="justify-start gap-2 text-sm h-auto py-2.5"
                onClick={() => navigate(link.path)}
              >
                <link.icon className="w-4 h-4 text-primary" />
                {link.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
