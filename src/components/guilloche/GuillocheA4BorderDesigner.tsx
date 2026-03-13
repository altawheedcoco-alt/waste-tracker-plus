import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { motion, AnimatePresence } from 'framer-motion';
import GuillocheSecurityOverlay, { generateSecurityOverlayHTML } from './GuillocheSecurityOverlay';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search, Check, Eye, Printer, Filter, X, Grid3X3, LayoutGrid,
  Sparkles, Frame, Square, Hexagon, Circle, Star, Triangle,
  Loader2, Download, Settings2, RotateCw, Palette, Maximize,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ─── Border Categories ───
const BORDER_CATEGORIES = [
  { id: 'classic-frame', name: 'إطار كلاسيكي', icon: '🖼️', count: 150 },
  { id: 'ornamental', name: 'زخرفي', icon: '🏛️', count: 150 },
  { id: 'geometric', name: 'هندسي', icon: '🔷', count: 150 },
  { id: 'wave-border', name: 'موجي', icon: '🌊', count: 100 },
  { id: 'floral-border', name: 'نباتي', icon: '🌿', count: 100 },
  { id: 'celtic', name: 'سلتي معقد', icon: '☘️', count: 80 },
  { id: 'arabic-islamic', name: 'عربي إسلامي', icon: '🕌', count: 120 },
  { id: 'modern-minimal', name: 'عصري بسيط', icon: '◻️', count: 80 },
  { id: 'certificate', name: 'شهادات رسمية', icon: '📜', count: 70 },
];

const BORDER_COLORS = [
  { id: 'gold', name: 'ذهبي', primary: '#b8860b', secondary: '#ffd700', tertiary: '#8b6914' },
  { id: 'green', name: 'أخضر بيئي', primary: '#059669', secondary: '#34d399', tertiary: '#047857' },
  { id: 'blue', name: 'أزرق ملكي', primary: '#1e40af', secondary: '#3b82f6', tertiary: '#1e3a8a' },
  { id: 'red', name: 'أحمر رسمي', primary: '#991b1b', secondary: '#ef4444', tertiary: '#7f1d1d' },
  { id: 'purple', name: 'بنفسجي', primary: '#6b21a8', secondary: '#a855f7', tertiary: '#581c87' },
  { id: 'black', name: 'أسود كلاسيكي', primary: '#1a1a1a', secondary: '#555', tertiary: '#000' },
  { id: 'teal', name: 'أخضر مائي', primary: '#0d9488', secondary: '#2dd4bf', tertiary: '#115e59' },
  { id: 'bronze', name: 'برونزي', primary: '#8B4513', secondary: '#CD853F', tertiary: '#654321' },
];

// ─── Border Style Types ───
type BorderStyleType =
  | 'double-line' | 'triple-line' | 'ornate-corner' | 'chain'
  | 'rope' | 'wave-edge' | 'scallop' | 'zigzag'
  | 'meander' | 'interlocking' | 'guilloche-band' | 'diamond-chain'
  | 'scroll' | 'leaf-vine' | 'geometric-repeat' | 'dot-dash'
  | 'arabesque-repeat' | 'star-chain' | 'cross-hatch-border' | 'bracket';

interface BorderConfig {
  id: string;
  name: string;
  category: string;
  categoryName: string;
  borderStyle: BorderStyleType;
  color: typeof BORDER_COLORS[0];
  thickness: number;      // 1-5
  cornerStyle: 'sharp' | 'rounded' | 'ornate' | 'chamfered';
  innerMargin: number;    // px from edge
  doubleBorder: boolean;
  cornerDecoration: boolean;
  symmetry: 'full' | 'horizontal' | 'vertical' | 'diagonal';
  density: number;        // pattern repeat density
  seed: number;
}

