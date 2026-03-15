/**
 * قوالب غيلوشي جاهزة — تجمع بين أنماط الخلفية الداخلية وبراويز الصفحة
 * مستوحاة من تصاميم الشهادات الرسمية والأوراق المالية
 */
import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Search, Check, Eye, Printer, Grid3X3, LayoutGrid,
  Sparkles, Bookmark, Loader2, Filter, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useGuillocheBackground } from '@/hooks/useGuillocheBackground';
import { patternToRef, GUILLOCHE_COLOR_PALETTES } from '@/lib/guillochePatternUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useMyPermissions } from '@/hooks/useMyPermissions';
import { generatePrintWatermarkHTML, getSecurePrintCSS, logPrintAudit } from '@/lib/printSecurityUtils';

// ─── Template Color Schemes ───
const TEMPLATE_COLORS = [
  { id: 'classic-blue', name: 'أزرق كلاسيكي', border: '#1e3a5f', borderLight: '#4a7fb5', accent: '#6b9fd4', bg: '#f5f8fc', rosette: '#2a5a8f' },
  { id: 'emerald-green', name: 'أخضر زمردي', border: '#0d5e3c', borderLight: '#1a9e6a', accent: '#34d399', bg: '#f0fdf4', rosette: '#059669' },
  { id: 'gold-classic', name: 'ذهبي كلاسيكي', border: '#8b6914', borderLight: '#c9a84c', accent: '#fbbf24', bg: '#fffbeb', rosette: '#b8860b' },
  { id: 'royal-red', name: 'أحمر ملكي', border: '#7f1d1d', borderLight: '#c0392b', accent: '#ef4444', bg: '#fef2f2', rosette: '#991b1b' },
  { id: 'royal-purple', name: 'بنفسجي ملكي', border: '#4c1d95', borderLight: '#7c3aed', accent: '#a78bfa', bg: '#f5f3ff', rosette: '#6b21a8' },
  { id: 'teal-modern', name: 'مائي عصري', border: '#115e59', borderLight: '#0d9488', accent: '#2dd4bf', bg: '#f0fdfa', rosette: '#0f766e' },
  { id: 'slate-formal', name: 'رمادي رسمي', border: '#1e293b', borderLight: '#475569', accent: '#94a3b8', bg: '#f8fafc', rosette: '#334155' },
  { id: 'bronze-antique', name: 'برونزي عتيق', border: '#654321', borderLight: '#8B4513', accent: '#CD853F', bg: '#fdf6ee', rosette: '#A0522D' },
];

// ─── Template Definitions ───
interface GuillocheTemplate {
  id: string;
  name: string;
  category: string;
  categoryName: string;
  colorScheme: typeof TEMPLATE_COLORS[0];
  // Inner pattern config
  innerPattern: 'rosette' | 'mandala' | 'spirograph' | 'starburst' | 'wave-field' | 'lattice' | 'concentric' | 'floral';
  innerScale: number;
  innerDensity: number;
  innerOpacity: number;
  // Border config
  borderStyle: 'ornate-wave' | 'scallop-wave' | 'double-guilloche' | 'chain-link' | 'meander' | 'arabesque';
  borderThickness: number;
  borderDensity: number;
  cornerStyle: 'rosette' | 'fan' | 'scroll' | 'medallion';
  hasDoubleBorder: boolean;
  // Decorations
  hasTopOrnament: boolean;
  hasBottomOrnament: boolean;
  hasCenterSeal: boolean;
  seed: number;
}

const TEMPLATE_CATEGORIES = [
  { id: 'certificate', name: 'شهادات رسمية', icon: '📜' },
  { id: 'security', name: 'مستندات أمنية', icon: '🛡️' },
  { id: 'ornamental', name: 'زخرفي فاخر', icon: '🏛️' },
  { id: 'modern', name: 'عصري أنيق', icon: '◻️' },
  { id: 'islamic', name: 'إسلامي عربي', icon: '🕌' },
  { id: 'financial', name: 'مالي رسمي', icon: '💰' },
];

