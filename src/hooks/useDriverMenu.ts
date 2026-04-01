/**
 * Hook لتحديد عناصر القائمة الجانبية حسب نوع السائق
 * ملاحظة: السائق المؤجر (hired) لا يملك حساب — لا يصل للوحة التحكم أصلاً
 */
import {
  LayoutDashboard, Package, MapPin, User, FileText,
  GraduationCap, Trophy, Bell, Settings, Briefcase,
  Zap, ShoppingCart, Star, CreditCard, BarChart3, Route,
  PlusCircle, Map,
} from 'lucide-react';
import type { DriverType } from '@/types/driver-types';
import type { LucideIcon } from 'lucide-react';

export interface DriverMenuItem {
  icon: LucideIcon;
  label: string;
  path: string;
  key: string;
  badge?: number;
}

// عناصر مشتركة لجميع السائقين (الذين لديهم حساب)
const commonItems = (lang: string, notifCount?: number): DriverMenuItem[] => [
  { icon: LayoutDashboard, label: lang === 'ar' ? 'لوحة التحكم' : 'Dashboard', path: '/dashboard', key: 'driver-dashboard' },
  { icon: MapPin, label: lang === 'ar' ? 'موقعي' : 'My Location', path: '/dashboard/my-location', key: 'driver-location' },
  { icon: GraduationCap, label: lang === 'ar' ? 'الأكاديمية' : 'Academy', path: '/dashboard/driver-academy', key: 'driver-academy' },
  { icon: Trophy, label: lang === 'ar' ? 'المكافآت' : 'Rewards', path: '/dashboard/driver-rewards', key: 'driver-rewards' },
  { icon: Bell, label: lang === 'ar' ? 'الإشعارات' : 'Notifications', path: '/dashboard/notifications', key: 'driver-notifications', badge: notifCount },
  { icon: Settings, label: lang === 'ar' ? 'الإعدادات' : 'Settings', path: '/dashboard/settings', key: 'driver-settings' },
];

export function getDriverMenuItems(
  driverType: DriverType | null,
  lang: string = 'ar',
  badges?: { shipments?: number; notifications?: number; offers?: number; contracts?: number }
): DriverMenuItem[] {
  const common = commonItems(lang, badges?.notifications);

  switch (driverType) {
    case 'company':
      // سائق تابع — موظف ينفذ مهام الجهة الناقلة (7 عناصر أساسية)
      return [
        common[0], // لوحة التحكم
        { icon: Package, label: lang === 'ar' ? 'شحناتي' : 'My Shipments', path: '/dashboard/transporter-shipments', key: 'driver-shipments', badge: badges?.shipments },
        { icon: Route, label: lang === 'ar' ? 'تتبع مساري' : 'My Route', path: '/dashboard/driver-my-route', key: 'driver-my-route' },
        { icon: CreditCard, label: lang === 'ar' ? 'أرباحي' : 'My Earnings', path: '/dashboard/driver-wallet', key: 'driver-earnings' },
        { icon: User, label: lang === 'ar' ? 'ملفي' : 'Profile', path: '/dashboard/driver-profile', key: 'driver-profile' },
        { icon: Bell, label: lang === 'ar' ? 'الإشعارات' : 'Notifications', path: '/dashboard/notifications', key: 'driver-notifications', badge: badges?.notifications },
        { icon: Settings, label: lang === 'ar' ? 'الإعدادات' : 'Settings', path: '/dashboard/settings', key: 'driver-settings' },
      ];

    case 'hired':
      // السائق المؤجر لا يملك حساب — لا يصل أصلاً للوحة التحكم
      // يستخدم رابط مؤقت /mission/:token فقط
      // هذا fallback نظري فقط
      return [];

    case 'independent':
      // سائق مستقل — نموذج Uber/InDriver (8 عناصر أساسية فقط)
      return [
        common[0], // لوحة التحكم
        { icon: Zap, label: lang === 'ar' ? 'العروض الواردة' : 'Incoming Offers', path: '/dashboard/driver-offers', key: 'driver-offers', badge: badges?.offers },
        { icon: ShoppingCart, label: lang === 'ar' ? 'سوق الشحنات' : 'Shipment Market', path: '/dashboard/shipment-market', key: 'driver-market' },
        { icon: Package, label: lang === 'ar' ? 'شحناتي' : 'My Shipments', path: '/dashboard/transporter-shipments', key: 'driver-shipments', badge: badges?.shipments },
        { icon: CreditCard, label: lang === 'ar' ? 'المحفظة' : 'Wallet', path: '/dashboard/driver-wallet', key: 'driver-wallet' },
        { icon: Route, label: lang === 'ar' ? 'تتبع مساري' : 'My Route', path: '/dashboard/driver-my-route', key: 'driver-my-route' },
        { icon: Star, label: lang === 'ar' ? 'ملفي المهني' : 'Public Profile', path: '/dashboard/driver-profile', key: 'driver-public-profile' },
        { icon: Bell, label: lang === 'ar' ? 'الإشعارات' : 'Notifications', path: '/dashboard/notifications', key: 'driver-notifications', badge: badges?.notifications },
        { icon: Settings, label: lang === 'ar' ? 'الإعدادات' : 'Settings', path: '/dashboard/settings', key: 'driver-settings' },
      ];

    default:
      // Fallback to company menu
      return [
        common[0],
        { icon: Package, label: lang === 'ar' ? 'شحناتي' : 'My Shipments', path: '/dashboard/transporter-shipments', key: 'driver-shipments' },
        common[1],
        { icon: User, label: lang === 'ar' ? 'ملفي' : 'Profile', path: '/dashboard/driver-profile', key: 'driver-profile' },
        ...common.slice(2),
      ];
  }
}