// ─── Generate 1000 unique borders ───
const generateBorders = (): BorderConfig[] => {
  const borders: BorderConfig[] = [];
  const borderStyles: BorderStyleType[] = [
    'double-line','triple-line','ornate-corner','chain','rope','wave-edge',
    'scallop','zigzag','meander','interlocking','guilloche-band','diamond-chain',
    'scroll','leaf-vine','geometric-repeat','dot-dash','arabesque-repeat',
    'star-chain','cross-hatch-border','bracket',
  ];
  const cornerStyles: BorderConfig['cornerStyle'][] = ['sharp','rounded','ornate','chamfered'];
  const symmetries: BorderConfig['symmetry'][] = ['full','horizontal','vertical','diagonal'];

  for (let i = 0; i < 1000; i++) {
    const catIdx = i % BORDER_CATEGORIES.length;
    const cat = BORDER_CATEGORIES[catIdx];
    const color = BORDER_COLORS[i % BORDER_COLORS.length];
    const style = borderStyles[i % borderStyles.length];
    const corner = cornerStyles[Math.floor(i / 50) % cornerStyles.length];
    const sym = symmetries[Math.floor(i / 100) % symmetries.length];

    borders.push({
      id: `border-${i + 1}`,
      name: `برواز ${i + 1}`,
      category: cat.id,
      categoryName: cat.name,
      borderStyle: style,
      color,
      thickness: 1 + (i % 5),
      cornerStyle: corner,
      innerMargin: 15 + (i % 6) * 5,
      doubleBorder: i % 3 === 0,
      cornerDecoration: i % 2 === 0,
      density: 4 + (i % 8),
      symmetry: sym,
      seed: i * 13 + 7,
    });
  }
  return borders;
};