// Generate templates
const generateTemplates = (): GuillocheTemplate[] => {
  const templates: GuillocheTemplate[] = [];
  const innerPatterns: GuillocheTemplate['innerPattern'][] = ['rosette', 'mandala', 'spirograph', 'starburst', 'wave-field', 'lattice', 'concentric', 'floral'];
  const borderStyles: GuillocheTemplate['borderStyle'][] = ['ornate-wave', 'scallop-wave', 'double-guilloche', 'chain-link', 'meander', 'arabesque'];
  const cornerStyles: GuillocheTemplate['cornerStyle'][] = ['rosette', 'fan', 'scroll', 'medallion'];

  for (let i = 0; i < 200; i++) {
    const cat = TEMPLATE_CATEGORIES[i % TEMPLATE_CATEGORIES.length];
    const color = TEMPLATE_COLORS[i % TEMPLATE_COLORS.length];
    templates.push({
      id: `tpl-${i + 1}`,
      name: `قالب ${i + 1}`,
      category: cat.id,
      categoryName: cat.name,
      colorScheme: color,
      innerPattern: innerPatterns[i % innerPatterns.length],
      innerScale: 0.6 + (i % 5) * 0.1,
      innerDensity: 3 + (i % 6),
      innerOpacity: 0.06 + (i % 4) * 0.02,
      borderStyle: borderStyles[i % borderStyles.length],
      borderThickness: 2 + (i % 4),
      borderDensity: 4 + (i % 6),
      cornerStyle: cornerStyles[i % cornerStyles.length],
      hasDoubleBorder: i % 3 === 0,
      hasTopOrnament: i % 2 === 0,
      hasBottomOrnament: i % 2 === 0,
      hasCenterSeal: i % 4 === 0,
      seed: i * 17 + 3,
    });
  }
  return templates;
};

