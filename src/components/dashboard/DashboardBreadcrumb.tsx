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
  'driver-tracking': 'تتبع السائقين',
  'company-approvals': 'موافقات الشركات',
  'driver-approvals': 'موافقات السائقين',
  'organization-documents': 'وثائق الجهات',
  reports: 'التقارير',
  notifications: 'الإشعارات',
  settings: 'الإعدادات',
  new: 'إنشاء جديد',
  edit: 'تعديل',
  partners: 'الجهات المرتبطة',
  'ai-tools': 'أدوات الذكاء الاصطناعي',
  'carbon-footprint': 'البصمة الكربونية',
  'employee-management': 'إدارة الموظفين',
  'environmental-sustainability': 'الاستدامة البيئية',
  'system-overview': 'نظرة عامة على النظام',
  'company-management': 'إدارة الشركات',
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
      className="mb-4 flex items-center gap-3"
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
              <BreadcrumbItem key={to}>
                <BreadcrumbSeparator>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </BreadcrumbSeparator>
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
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </motion.div>
  );
};

export default DashboardBreadcrumb;