// ─── SVG Border Renderer ───
const GuillocheA4Border = ({ border, width = 200, height = 283, showContent = false }: {
  border: BorderConfig; width?: number; height?: number; showContent?: boolean;
}) => {
  const { color, thickness, cornerStyle, innerMargin, doubleBorder, cornerDecoration, borderStyle, density, seed } = border;
  const m = innerMargin * (width / 595);  // scale margin
  const sw = thickness * 0.6;
  const r = cornerStyle === 'rounded' ? 8 : cornerStyle === 'chamfered' ? 4 : 0;

  const generateBorderPaths = useCallback((): string[] => {
    const paths: string[] = [];
    const w = width;
    const h = height;
    const inset = m;

    // Outer frame
    if (cornerStyle === 'rounded') {
      paths.push(`M ${inset + r} ${inset} L ${w - inset - r} ${inset} Q ${w - inset} ${inset} ${w - inset} ${inset + r} L ${w - inset} ${h - inset - r} Q ${w - inset} ${h - inset} ${w - inset - r} ${h - inset} L ${inset + r} ${h - inset} Q ${inset} ${h - inset} ${inset} ${h - inset - r} L ${inset} ${inset + r} Q ${inset} ${inset} ${inset + r} ${inset} Z`);
    } else {
      paths.push(`M ${inset} ${inset} L ${w - inset} ${inset} L ${w - inset} ${h - inset} L ${inset} ${h - inset} Z`);
    }

    // Inner frame (double border)
    if (doubleBorder) {
      const gap = 4 + thickness;
      const i2 = inset + gap;
      paths.push(`M ${i2} ${i2} L ${w - i2} ${i2} L ${w - i2} ${h - i2} L ${i2} ${h - i2} Z`);
    }

    // Decorative border elements
    const segLen = Math.max(8, 20 - density);
    switch (borderStyle) {
      case 'wave-edge': {
        let d = `M ${inset} ${inset + (h - 2 * inset) / 2}`;
        for (let x = inset; x < w - inset; x += segLen) {
          const y1 = inset - 3 + Math.sin((x + seed) * 0.3) * 3;
          d = `M ${x} ${inset + y1}`;
          paths.push(`M ${x} ${inset} Q ${x + segLen / 2} ${inset - 4} ${x + segLen} ${inset}`);
          paths.push(`M ${x} ${h - inset} Q ${x + segLen / 2} ${h - inset + 4} ${x + segLen} ${h - inset}`);
        }
        for (let y = inset; y < h - inset; y += segLen) {
          paths.push(`M ${inset} ${y} Q ${inset - 4} ${y + segLen / 2} ${inset} ${y + segLen}`);
          paths.push(`M ${w - inset} ${y} Q ${w - inset + 4} ${y + segLen / 2} ${w - inset} ${y + segLen}`);
        }
        break;
      }
      case 'scallop': {
        for (let x = inset; x < w - inset - segLen; x += segLen) {
          paths.push(`M ${x} ${inset} A ${segLen / 2} ${segLen / 2} 0 0 1 ${x + segLen} ${inset}`);
          paths.push(`M ${x} ${h - inset} A ${segLen / 2} ${segLen / 2} 0 0 0 ${x + segLen} ${h - inset}`);
        }
        for (let y = inset; y < h - inset - segLen; y += segLen) {
          paths.push(`M ${inset} ${y} A ${segLen / 2} ${segLen / 2} 0 0 0 ${inset} ${y + segLen}`);
          paths.push(`M ${w - inset} ${y} A ${segLen / 2} ${segLen / 2} 0 0 1 ${w - inset} ${y + segLen}`);
        }
        break;
      }
      case 'zigzag': {
        const amp = 3;
        for (let x = inset; x < w - inset; x += segLen) {
          const toggle = ((x - inset) / segLen) % 2 === 0;
          paths.push(`M ${x} ${inset + (toggle ? -amp : amp)} L ${x + segLen / 2} ${inset + (toggle ? amp : -amp)} L ${x + segLen} ${inset + (toggle ? -amp : amp)}`);
          paths.push(`M ${x} ${h - inset + (toggle ? -amp : amp)} L ${x + segLen / 2} ${h - inset + (toggle ? amp : -amp)} L ${x + segLen} ${h - inset + (toggle ? -amp : amp)}`);
        }
        break;
      }
      case 'chain': {
        for (let x = inset; x < w - inset - segLen; x += segLen) {
          const cx = x + segLen / 2;
          const rr = segLen / 3;
          paths.push(`M ${cx - rr} ${inset} A ${rr} ${rr} 0 1 1 ${cx + rr} ${inset} A ${rr} ${rr} 0 1 1 ${cx - rr} ${inset}`);
          paths.push(`M ${cx - rr} ${h - inset} A ${rr} ${rr} 0 1 1 ${cx + rr} ${h - inset} A ${rr} ${rr} 0 1 1 ${cx - rr} ${h - inset}`);
        }
        break;
      }
      case 'diamond-chain': {
        const ds = segLen * 0.6;
        for (let x = inset + ds; x < w - inset - ds; x += segLen) {
          paths.push(`M ${x} ${inset - ds / 2} L ${x + ds / 2} ${inset} L ${x} ${inset + ds / 2} L ${x - ds / 2} ${inset} Z`);
          paths.push(`M ${x} ${h - inset - ds / 2} L ${x + ds / 2} ${h - inset} L ${x} ${h - inset + ds / 2} L ${x - ds / 2} ${h - inset} Z`);
        }
        for (let y = inset + ds; y < h - inset - ds; y += segLen) {
          paths.push(`M ${inset - ds / 2} ${y} L ${inset} ${y - ds / 2} L ${inset + ds / 2} ${y} L ${inset} ${y + ds / 2} Z`);
          paths.push(`M ${w - inset - ds / 2} ${y} L ${w - inset} ${y - ds / 2} L ${w - inset + ds / 2} ${y} L ${w - inset} ${y + ds / 2} Z`);
        }
        break;
      }
      case 'guilloche-band': {
        for (let x = inset; x < w - inset; x += 2) {
          const y1 = inset + Math.sin((x + seed) * 0.2) * 4;
          const y2 = inset + Math.cos((x + seed) * 0.15) * 4;
          if (x === inset) {
            paths.push(`M ${x} ${y1}`);
            paths.push(`M ${x} ${y2}`);
          }
        }
        // Top guilloche band
        let topBand1 = `M ${inset} ${inset}`;
        let topBand2 = `M ${inset} ${inset}`;
        for (let x = inset; x <= w - inset; x += 1.5) {
          topBand1 += ` L ${x} ${inset + Math.sin((x + seed) * 0.25) * 3}`;
          topBand2 += ` L ${x} ${inset + Math.cos((x + seed) * 0.2) * 3}`;
        }
        paths.push(topBand1);
        paths.push(topBand2);
        // Bottom
        let botBand1 = `M ${inset} ${h - inset}`;
        let botBand2 = `M ${inset} ${h - inset}`;
        for (let x = inset; x <= w - inset; x += 1.5) {
          botBand1 += ` L ${x} ${h - inset + Math.sin((x + seed) * 0.25) * 3}`;
          botBand2 += ` L ${x} ${h - inset + Math.cos((x + seed) * 0.2) * 3}`;
        }
        paths.push(botBand1);
        paths.push(botBand2);
        // Left & Right
        let leftBand = `M ${inset} ${inset}`;
        let rightBand = `M ${w - inset} ${inset}`;
        for (let y = inset; y <= h - inset; y += 1.5) {
          leftBand += ` L ${inset + Math.sin((y + seed) * 0.25) * 3} ${y}`;
          rightBand += ` L ${w - inset + Math.sin((y + seed) * 0.25) * 3} ${y}`;
        }
        paths.push(leftBand);
        paths.push(rightBand);
        break;
      }
      case 'meander': {
        const ms = segLen * 0.7;
        for (let x = inset; x < w - inset - ms * 2; x += ms * 2) {
          paths.push(`M ${x} ${inset} L ${x} ${inset - ms} L ${x + ms} ${inset - ms} L ${x + ms} ${inset + ms} L ${x + ms * 2} ${inset + ms} L ${x + ms * 2} ${inset}`);
        }
        break;
      }
      case 'dot-dash': {
        for (let x = inset; x < w - inset; x += segLen) {
          // dash
          paths.push(`M ${x} ${inset} L ${x + segLen * 0.6} ${inset}`);
          paths.push(`M ${x} ${h - inset} L ${x + segLen * 0.6} ${h - inset}`);
          // dot
          const dx = x + segLen * 0.8;
          paths.push(`M ${dx - 1} ${inset} A 1 1 0 1 1 ${dx + 1} ${inset} A 1 1 0 1 1 ${dx - 1} ${inset}`);
        }
        break;
      }
      case 'star-chain': {
        const sr = segLen * 0.3;
        for (let x = inset + sr * 2; x < w - inset - sr * 2; x += segLen) {
          // 5-point star
          let starPath = '';
          for (let p = 0; p < 5; p++) {
            const angle = (p * 72 - 90) * Math.PI / 180;
            const px = x + Math.cos(angle) * sr;
            const py = inset + Math.sin(angle) * sr;
            starPath += (p === 0 ? 'M' : 'L') + ` ${px} ${py} `;
            const innerAngle = ((p * 72) + 36 - 90) * Math.PI / 180;
            const ipx = x + Math.cos(innerAngle) * sr * 0.4;
            const ipy = inset + Math.sin(innerAngle) * sr * 0.4;
            starPath += `L ${ipx} ${ipy} `;
          }
          starPath += 'Z';
          paths.push(starPath);
        }
        break;
      }
      case 'scroll': {
        for (let x = inset; x < w - inset - segLen; x += segLen * 1.5) {
          paths.push(`M ${x} ${inset} Q ${x + segLen / 3} ${inset - 5} ${x + segLen / 2} ${inset} Q ${x + segLen * 0.67} ${inset + 5} ${x + segLen} ${inset}`);
          paths.push(`M ${x} ${h - inset} Q ${x + segLen / 3} ${h - inset - 5} ${x + segLen / 2} ${h - inset} Q ${x + segLen * 0.67} ${h - inset + 5} ${x + segLen} ${h - inset}`);
        }
        break;
      }
      case 'arabesque-repeat': {
        for (let x = inset; x < w - inset; x += segLen) {
          const cx1 = x + segLen * 0.25;
          const cx2 = x + segLen * 0.75;
          paths.push(`M ${x} ${inset} C ${cx1} ${inset - 6} ${cx2} ${inset + 6} ${x + segLen} ${inset}`);
          paths.push(`M ${x} ${h - inset} C ${cx1} ${h - inset + 6} ${cx2} ${h - inset - 6} ${x + segLen} ${h - inset}`);
        }
        for (let y = inset; y < h - inset; y += segLen) {
          const cy1 = y + segLen * 0.25;
          const cy2 = y + segLen * 0.75;
          paths.push(`M ${inset} ${y} C ${inset - 6} ${cy1} ${inset + 6} ${cy2} ${inset} ${y + segLen}`);
          paths.push(`M ${w - inset} ${y} C ${w - inset + 6} ${cy1} ${w - inset - 6} ${cy2} ${w - inset} ${y + segLen}`);
        }
        break;
      }
      case 'rope': {
        let rope1 = `M ${inset} ${inset}`;
        let rope2 = `M ${inset} ${inset}`;
        for (let x = inset; x <= w - inset; x += 1) {
          rope1 += ` L ${x} ${inset + Math.sin(x * 0.5) * 2}`;
          rope2 += ` L ${x} ${inset + Math.cos(x * 0.5) * 2}`;
        }
        paths.push(rope1);
        paths.push(rope2);
        break;
      }
      default: {
        // triple-line, ornate-corner, bracket, leaf-vine, geometric-repeat, interlocking, cross-hatch-border
        // Add second line offset
        const gap2 = 3 + thickness;
        paths.push(`M ${inset + gap2} ${inset + gap2} L ${w - inset - gap2} ${inset + gap2} L ${w - inset - gap2} ${h - inset - gap2} L ${inset + gap2} ${h - inset - gap2} Z`);
        if (borderStyle === 'triple-line') {
          const gap3 = gap2 * 2;
          paths.push(`M ${inset + gap3} ${inset + gap3} L ${w - inset - gap3} ${inset + gap3} L ${w - inset - gap3} ${h - inset - gap3} L ${inset + gap3} ${h - inset - gap3} Z`);
        }
        break;
      }
    }

    // Corner decorations
    if (cornerDecoration) {
      const cs = 12 + thickness * 2;
      // Top-left
      paths.push(`M ${inset} ${inset + cs} Q ${inset} ${inset} ${inset + cs} ${inset}`);
      paths.push(`M ${inset + 2} ${inset + cs - 2} Q ${inset + 2} ${inset + 2} ${inset + cs - 2} ${inset + 2}`);
      // Top-right
      paths.push(`M ${w - inset - cs} ${inset} Q ${w - inset} ${inset} ${w - inset} ${inset + cs}`);
      // Bottom-left
      paths.push(`M ${inset} ${h - inset - cs} Q ${inset} ${h - inset} ${inset + cs} ${h - inset}`);
      // Bottom-right
      paths.push(`M ${w - inset - cs} ${h - inset} Q ${w - inset} ${h - inset} ${w - inset} ${h - inset - cs}`);
    }

    return paths;
  }, [width, height, m, sw, r, cornerStyle, doubleBorder, borderStyle, density, seed, thickness, cornerDecoration]);

  const paths = generateBorderPaths();

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="bg-white">
      <defs>
        <linearGradient id={`bgrad-${border.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color.primary} />
          <stop offset="50%" stopColor={color.secondary} />
          <stop offset="100%" stopColor={color.tertiary} />
        </linearGradient>
      </defs>
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke={`url(#bgrad-${border.id})`}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {showContent && (
        <g>
          <text x={width / 2} y={height * 0.35} textAnchor="middle" fontSize={width * 0.04} fill={color.primary} fontWeight="bold">شهادة رسمية</text>
          <text x={width / 2} y={height * 0.42} textAnchor="middle" fontSize={width * 0.025} fill="#999">نموذج معاينة البرواز</text>
          <line x1={width * 0.25} y1={height * 0.75} x2={width * 0.45} y2={height * 0.75} stroke={color.primary} strokeWidth={0.5} strokeDasharray="3,2" />
          <text x={width * 0.35} y={height * 0.78} textAnchor="middle" fontSize={width * 0.02} fill="#aaa">التوقيع</text>
        </g>
      )}
    </svg>
  );
};