// ─── SVG Inner Pattern Generator ───
function generateInnerPatternPaths(
  type: GuillocheTemplate['innerPattern'],
  cx: number, cy: number, maxR: number,
  density: number, scale: number, seed: number
): { d: string; opacity: number }[] {
  const paths: { d: string; opacity: number }[] = [];
  const r = maxR * scale;

  switch (type) {
    case 'rosette': {
      // Multi-layered petal rosette like reference image 1
      for (let layer = 0; layer < density; layer++) {
        const lr = r * (0.3 + layer * 0.12);
        const petals = 8 + layer * 4;
        for (let p = 0; p < petals; p++) {
          const a1 = (p / petals) * Math.PI * 2;
          const a2 = ((p + 0.5) / petals) * Math.PI * 2;
          const a3 = ((p + 1) / petals) * Math.PI * 2;
          const x1 = cx + Math.cos(a1) * lr;
          const y1 = cy + Math.sin(a1) * lr;
          const cpx = cx + Math.cos(a2) * lr * (1.3 + layer * 0.08);
          const cpy = cy + Math.sin(a2) * lr * (1.3 + layer * 0.08);
          const x2 = cx + Math.cos(a3) * lr;
          const y2 = cy + Math.sin(a3) * lr;
          paths.push({ d: `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${cpx.toFixed(1)} ${cpy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`, opacity: 0.4 - layer * 0.04 });
        }
        // Ring
        paths.push({ d: `M ${cx - lr} ${cy} A ${lr} ${lr} 0 1 1 ${cx + lr} ${cy} A ${lr} ${lr} 0 1 1 ${cx - lr} ${cy}`, opacity: 0.2 });
      }
      break;
    }
    case 'mandala': {
      for (let ring = 1; ring <= density; ring++) {
        const rr = r * (ring / density);
        const segments = 6 + ring * 3;
        // Circle
        paths.push({ d: `M ${cx - rr} ${cy} A ${rr} ${rr} 0 1 1 ${cx + rr} ${cy} A ${rr} ${rr} 0 1 1 ${cx - rr} ${cy}`, opacity: 0.15 });
        // Petal shapes
        for (let s = 0; s < segments; s++) {
          const angle = (s / segments) * Math.PI * 2 + seed * 0.01;
          const na = ((s + 0.5) / segments) * Math.PI * 2 + seed * 0.01;
          const ix = cx + Math.cos(angle) * rr * 0.7;
          const iy = cy + Math.sin(angle) * rr * 0.7;
          const ox = cx + Math.cos(angle) * rr;
          const oy = cy + Math.sin(angle) * rr;
          const cpx = cx + Math.cos(na) * rr * 1.15;
          const cpy = cy + Math.sin(na) * rr * 1.15;
          paths.push({ d: `M ${ix.toFixed(1)} ${iy.toFixed(1)} Q ${cpx.toFixed(1)} ${cpy.toFixed(1)} ${ox.toFixed(1)} ${oy.toFixed(1)}`, opacity: 0.25 });
        }
      }
      break;
    }
    case 'spirograph': {
      // Spirograph-like curves
      for (let layer = 0; layer < Math.min(density, 6); layer++) {
        let d = '';
        const R = r * (0.4 + layer * 0.1);
        const rSmall = R * (0.3 + (seed % 5) * 0.1);
        const offset = R - rSmall;
        const ratio = rSmall / R;
        for (let t = 0; t <= 360 * 4; t += 2) {
          const rad = (t * Math.PI) / 180;
          const x = cx + offset * Math.cos(rad) + rSmall * Math.cos(rad * (1 - 1 / ratio) + layer);
          const y = cy + offset * Math.sin(rad) - rSmall * Math.sin(rad * (1 - 1 / ratio) + layer);
          d += (t === 0 ? 'M' : 'L') + ` ${x.toFixed(1)} ${y.toFixed(1)}`;
        }
        paths.push({ d, opacity: 0.2 - layer * 0.02 });
      }
      break;
    }
    case 'starburst': {
      for (let layer = 0; layer < density; layer++) {
        const rays = 12 + layer * 6;
        const lr = r * (0.3 + layer * 0.12);
        for (let i = 0; i < rays; i++) {
          const a = (i / rays) * Math.PI * 2;
          const innerR = lr * 0.3;
          const outerR = lr;
          const x1 = cx + Math.cos(a) * innerR;
          const y1 = cy + Math.sin(a) * innerR;
          const x2 = cx + Math.cos(a) * outerR;
          const y2 = cy + Math.sin(a) * outerR;
          paths.push({ d: `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`, opacity: 0.15 });
        }
      }
      break;
    }
    case 'wave-field': {
      // Wavy horizontal lines covering the page
      for (let row = 0; row < density * 3; row++) {
        let d = '';
        const yBase = cy - r + (row / (density * 3)) * r * 2;
        for (let x = cx - r; x <= cx + r; x += 3) {
          const dist = Math.sqrt((x - cx) ** 2 + (yBase - cy) ** 2);
          const fade = Math.max(0, 1 - dist / r);
          const yOff = Math.sin(x * 0.05 + row * 0.5 + seed) * 4 * fade;
          d += (x === cx - r ? 'M' : 'L') + ` ${x.toFixed(1)} ${(yBase + yOff).toFixed(1)}`;
        }
        paths.push({ d, opacity: 0.12 });
      }
      break;
    }
    case 'lattice': {
      // Diamond lattice grid
      const step = r * 2 / (density * 2);
      for (let i = 0; i < density * 2; i++) {
        const offset = cx - r + i * step;
        // Diagonal lines clipped to circle
        paths.push({ d: `M ${(offset).toFixed(1)} ${(cy - r).toFixed(1)} L ${(offset + r).toFixed(1)} ${(cy).toFixed(1)}`, opacity: 0.1 });
        paths.push({ d: `M ${(offset).toFixed(1)} ${(cy + r).toFixed(1)} L ${(offset + r).toFixed(1)} ${(cy).toFixed(1)}`, opacity: 0.1 });
      }
      break;
    }
    case 'concentric': {
      for (let ring = 1; ring <= density * 2; ring++) {
        const rr = r * (ring / (density * 2));
        // Undulating circle
        let d = '';
        const pts = 120;
        for (let p = 0; p <= pts; p++) {
          const angle = (p / pts) * Math.PI * 2;
          const wobble = Math.sin(angle * (4 + ring) + seed) * rr * 0.05;
          const x = cx + Math.cos(angle) * (rr + wobble);
          const y = cy + Math.sin(angle) * (rr + wobble);
          d += (p === 0 ? 'M' : 'L') + ` ${x.toFixed(1)} ${y.toFixed(1)}`;
        }
        d += ' Z';
        paths.push({ d, opacity: 0.12 });
      }
      break;
    }
    case 'floral': {
      // Flower-like pattern with curved petals
      for (let layer = 0; layer < density; layer++) {
        const lr = r * (0.2 + layer * 0.15);
        const petals = 6 + layer * 2;
        for (let p = 0; p < petals; p++) {
          const a = (p / petals) * Math.PI * 2;
          const aNext = ((p + 1) / petals) * Math.PI * 2;
          const aMid = (a + aNext) / 2;
          const x1 = cx + Math.cos(a) * lr * 0.5;
          const y1 = cy + Math.sin(a) * lr * 0.5;
          const cpx1 = cx + Math.cos(aMid - 0.3) * lr * 1.2;
          const cpy1 = cy + Math.sin(aMid - 0.3) * lr * 1.2;
          const cpx2 = cx + Math.cos(aMid + 0.3) * lr * 1.2;
          const cpy2 = cy + Math.sin(aMid + 0.3) * lr * 1.2;
          const x2 = cx + Math.cos(aNext) * lr * 0.5;
          const y2 = cy + Math.sin(aNext) * lr * 0.5;
          paths.push({ d: `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${cpx1.toFixed(1)} ${cpy1.toFixed(1)} ${cpx2.toFixed(1)} ${cpy2.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`, opacity: 0.25 - layer * 0.03 });
        }
      }
      break;
    }
  }
  return paths;
}

