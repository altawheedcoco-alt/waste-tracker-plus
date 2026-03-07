import {
  Package, AlertTriangle, CalendarClock, FileText, FolderCheck, FileCheck,
  Fingerprint, Inbox, Plus, Truck, Users, MapPin, Shield, GraduationCap,
  Recycle, Factory, HardHat, Wrench, Trophy, Gauge,
} from 'lucide-react';
import type { SidebarGroupConfig } from './sidebarTypes';

/** Generator operations */
const generatorOps: SidebarGroupConfig = {
  id: 'generator-ops',
  icon: Package,
  labelAr: 'الشحنات والشهادات',
  labelEn: 'Shipments & Certs',
  visibleFor: ['generator'],
  items: [
    { icon: Package, labelAr: 'الشحنات', labelEn: 'Shipments', path: '/dashboard/shipments', key: 'generator-shipments', badgeKey: 'generator-shipments' },
    { icon: AlertTriangle, labelAr: 'الشحنات المرفوضة', labelEn: 'Rejected', path: '/dashboard/rejected-shipments', key: 'generator-rejected' },
    { icon: CalendarClock, labelAr: 'شحنات متكررة', labelEn: 'Recurring Shipments', path: '/dashboard/recurring-shipments', key: 'recurring-shipments' },
    { icon: FileText, labelAr: 'شهادات الاستلام', labelEn: 'Receipt Certs', path: '/dashboard/generator-receipts', key: 'generator-receipts' },
    { icon: FolderCheck, labelAr: 'شهادات التدوير', labelEn: 'Recycling Certs', path: '/dashboard/recycling-certificates', key: 'generator-certs', badgeKey: 'generator-certs' },
  ],
};

/** Transporter operations */
const transporterOps: SidebarGroupConfig = {
  id: 'transporter-ops',
  icon: Package,
  labelAr: 'عمليات الشحن',
  labelEn: 'Shipping Operations',
  visibleFor: ['transporter'],
  items: [
    { icon: Package, labelAr: 'الشحنات', labelEn: 'Shipments', path: '/dashboard/transporter-shipments', key: 'transporter-shipments', badgeKey: 'transporter-shipments', bindingType: 'hybrid' },
    { icon: AlertTriangle, labelAr: 'الشحنات المرفوضة', labelEn: 'Rejected', path: '/dashboard/rejected-shipments', key: 'transporter-rejected', bindingType: 'partner' },
    { icon: FileText, labelAr: 'شهادات الاستلام', labelEn: 'Receipt Certs', path: '/dashboard/transporter-receipts', key: 'transporter-receipts', bindingType: 'hybrid' },
    { icon: FileCheck, labelAr: 'إقرارات التسليم', labelEn: 'Delivery Declarations', path: '/dashboard/delivery-declarations', key: 'transporter-declarations', bindingType: 'partner' },
    { icon: FolderCheck, labelAr: 'شهادات التدوير', labelEn: 'Recycling Certs', path: '/dashboard/recycling-certificates', key: 'transporter-certs', badgeKey: 'transporter-certs', bindingType: 'hybrid' },
    { icon: Fingerprint, labelAr: 'أنماط الجيلوش', labelEn: 'Guilloche', path: '/dashboard/guilloche-patterns', key: 'transporter-guilloche', bindingType: 'internal' },
    { icon: Inbox, labelAr: 'طلبات الجمع', labelEn: 'Collection Requests', path: '/dashboard/collection-requests', key: 'collection-requests', bindingType: 'partner' },
    { icon: Plus, labelAr: 'إنشاء شحنة يدوية', labelEn: 'Manual Shipment', path: '/dashboard/manual-shipment', key: 'manual-shipment', bindingType: 'hybrid' },
    { icon: FileText, labelAr: 'أرشيف النماذج اليدوية', labelEn: 'Manual Drafts', path: '/dashboard/manual-shipment-drafts', key: 'manual-shipment-drafts', bindingType: 'internal' },
  ],
};