// ─── Main Component ───
export default function GuillocheA4BorderDesigner() {
  const { organization } = useAuth();
  const { getPref, setPref } = useUserPreferences();
  const orgName = organization?.name || 'اسم الجهة';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [gridSize, setGridSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [visibleCount, setVisibleCount] = useState(60);
  const [selectedBorder, setSelectedBorder] = useState<BorderConfig | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [a4PreviewOpen, setA4PreviewOpen] = useState(false);
  const [activeBorder, setActiveBorder] = useState<BorderConfig | null>(null);

  // Customization
  const [customThickness, setCustomThickness] = useState(2);
  const [customColor, setCustomColor] = useState<string | null>(null);

  const allBorders = useMemo(() => generateBorders(), []);

  const filteredBorders = useMemo(() => {
    return allBorders.filter(b => {
      if (selectedCategory !== 'all' && b.category !== selectedCategory) return false;
      if (selectedColor !== 'all' && b.color.id !== selectedColor) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return b.name.includes(q) || b.categoryName.includes(q) || b.borderStyle.includes(q);
      }
      return true;
    });
  }, [allBorders, selectedCategory, selectedColor, searchQuery]);

  const visibleBorders = useMemo(() => filteredBorders.slice(0, visibleCount), [filteredBorders, visibleCount]);

  const handleSelect = (border: BorderConfig) => {
    setActiveBorder(border);
    // Save to preferences
    const existing: string[] = getPref('guilloche_saved_borders', []);
    const merged = [...new Set([border.id, ...existing])].slice(0, 50);
    setPref('guilloche_saved_borders', merged);
    toast.success(`تم اختيار "${border.name}" كبرواز للصفحة`);
  };

  const handlePreview = (border: BorderConfig) => {
    setSelectedBorder(border);
    setPreviewOpen(true);
  };

  const handlePrintA4 = () => {
    if (!activeBorder) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const svgEl = document.getElementById('a4-border-full-preview');
    if (!svgEl) return;

    printWindow.document.write(`
      <html dir="rtl">
      <head>
        <title>طباعة البرواز الغيلوشي A4 - ${orgName}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { size: A4; margin: 0; }
          body { display: flex; justify-content: center; font-family: 'Cairo', sans-serif; }
          .print-wrapper { width: 210mm; height: 297mm; position: relative; }
          .print-wrapper svg { width: 210mm; height: 297mm; }
          .org-wm { position: absolute; inset: 0; z-index: 2; pointer-events: none; }
        </style>
      </head>
      <body>
        <div class="print-wrapper">
          ${svgEl.outerHTML}
          <svg class="org-wm" viewBox="0 0 595 842" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="border-org-wm" patternUnits="userSpaceOnUse" width="200" height="100" patternTransform="rotate(-35)">
                <text x="5" y="55" font-size="12" font-weight="300" fill="${activeBorder.color.primary}" opacity="0.05" font-family="Cairo, sans-serif">${orgName}</text>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#border-org-wm)" />
          </svg>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  const gridCols = {
    small: 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10',
    medium: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8',
    large: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
  };

  const thumbSize = { small: { w: 80, h: 113 }, medium: { w: 120, h: 170 }, large: { w: 160, h: 226 } };

  return (
    <div className="space-y-6">
      {/* Active Border */}
      {activeBorder && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Frame className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">البرواز المحدد: {activeBorder.name}</h3>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setA4PreviewOpen(true)} className="gap-1">
                  <Maximize className="h-4 w-4" />
                  معاينة A4
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { setActiveBorder(null); toast.info('تم إلغاء البرواز'); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="border rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                <GuillocheA4Border border={activeBorder} width={140} height={198} showContent />
              </div>
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">التصنيف:</span> {activeBorder.categoryName}</div>
                  <div><span className="text-muted-foreground">النمط:</span> {activeBorder.borderStyle}</div>
                  <div><span className="text-muted-foreground">اللون:</span> {activeBorder.color.name}</div>
                  <div><span className="text-muted-foreground">السمك:</span> {activeBorder.thickness}</div>
                  <div><span className="text-muted-foreground">الزوايا:</span> {activeBorder.cornerStyle === 'rounded' ? 'مستديرة' : activeBorder.cornerStyle === 'ornate' ? 'مزخرفة' : activeBorder.cornerStyle === 'chamfered' ? 'مشطوفة' : 'حادة'}</div>
                  <div><span className="text-muted-foreground">برواز مزدوج:</span> {activeBorder.doubleBorder ? '✓' : '✗'}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="ابحث في البراويز..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-10" />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-44"><SelectValue placeholder="التصنيف" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل التصنيفات</SelectItem>
                {BORDER_CATEGORIES.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.icon} {c.name} ({c.count})</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedColor} onValueChange={setSelectedColor}>
              <SelectTrigger className="w-40"><SelectValue placeholder="اللون" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الألوان</SelectItem>
                {BORDER_COLORS.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ background: `linear-gradient(135deg, ${c.primary}, ${c.secondary})` }} />
                      {c.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1 border rounded-lg p-1">
              {(['small', 'medium', 'large'] as const).map(s => (
                <Button key={s} variant={gridSize === s ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setGridSize(s)}>
                  {s === 'small' ? <Grid3X3 className="h-4 w-4" /> : s === 'medium' ? <LayoutGrid className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                </Button>
              ))}
            </div>

            <Badge variant="outline" className="gap-1"><Filter className="h-3 w-3" />{filteredBorders.length} برواز</Badge>

            {(selectedCategory !== 'all' || selectedColor !== 'all' || searchQuery) && (
              <Button variant="ghost" size="sm" onClick={() => { setSelectedCategory('all'); setSelectedColor('all'); setSearchQuery(''); }} className="gap-1">
                <X className="h-4 w-4" />مسح الفلاتر
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      <div className={cn('grid gap-3', gridCols[gridSize])}>
        <AnimatePresence mode="popLayout">
          {visibleBorders.map((border, idx) => (
            <motion.div
              key={border.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: Math.min(idx * 0.015, 0.4) }}
            >
              <Card
                className={cn(
                  'cursor-pointer transition-all hover:shadow-lg hover:scale-105 group overflow-hidden',
                  activeBorder?.id === border.id && 'ring-2 ring-primary'
                )}
                onClick={() => handlePreview(border)}
              >
                <CardContent className="p-2 relative flex flex-col items-center">
                  <GuillocheA4Border border={border} width={thumbSize[gridSize].w} height={thumbSize[gridSize].h} />

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary" onClick={e => { e.stopPropagation(); handlePreview(border); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant={activeBorder?.id === border.id ? 'destructive' : 'default'} onClick={e => { e.stopPropagation(); handleSelect(border); }}>
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>

                  {activeBorder?.id === border.id && (
                    <div className="absolute top-1 left-1">
                      <Badge className="gap-1 bg-primary"><Star className="h-3 w-3" />مُفعَّل</Badge>
                    </div>
                  )}

                  <p className="text-xs font-medium mt-1.5 truncate w-full text-center">{border.name}</p>
                  <p className="text-[10px] text-muted-foreground">{border.categoryName}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Load More */}
      {visibleCount < filteredBorders.length && (
        <div className="flex justify-center">
          <Button variant="outline" size="lg" onClick={() => setVisibleCount(prev => Math.min(prev + 60, filteredBorders.length))} className="gap-2">
            تحميل المزيد ({filteredBorders.length - visibleCount} متبقي)
          </Button>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Frame className="h-5 w-5 text-primary" />
              معاينة البرواز: {selectedBorder?.name}
            </DialogTitle>
            <DialogDescription>
              معاينة كيف سيظهر هذا البرواز على صفحة A4
            </DialogDescription>
          </DialogHeader>

          {selectedBorder && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="shadow-xl rounded-lg overflow-hidden">
                  <GuillocheA4Border border={selectedBorder} width={400} height={566} showContent />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="font-medium">معلومات البرواز:</p>
                  <p className="text-muted-foreground">التصنيف: {selectedBorder.categoryName}</p>
                  <p className="text-muted-foreground">النمط: {selectedBorder.borderStyle}</p>
                  <p className="text-muted-foreground">الزوايا: {selectedBorder.cornerStyle}</p>
                  <p className="text-muted-foreground">التناظر: {selectedBorder.symmetry}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">لوحة الألوان:</p>
                  <div className="flex gap-2 items-center">
                    {[selectedBorder.color.primary, selectedBorder.color.secondary, selectedBorder.color.tertiary].map((c, i) => (
                      <div key={i} className="w-8 h-8 rounded-lg shadow-sm" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <p className="text-muted-foreground">{selectedBorder.color.name}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>إغلاق</Button>
            <Button onClick={() => { if (selectedBorder) { handleSelect(selectedBorder); setPreviewOpen(false); } }} className="gap-2">
              <Check className="h-4 w-4" />
              اختيار هذا البرواز
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full A4 Preview Dialog */}
      <Dialog open={a4PreviewOpen} onOpenChange={setA4PreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Maximize className="h-5 w-5 text-primary" />
              معاينة البرواز على صفحة A4 كاملة
            </DialogTitle>
          </DialogHeader>

          {activeBorder && (
            <div className="flex justify-center">
              <div className="shadow-2xl rounded-lg overflow-hidden border relative">
                <div id="a4-border-full-preview">
                  <GuillocheA4Border border={activeBorder} width={595} height={842} showContent />
                </div>
                {/* Org name watermark overlay */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 595 842" preserveAspectRatio="xMidYMid slice">
                  <defs>
                    <pattern id="border-preview-wm" patternUnits="userSpaceOnUse" width="200" height="100" patternTransform="rotate(-35)">
                      <text x="5" y="55" fontSize="12" fontWeight="300" fill={activeBorder.color.primary} opacity="0.05" fontFamily="Cairo, sans-serif">{orgName}</text>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#border-preview-wm)" />
                </svg>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setA4PreviewOpen(false)}>إغلاق</Button>
            <Button onClick={handlePrintA4} className="gap-2">
              <Printer className="h-4 w-4" />
              طباعة A4
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
