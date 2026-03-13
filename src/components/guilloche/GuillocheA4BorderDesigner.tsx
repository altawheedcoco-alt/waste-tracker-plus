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
      innerMargin: 0,
      doubleBorder: i % 3 === 0,
      cornerDecoration: i % 2 === 0,
      density: 4 + (i % 8),
      symmetry: sym,
      seed: i * 13 + 7,
    });
  }
  return borders;
};

// ─── Interwoven Guilloche SVG Border Renderer ───
const GuillocheA4Border = ({ border, width = 200, height = 283, showContent = false }: {
  border: BorderConfig; width?: number; height?: number; showContent?: boolean;
}) => {
  const { color, thickness, cornerStyle, innerMargin, doubleBorder, cornerDecoration, borderStyle, density, seed } = border;
  const scale = width / 595;
  const m = innerMargin * scale;
  const sw = Math.max(0.3, thickness * 0.35 * scale);
  const bandWidth = (8 + thickness * 3) * scale;
  const numWaves = 3 + density; // number of interwoven sine waves
  const step = Math.max(0.8, 2 / scale); // point resolution

  // Generate complex interwoven guilloche band along a rectangular path
  const generateInterwovenPaths = useCallback(() => {
    const paths: { d: string; color: string; opacity: number }[] = [];
    const w = width;
    const h = height;
    const inset = m;
    const bw = bandWidth;

    // Helper: generate a point on the rectangular border path given parameter t (0..1)
    // t maps to perimeter: top(0-w) -> right(w-w+h) -> bottom(w+h-2w+h) -> left(2w+h-2w+2h)
    const perimeter = 2 * (w - 2 * inset) + 2 * (h - 2 * inset);
    const topLen = w - 2 * inset;
    const rightLen = h - 2 * inset;
    const bottomLen = topLen;

    const getPointOnRect = (t: number): { x: number; y: number; nx: number; ny: number } => {
      const dist = ((t % 1) + 1) % 1 * perimeter;
      if (dist <= topLen) {
        // Top edge, left to right
        return { x: inset + dist, y: inset, nx: 0, ny: -1 };
      } else if (dist <= topLen + rightLen) {
        // Right edge, top to bottom
        const d = dist - topLen;
        return { x: w - inset, y: inset + d, nx: 1, ny: 0 };
      } else if (dist <= topLen + rightLen + bottomLen) {
        // Bottom edge, right to left
        const d = dist - topLen - rightLen;
        return { x: w - inset - d, y: h - inset, nx: 0, ny: 1 };
      } else {
        // Left edge, bottom to top
        const d = dist - topLen - rightLen - bottomLen;
        return { x: inset, y: h - inset - d, nx: -1, ny: 0 };
      }
    };

    // Generate multiple frequency-shifted sinusoidal waves that weave over/under each other
    const totalPoints = Math.floor(perimeter / step);
    const seedMul = (seed % 100) * 0.01 + 0.5;

    for (let wave = 0; wave < numWaves; wave++) {
      const freq1 = (0.03 + wave * 0.007 + seed * 0.0001) * (2 + density * 0.3);
      const freq2 = freq1 * (1.3 + wave * 0.15 * seedMul);
      const freq3 = freq1 * (0.7 + wave * 0.11);
      const amp1 = bw * (0.35 + (wave % 3) * 0.12);
      const amp2 = bw * (0.25 + ((wave + 1) % 3) * 0.1);
      const phase = (wave * Math.PI * 2) / numWaves + seed * 0.1;

      let pathD = '';
      for (let i = 0; i <= totalPoints; i++) {
        const t = i / totalPoints;
        const dist = t * perimeter;
        const pt = getPointOnRect(t);
        // Combine multiple sin waves for complex pattern
        const offset = Math.sin(dist * freq1 + phase) * amp1
                     + Math.sin(dist * freq2 + phase * 1.7) * amp2 * 0.6
                     + Math.sin(dist * freq3 + phase * 2.3) * amp1 * 0.3;
        const x = pt.x + pt.nx * offset;
        const y = pt.y + pt.ny * offset;
        pathD += (i === 0 ? 'M' : 'L') + ` ${x.toFixed(2)} ${y.toFixed(2)}`;
      }

      // Main wave
      paths.push({ d: pathD, color: color.primary, opacity: 0.7 + (wave % 2) * 0.15 });

      // Secondary interleaved wave (phase shifted)
      if (wave < numWaves - 1) {
        let pathD2 = '';
        const phase2 = phase + Math.PI / numWaves;
        for (let i = 0; i <= totalPoints; i++) {
          const t = i / totalPoints;
          const dist = t * perimeter;
          const pt = getPointOnRect(t);
          const offset = Math.sin(dist * freq1 + phase2) * amp1 * 0.8
                       + Math.cos(dist * freq2 + phase2 * 1.4) * amp2 * 0.5
                       + Math.sin(dist * freq3 * 1.2 + phase2 * 0.8) * amp1 * 0.25;
          const x = pt.x + pt.nx * offset;
          const y = pt.y + pt.ny * offset;
          pathD2 += (i === 0 ? 'M' : 'L') + ` ${x.toFixed(2)} ${y.toFixed(2)}`;
        }
        paths.push({ d: pathD2, color: color.secondary, opacity: 0.5 + (wave % 3) * 0.1 });
      }
    }

    // Inner boundary guilloche ring (double border creates second interwoven band)
    if (doubleBorder) {
      const innerInset = inset + bw + 2 * scale;
      const innerPerimeter = 2 * (w - 2 * innerInset) + 2 * (h - 2 * innerInset);
      const innerTopLen = w - 2 * innerInset;
      const innerRightLen = h - 2 * innerInset;
      const innerBottomLen = innerTopLen;

      const getInnerPoint = (t: number) => {
        const dist = ((t % 1) + 1) % 1 * innerPerimeter;
        if (dist <= innerTopLen) return { x: innerInset + dist, y: innerInset, nx: 0, ny: -1 };
        else if (dist <= innerTopLen + innerRightLen) return { x: w - innerInset, y: innerInset + dist - innerTopLen, nx: 1, ny: 0 };
        else if (dist <= innerTopLen + innerRightLen + innerBottomLen) return { x: w - innerInset - (dist - innerTopLen - innerRightLen), y: h - innerInset, nx: 0, ny: 1 };
        else return { x: innerInset, y: h - innerInset - (dist - innerTopLen - innerRightLen - innerBottomLen), nx: -1, ny: 0 };
      };

      const innerTotal = Math.floor(innerPerimeter / step);
      for (let wave = 0; wave < Math.min(numWaves, 5); wave++) {
        const freq = (0.04 + wave * 0.009) * (2 + density * 0.2);
        const amp = bw * 0.3 * (0.6 + wave * 0.1);
        const ph = wave * Math.PI / 3 + seed * 0.07;
        let d = '';
        for (let i = 0; i <= innerTotal; i++) {
          const t = i / innerTotal;
          const dist = t * innerPerimeter;
          const pt = getInnerPoint(t);
          const off = Math.sin(dist * freq + ph) * amp + Math.cos(dist * freq * 1.5 + ph * 2) * amp * 0.4;
          d += (i === 0 ? 'M' : 'L') + ` ${(pt.x + pt.nx * off).toFixed(2)} ${(pt.y + pt.ny * off).toFixed(2)}`;
        }
        paths.push({ d, color: color.tertiary, opacity: 0.45 + wave * 0.08 });
      }
    }

    // Corner rosettes: complex guilloche spirals at corners
    if (cornerDecoration) {
      const corners = [
        { cx: inset, cy: inset },
        { cx: w - inset, cy: inset },
        { cx: w - inset, cy: h - inset },
        { cx: inset, cy: h - inset },
      ];
      const roseSize = bw * 1.2;
      corners.forEach((corner, ci) => {
        for (let ring = 0; ring < 3; ring++) {
          let d = '';
          const pts = 60;
          for (let i = 0; i <= pts; i++) {
            const angle = (i / pts) * Math.PI / 2 + ci * Math.PI / 2;
            const r = roseSize * (0.3 + ring * 0.25) + Math.sin(angle * (4 + ring * 2) + seed) * roseSize * 0.15;
            const x = corner.cx + Math.cos(angle) * r * (ci === 0 || ci === 3 ? 1 : -1) * (ci < 2 ? 1 : 1);
            const y = corner.cy + Math.sin(angle) * r;
            // Proper quadrant direction
            const qx = corner.cx + Math.cos(angle) * r;
            const qy = corner.cy + Math.sin(angle) * r;
            d += (i === 0 ? 'M' : 'L') + ` ${qx.toFixed(2)} ${qy.toFixed(2)}`;
          }
          paths.push({ d, color: [color.primary, color.secondary, color.tertiary][ring], opacity: 0.6 });
        }
      });
    }

    // Micropattern fill between bands (cross-hatching with sine modulation)
    const microStep = step * 4;
    const microAmp = bw * 0.15;
    for (let i = 0; i < Math.floor(perimeter / microStep); i++) {
      const t1 = (i * microStep) / perimeter;
      const t2 = ((i + 0.5) * microStep) / perimeter;
      const p1 = getPointOnRect(t1);
      const p2 = getPointOnRect(t2);
      const off1 = bw * 0.5 * Math.sin(i * 1.7 + seed);
      const off2 = bw * 0.5 * Math.cos(i * 1.3 + seed);
      const x1 = p1.x + p1.nx * off1;
      const y1 = p1.y + p1.ny * off1;
      const x2 = p2.x + p2.nx * off2;
      const y2 = p2.y + p2.ny * off2;
      paths.push({
        d: `M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)}`,
        color: color.tertiary,
        opacity: 0.15,
      });
    }

    return paths;
  }, [width, height, m, bandWidth, numWaves, step, cornerStyle, doubleBorder, borderStyle, density, seed, thickness, cornerDecoration, color, scale]);

  const paths = generateInterwovenPaths();
  const uid = `gb-${border.id}-${width}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="bg-white">
      <defs>
        <linearGradient id={`bgrad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color.primary} />
          <stop offset="50%" stopColor={color.secondary} />
          <stop offset="100%" stopColor={color.tertiary} />
        </linearGradient>
        <linearGradient id={`bgrad2-${uid}`} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color.secondary} />
          <stop offset="100%" stopColor={color.tertiary} />
        </linearGradient>
      </defs>
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill="none"
          stroke={p.color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={p.opacity}
        />
      ))}
      {showContent && (
        <g>
          <text x={width / 2} y={height * 0.35} textAnchor="middle" fontSize={width * 0.04} fill={color.primary} fontWeight="bold" fontFamily="Cairo, sans-serif">شهادة رسمية</text>
          <text x={width / 2} y={height * 0.42} textAnchor="middle" fontSize={width * 0.025} fill="#999" fontFamily="Cairo, sans-serif">نموذج معاينة البرواز</text>
          <line x1={width * 0.25} y1={height * 0.75} x2={width * 0.45} y2={height * 0.75} stroke={color.primary} strokeWidth={0.5} strokeDasharray="3,2" />
          <text x={width * 0.35} y={height * 0.78} textAnchor="middle" fontSize={width * 0.02} fill="#aaa" fontFamily="Cairo, sans-serif">التوقيع</text>
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
          .print-wrapper > svg { width: 210mm; height: 297mm; }
        </style>
      </head>
      <body>
        <div class="print-wrapper">
          ${svgEl.outerHTML}
          ${generateSecurityOverlayHTML(orgName, activeBorder.color.primary)}
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
                {/* Security Overlay */}
                <GuillocheSecurityOverlay orgName={orgName} color={activeBorder.color.primary} />
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