// ─── SVG Border Generator ───
function generateBorderFramePaths(
  style: GuillocheTemplate['borderStyle'],
  w: number, h: number,
  thickness: number, density: number, seed: number,
  hasDouble: boolean
): { d: string; opacity: number }[] {
  const paths: { d: string; opacity: number }[] = [];
  const margin = 2;
  const bandW = 3 + thickness * 1.5;
  const step = 1.5;

  const perimeter = 2 * (w - 2 * margin) + 2 * (h - 2 * margin);
  const topLen = w - 2 * margin;
  const rightLen = h - 2 * margin;
  const bottomLen = topLen;

  const getPoint = (t: number) => {
    const dist = ((t % 1) + 1) % 1 * perimeter;
    if (dist <= topLen) return { x: margin + dist, y: margin, nx: 0, ny: -1 };
    if (dist <= topLen + rightLen) return { x: w - margin, y: margin + dist - topLen, nx: 1, ny: 0 };
    if (dist <= topLen + rightLen + bottomLen) return { x: w - margin - (dist - topLen - rightLen), y: h - margin, nx: 0, ny: 1 };
    return { x: margin, y: h - margin - (dist - topLen - rightLen - bottomLen), nx: -1, ny: 0 };
  };

  const totalPts = Math.floor(perimeter / step);
  const numWaves = 2 + density;

  // Outer border waves
  for (let wave = 0; wave < numWaves; wave++) {
    let d = '';
    const freq = (0.04 + wave * 0.008 + seed * 0.00005) * (1.5 + density * 0.25);
    const amp = bandW * (0.3 + (wave % 3) * 0.15);
    const phase = (wave * Math.PI * 2) / numWaves + seed * 0.05;

    for (let i = 0; i <= totalPts; i++) {
      const t = i / totalPts;
      const dist = t * perimeter;
      const pt = getPoint(t);
      const offset = Math.sin(dist * freq + phase) * amp
        + Math.sin(dist * freq * 1.5 + phase * 1.3) * amp * 0.4;
      const x = pt.x + pt.nx * offset;
      const y = pt.y + pt.ny * offset;
      d += (i === 0 ? 'M' : 'L') + ` ${x.toFixed(2)} ${y.toFixed(2)}`;
    }
    paths.push({ d, opacity: 0.6 + (wave % 2) * 0.15 });
  }

  // Inner border if double
  if (hasDouble) {
    const innerMargin = margin + bandW + 2;
    const innerPerimeter = 2 * (w - 2 * innerMargin) + 2 * (h - 2 * innerMargin);
    const iTopLen = w - 2 * innerMargin;
    const iRightLen = h - 2 * innerMargin;
    const iBottomLen = iTopLen;

    const getInnerPt = (t: number) => {
      const dist = ((t % 1) + 1) % 1 * innerPerimeter;
      if (dist <= iTopLen) return { x: innerMargin + dist, y: innerMargin, nx: 0, ny: -1 };
      if (dist <= iTopLen + iRightLen) return { x: w - innerMargin, y: innerMargin + dist - iTopLen, nx: 1, ny: 0 };
      if (dist <= iTopLen + iRightLen + iBottomLen) return { x: w - innerMargin - (dist - iTopLen - iRightLen), y: h - innerMargin, nx: 0, ny: 1 };
      return { x: innerMargin, y: h - innerMargin - (dist - iTopLen - iRightLen - iBottomLen), nx: -1, ny: 0 };
    };

    const innerTotal = Math.floor(innerPerimeter / step);
    for (let wave = 0; wave < Math.min(numWaves, 4); wave++) {
      let d = '';
      const freq = (0.05 + wave * 0.01) * (1.5 + density * 0.2);
      const amp = bandW * 0.25 * (0.5 + wave * 0.12);
      const ph = wave * Math.PI / 2.5 + seed * 0.03;
      for (let i = 0; i <= innerTotal; i++) {
        const t = i / innerTotal;
        const dist = t * innerPerimeter;
        const pt = getInnerPt(t);
        const off = Math.sin(dist * freq + ph) * amp + Math.cos(dist * freq * 1.3 + ph * 1.5) * amp * 0.35;
        d += (i === 0 ? 'M' : 'L') + ` ${(pt.x + pt.nx * off).toFixed(2)} ${(pt.y + pt.ny * off).toFixed(2)}`;
      }
      paths.push({ d, opacity: 0.4 + wave * 0.08 });
    }
  }

  return paths;
}

