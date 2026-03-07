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

export type OrgType = 'generator' | 'transporter' | 'recycler' | 'disposal' | 'regulator' | 'consultant' | 'consulting_office' | 'admin' | 'driver';
