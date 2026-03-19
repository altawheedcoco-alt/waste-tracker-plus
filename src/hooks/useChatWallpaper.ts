import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface ChatWallpaper {
  type: 'color' | 'gradient' | 'pattern' | 'svg-pattern';
  value: string;
}

// ─── COLORS: Comprehensive global palette ───────────────────
const COLOR_FAMILIES: { family: string; colors: { label: string; value: string }[] }[] = [
  {
    family: 'الأحمر',
    colors: [
      { label: 'أحمر 50', value: '#fef2f2' }, { label: 'أحمر 100', value: '#fee2e2' },
      { label: 'أحمر 200', value: '#fecaca' }, { label: 'أحمر 300', value: '#fca5a5' },
      { label: 'أحمر 400', value: '#f87171' }, { label: 'أحمر 500', value: '#ef4444' },
      { label: 'أحمر 600', value: '#dc2626' }, { label: 'أحمر 700', value: '#b91c1c' },
      { label: 'أحمر 800', value: '#991b1b' }, { label: 'أحمر 900', value: '#7f1d1d' },
    ],
  },
  {
    family: 'البرتقالي',
    colors: [
      { label: 'برتقالي 50', value: '#fff7ed' }, { label: 'برتقالي 100', value: '#ffedd5' },
      { label: 'برتقالي 200', value: '#fed7aa' }, { label: 'برتقالي 300', value: '#fdba74' },
      { label: 'برتقالي 400', value: '#fb923c' }, { label: 'برتقالي 500', value: '#f97316' },
      { label: 'برتقالي 600', value: '#ea580c' }, { label: 'برتقالي 700', value: '#c2410c' },
      { label: 'برتقالي 800', value: '#9a3412' }, { label: 'برتقالي 900', value: '#7c2d12' },
    ],
  },
  {
    family: 'الأصفر',
    colors: [
      { label: 'أصفر 50', value: '#fefce8' }, { label: 'أصفر 100', value: '#fef9c3' },
      { label: 'أصفر 200', value: '#fef08a' }, { label: 'أصفر 300', value: '#fde047' },
      { label: 'أصفر 400', value: '#facc15' }, { label: 'أصفر 500', value: '#eab308' },
      { label: 'أصفر 600', value: '#ca8a04' }, { label: 'أصفر 700', value: '#a16207' },
      { label: 'أصفر 800', value: '#854d0e' }, { label: 'أصفر 900', value: '#713f12' },
    ],
  },
  {
    family: 'الليموني',
    colors: [
      { label: 'ليموني 50', value: '#f7fee7' }, { label: 'ليموني 100', value: '#ecfccb' },
      { label: 'ليموني 200', value: '#d9f99d' }, { label: 'ليموني 300', value: '#bef264' },
      { label: 'ليموني 400', value: '#a3e635' }, { label: 'ليموني 500', value: '#84cc16' },
      { label: 'ليموني 600', value: '#65a30d' }, { label: 'ليموني 700', value: '#4d7c0f' },
      { label: 'ليموني 800', value: '#3f6212' }, { label: 'ليموني 900', value: '#365314' },
    ],
  },
  {
    family: 'الأخضر',
    colors: [
      { label: 'أخضر 50', value: '#f0fdf4' }, { label: 'أخضر 100', value: '#dcfce7' },
      { label: 'أخضر 200', value: '#bbf7d0' }, { label: 'أخضر 300', value: '#86efac' },
      { label: 'أخضر 400', value: '#4ade80' }, { label: 'أخضر 500', value: '#22c55e' },
      { label: 'أخضر 600', value: '#16a34a' }, { label: 'أخضر 700', value: '#15803d' },
      { label: 'أخضر 800', value: '#166534' }, { label: 'أخضر 900', value: '#14532d' },
    ],
  },
  {
    family: 'الزمردي',
    colors: [
      { label: 'زمردي 50', value: '#ecfdf5' }, { label: 'زمردي 100', value: '#d1fae5' },
      { label: 'زمردي 200', value: '#a7f3d0' }, { label: 'زمردي 300', value: '#6ee7b7' },
      { label: 'زمردي 400', value: '#34d399' }, { label: 'زمردي 500', value: '#10b981' },
      { label: 'زمردي 600', value: '#059669' }, { label: 'زمردي 700', value: '#047857' },
      { label: 'زمردي 800', value: '#065f46' }, { label: 'زمردي 900', value: '#064e3b' },
    ],
  },
  {
    family: 'التيل',
    colors: [
      { label: 'تيل 50', value: '#f0fdfa' }, { label: 'تيل 100', value: '#ccfbf1' },
      { label: 'تيل 200', value: '#99f6e4' }, { label: 'تيل 300', value: '#5eead4' },
      { label: 'تيل 400', value: '#2dd4bf' }, { label: 'تيل 500', value: '#14b8a6' },
      { label: 'تيل 600', value: '#0d9488' }, { label: 'تيل 700', value: '#0f766e' },
      { label: 'تيل 800', value: '#115e59' }, { label: 'تيل 900', value: '#134e4a' },
    ],
  },
  {
    family: 'السماوي',
    colors: [
      { label: 'سماوي 50', value: '#ecfeff' }, { label: 'سماوي 100', value: '#cffafe' },
      { label: 'سماوي 200', value: '#a5f3fc' }, { label: 'سماوي 300', value: '#67e8f9' },
      { label: 'سماوي 400', value: '#22d3ee' }, { label: 'سماوي 500', value: '#06b6d4' },
      { label: 'سماوي 600', value: '#0891b2' }, { label: 'سماوي 700', value: '#0e7490' },
      { label: 'سماوي 800', value: '#155e75' }, { label: 'سماوي 900', value: '#164e63' },
    ],
  },
  {
    family: 'الأزرق',
    colors: [
      { label: 'أزرق 50', value: '#eff6ff' }, { label: 'أزرق 100', value: '#dbeafe' },
      { label: 'أزرق 200', value: '#bfdbfe' }, { label: 'أزرق 300', value: '#93c5fd' },
      { label: 'أزرق 400', value: '#60a5fa' }, { label: 'أزرق 500', value: '#3b82f6' },
      { label: 'أزرق 600', value: '#2563eb' }, { label: 'أزرق 700', value: '#1d4ed8' },
      { label: 'أزرق 800', value: '#1e40af' }, { label: 'أزرق 900', value: '#1e3a8a' },
    ],
  },
  {
    family: 'النيلي',
    colors: [
      { label: 'نيلي 50', value: '#eef2ff' }, { label: 'نيلي 100', value: '#e0e7ff' },
      { label: 'نيلي 200', value: '#c7d2fe' }, { label: 'نيلي 300', value: '#a5b4fc' },
      { label: 'نيلي 400', value: '#818cf8' }, { label: 'نيلي 500', value: '#6366f1' },
      { label: 'نيلي 600', value: '#4f46e5' }, { label: 'نيلي 700', value: '#4338ca' },
      { label: 'نيلي 800', value: '#3730a3' }, { label: 'نيلي 900', value: '#312e81' },
    ],
  },
  {
    family: 'البنفسجي',
    colors: [
      { label: 'بنفسجي 50', value: '#f5f3ff' }, { label: 'بنفسجي 100', value: '#ede9fe' },
      { label: 'بنفسجي 200', value: '#ddd6fe' }, { label: 'بنفسجي 300', value: '#c4b5fd' },
      { label: 'بنفسجي 400', value: '#a78bfa' }, { label: 'بنفسجي 500', value: '#8b5cf6' },
      { label: 'بنفسجي 600', value: '#7c3aed' }, { label: 'بنفسجي 700', value: '#6d28d9' },
      { label: 'بنفسجي 800', value: '#5b21b6' }, { label: 'بنفسجي 900', value: '#4c1d95' },
    ],
  },
  {
    family: 'الفوشيا',
    colors: [
      { label: 'فوشيا 50', value: '#fdf4ff' }, { label: 'فوشيا 100', value: '#fae8ff' },
      { label: 'فوشيا 200', value: '#f5d0fe' }, { label: 'فوشيا 300', value: '#f0abfc' },
      { label: 'فوشيا 400', value: '#e879f9' }, { label: 'فوشيا 500', value: '#d946ef' },
      { label: 'فوشيا 600', value: '#c026d3' }, { label: 'فوشيا 700', value: '#a21caf' },
      { label: 'فوشيا 800', value: '#86198f' }, { label: 'فوشيا 900', value: '#701a75' },
    ],
  },
  {
    family: 'الوردي',
    colors: [
      { label: 'وردي 50', value: '#fdf2f8' }, { label: 'وردي 100', value: '#fce7f3' },
      { label: 'وردي 200', value: '#fbcfe8' }, { label: 'وردي 300', value: '#f9a8d4' },
      { label: 'وردي 400', value: '#f472b6' }, { label: 'وردي 500', value: '#ec4899' },
      { label: 'وردي 600', value: '#db2777' }, { label: 'وردي 700', value: '#be185d' },
      { label: 'وردي 800', value: '#9d174d' }, { label: 'وردي 900', value: '#831843' },
    ],
  },
  {
    family: 'الوردي الفاتح',
    colors: [
      { label: 'روز 50', value: '#fff1f2' }, { label: 'روز 100', value: '#ffe4e6' },
      { label: 'روز 200', value: '#fecdd3' }, { label: 'روز 300', value: '#fda4af' },
      { label: 'روز 400', value: '#fb7185' }, { label: 'روز 500', value: '#f43f5e' },
      { label: 'روز 600', value: '#e11d48' }, { label: 'روز 700', value: '#be123c' },
      { label: 'روز 800', value: '#9f1239' }, { label: 'روز 900', value: '#881337' },
    ],
  },
  {
    family: 'الرمادي',
    colors: [
      { label: 'رمادي 50', value: '#fafafa' }, { label: 'رمادي 100', value: '#f4f4f5' },
      { label: 'رمادي 200', value: '#e4e4e7' }, { label: 'رمادي 300', value: '#d4d4d8' },
      { label: 'رمادي 400', value: '#a1a1aa' }, { label: 'رمادي 500', value: '#71717a' },
      { label: 'رمادي 600', value: '#52525b' }, { label: 'رمادي 700', value: '#3f3f46' },
      { label: 'رمادي 800', value: '#27272a' }, { label: 'رمادي 900', value: '#18181b' },
    ],
  },
  {
    family: 'الحجري',
    colors: [
      { label: 'حجري 50', value: '#fafaf9' }, { label: 'حجري 100', value: '#f5f5f4' },
      { label: 'حجري 200', value: '#e7e5e4' }, { label: 'حجري 300', value: '#d6d3d1' },
      { label: 'حجري 400', value: '#a8a29e' }, { label: 'حجري 500', value: '#78716c' },
      { label: 'حجري 600', value: '#57534e' }, { label: 'حجري 700', value: '#44403c' },
      { label: 'حجري 800', value: '#292524' }, { label: 'حجري 900', value: '#1c1917' },
    ],
  },
  {
    family: 'الأردوازي',
    colors: [
      { label: 'أردوازي 50', value: '#f8fafc' }, { label: 'أردوازي 100', value: '#f1f5f9' },
      { label: 'أردوازي 200', value: '#e2e8f0' }, { label: 'أردوازي 300', value: '#cbd5e1' },
      { label: 'أردوازي 400', value: '#94a3b8' }, { label: 'أردوازي 500', value: '#64748b' },
      { label: 'أردوازي 600', value: '#475569' }, { label: 'أردوازي 700', value: '#334155' },
      { label: 'أردوازي 800', value: '#1e293b' }, { label: 'أردوازي 900', value: '#0f172a' },
    ],
  },
  {
    family: 'البني',
    colors: [
      { label: 'أمبر 50', value: '#fffbeb' }, { label: 'أمبر 100', value: '#fef3c7' },
      { label: 'أمبر 200', value: '#fde68a' }, { label: 'أمبر 300', value: '#fcd34d' },
      { label: 'أمبر 400', value: '#fbbf24' }, { label: 'أمبر 500', value: '#f59e0b' },
      { label: 'أمبر 600', value: '#d97706' }, { label: 'أمبر 700', value: '#b45309' },
      { label: 'أمبر 800', value: '#92400e' }, { label: 'أمبر 900', value: '#78350f' },
    ],
  },
];