// ─── Corner Ornaments ───
function generateCornerPaths(
  style: GuillocheTemplate['cornerStyle'],
  cx: number, cy: number, quadrant: number,
  size: number, seed: number
): { d: string; opacity: number }[] {
  const paths: { d: string; opacity: number }[] = [];
  const s = size;

  for (let ring = 0; ring < 4; ring++) {
    let d = '';
    const pts = 40;
    for (let i = 0; i <= pts; i++) {
      const angle = (i / pts) * Math.PI / 2 + quadrant * Math.PI / 2;
      const r = s * (0.2 + ring * 0.2) + Math.sin(angle * (3 + ring * 2) + seed * 0.1) * s * 0.1;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      d += (i === 0 ? 'M' : 'L') + ` ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    paths.push({ d, opacity: 0.5 - ring * 0.08 });
  }
  return paths;
}

// ─── Top/Bottom Ornament ───
function generateOrnamentPaths(cx: number, cy: number, width: number, seed: number, flip = false): { d: string; opacity: number }[] {
  const paths: { d: string; opacity: number }[] = [];
  const w = width * 0.4;
  const dir = flip ? -1 : 1;
  
  for (let layer = 0; layer < 3; layer++) {
    const amplitude = 5 + layer * 3;
    let d = '';
    for (let x = -w; x <= w; x += 2) {
      const t = x / w;
      const fade = 1 - t * t;
      const y = cy + dir * (Math.sin(x * 0.15 + layer + seed * 0.1) * amplitude * fade + Math.sin(x * 0.3 + layer * 2) * amplitude * 0.3 * fade);
      d += (x === -w ? 'M' : 'L') + ` ${(cx + x).toFixed(1)} ${y.toFixed(1)}`;
    }
    paths.push({ d, opacity: 0.5 - layer * 0.1 });
  }
  
  // Central flourish
  const flourishR = 6;
  paths.push({
    d: `M ${cx - flourishR} ${cy} A ${flourishR} ${flourishR} 0 1 ${flip ? 0 : 1} ${cx + flourishR} ${cy} A ${flourishR} ${flourishR} 0 1 ${flip ? 0 : 1} ${cx - flourishR} ${cy}`,
    opacity: 0.35,
  });

  return paths;
}

// ─── Template SVG Renderer ───
const GuillocheTemplateSVG = ({ template, width = 200, height = 283 }: {
  template: GuillocheTemplate; width?: number; height?: number;
}) => {
  const { colorScheme, innerPattern, innerScale, innerDensity, innerOpacity,
    borderStyle, borderThickness, borderDensity, cornerStyle,
    hasDoubleBorder, hasTopOrnament, hasBottomOrnament, hasCenterSeal, seed } = template;

  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.min(width, height) * 0.38;

  const innerPaths = useMemo(() =>
    generateInnerPatternPaths(innerPattern, cx, cy, maxR, innerDensity, innerScale, seed),
    [innerPattern, cx, cy, maxR, innerDensity, innerScale, seed]
  );

  const borderPaths = useMemo(() =>
    generateBorderFramePaths(borderStyle, width, height, borderThickness, borderDensity, seed, hasDoubleBorder),
    [borderStyle, width, height, borderThickness, borderDensity, seed, hasDoubleBorder]
  );

  const cornerPaths = useMemo(() => {
    const bandW = 3 + borderThickness * 1.5;
    const m = 2;
    const corners = [
      { cx: m, cy: m, q: 0 },
      { cx: width - m, cy: m, q: 3 },
      { cx: width - m, cy: height - m, q: 2 },
      { cx: m, cy: height - m, q: 1 },
    ];
    return corners.flatMap(c => generateCornerPaths(cornerStyle, c.cx, c.cy, c.q, bandW * 1.5, seed));
  }, [cornerStyle, width, height, borderThickness, seed]);

  const ornamentPaths = useMemo(() => {
    const result: { d: string; opacity: number }[] = [];
    if (hasTopOrnament) result.push(...generateOrnamentPaths(cx, 12, width, seed, false));
    if (hasBottomOrnament) result.push(...generateOrnamentPaths(cx, height - 12, width, seed, true));
    return result;
  }, [hasTopOrnament, hasBottomOrnament, cx, width, height, seed]);

  const uid = `gtpl-${template.id}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ backgroundColor: colorScheme.bg }}>
      <defs>
        <linearGradient id={`${uid}-g1`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colorScheme.border} />
          <stop offset="100%" stopColor={colorScheme.borderLight} />
        </linearGradient>
        <linearGradient id={`${uid}-g2`} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colorScheme.rosette} />
          <stop offset="100%" stopColor={colorScheme.accent} />
        </linearGradient>
      </defs>

      {/* Inner pattern */}
      <g opacity={innerOpacity * 10}>
        {innerPaths.map((p, i) => (
          <path key={`i${i}`} d={p.d} fill="none" stroke={`url(#${uid}-g2)`}
            strokeWidth={0.4} strokeLinecap="round" opacity={p.opacity} />
        ))}
      </g>

      {/* Border frame */}
      <g>
        {borderPaths.map((p, i) => (
          <path key={`b${i}`} d={p.d} fill="none" stroke={`url(#${uid}-g1)`}
            strokeWidth={0.5} strokeLinecap="round" opacity={p.opacity} />
        ))}
      </g>

      {/* Corner ornaments */}
      <g>
        {cornerPaths.map((p, i) => (
          <path key={`c${i}`} d={p.d} fill="none" stroke={colorScheme.border}
            strokeWidth={0.35} strokeLinecap="round" opacity={p.opacity} />
        ))}
      </g>

      {/* Top/Bottom ornaments */}
      <g>
        {ornamentPaths.map((p, i) => (
          <path key={`o${i}`} d={p.d} fill="none" stroke={colorScheme.rosette}
            strokeWidth={0.4} strokeLinecap="round" opacity={p.opacity} />
        ))}
      </g>

      {/* Center seal */}
      {hasCenterSeal && (
        <g opacity={0.15}>
          <circle cx={cx} cy={height * 0.8} r={8} fill="none" stroke={colorScheme.rosette} strokeWidth={0.6} />
          <circle cx={cx} cy={height * 0.8} r={6} fill="none" stroke={colorScheme.accent} strokeWidth={0.3} />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <line key={i} x1={cx + Math.cos(a) * 6} y1={height * 0.8 + Math.sin(a) * 6}
              x2={cx + Math.cos(a) * 8} y2={height * 0.8 + Math.sin(a) * 8}
              stroke={colorScheme.rosette} strokeWidth={0.3} />;
          })}
        </g>
      )}
    </svg>
  );
};