/** Fleet & drivers (transporter) */
const fleetDrivers: SidebarGroupConfig = {
  id: 'fleet-drivers',
  icon: Truck,
  labelAr: 'السائقون والأسطول',
  labelEn: 'Fleet & Drivers',
  visibleFor: ['transporter'],
  items: [
    { icon: Users, labelAr: 'إدارة السائقين', labelEn: 'Drivers', path: '/dashboard/transporter-drivers', key: 'transporter-drivers', bindingType: 'internal' },
    { icon: MapPin, labelAr: 'تتبع السائقين', labelEn: 'Driver Tracking', path: '/dashboard/driver-tracking', key: 'transporter-driver-tracking', bindingType: 'internal' },
    { icon: Truck, labelAr: 'خريطة المسارات', labelEn: 'Routes Map', path: '/dashboard/shipment-routes', key: 'shipment-routes', bindingType: 'hybrid' },
    { icon: Shield, labelAr: 'تصاريح السائقين', labelEn: 'Driver Permits', path: '/dashboard/driver-permits', key: 'driver-permits', bindingType: 'admin' },
    { icon: GraduationCap, labelAr: 'أكاديمية السائقين', labelEn: 'Driver Academy', path: '/dashboard/driver-academy', key: 'driver-academy', bindingType: 'internal' },
    { icon: Wrench, labelAr: 'الصيانة الوقائية', labelEn: 'Preventive Maintenance', path: '/dashboard/preventive-maintenance', key: 'preventive-maintenance', bindingType: 'internal' },
    { icon: Trophy, labelAr: 'مكافآت السائقين', labelEn: 'Driver Rewards', path: '/dashboard/driver-rewards', key: 'driver-rewards', bindingType: 'internal' },
  ],
};

/** Recycler operations */
const recyclerOps: SidebarGroupConfig = {
  id: 'recycler-ops',
  icon: Recycle,
  labelAr: 'الشحنات والشهادات',
  labelEn: 'Shipments & Certs',
  visibleFor: ['recycler'],
  items: [
    { icon: Package, labelAr: 'الشحنات', labelEn: 'Shipments', path: '/dashboard/shipments', key: 'recycler-shipments', badgeKey: 'recycler-shipments' },
    { icon: AlertTriangle, labelAr: 'الشحنات المرفوضة', labelEn: 'Rejected', path: '/dashboard/rejected-shipments', key: 'recycler-rejected' },
    { icon: FileCheck, labelAr: 'إقرارات التسليم', labelEn: 'Delivery Declarations', path: '/dashboard/delivery-declarations', key: 'recycler-declarations' },
    { icon: FolderCheck, labelAr: 'إصدار شهادات التدوير', labelEn: 'Issue Certs', path: '/dashboard/issue-recycling-certificates', key: 'issue-certs', badgeKey: 'issue-certs' },
    { icon: Factory, labelAr: 'لوحة الإنتاج', labelEn: 'Production Dashboard', path: '/dashboard/production', key: 'production-dashboard' },
  ],
};

/** Disposal operations */
const disposalOps: SidebarGroupConfig = {
  id: 'disposal-ops',
  icon: Factory,
  labelAr: 'عمليات التخلص',
  labelEn: 'Disposal Operations',
  visibleFor: ['disposal'],
  items: [
    { icon: Factory, labelAr: 'العمليات', labelEn: 'Operations', path: '/dashboard/disposal/operations', key: 'disposal-operations' },
    { icon: Package, labelAr: 'الطلبات الواردة', labelEn: 'Incoming Requests', path: '/dashboard/disposal/incoming-requests', key: 'disposal-incoming' },
    { icon: FolderCheck, labelAr: 'شهادات التخلص', labelEn: 'Disposal Certs', path: '/dashboard/disposal/certificates', key: 'disposal-certs' },
    { icon: Factory, labelAr: 'مرافق التخلص', labelEn: 'Facilities', path: '/dashboard/disposal-facilities', key: 'disposal-facilities' },
    { icon: HardHat, labelAr: 'السلامة والصحة المهنية', labelEn: 'Safety & OHS', path: '/dashboard/safety', key: 'disposal-safety' },
    { icon: Gauge, labelAr: 'إدارة السعة', labelEn: 'Capacity Management', path: '/dashboard/capacity-management', key: 'capacity-management' },
  ],
};

export const operationalGroups: SidebarGroupConfig[] = [
  generatorOps,
  transporterOps,
  fleetDrivers,
  recyclerOps,
  disposalOps,
];
