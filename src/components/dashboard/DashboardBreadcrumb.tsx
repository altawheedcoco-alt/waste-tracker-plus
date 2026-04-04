import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Home, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const routeLabels: Record<string, string> = {
  dashboard: 'لوحة التحكم',
  'organization-profile': 'ملف الجهة',
  shipments: 'الشحنات',
  'transporter-shipments': 'الشحنات',
  'transporter-drivers': 'السائقين',
  'transporter-receipts': 'شهادات الاستلام',
  'transporter-ai-tools': 'أدوات الذكاء الاصطناعي',
  'driver-tracking': 'تتبع السائقين',
  'tracking-center': 'مركز التتبع',
  'company-approvals': 'موافقات الشركات',
  'driver-approvals': 'موافقات السائقين',
  'organization-documents': 'وثائق الجهات',
  reports: 'التقارير',
  'shipment-reports': 'تقارير الشحنات',
  'aggregate-report': 'التقرير المجمع',
  notifications: 'الإشعارات',
  settings: 'الإعدادات',
  new: 'إنشاء جديد',
  edit: 'تعديل',
  partners: 'الجهات المرتبطة',
  'partner-accounts': 'حسابات الشركاء',
  'ai-tools': 'أدوات الذكاء الاصطناعي',
  'carbon-footprint': 'البصمة الكربونية',
  'employee-management': 'إدارة الموظفين',
  'environmental-sustainability': 'الاستدامة البيئية',
  'environmental-passport': 'جواز السفر البيئي',
  'iot-fill-prediction': 'رادار التنبؤ بالامتلاء',
  'community-rewards': 'المكافآت المجتمعية',
  'secondary-materials': 'سوق السلع الثانوية',
  'circular-matcher': 'المطابق الدائري',
  'developer-portal': 'بوابة المطورين',
  'system-overview': 'نظرة عامة على النظام',
  'admin-revenue': 'الإيرادات والاشتراكات',
  'company-management': 'إدارة الشركات',
  // الشحنات والعمليات
  'rejected-shipments': 'الشحنات المرفوضة',
  'recurring-shipments': 'الشحنات المتكررة',
  'collection-requests': 'طلبات الجمع',
  'manual-shipment': 'شحنة يدوية',
  'manual-shipment-drafts': 'مسودات الشحنات',
  'bulk-weight-entries': 'الوزنات الجماعية',
  'external-records': 'السجل الخارجي',
  'shipment-routes': 'مسارات الشحنات',
  'print-center': 'مركز الطباعة',
  'loading-workers': 'عمال التحميل',
  // السائقين والأسطول
  'driver-permits': 'تصاريح السائقين',
  'driver-academy': 'أكاديمية السائقين',
  'driver-rewards': 'مكافآت السائقين',
  'driver-my-route': 'مساري',
  'driver-profile': 'ملف السائق',
  'driver-data': 'بيانات السائق',
  'driver-analytics': 'تحليلات السائق',
  'preventive-maintenance': 'الصيانة الوقائية',
  'fuel-management': 'إدارة الوقود',
  // المالية
  'quick-deposit-links': 'روابط الإيداع',
  'quick-shipment-links': 'روابط الشحنات',
  'quick-driver-links': 'روابط السائقين',
  'quotations': 'عروض الأسعار',
  'e-invoice': 'الفاتورة الإلكترونية',
  deposits: 'الإيداعات',
  // الحوكمة والمؤسسة
  'org-structure': 'الهيكل التنظيمي',
  'team-credentials': 'بيانات الفريق',
  'governance-dashboard': 'الحوكمة والرقابة',
  'cyber-security': 'الأمن السيبراني',
  'compliance-analysis': 'تحليل الامتثال',
  'auto-actions': 'الإجراءات التلقائية',
  'scoped-access-links': 'روابط المشاركة',
  'authorized-signatories': 'المفوضين بالتوقيع',
  // التواصل والمحتوى
  chat: 'الرسائل',
  'social-feed': 'المنشورات',
  reels: 'الريلز',
  stories: 'القصص',
  'platform-posts': 'منشورات المنصة',
  // الخرائط والتتبع
  'map-explorer': 'مستكشف الخريطة',
  'waze-live-map': 'الخريطة المباشرة',
  'my-location': 'موقعي',
  'gps-settings': 'إعدادات GPS',
  cameras: 'الكاميرات',
  'iot-settings': 'إعدادات IoT',
  // التقارير والتحليلات
  'data-export': 'تصدير البيانات',
  'non-hazardous-register': 'سجل المخلفات غير الخطرة',
  'hazardous-register': 'سجل المخلفات الخطرة',
  'smart-insights': 'الرؤى الذكية',
  'executive': 'اللوحة التنفيذية',
  'advanced-analytics': 'التحليلات المتقدمة',
  // ERP
  erp: 'ERP',
  accounting: 'المحاسبة',
  inventory: 'المخزون',
  'purchasing-sales': 'المشتريات والمبيعات',
  'financial-dashboard': 'لوحة المالية',
  // HR
  hr: 'الموارد البشرية',
  payroll: 'مسيّر الرواتب',
  performance: 'الأداء',
  shifts: 'الورديات',
  'end-of-service': 'نهاية الخدمة',
  // أخرى
  'customer-portal': 'بوابة العملاء',
  'white-label-portal': 'البوابة المخصصة',
  'smart-agent': 'الوكيل الذكي',
  'laws-regulations': 'القوانين واللوائح',
  'waste-exchange': 'بورصة المخلفات',
  'b2b-marketplace': 'سوق B2B',
  subscription: 'الاشتراك',
  'operations': 'العمليات',
  'delivery-declarations': 'إقرارات التسليم',
  'digital-wallet': 'المحفظة الرقمية',
  'document-archive': 'أرشيف المستندات',
  'document-center': 'مركز المستندات',
  'activity-log': 'سجل النشاط',
  webhooks: 'الويب هوكس',
  'api-management': 'إدارة API',
};

const DashboardBreadcrumb = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Don't show on main dashboard
  if (pathnames.length <= 1) return null;

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-2 sm:mb-4 flex items-center gap-2 sm:gap-3 max-sm:hidden"
    >
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBack}
        className="gap-1.5 text-muted-foreground hover:text-foreground shrink-0 px-2"
      >
        <ArrowRight className="h-4 w-4" />
        رجوع
      </Button>

      <div className="h-4 w-px bg-border" />

      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList className="text-sm">
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link 
                to="/dashboard" 
                className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
              >
                <Home className="h-3.5 w-3.5" />
                <span>الرئيسية</span>
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {pathnames.slice(1).map((value, index) => {
            const to = `/${pathnames.slice(0, index + 2).join('/')}`;
            const isLast = index === pathnames.length - 2;
            const label = routeLabels[value] || value;

            return (
              <React.Fragment key={to}>
                <BreadcrumbSeparator>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="font-medium text-foreground">
                      {label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link 
                        to={to}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {label}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </motion.div>
  );
};

export default DashboardBreadcrumb;