// ─── Generate HTML for printing ───
function generateTemplateHTML(template: GuillocheTemplate, w: number, h: number): string {
  const { colorScheme, innerPattern, innerScale, innerDensity, innerOpacity,
    borderStyle, borderThickness, borderDensity, cornerStyle,
    hasDoubleBorder, hasTopOrnament, hasBottomOrnament, hasCenterSeal, seed } = template;

  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.min(w, h) * 0.38;

  const innerPaths = generateInnerPatternPaths(innerPattern, cx, cy, maxR, innerDensity, innerScale, seed);
  const borderPaths = generateBorderFramePaths(borderStyle, w, h, borderThickness, borderDensity, seed, hasDoubleBorder);
  const bandW = 3 + borderThickness * 1.5;
  const m = 2;
  const corners = [
    { cx: m, cy: m, q: 0 }, { cx: w - m, cy: m, q: 3 },
    { cx: w - m, cy: h - m, q: 2 }, { cx: m, cy: h - m, q: 1 },
  ];
  const cornerPs = corners.flatMap(c => generateCornerPaths(cornerStyle, c.cx, c.cy, c.q, bandW * 1.5, seed));
  const ornamentPs: { d: string; opacity: number }[] = [];
  if (hasTopOrnament) ornamentPs.push(...generateOrnamentPaths(cx, 12, w, seed, false));
  if (hasBottomOrnament) ornamentPs.push(...generateOrnamentPaths(cx, h - 12, w, seed, true));

  const allPaths = [
    ...innerPaths.map(p => `<path d="${p.d}" fill="none" stroke="url(#g2)" stroke-width="0.5" stroke-linecap="round" opacity="${p.opacity * innerOpacity * 10}" />`),
    ...borderPaths.map(p => `<path d="${p.d}" fill="none" stroke="url(#g1)" stroke-width="0.6" stroke-linecap="round" opacity="${p.opacity}" />`),
    ...cornerPs.map(p => `<path d="${p.d}" fill="none" stroke="${colorScheme.border}" stroke-width="0.4" stroke-linecap="round" opacity="${p.opacity}" />`),
    ...ornamentPs.map(p => `<path d="${p.d}" fill="none" stroke="${colorScheme.rosette}" stroke-width="0.5" stroke-linecap="round" opacity="${p.opacity}" />`),
  ];

  return `<div style="position:absolute;inset:0;pointer-events:none;background-color:${colorScheme.bg};">
    <svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${colorScheme.border}" />
          <stop offset="100%" stop-color="${colorScheme.borderLight}" />
        </linearGradient>
        <linearGradient id="g2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${colorScheme.rosette}" />
          <stop offset="100%" stop-color="${colorScheme.accent}" />
        </linearGradient>
      </defs>
      ${allPaths.join('\n')}
    </svg>
  </div>`;
}

