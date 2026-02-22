import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowRight } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background" dir="rtl">
      <div className="text-center space-y-6 p-8">
        <div className="text-8xl font-bold text-primary/20">404</div>
        <h1 className="text-2xl font-bold text-foreground">الصفحة غير موجودة</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          الصفحة التي تبحث عنها غير متاحة أو تم نقلها.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={() => navigate(-1)} variant="outline" className="gap-2">
            <ArrowRight className="w-4 h-4" />
            رجوع
          </Button>
          <Button onClick={() => navigate('/')} className="gap-2">
            <Home className="w-4 h-4" />
            الصفحة الرئيسية
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
