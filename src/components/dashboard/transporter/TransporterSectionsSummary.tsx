/**
 * ويدجات ملخصة لجميع أقسام القائمة الجانبية للناقل
 * تعرض بطاقة لكل قسم مع أيقونات العناصر وروابط سريعة
 */
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Package, AlertTriangle, FileText, Scale, Fingerprint, Inbox, Plus, Printer,
  MapPin, Truck, Boxes, GitCompareArrows, Wrench,
  Users, Shield, CalendarClock, GraduationCap, Trophy,
  FileCheck, FolderCheck, ClipboardList, HardHat,
  Sparkles, Database, FolderOpen, Upload, PenTool, CircleDot,
  Calculator, Banknote, Award, Activity, Network, ShoppingCart, BarChart3, Umbrella, TrendingUp, Wallet,
  MessageCircle, Video, Send, BookOpen,
  Store, Globe, Search, Bookmark, Link2, Zap,
  Receipt, FileSignature,
  LucideIcon,
} from 'lucide-react';

interface SectionItem {
  icon: LucideIcon;
  label: string;
  labelEn: string;
  path: string;
}

interface SectionConfig {
  id: string;
  title: string;
  titleEn: string;
  icon: LucideIcon;
  gradient: string;
  items: SectionItem[];
}

const sections: SectionConfig[] = [
  {
    id: 'shipping-ops',
    title: 'عمليات الشحن',
    titleEn: 'Shipping Operations',
    icon: Package,
    gradient: 'from-blue-500 to-cyan-500',
    items: [
      { icon: Package, label: 'الشحنات', labelEn: 'Shipments', path: '/dashboard/transporter-shipments' },
      { icon: AlertTriangle, label: 'الشحنات المرفوضة', labelEn: 'Rejected', path: '/dashboard/rejected-shipments' },
      { icon: FileText, label: 'شهادات الاستلام', labelEn: 'Receipt Certs', path: '/dashboard/transporter-receipts' },
      { icon: Scale, label: 'السجل الخارجي', labelEn: 'External Records', path: '/dashboard/external-records' },
      { icon: Scale, label: 'الوزنات الجماعية', labelEn: 'Bulk Weight', path: '/dashboard/bulk-weight-entries' },
      { icon: Fingerprint, label: 'أنماط الجيلوش', labelEn: 'Guilloche', path: '/dashboard/guilloche-patterns' },
      { icon: Inbox, label: 'طلبات الجمع', labelEn: 'Collection Requests', path: '/dashboard/collection-requests' },
      { icon: Plus, label: 'شحنة يدوية', labelEn: 'Manual Shipment', path: '/dashboard/manual-shipment' },
      { icon: FileText, label: 'أرشيف النماذج', labelEn: 'Manual Drafts', path: '/dashboard/manual-shipment-drafts' },
      { icon: Printer, label: 'مركز الطباعة', labelEn: 'Print Center', path: '/dashboard/print-center' },
    ],
  },
  {
    id: 'fleet-tracking',
    title: 'الأسطول والتتبع',
    titleEn: 'Fleet & Tracking',
    icon: Truck,
    gradient: 'from-emerald-500 to-teal-500',
    items: [
      { icon: MapPin, label: 'التتبع المباشر', labelEn: 'Live Tracking', path: '/dashboard/tracking-center' },
      { icon: MapPin, label: 'تتبع السائقين', labelEn: 'Driver Tracking', path: '/dashboard/driver-tracking' },
      { icon: Truck, label: 'خريطة المسارات', labelEn: 'Routes Map', path: '/dashboard/shipment-routes' },
      { icon: Boxes, label: 'إدارة الحاويات', labelEn: 'Containers', path: '/dashboard?tab=fleet' },
      { icon: GitCompareArrows, label: 'إعادة تعيين المركبات', labelEn: 'Vehicle Reassignment', path: '/dashboard?tab=fleet' },
      { icon: Wrench, label: 'الصيانة الوقائية', labelEn: 'Maintenance', path: '/dashboard/preventive-maintenance' },
    ],
  },
  {
    id: 'workforce',
    title: 'إدارة القوى العاملة',
    titleEn: 'Workforce Management',
    icon: Users,
    gradient: 'from-violet-500 to-purple-500',
    items: [
      { icon: Users, label: 'إدارة السائقين', labelEn: 'Drivers', path: '/dashboard/transporter-drivers' },
      { icon: Shield, label: 'تصاريح السائقين', labelEn: 'Driver Permits', path: '/dashboard/driver-permits' },
      { icon: CalendarClock, label: 'جدولة الورديات', labelEn: 'Shift Scheduler', path: '/dashboard?tab=intelligence' },
      { icon: GraduationCap, label: 'أكاديمية السائقين', labelEn: 'Driver Academy', path: '/dashboard/driver-academy' },
      { icon: Trophy, label: 'مكافآت السائقين', labelEn: 'Driver Rewards', path: '/dashboard/driver-rewards' },
    ],
  },
  {
    id: 'regulatory',
    title: 'المركز التنظيمي',
    titleEn: 'Regulatory Center',
    icon: Shield,
    gradient: 'from-amber-500 to-orange-500',
    items: [
      { icon: FileCheck, label: 'إقرارات التسليم', labelEn: 'Delivery Declarations', path: '/dashboard/delivery-declarations' },
      { icon: FolderCheck, label: 'شهادات التدوير', labelEn: 'Recycling Certs', path: '/dashboard/recycling-certificates' },
      { icon: FileCheck, label: 'تجديد التراخيص', labelEn: 'License Renewal', path: '/dashboard?tab=licenses' },
      { icon: FileText, label: 'الإقرارات الدورية', labelEn: 'Periodic Declarations', path: '/dashboard?tab=declarations' },
      { icon: ClipboardList, label: 'الخطة السنوية', labelEn: 'Annual Plan', path: '/dashboard?tab=annual_plan' },
      { icon: HardHat, label: 'السلامة المهنية', labelEn: 'Safety & OHS', path: '/dashboard/safety' },
    ],
  },
  {
    id: 'documents',
    title: 'مركز المستندات',
    titleEn: 'Document Center',
    icon: FolderOpen,
    gradient: 'from-indigo-500 to-blue-500',
    items: [
      { icon: Sparkles, label: 'استوديو ذكي', labelEn: 'AI Studio', path: '/dashboard/ai-document-studio' },
      { icon: Database, label: 'بياناتي', labelEn: 'My Data', path: '/dashboard/my-data' },
      { icon: FolderOpen, label: 'مركز المستندات', labelEn: 'Document Center', path: '/dashboard/document-center' },
      { icon: Upload, label: 'رفع المستندات', labelEn: 'Upload', path: '/dashboard/document-center?tab=upload' },
      { icon: Scale, label: 'المستندات التنظيمية', labelEn: 'Regulatory Docs', path: '/dashboard/regulatory-documents' },
      { icon: PenTool, label: 'التوقيعات', labelEn: 'Signatures', path: '/dashboard/document-center?tab=signatures' },
      { icon: CircleDot, label: 'QR وباركود', labelEn: 'QR & Barcode', path: '/dashboard/document-center?tab=qr-barcode' },
      { icon: FileSignature, label: 'العقود', labelEn: 'Contracts', path: '/dashboard/document-center?tab=contracts' },
      { icon: Award, label: 'الشهادات', labelEn: 'Certificates', path: '/dashboard/document-center?tab=certificates' },
      { icon: Receipt, label: 'الفواتير', labelEn: 'Invoices', path: '/dashboard/document-center?tab=invoices' },
    ],
  },
  {
    id: 'finance',
    title: 'المالية والمحاسبة',
    titleEn: 'Finance & Accounting',
    icon: Wallet,
    gradient: 'from-emerald-500 to-green-500',
    items: [
      { icon: Calculator, label: 'المحاسبة', labelEn: 'Accounting', path: '/dashboard/erp/accounting' },
      { icon: Package, label: 'المخزون', labelEn: 'Inventory', path: '/dashboard/erp/inventory' },
      { icon: Users, label: 'الموارد البشرية', labelEn: 'HR', path: '/dashboard/erp/hr' },
      { icon: Banknote, label: 'مسيّر الرواتب', labelEn: 'Payroll', path: '/dashboard/hr/payroll' },
      { icon: ShoppingCart, label: 'المشتريات والمبيعات', labelEn: 'Purchasing', path: '/dashboard/erp/purchasing-sales' },
      { icon: BarChart3, label: 'التقارير المالية', labelEn: 'Financial Reports', path: '/dashboard/erp/financial-dashboard' },
      { icon: Umbrella, label: 'التأمين الذكي', labelEn: 'Smart Insurance', path: '/dashboard/smart-insurance' },
      { icon: TrendingUp, label: 'العقود الآجلة', labelEn: 'Futures Market', path: '/dashboard/futures-market' },
      { icon: Wallet, label: 'المحفظة الرقمية', labelEn: 'Digital Wallet', path: '/dashboard/digital-wallet' },
    ],
  },
  {
    id: 'reports',
    title: 'التقارير والتحليلات',
    titleEn: 'Reports & Analytics',
    icon: BarChart3,
    gradient: 'from-rose-500 to-pink-500',
    items: [
      { icon: BarChart3, label: 'التقارير', labelEn: 'Reports', path: '/dashboard/reports' },
      { icon: FileText, label: 'تقارير الشحنات', labelEn: 'Shipment Reports', path: '/dashboard/shipment-reports' },
      { icon: ClipboardList, label: 'التقرير التجميعي', labelEn: 'Aggregate Report', path: '/dashboard/aggregate-report' },
      { icon: Leaf, label: 'البصمة الكربونية', labelEn: 'Carbon Footprint', path: '/dashboard/carbon-footprint' },
      { icon: Leaf, label: 'الاستدامة البيئية', labelEn: 'Sustainability', path: '/dashboard/environmental-sustainability' },
      { icon: Activity, label: 'خريطة تدفق النفايات', labelEn: 'Waste Flow', path: '/dashboard/waste-flow-heatmap' },
    ],
  },
  {
    id: 'exchange',
    title: 'البورصة والتجارة',
    titleEn: 'Exchange & Trade',
    icon: Store,
    gradient: 'from-cyan-500 to-sky-500',
    items: [
      { icon: Store, label: 'بورصة المخلفات', labelEn: 'Waste Exchange', path: '/dashboard/waste-exchange' },
      { icon: Globe, label: 'بورصة السلع', labelEn: 'Commodity Exchange', path: '/dashboard/commodity-exchange' },
      { icon: ShoppingCart, label: 'سوق B2B', labelEn: 'B2B Marketplace', path: '/dashboard/b2b-marketplace' },
    ],
  },
  {
    id: 'communication',
    title: 'التواصل والطلبات',
    titleEn: 'Communication',
    icon: MessageCircle,
    gradient: 'from-fuchsia-500 to-pink-500',
    items: [
      { icon: MessageCircle, label: 'الرسائل', labelEn: 'Chat', path: '/dashboard/chat' },
      { icon: Video, label: 'الاجتماعات', labelEn: 'Meetings', path: '/dashboard/meetings' },
      { icon: Send, label: 'طلباتي', labelEn: 'My Requests', path: '/dashboard/my-requests' },
      { icon: FileText, label: 'عروض الأسعار', labelEn: 'Quotations', path: '/dashboard/quotations' },
      { icon: Users, label: 'حسابات الشركاء', labelEn: 'Partner Accounts', path: '/dashboard/partner-accounts' },
      { icon: BookOpen, label: 'القوانين واللوائح', labelEn: 'Laws & Regulations', path: '/dashboard/laws-regulations' },
    ],
  },
  {
    id: 'maps-links',
    title: 'الخرائط والروابط',
    titleEn: 'Maps & Quick Links',
    icon: MapPin,
    gradient: 'from-teal-500 to-emerald-500',
    items: [
      { icon: Search, label: 'مستكشف الخريطة', labelEn: 'Map Explorer', path: '/dashboard/map-explorer' },
      { icon: Bookmark, label: 'المواقع المحفوظة', labelEn: 'Saved Locations', path: '/dashboard/saved-locations' },
      { icon: Link2, label: 'روابط الشحنات', labelEn: 'Shipment Links', path: '/dashboard/quick-shipment-links' },
      { icon: Zap, label: 'روابط الإيداع', labelEn: 'Deposit Links', path: '/dashboard/quick-deposit-links' },
    ],
  },
];

