/**
 * Sidebar group definitions split by role/domain.
 * Each file exports an array of SidebarGroupConfig.
 */
import {
  Building2, FileText, Network, Users, Handshake, Rss, Newspaper, Fingerprint, Shield, Brain, ShieldAlert, GitBranch, Palette,
} from 'lucide-react';
import type { SidebarGroupConfig } from './sidebarTypes';

/** Groups visible to ALL org types */
export const sharedGroups: SidebarGroupConfig[] = [
  {
    id: 'org-structure',
    icon: Building2,
    labelAr: 'المنظمة والهيكل',
    labelEn: 'Organization',
    visibleFor: [],
    items: [
      { icon: Building2, labelAr: 'ملف المنظمة', labelEn: 'Org Profile', path: '/dashboard/organization-profile', key: 'org-profile' },
      { icon: FileText, labelAr: 'الإفادة الرقمية', labelEn: 'Digital Attestation', path: '/dashboard/organization-attestation', key: 'org-attestation' },
      { icon: Network, labelAr: 'الهيكل التنظيمي', labelEn: 'Org Structure', path: '/dashboard/org-structure', key: 'org-structure' },
      { icon: Handshake, labelAr: 'الشركاء', labelEn: 'Partners', path: '/dashboard/partners', key: 'partners', badgeKey: 'partners' },
      { icon: Rss, labelAr: 'آخر أخبار الشركاء', labelEn: 'Partners Timeline', path: '/dashboard/partners-timeline', key: 'partners-timeline', badgeKey: 'partners-timeline' },
      { icon: Newspaper, labelAr: 'منشورات المنظمة', labelEn: 'Posts', path: '/dashboard/organization-profile?tab=posts', key: 'posts' },
      { icon: Fingerprint, labelAr: 'بطاقة الهوية الرقمية', labelEn: 'Digital Identity', path: '/dashboard/digital-identity-card', key: 'digital-identity-card' },
      { icon: Shield, labelAr: 'الحوكمة والرقابة', labelEn: 'Governance', path: '/dashboard/governance', key: 'governance' },
      { icon: Brain, labelAr: 'مركز المستندات', labelEn: 'Document Center', path: '/dashboard/document-center', key: 'document-center', visibleFor: ['generator', 'transporter', 'recycler', 'disposal', 'regulator', 'consultant', 'consulting_office', 'admin'] },
      { icon: ShieldAlert, labelAr: 'الأمن السيبراني', labelEn: 'Cyber Security', path: '/dashboard/cyber-security', key: 'cyber-security' },
      { icon: GitBranch, labelAr: 'دليل البنية المعمارية', labelEn: 'Architecture Guide', path: '/dashboard/architecture-guide', key: 'architecture-guide', visibleFor: ['generator', 'transporter', 'recycler', 'disposal', 'admin'] },
      { icon: Palette, labelAr: 'الهوية البصرية', labelEn: 'Branding', path: '/dashboard/admin-branding', key: 'admin-branding', visibleFor: ['admin'] },
    ],
  },
];
