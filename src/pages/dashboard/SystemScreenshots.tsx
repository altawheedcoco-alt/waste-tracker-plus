import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Monitor, Smartphone, Camera, Download, ExternalLink,
  LayoutDashboard, Building2, Truck, Recycle, Factory,
  Shield, User, LogIn, Home, Loader2, Image as ImageIcon,
  Eye, ZoomIn, X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';

// Screenshot categories
const screenshotCategories = [
  {
    id: 'public',
    label: 'الصفحات العامة',
    icon: Home,
    screens: [
      {
        id: 'landing',
        title: 'الصفحة الرئيسية',
        description: 'صفحة الهبوط الرئيسية للمنصة',
        path: '/',
        image: '/screenshots/landing-page.png',
      },
      {
        id: 'auth',
        title: 'تسجيل الدخول',
        description: 'صفحة تسجيل دخول المستخدمين',
        path: '/auth',
        image: '/screenshots/auth-page.png',
      },
    ],
  },
  {
    id: 'generator',
    label: 'مولد المخلفات',
    icon: Building2,
    screens: [
      { id: 'gen-dash', title: 'لوحة تحكم المولد', description: 'عرض ملخص العمليات والإحصائيات', path: '/dashboard', image: null },
      { id: 'gen-shipments', title: 'إدارة الشحنات', description: 'عرض وتتبع شحنات المخلفات', path: '/dashboard/shipments', image: null },
      { id: 'gen-reports', title: 'التقارير البيئية', description: 'تقارير الامتثال والأداء', path: '/dashboard/reports', image: null },
    ],
  },
  {
    id: 'transporter',
    label: 'ناقل المخلفات',
    icon: Truck,
    screens: [
      { id: 'trans-dash', title: 'لوحة تحكم الناقل', description: 'مركز القيادة للعمليات اللوجستية', path: '/dashboard', image: null },
      { id: 'trans-shipments', title: 'شحنات الناقل', description: 'إدارة ومتابعة الشحنات', path: '/dashboard/transporter-shipments', image: null },
      { id: 'trans-drivers', title: 'إدارة السائقين', description: 'متابعة السائقين والمركبات', path: '/dashboard/transporter-drivers', image: null },
    ],
  },
  {
    id: 'recycler',
    label: 'معيد التدوير',
    icon: Recycle,
    screens: [
      { id: 'rec-dash', title: 'لوحة تحكم المعيد', description: 'ملخص عمليات إعادة التدوير', path: '/dashboard', image: null },
      { id: 'rec-shipments', title: 'الشحنات الواردة', description: 'استقبال وإدارة المواد', path: '/dashboard/shipments', image: null },
      { id: 'rec-certs', title: 'شهادات إعادة التدوير', description: 'إصدار الشهادات البيئية', path: '/dashboard/issue-recycling-certificates', image: null },
    ],
  },
  {
    id: 'disposal',
    label: 'جهة التخلص الآمن',
    icon: Factory,
    screens: [
      { id: 'disp-dash', title: 'لوحة تحكم التخلص', description: 'إدارة مرافق التخلص الآمن', path: '/dashboard', image: null },
      { id: 'disp-shipments', title: 'شحنات التخلص', description: 'متابعة عمليات التخلص', path: '/dashboard/shipments', image: null },
    ],
  },
  {
    id: 'driver',
    label: 'السائق',
    icon: User,
    screens: [
      { id: 'drv-dash', title: 'لوحة تحكم السائق', description: 'المهام اليومية وحالة الشحنات', path: '/dashboard', image: null },
      { id: 'drv-shipments', title: 'شحنات السائق', description: 'الشحنات المسندة للسائق', path: '/dashboard/transporter-shipments', image: null },
      { id: 'drv-location', title: 'موقعي', description: 'تتبع الموقع والرحلات', path: '/dashboard/my-location', image: null },
    ],
  },
  {
    id: 'admin',
    label: 'مدير النظام',
    icon: Shield,
    screens: [
      { id: 'adm-dash', title: 'لوحة التحكم الرئيسية', description: 'نظرة عامة على كل العمليات', path: '/dashboard', image: null },
      { id: 'adm-companies', title: 'إدارة الشركات', description: 'قبول ومراجعة الشركات', path: '/dashboard/company-management', image: null },
      { id: 'adm-drivers', title: 'قبول السائقين', description: 'مراجعة طلبات السائقين', path: '/dashboard/driver-approvals', image: null },
      { id: 'adm-system', title: 'حالة النظام', description: 'مراقبة صحة النظام', path: '/dashboard/system-status', image: null },
      { id: 'adm-insights', title: 'العين الذكية', description: 'تحليلات وتوصيات ذكية', path: '/dashboard/smart-insights', image: null },
    ],
  },
];