const SectionCard = ({ section, isRTL }: { section: SectionConfig; isRTL: boolean }) => {
  const navigate = useNavigate();
  const Icon = section.icon;

  return (
    <Card className="group overflow-hidden border-border/40 bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-[10px]">
            {section.items.length}
          </Badge>
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-bold text-foreground">
              {isRTL ? section.title : section.titleEn}
            </CardTitle>
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br',
              section.gradient,
              'text-white shadow-sm'
            )}>
              <Icon className="w-4 h-4" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-1">
        <div className="grid grid-cols-2 gap-1.5">
          {section.items.map((item, idx) => {
            const ItemIcon = item.icon;
            return (
              <motion.button
                key={idx}
                whileHover={{ x: isRTL ? -2 : 2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-right hover:bg-muted/60 transition-colors w-full"
              >
                <ItemIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-[11px] text-foreground/80 truncate flex-1 text-right">
                  {isRTL ? item.label : item.labelEn}
                </span>
              </motion.button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

const TransporterSectionsSummary = () => {
  const { isRTL, t } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-[10px]">
          {sections.reduce((acc, s) => acc + s.items.length, 0)} {isRTL ? 'عنصر' : 'items'}
        </Badge>
        <h3 className="text-base font-bold text-foreground">
          {isRTL ? '📋 دليل الأقسام الشامل' : '📋 Complete Sections Guide'}
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sections.map((section) => (
          <SectionCard key={section.id} section={section} isRTL={isRTL} />
        ))}
      </div>
    </div>
  );
};

export default TransporterSectionsSummary;
