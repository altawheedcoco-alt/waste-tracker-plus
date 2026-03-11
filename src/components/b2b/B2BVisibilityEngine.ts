/**
 * B2B Visibility Engine
 * Defines which org types can LIST and who can SEE listings
 * 
 * Rules:
 * - Generator → visible to: Transporter, Recycler, Disposal
 * - Transporter → visible to: Recycler, Disposal (NOT Generator)
 * - Recycler → visible to: Transporter, Generator, Disposal
 * - Disposal → visible to: Transporter, Generator, Recycler
 */

export type OrgType = 'generator' | 'transporter' | 'recycler' | 'disposal';

export const ORG_TYPE_LABELS: Record<OrgType, string> = {
  generator: 'مولّد نفايات',
  transporter: 'ناقل',
  recycler: 'مُدوّر',
  disposal: 'تخلص آمن',
};

export const ORG_TYPE_COLORS: Record<OrgType, string> = {
  generator: 'bg-amber-100 text-amber-800 border-amber-300',
  transporter: 'bg-blue-100 text-blue-800 border-blue-300',
  recycler: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  disposal: 'bg-red-100 text-red-800 border-red-300',
};

export const ORG_TYPE_ICONS_COLOR: Record<OrgType, string> = {
  generator: 'text-amber-600',
  transporter: 'text-blue-600',
  recycler: 'text-emerald-600',
  disposal: 'text-red-600',
};

/**
 * Default target audience when a specific org type creates a listing
 */
export const DEFAULT_TARGET_AUDIENCE: Record<OrgType, OrgType[]> = {
  generator: ['transporter', 'recycler', 'disposal'],
  transporter: ['recycler', 'disposal'], // NOT generator
  recycler: ['transporter', 'generator', 'disposal'],
  disposal: ['transporter', 'generator', 'recycler'],
};

/**
 * Allowed target audience options for each seller type
 */
export const ALLOWED_TARGETS: Record<OrgType, OrgType[]> = {
  generator: ['transporter', 'recycler', 'disposal'],
  transporter: ['recycler', 'disposal'], // Cannot target generators
  recycler: ['transporter', 'generator', 'disposal'],
  disposal: ['transporter', 'generator', 'recycler'],
};

/**
 * Check if a viewer org type can see a listing
 */
export const canViewListing = (
  viewerType: OrgType,
  listingTargetAudience: string[]
): boolean => {
  return listingTargetAudience.includes(viewerType);
};

/**
 * Listing categories available for each org type
 */
export const LISTING_CATEGORIES: Record<OrgType, { id: string; label: string }[]> = {
  generator: [
    { id: 'plastic', label: 'بلاستيك' },
    { id: 'metal', label: 'معادن' },
    { id: 'paper', label: 'ورق وكرتون' },
    { id: 'glass', label: 'زجاج' },
    { id: 'organic', label: 'مخلفات عضوية' },
    { id: 'electronic', label: 'مخلفات إلكترونية' },
    { id: 'hazardous', label: 'مخلفات خطرة' },
    { id: 'construction', label: 'مخلفات بناء وهدم' },
    { id: 'textile', label: 'منسوجات' },
    { id: 'other', label: 'أخرى' },
  ],
  transporter: [
    { id: 'transport_service', label: 'خدمة نقل' },
    { id: 'fleet_rental', label: 'تأجير أسطول' },
    { id: 'bulk_transport', label: 'نقل بالجملة' },
    { id: 'hazardous_transport', label: 'نقل مواد خطرة' },
    { id: 'container_service', label: 'خدمة حاويات' },
  ],
  recycler: [
    { id: 'recycled_material', label: 'مادة مُعاد تدويرها' },
    { id: 'processed_waste', label: 'مخلفات مُعالجة' },
    { id: 'recycling_service', label: 'خدمة تدوير' },
    { id: 'byproduct', label: 'منتج ثانوي' },
  ],
  disposal: [
    { id: 'disposal_service', label: 'خدمة تخلص آمن' },
    { id: 'treatment_service', label: 'خدمة معالجة' },
    { id: 'incineration', label: 'حرق آمن' },
    { id: 'landfill', label: 'دفن صحي' },
  ],
};

export const ALL_WASTE_CATEGORIES = [
  { id: 'all', label: 'الكل' },
  { id: 'plastic', label: 'بلاستيك' },
  { id: 'metal', label: 'معادن' },
  { id: 'paper', label: 'ورق وكرتون' },
  { id: 'glass', label: 'زجاج' },
  { id: 'organic', label: 'عضوي' },
  { id: 'electronic', label: 'إلكتروني' },
  { id: 'hazardous', label: 'خطر' },
  { id: 'construction', label: 'بناء وهدم' },
  { id: 'transport_service', label: 'خدمة نقل' },
  { id: 'recycled_material', label: 'مواد مدورة' },
  { id: 'disposal_service', label: 'خدمة تخلص' },
  { id: 'other', label: 'أخرى' },
];

export const DELIVERY_OPTIONS = [
  { id: 'pickup', label: 'استلام من الموقع' },
  { id: 'delivery', label: 'توصيل للمشتري' },
  { id: 'both', label: 'الاثنان' },
];

export const UNITS = [
  { id: 'ton', label: 'طن' },
  { id: 'kg', label: 'كيلوجرام' },
  { id: 'unit', label: 'وحدة' },
  { id: 'trip', label: 'رحلة' },
  { id: 'container', label: 'حاوية' },
  { id: 'cubic_meter', label: 'متر مكعب' },
];