const SystemScreenshots = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<{ title: string; src: string } | null>(null);
  const [capturing, setCapturing] = useState<string | null>(null);

  const handleCapture = useCallback(async (screenId: string, path: string) => {
    setCapturing(screenId);
    // Navigate to the page - admin can use shadow login for other entity types
    setTimeout(() => {
      navigate(path);
      setCapturing(null);
    }, 500);
  }, [navigate]);

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 pb-20"
      >
        <BackButton />

        <div className="flex items-center justify-between">
          <div className="text-right">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 justify-end">
              <Camera className="h-6 w-6 text-primary" />
              سكرين شوت النظام
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              عرض شامل لكافة واجهات وصفحات المنصة لكل جهة
            </p>
          </div>
        </div>

        <Tabs defaultValue="public" className="w-full" dir="rtl">
          <ScrollArea className="w-full" dir="rtl">
            <TabsList className="inline-flex w-auto min-w-full justify-start gap-1 bg-card border border-border/50 p-1 h-auto">
              {screenshotCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    className="whitespace-nowrap text-[10px] sm:text-xs gap-1.5 px-2.5 py-2 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-primary/30"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cat.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </ScrollArea>

          {screenshotCategories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.screens.map((screen) => (
                  <Card key={screen.id} className="overflow-hidden group hover:border-primary/30 transition-all">
                    {/* Screenshot preview */}
                    <div className="relative aspect-video bg-muted/50 overflow-hidden">
                      {screen.image ? (
                        <>
                          <img
                            src={screen.image}
                            alt={screen.title}
                            className="w-full h-full object-cover object-top transition-transform group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity gap-1.5"
                              onClick={() => setSelectedImage({ title: screen.title, src: screen.image! })}
                            >
                              <ZoomIn className="w-3.5 h-3.5" />
                              تكبير
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground/50">
                          <Monitor className="w-10 h-10" />
                          <span className="text-[10px]">لم يتم التقاط بعد</span>
                        </div>
                      )}
                    </div>

                    {/* Card info */}
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 text-right">
                          <h3 className="font-semibold text-sm">{screen.title}</h3>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{screen.description}</p>
                        </div>
                        <Badge variant="outline" className="text-[9px] shrink-0">
                          {screen.image ? 'متاح' : 'قيد التجهيز'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs gap-1.5"
                          onClick={() => handleCapture(screen.id, screen.path)}
                          disabled={capturing === screen.id}
                        >
                          {capturing === screen.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <ExternalLink className="w-3 h-3" />
                          )}
                          فتح الصفحة
                        </Button>
                        {screen.image && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs gap-1.5"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = screen.image!;
                              link.download = `${screen.id}.png`;
                              link.click();
                            }}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Lightbox for image preview */}
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-12 left-0 text-white hover:bg-white/20"
                onClick={() => setSelectedImage(null)}
              >
                <X className="w-6 h-6" />
              </Button>
              <p className="absolute -top-12 right-0 text-white text-sm">{selectedImage.title}</p>
              <img
                src={selectedImage.src}
                alt={selectedImage.title}
                className="w-full rounded-xl shadow-2xl"
              />
            </div>
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default SystemScreenshots;