// ─── GRADIENTS ───────────────────────────────────────────
export const GRADIENT_PRESETS: { label: string; value: string }[] = [
  // Nature
  { label: 'غروب', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { label: 'محيط', value: 'linear-gradient(135deg, #667eea 0%, #43e97b 100%)' },
  { label: 'شروق', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { label: 'سماء', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { label: 'غابة', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { label: 'خريف', value: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)' },
  { label: 'ربيع', value: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)' },
  { label: 'ليل', value: 'linear-gradient(135deg, #0c3483 0%, #a2b6df 100%)' },
  // Tech
  { label: 'نيون', value: 'linear-gradient(135deg, #b721ff 0%, #21d4fd 100%)' },
  { label: 'كهربائي', value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { label: 'فضائي', value: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' },
  { label: 'رقمي', value: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)' },
  // Warm
  { label: 'ذهبي', value: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)' },
  { label: 'مرجاني', value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
  { label: 'وردي ناعم', value: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)' },
  { label: 'دافئ', value: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' },
  // Cool
  { label: 'جليدي', value: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)' },
  { label: 'بارد', value: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)' },
  { label: 'قطبي', value: 'linear-gradient(135deg, #c3cfe2 0%, #f5f7fa 100%)' },
  { label: 'ضبابي', value: 'linear-gradient(135deg, #d7d2cc 0%, #304352 100%)' },
  // iRecycle themed
  { label: 'إعادة تدوير', value: 'linear-gradient(135deg, #11998e 0%, #22c55e 50%, #059669 100%)' },
  { label: 'بيئي', value: 'linear-gradient(135deg, #134e4a 0%, #14532d 50%, #365314 100%)' },
  { label: 'أخضر رقمي', value: 'linear-gradient(135deg, #00b09b 0%, #96c93d 100%)' },
  { label: 'مستدام', value: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)' },
  // Dark premium
  { label: 'منتصف الليل', value: 'linear-gradient(135deg, #232526 0%, #414345 100%)' },
  { label: 'فحمي', value: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' },
  { label: 'عميق', value: 'linear-gradient(135deg, #200122 0%, #6f0000 100%)' },
  { label: 'كوني', value: 'linear-gradient(135deg, #1a2a6c 0%, #b21f1f 50%, #fdbb2d 100%)' },
  // Pastel
  { label: 'باستيل 1', value: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { label: 'باستيل 2', value: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  { label: 'باستيل 3', value: 'linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)' },
  { label: 'باستيل 4', value: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)' },
  // Multi-color
  { label: 'قوس قزح', value: 'linear-gradient(135deg, #f43b47 0%, #f7b733 25%, #43e97b 50%, #38f9d7 75%, #667eea 100%)' },
  { label: 'أورورا', value: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 33%, #6dd5ed 66%, #00d2ff 100%)' },
  { label: 'هولوغرام', value: 'linear-gradient(135deg, #a770ef 0%, #cf8bf3 33%, #fdb99b 66%, #a770ef 100%)' },
  { label: 'بريزما', value: 'linear-gradient(135deg, #f5af19 0%, #f12711 25%, #b721ff 50%, #21d4fd 75%, #43e97b 100%)' },
];

// ─── SVG PATTERNS: iRecycle themed + abstract ────────────
// Each pattern is a CSS background combo (SVG data URI + base color)
export interface SvgPattern {
  id: string;
  label: string;
  category: 'recycling' | 'digital' | 'geometric' | 'nature' | 'abstract' | 'islamic' | 'tech' | 'minimal';
  bgColor: string;
  patternSvg: string; // CSS background-image value
  bgSize?: string;
}

const encodeSvg = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

// Helper to create repeating SVG patterns
const makePattern = (innerSvg: string, w: number, h: number, bg?: string) => {
  const bgAttr = bg ? ` style="background:${bg}"` : '';
  return encodeSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"${bgAttr}>${innerSvg}</svg>`);
};

export const SVG_PATTERNS: SvgPattern[] = [
  // ─── RECYCLING ─────────────────────────────────
  {
    id: 'recycle-arrows',
    label: 'سهام التدوير',
    category: 'recycling',
    bgColor: '#f0fdf4',
    patternSvg: makePattern(
      `<path d="M20 8l-4-4v3H8v2h8v3l4-4z" fill="#22c55e" opacity="0.15"/><path d="M12 24l4 4v-3h8v-2h-8v-3l-4 4z" fill="#22c55e" opacity="0.15"/>`,
      32, 32
    ),
    bgSize: '32px 32px',
  },
  {
    id: 'eco-leaves',
    label: 'أوراق خضراء',
    category: 'recycling',
    bgColor: '#ecfdf5',
    patternSvg: makePattern(
      `<path d="M16 4c-4 4-8 12-4 16s12-4 16-8c-4 0-8-4-12-8z" fill="#10b981" opacity="0.1"/>`,
      32, 32
    ),
    bgSize: '40px 40px',
  },
  {
    id: 'waste-bins',
    label: 'حاويات النفايات',
    category: 'recycling',
    bgColor: '#f0f9ff',
    patternSvg: makePattern(
      `<rect x="8" y="10" width="16" height="18" rx="2" fill="#3b82f6" opacity="0.08"/><rect x="10" y="6" width="12" height="4" rx="1" fill="#3b82f6" opacity="0.08"/><line x1="14" y1="14" x2="14" y2="24" stroke="#3b82f6" stroke-opacity="0.1"/><line x1="18" y1="14" x2="18" y2="24" stroke="#3b82f6" stroke-opacity="0.1"/>`,
      32, 32
    ),
    bgSize: '48px 48px',
  },
  {
    id: 'recycle-symbol',
    label: 'رمز التدوير',
    category: 'recycling',
    bgColor: '#f0fdf4',
    patternSvg: makePattern(
      `<path d="M16 6l-6 10h4l-2 8 6-10h-4l2-8z" fill="#16a34a" opacity="0.08"/>`,
      32, 32
    ),
    bgSize: '48px 48px',
  },
  {
    id: 'eco-circles',
    label: 'دوائر بيئية',
    category: 'recycling',
    bgColor: '#ecfdf5',
    patternSvg: makePattern(
      `<circle cx="16" cy="16" r="12" fill="none" stroke="#059669" stroke-width="1" opacity="0.12"/><circle cx="16" cy="16" r="6" fill="#059669" opacity="0.06"/>`,
      32, 32
    ),
    bgSize: '40px 40px',
  },
  {
    id: 'green-grid',
    label: 'شبكة خضراء',
    category: 'recycling',
    bgColor: '#f0fdf4',
    patternSvg: makePattern(
      `<path d="M32 0H0v32" fill="none" stroke="#22c55e" stroke-width="0.5" opacity="0.15"/>`,
      32, 32
    ),
    bgSize: '32px 32px',
  },

  // ─── DIGITAL / TECH ────────────────────────────
  {
    id: 'circuit-board',
    label: 'لوحة دوائر',
    category: 'digital',
    bgColor: '#0f172a',
    patternSvg: makePattern(
      `<path d="M0 16h8m4 0h4m4 0h12M16 0v8m0 4v4m0 4v12" stroke="#22d3ee" stroke-width="0.5" opacity="0.2"/><circle cx="16" cy="16" r="2" fill="#22d3ee" opacity="0.15"/><circle cx="8" cy="16" r="1" fill="#22d3ee" opacity="0.15"/><circle cx="16" cy="8" r="1" fill="#22d3ee" opacity="0.15"/>`,
      32, 32
    ),
    bgSize: '32px 32px',
  },
  {
    id: 'binary-code',
    label: 'كود ثنائي',
    category: 'digital',
    bgColor: '#042f2e',
    patternSvg: makePattern(
      `<text x="2" y="10" font-size="8" fill="#14b8a6" opacity="0.12" font-family="monospace">01</text><text x="18" y="22" font-size="8" fill="#14b8a6" opacity="0.12" font-family="monospace">10</text>`,
      32, 28
    ),
    bgSize: '32px 28px',
  },
  {
    id: 'data-grid',
    label: 'شبكة بيانات',
    category: 'digital',
    bgColor: '#020617',
    patternSvg: makePattern(
      `<rect width="32" height="32" fill="none"/><path d="M0 0h32v32H0z" fill="none" stroke="#334155" stroke-width="0.5"/><circle cx="0" cy="0" r="1" fill="#60a5fa" opacity="0.3"/><circle cx="32" cy="0" r="1" fill="#60a5fa" opacity="0.3"/><circle cx="0" cy="32" r="1" fill="#60a5fa" opacity="0.3"/><circle cx="32" cy="32" r="1" fill="#60a5fa" opacity="0.3"/>`,
      32, 32
    ),
    bgSize: '32px 32px',
  },
  {
    id: 'matrix-rain',
    label: 'مطر رقمي',
    category: 'digital',
    bgColor: '#000000',
    patternSvg: makePattern(
      `<text x="4" y="12" font-size="10" fill="#22c55e" opacity="0.08" font-family="monospace">♻</text><text x="16" y="28" font-size="8" fill="#22c55e" opacity="0.06" font-family="monospace">⟳</text>`,
      28, 32
    ),
    bgSize: '28px 32px',
  },
  {
    id: 'pixel-grid',
    label: 'بكسلات',
    category: 'digital',
    bgColor: '#1e293b',
    patternSvg: makePattern(
      `<rect x="0" y="0" width="4" height="4" fill="#38bdf8" opacity="0.06"/><rect x="8" y="8" width="4" height="4" fill="#38bdf8" opacity="0.04"/><rect x="4" y="12" width="4" height="4" fill="#38bdf8" opacity="0.08"/>`,
      16, 16
    ),
    bgSize: '16px 16px',
  },
  {
    id: 'hex-network',
    label: 'شبكة سداسية',
    category: 'digital',
    bgColor: '#0c1222',
    patternSvg: makePattern(
      `<polygon points="16,2 28,9 28,23 16,30 4,23 4,9" fill="none" stroke="#6366f1" stroke-width="0.5" opacity="0.15"/>`,
      32, 32
    ),
    bgSize: '32px 32px',
  },

  // ─── GEOMETRIC ─────────────────────────────────
  {
    id: 'dots-regular',
    label: 'نقاط منتظمة',
    category: 'geometric',
    bgColor: '#fafafa',
    patternSvg: makePattern(
      `<circle cx="8" cy="8" r="1.5" fill="#94a3b8" opacity="0.2"/>`,
      16, 16
    ),
    bgSize: '16px 16px',
  },
  {
    id: 'diagonal-lines',
    label: 'خطوط مائلة',
    category: 'geometric',
    bgColor: '#f8fafc',
    patternSvg: makePattern(
      `<path d="M0 16L16 0M8 16L16 8M0 8L8 0" stroke="#94a3b8" stroke-width="0.5" opacity="0.15"/>`,
      16, 16
    ),
    bgSize: '16px 16px',
  },
  {
    id: 'triangles',
    label: 'مثلثات',
    category: 'geometric',
    bgColor: '#fef9c3',
    patternSvg: makePattern(
      `<polygon points="16,4 28,28 4,28" fill="none" stroke="#ca8a04" stroke-width="0.7" opacity="0.12"/>`,
      32, 32
    ),
    bgSize: '32px 32px',
  },
  {
    id: 'squares',
    label: 'مربعات',
    category: 'geometric',
    bgColor: '#f5f3ff',
    patternSvg: makePattern(
      `<rect x="4" y="4" width="24" height="24" fill="none" stroke="#8b5cf6" stroke-width="0.5" opacity="0.12"/><rect x="10" y="10" width="12" height="12" fill="#8b5cf6" opacity="0.04"/>`,
      32, 32
    ),
    bgSize: '32px 32px',
  },
  {
    id: 'diamonds',
    label: 'ألماس',
    category: 'geometric',
    bgColor: '#fff1f2',
    patternSvg: makePattern(
      `<polygon points="16,2 30,16 16,30 2,16" fill="none" stroke="#f43f5e" stroke-width="0.5" opacity="0.12"/>`,
      32, 32
    ),
    bgSize: '32px 32px',
  },
  {
    id: 'hexagons',
    label: 'سداسيات',
    category: 'geometric',
    bgColor: '#f0f9ff',
    patternSvg: makePattern(
      `<polygon points="16,2 28,9 28,23 16,30 4,23 4,9" fill="none" stroke="#0ea5e9" stroke-width="0.6" opacity="0.1"/>`,
      32, 32
    ),
    bgSize: '32px 32px',
  },
  {
    id: 'crosses',
    label: 'صلبان',
    category: 'geometric',
    bgColor: '#fef2f2',
    patternSvg: makePattern(
      `<path d="M14 8h4v16h-4zM8 14h16v4H8z" fill="#ef4444" opacity="0.06"/>`,
      32, 32
    ),
    bgSize: '32px 32px',
  },
  {
    id: 'chevrons',
    label: 'أقواس',
    category: 'geometric',
    bgColor: '#ecfdf5',
    patternSvg: makePattern(
      `<path d="M0 16l16-8 16 8" fill="none" stroke="#059669" stroke-width="0.5" opacity="0.12"/>`,
      32, 16
    ),
    bgSize: '32px 16px',
  },
  {
    id: 'zigzag',
    label: 'زجزاج',
    category: 'geometric',
    bgColor: '#fffbeb',
    patternSvg: makePattern(
      `<path d="M0 8l8-8 8 8 8-8 8 8" fill="none" stroke="#d97706" stroke-width="0.5" opacity="0.15"/>`,
      32, 16
    ),
    bgSize: '32px 16px',
  },
  {
    id: 'concentric-circles',
    label: 'دوائر متحدة',
    category: 'geometric',
    bgColor: '#f0f9ff',
    patternSvg: makePattern(
      `<circle cx="20" cy="20" r="6" fill="none" stroke="#3b82f6" stroke-width="0.4" opacity="0.1"/><circle cx="20" cy="20" r="12" fill="none" stroke="#3b82f6" stroke-width="0.4" opacity="0.08"/><circle cx="20" cy="20" r="18" fill="none" stroke="#3b82f6" stroke-width="0.4" opacity="0.06"/>`,
      40, 40
    ),
    bgSize: '40px 40px',
  },

  // ─── NATURE ────────────────────────────────────
  {
    id: 'waves',
    label: 'أمواج',
    category: 'nature',
    bgColor: '#ecfeff',
    patternSvg: makePattern(
      `<path d="M0 16c8-8 16 0 24-8s8 0 16-8" fill="none" stroke="#06b6d4" stroke-width="0.7" opacity="0.12"/>`,
      40, 20
    ),
    bgSize: '40px 20px',
  },
  {
    id: 'mountains',
    label: 'جبال',
    category: 'nature',
    bgColor: '#f0fdf4',
    patternSvg: makePattern(
      `<path d="M0 32l12-20 8 10 12-22 8 32z" fill="#15803d" opacity="0.06"/>`,
      40, 32
    ),
    bgSize: '40px 32px',
  },
  {
    id: 'raindrops',
    label: 'قطرات مطر',
    category: 'nature',
    bgColor: '#eff6ff',
    patternSvg: makePattern(
      `<path d="M12 4c0 0-4 6-4 9a4 4 0 008 0c0-3-4-9-4-9z" fill="#60a5fa" opacity="0.08"/>`,
      24, 24
    ),
    bgSize: '24px 24px',
  },
  {
    id: 'clouds',
    label: 'سحب',
    category: 'nature',
    bgColor: '#f0f9ff',
    patternSvg: makePattern(
      `<ellipse cx="16" cy="20" rx="12" ry="6" fill="#bae6fd" opacity="0.15"/><ellipse cx="10" cy="16" rx="6" ry="4" fill="#bae6fd" opacity="0.1"/>`,
      40, 28
    ),
    bgSize: '48px 28px',
  },
  {
    id: 'stars',
    label: 'نجوم',
    category: 'nature',
    bgColor: '#0f172a',
    patternSvg: makePattern(
      `<circle cx="8" cy="8" r="0.8" fill="#fbbf24" opacity="0.3"/><circle cx="24" cy="20" r="0.5" fill="#fbbf24" opacity="0.2"/><circle cx="16" cy="28" r="0.6" fill="#fbbf24" opacity="0.25"/>`,
      32, 32
    ),
    bgSize: '32px 32px',
  },
  {
    id: 'trees',
    label: 'أشجار',
    category: 'nature',
    bgColor: '#f0fdf4',
    patternSvg: makePattern(
      `<polygon points="16,4 24,20 8,20" fill="#22c55e" opacity="0.08"/><rect x="14" y="20" width="4" height="6" fill="#92400e" opacity="0.08"/>`,
      32, 28
    ),
    bgSize: '32px 28px',
  },

  // ─── ABSTRACT ──────────────────────────────────
  {
    id: 'abstract-blobs',
    label: 'بقع تجريدية',
    category: 'abstract',
    bgColor: '#fdf4ff',
    patternSvg: makePattern(
      `<ellipse cx="10" cy="12" rx="8" ry="6" fill="#d946ef" opacity="0.05" transform="rotate(20,10,12)"/><ellipse cx="24" cy="22" rx="6" ry="8" fill="#8b5cf6" opacity="0.04" transform="rotate(-15,24,22)"/>`,
      32, 32
    ),
    bgSize: '48px 48px',
  },
  {
    id: 'noise-texture',
    label: 'نسيج ضوضاء',
    category: 'abstract',
    bgColor: '#f5f5f4',
    patternSvg: makePattern(
      `<rect x="0" y="0" width="2" height="2" fill="#000" opacity="0.02"/><rect x="6" y="3" width="1" height="1" fill="#000" opacity="0.03"/><rect x="3" y="7" width="2" height="1" fill="#000" opacity="0.02"/><rect x="9" y="5" width="1" height="2" fill="#000" opacity="0.025"/>`,
      12, 12
    ),
    bgSize: '12px 12px',
  },
  {
    id: 'spiral',
    label: 'حلزوني',
    category: 'abstract',
    bgColor: '#fff7ed',
    patternSvg: makePattern(
      `<path d="M20 20a4 4 0 01-4 4 8 8 0 008-8 12 12 0 01-12 12" fill="none" stroke="#f97316" stroke-width="0.5" opacity="0.12"/>`,
      40, 40
    ),
    bgSize: '40px 40px',
  },
  {
    id: 'scattered-dots',
    label: 'نقاط متناثرة',
    category: 'abstract',
    bgColor: '#fefce8',
    patternSvg: makePattern(
      `<circle cx="4" cy="4" r="1.5" fill="#eab308" opacity="0.1"/><circle cx="18" cy="10" r="1" fill="#f59e0b" opacity="0.08"/><circle cx="10" cy="22" r="2" fill="#d97706" opacity="0.06"/><circle cx="26" cy="28" r="1.2" fill="#eab308" opacity="0.09"/>`,
      32, 32
    ),
    bgSize: '32px 32px',
  },
  {
    id: 'flow-lines',
    label: 'خطوط انسيابية',
    category: 'abstract',
    bgColor: '#f0f9ff',
    patternSvg: makePattern(
      `<path d="M0 20c10-10 20 10 32 0" fill="none" stroke="#3b82f6" stroke-width="0.5" opacity="0.1"/><path d="M0 10c10-10 20 10 32 0" fill="none" stroke="#60a5fa" stroke-width="0.3" opacity="0.08"/>`,
      32, 28
    ),
    bgSize: '32px 28px',
  },

  // ─── ISLAMIC / ARABIC ─────────────────────────
  {
    id: 'islamic-star',
    label: 'نجمة إسلامية',
    category: 'islamic',
    bgColor: '#fffbeb',
    patternSvg: makePattern(
      `<polygon points="16,2 19,12 30,12 21,18 24,28 16,22 8,28 11,18 2,12 13,12" fill="none" stroke="#d97706" stroke-width="0.5" opacity="0.12"/>`,
      32, 32
    ),
    bgSize: '40px 40px',
  },
  {
    id: 'arabic-pattern',
    label: 'نقش عربي',
    category: 'islamic',
    bgColor: '#ecfdf5',
    patternSvg: makePattern(
      `<path d="M0 16L16 0L32 16L16 32Z" fill="none" stroke="#059669" stroke-width="0.4" opacity="0.1"/><path d="M8 8L24 8L24 24L8 24Z" fill="none" stroke="#059669" stroke-width="0.4" opacity="0.08"/>`,
      32, 32
    ),
    bgSize: '32px 32px',
  },
  {
    id: 'tessellation',
    label: 'تبليط',
    category: 'islamic',
    bgColor: '#f5f3ff',
    patternSvg: makePattern(
      `<path d="M0 0L16 8L32 0M0 16L16 8M32 16L16 8M0 16L16 24L32 16M16 24L16 32" fill="none" stroke="#7c3aed" stroke-width="0.4" opacity="0.1"/>`,
      32, 32
    ),
    bgSize: '32px 32px',
  },
  {
    id: 'crescent',
    label: 'هلال',
    category: 'islamic',
    bgColor: '#0f172a',
    patternSvg: makePattern(
      `<circle cx="16" cy="16" r="8" fill="#fbbf24" opacity="0.06"/><circle cx="20" cy="14" r="7" fill="#0f172a"/>`,
      40, 40
    ),
    bgSize: '40px 40px',
  },

  // ─── TECH / STARTUP ───────────────────────────
  {
    id: 'blockchain',
    label: 'بلوكتشين',
    category: 'tech',
    bgColor: '#1e1b4b',
    patternSvg: makePattern(
      `<rect x="4" y="4" width="10" height="10" rx="2" fill="none" stroke="#818cf8" stroke-width="0.5" opacity="0.15"/><rect x="18" y="18" width="10" height="10" rx="2" fill="none" stroke="#818cf8" stroke-width="0.5" opacity="0.15"/><line x1="14" y1="14" x2="18" y2="18" stroke="#818cf8" stroke-width="0.3" opacity="0.1"/>`,
      32, 32
    ),
    bgSize: '32px 32px',
  },
  {
    id: 'ai-neural',
    label: 'شبكة عصبية',
    category: 'tech',
    bgColor: '#0c0a09',
    patternSvg: makePattern(
      `<circle cx="8" cy="8" r="2" fill="#a855f7" opacity="0.1"/><circle cx="24" cy="8" r="2" fill="#a855f7" opacity="0.1"/><circle cx="16" cy="24" r="2" fill="#a855f7" opacity="0.1"/><line x1="8" y1="8" x2="24" y2="8" stroke="#a855f7" stroke-width="0.3" opacity="0.08"/><line x1="8" y1="8" x2="16" y2="24" stroke="#a855f7" stroke-width="0.3" opacity="0.08"/><line x1="24" y1="8" x2="16" y2="24" stroke="#a855f7" stroke-width="0.3" opacity="0.08"/>`,
      32, 32
    ),
    bgSize: '32px 32px',
  },
  {
    id: 'iot-nodes',
    label: 'عقد IoT',
    category: 'tech',
    bgColor: '#022c22',
    patternSvg: makePattern(
      `<circle cx="16" cy="16" r="3" fill="none" stroke="#34d399" stroke-width="0.5" opacity="0.15"/><circle cx="16" cy="16" r="1" fill="#34d399" opacity="0.1"/><line x1="16" y1="0" x2="16" y2="13" stroke="#34d399" stroke-width="0.3" opacity="0.06"/><line x1="16" y1="19" x2="16" y2="32" stroke="#34d399" stroke-width="0.3" opacity="0.06"/><line x1="0" y1="16" x2="13" y2="16" stroke="#34d399" stroke-width="0.3" opacity="0.06"/><line x1="19" y1="16" x2="32" y2="16" stroke="#34d399" stroke-width="0.3" opacity="0.06"/>`,
      32, 32
    ),
    bgSize: '32px 32px',
  },

  // ─── MINIMAL ───────────────────────────────────
  {
    id: 'subtle-grain',
    label: 'حبيبات ناعمة',
    category: 'minimal',
    bgColor: '#fafaf9',
    patternSvg: makePattern(
      `<rect x="1" y="1" width="1" height="1" fill="#000" opacity="0.015"/><rect x="5" y="3" width="1" height="1" fill="#000" opacity="0.02"/><rect x="3" y="6" width="1" height="1" fill="#000" opacity="0.01"/>`,
      8, 8
    ),
    bgSize: '8px 8px',
  },
  {
    id: 'thin-lines',
    label: 'خطوط رفيعة',
    category: 'minimal',
    bgColor: '#ffffff',
    patternSvg: makePattern(
      `<line x1="0" y1="32" x2="32" y2="32" stroke="#e5e7eb" stroke-width="0.5"/>`,
      32, 32
    ),
    bgSize: '32px 32px',
  },
  {
    id: 'cross-hatch',
    label: 'تقاطعات',
    category: 'minimal',
    bgColor: '#f9fafb',
    patternSvg: makePattern(
      `<path d="M0 8h32M8 0v32" stroke="#d1d5db" stroke-width="0.3" opacity="0.5"/>`,
      32, 32
    ),
    bgSize: '32px 32px',
  },
  {
    id: 'mini-plus',
    label: 'علامات زائد',
    category: 'minimal',
    bgColor: '#fefce8',
    patternSvg: makePattern(
      `<path d="M7 8h2M8 7v2" stroke="#a16207" stroke-width="0.5" opacity="0.15"/>`,
      16, 16
    ),
    bgSize: '16px 16px',
  },
  {
    id: 'paper-texture',
    label: 'ورق',
    category: 'minimal',
    bgColor: '#fef3c7',
    patternSvg: makePattern(
      `<rect width="4" height="4" fill="#000" opacity="0.01"/><rect x="2" y="2" width="2" height="2" fill="#000" opacity="0.015"/>`,
      4, 4
    ),
    bgSize: '4px 4px',
  },
  {
    id: 'linen',
    label: 'كتان',
    category: 'minimal',
    bgColor: '#f5f5f4',
    patternSvg: makePattern(
      `<line x1="0" y1="0" x2="4" y2="0" stroke="#000" stroke-width="0.3" opacity="0.03"/><line x1="0" y1="2" x2="0" y2="6" stroke="#000" stroke-width="0.3" opacity="0.03"/>`,
      4, 4
    ),
    bgSize: '4px 4px',
  },
];

export const PATTERN_CATEGORIES: { id: SvgPattern['category']; label: string }[] = [
  { id: 'recycling', label: '♻️ تدوير' },
  { id: 'digital', label: '💻 رقمي' },
  { id: 'geometric', label: '🔷 هندسي' },
  { id: 'nature', label: '🌿 طبيعة' },
  { id: 'abstract', label: '🎨 تجريدي' },
  { id: 'islamic', label: '🕌 إسلامي' },
  { id: 'tech', label: '⚡ تقني' },
  { id: 'minimal', label: '✨ بسيط' },
];

// Legacy presets for backwards compatibility
export const WALLPAPER_PRESETS: { label: string; type: ChatWallpaper['type']; value: string }[] = [
  { label: 'كلاسيكي', type: 'color', value: '#e5ddd5' },
  { label: 'أخضر فاتح', type: 'color', value: '#dcf8c6' },
  { label: 'أزرق فاتح', type: 'color', value: '#d4e6f1' },
  { label: 'وردي فاتح', type: 'color', value: '#fce4ec' },
  { label: 'بنفسجي', type: 'color', value: '#ede7f6' },
  { label: 'رمادي', type: 'color', value: '#eceff1' },
  { label: 'داكن', type: 'color', value: '#1a1a2e' },
  { label: 'أزرق داكن', type: 'color', value: '#0d1b2a' },
  { label: 'غروب', type: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { label: 'محيط', type: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #43e97b 100%)' },
  { label: 'ذهبي', type: 'gradient', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { label: 'سماوي', type: 'gradient', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { label: 'نقاط', type: 'pattern', value: 'dots' },
  { label: 'خطوط', type: 'pattern', value: 'lines' },
  { label: 'دوائر', type: 'pattern', value: 'circles' },
];

export { COLOR_FAMILIES };

const getPatternCSS = (patternName: string): string => {
  switch (patternName) {
    case 'dots':
      return 'radial-gradient(circle, hsl(var(--muted-foreground) / 0.08) 1px, transparent 1px)';
    case 'lines':
      return 'repeating-linear-gradient(45deg, transparent, transparent 10px, hsl(var(--muted-foreground) / 0.05) 10px, hsl(var(--muted-foreground) / 0.05) 11px)';
    case 'circles':
      return 'radial-gradient(circle at 25% 25%, hsl(var(--muted-foreground) / 0.04) 0%, transparent 50%), radial-gradient(circle at 75% 75%, hsl(var(--muted-foreground) / 0.04) 0%, transparent 50%)';
    default:
      return '';
  }
};

export function useChatWallpaper(conversationId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: wallpaper } = useQuery({
    queryKey: ['chat-wallpaper', user?.id, conversationId],
    queryFn: async (): Promise<ChatWallpaper | null> => {
      if (!user) return null;

      if (conversationId) {
        const { data } = await supabase
          .from('chat_wallpapers')
          .select('wallpaper_type, wallpaper_value')
          .eq('user_id', user.id)
          .eq('conversation_id', conversationId)
          .maybeSingle();

        if (data) return { type: data.wallpaper_type as ChatWallpaper['type'], value: data.wallpaper_value };
      }

      const { data } = await supabase
        .from('chat_wallpapers')
        .select('wallpaper_type, wallpaper_value')
        .eq('user_id', user.id)
        .is('conversation_id', null)
        .maybeSingle();

      if (data) return { type: data.wallpaper_type as ChatWallpaper['type'], value: data.wallpaper_value };
      return null;
    },
    enabled: !!user,
  });

  const setWallpaper = useCallback(async (wp: ChatWallpaper, forConversation?: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('chat_wallpapers')
      .upsert({
        user_id: user.id,
        wallpaper_type: wp.type,
        wallpaper_value: wp.value,
        conversation_id: forConversation || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,conversation_id' });

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['chat-wallpaper'] });
    }
  }, [user, queryClient]);

  const getWallpaperStyle = useCallback((): React.CSSProperties => {
    if (!wallpaper) return { backgroundColor: 'hsl(var(--muted) / 0.2)' };

    switch (wallpaper.type) {
      case 'color':
        return { backgroundColor: wallpaper.value };
      case 'gradient':
        return { background: wallpaper.value };
      case 'pattern':
        return {
          backgroundColor: 'hsl(var(--background))',
          backgroundImage: getPatternCSS(wallpaper.value),
          backgroundSize: wallpaper.value === 'dots' ? '20px 20px' : undefined,
        };
      case 'svg-pattern': {
        const pattern = SVG_PATTERNS.find(p => p.id === wallpaper.value);
        if (pattern) {
          return {
            backgroundColor: pattern.bgColor,
            backgroundImage: pattern.patternSvg,
            backgroundSize: pattern.bgSize || '32px 32px',
            backgroundRepeat: 'repeat',
          };
        }
        return {};
      }
      default:
        return {};
    }
  }, [wallpaper]);

  return { wallpaper, setWallpaper, getWallpaperStyle };
}