// ─── Exports for use in print system ───
export { generateTemplateHTML, TEMPLATE_COLORS };
export type { GuillocheTemplate };

// ─── Main Component ───
export default function GuillocheTemplateDesigns() {
  const { organization, profile, user } = useAuth();
  const { hasPermission, isAdmin, isCompanyAdmin } = useMyPermissions();
  const canPrint = isAdmin || isCompanyAdmin || hasPermission('print_documents');
  const orgName = organization?.name || 'اسم الجهة';
  const userName = profile?.full_name || 'المستخدم';
  const { getPref, setPref } = useUserPreferences();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [gridSize, setGridSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [visibleCount, setVisibleCount] = useState(40);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<GuillocheTemplate | null>(null);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(
    getPref('guilloche_active_template', null)
  );

  const allTemplates = useMemo(() => generateTemplates(), []);

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter(t => {
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
      if (selectedColor !== 'all' && t.colorScheme.id !== selectedColor) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return t.name.includes(q) || t.categoryName.includes(q);
      }
      return true;
    });
  }, [allTemplates, selectedCategory, selectedColor, searchQuery]);

  const visibleTemplates = useMemo(() => filteredTemplates.slice(0, visibleCount), [filteredTemplates, visibleCount]);

  const handleApply = (template: GuillocheTemplate) => {
    setPref('guilloche_active_template', template.id);
    setPref('guilloche_active_template_data', template);
    setActiveTemplateId(template.id);
    toast.success(`تم تطبيق "${template.name}" كقالب للمستندات`);
  };

  const handleClear = () => {
    setPref('guilloche_active_template', null);
    setPref('guilloche_active_template_data', null);
    setActiveTemplateId(null);
    toast.info('تم إلغاء القالب - سيتم استخدام الإعدادات الأخرى');
  };

  const handlePreview = (template: GuillocheTemplate) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const handlePrintPreview = () => {
    if (!selectedTemplate) return;
    if (!canPrint) {
      toast.error('ليس لديك صلاحية طباعة المستندات');
      return;
    }
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>معاينة القالب - ${selectedTemplate.name}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
          ${getSecurePrintCSS()}
          * { margin:0; padding:0; box-sizing:border-box; }
          @page { size:A4; margin:0; }
          body { display:flex; justify-content:center; font-family:'Cairo',sans-serif; }
          .page { width:210mm; height:297mm; position:relative; overflow:hidden; }
          .content { position:absolute; inset:22mm; z-index:5; text-align:center; }
          .content h1 { font-size:24px; color:${selectedTemplate.colorScheme.border}; margin-top:40px; }
          .content p { font-size:14px; color:#666; margin-top:10px; }
        </style>
      </head>
      <body>
        <div class="page">
          ${generateTemplateHTML(selectedTemplate, 595, 842)}
          <div class="content">
            <h1>♻ شهادة إعادة التدوير</h1>
            <p>هذه معاينة للقالب مع محتوى تجريبي</p>
            <p style="margin-top:30px;font-size:18px;font-weight:bold;">${orgName}</p>
            <p style="margin-top:60px;color:#999;font-size:12px;">رقم الشهادة: RC-2026-001234</p>
          </div>
        </div>
        ${generatePrintWatermarkHTML(orgName, userName)}
      </body>
      </html>`;
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
    }
    if (user?.id && organization?.id) {
      logPrintAudit({ userId: user.id, orgId: organization.id, action: 'print_guilloche_template', details: { template: selectedTemplate.name } });
    }
  };

  const gridCols = {
    small: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7',
    medium: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
    large: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  };

  const sizes = { small: 140, medium: 180, large: 240 };
  const tplWidth = sizes[gridSize];
  const tplHeight = Math.round(tplWidth * 1.414);

  return (
    <div className="space-y-4">
      {/* Active template indicator */}
      {activeTemplateId && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">القالب النشط: {allTemplates.find(t => t.id === activeTemplateId)?.name}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClear} className="gap-1 text-destructive">
              <X className="h-3.5 w-3.5" /> إلغاء
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث في القوالب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل التصنيفات</SelectItem>
            {TEMPLATE_CATEGORIES.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedColor} onValueChange={setSelectedColor}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الألوان</SelectItem>
            {TEMPLATE_COLORS.map(c => (
              <SelectItem key={c.id} value={c.id}>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ background: c.border }} />
                  {c.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex border rounded-md overflow-hidden">
          {(['small', 'medium', 'large'] as const).map(s => (
            <button key={s} onClick={() => setGridSize(s)}
              className={cn('p-1.5 transition-colors', gridSize === s ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}>
              {s === 'small' ? <Grid3X3 className="h-4 w-4" /> : s === 'medium' ? <LayoutGrid className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            </button>
          ))}
        </div>

        <Badge variant="secondary" className="text-xs">{filteredTemplates.length} قالب</Badge>
      </div>

      {/* Grid */}
      <div className={cn('grid gap-3', gridCols[gridSize])}>
        {visibleTemplates.map((tpl, i) => (
          <motion.div
            key={tpl.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: Math.min(i * 0.02, 0.5) }}
          >
            <Card
              className={cn(
                'group cursor-pointer transition-all hover:shadow-lg overflow-hidden',
                activeTemplateId === tpl.id && 'ring-2 ring-primary shadow-primary/20'
              )}
              onClick={() => handlePreview(tpl)}
            >
              <div className="relative">
                <GuillocheTemplateSVG template={tpl} width={tplWidth} height={tplHeight} />
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-1">
                    <Button size="sm" variant="secondary" className="gap-1 text-xs h-7"
                      onClick={(e) => { e.stopPropagation(); handleApply(tpl); }}>
                      <Check className="h-3 w-3" /> تطبيق
                    </Button>
                    <Button size="sm" variant="secondary" className="gap-1 text-xs h-7"
                      onClick={(e) => { e.stopPropagation(); handlePreview(tpl); }}>
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {activeTemplateId === tpl.id && (
                  <div className="absolute top-1 right-1">
                    <Badge className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0">
                      <Check className="h-2.5 w-2.5 ml-0.5" /> نشط
                    </Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-2">
                <p className="text-xs font-medium truncate">{tpl.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: tpl.colorScheme.border }} />
                  <span className="text-[10px] text-muted-foreground">{tpl.colorScheme.name}</span>
                  <span className="text-[10px] text-muted-foreground mr-auto">{tpl.categoryName}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Load more */}
      {visibleCount < filteredTemplates.length && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={() => setVisibleCount(v => Math.min(v + 40, filteredTemplates.length))} className="gap-2">
            <Loader2 className="h-4 w-4" />
            عرض المزيد ({filteredTemplates.length - visibleCount} متبقي)
          </Button>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
          {selectedTemplate && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {selectedTemplate.name} — {selectedTemplate.categoryName}
                </DialogTitle>
              </DialogHeader>
              <div className="flex justify-center py-4">
                <div className="border-2 rounded-lg shadow-2xl overflow-hidden">
                  <GuillocheTemplateSVG template={selectedTemplate} width={450} height={636} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="outline">{selectedTemplate.colorScheme.name}</Badge>
                <Badge variant="outline">خلفية: {selectedTemplate.innerPattern}</Badge>
                <Badge variant="outline">برواز: {selectedTemplate.borderStyle}</Badge>
                <Badge variant="outline">أركان: {selectedTemplate.cornerStyle}</Badge>
                {selectedTemplate.hasDoubleBorder && <Badge variant="outline">برواز مزدوج</Badge>}
                {selectedTemplate.hasTopOrnament && <Badge variant="outline">زخرفة علوية</Badge>}
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" className="gap-2" onClick={handlePrintPreview}>
                  <Printer className="h-4 w-4" /> معاينة A4
                </Button>
                <Button className="gap-2" onClick={() => { handleApply(selectedTemplate); setPreviewOpen(false); }}>
                  <Check className="h-4 w-4" /> تطبيق كقالب
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
