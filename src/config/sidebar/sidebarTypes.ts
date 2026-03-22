import { LucideIcon } from 'lucide-react';
import type { BindingType } from '@/types/bindingTypes';

export interface SidebarGroupConfig {
  id: string;
  icon: LucideIcon;
  labelAr: string;
  labelEn: string;
  visibleFor: string[];
  items: SidebarItemConfig[];
}

export interface SidebarItemConfig {
  icon: LucideIcon;
  labelAr: string;
  labelEn: string;
  path: string;
  key: string;
  badgeKey?: string;
  visibleFor?: string[];
  /** نوع الارتباط الوظيفي */
  bindingType?: BindingType;
}

/**
 * أنواع الجهات (المنظمات) الفعلية فقط
 * السائق ليس جهة — هو كيان مستقل بطبيعة خاصة
 */
export type OrgType = 'generator' | 'transporter' | 'recycler' | 'disposal' | 'regulator' | 'consultant' | 'consulting_office';

/**
 * جميع أنواع الكيانات في لوحة التحكم
 * يشمل الجهات + الكيانات الخاصة (سائق، مدير، موظف)
 */
export type DashboardEntityType = OrgType | 'admin' | 'driver' | 'employee';
