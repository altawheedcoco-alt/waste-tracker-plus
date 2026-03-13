import { useState, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import BackButton from '@/components/ui/back-button';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserPreferences } from '@/hooks/useUserPreferences';

const GuillocheA4BorderDesigner = lazy(() => import('@/components/guilloche/GuillocheA4BorderDesigner'));
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Fingerprint,
  Search,
  Check,
  Eye,
  Download,
  Palette,
  Grid3X3,
  LayoutGrid,
  Sparkles,
  Star,
  Loader2,
  Filter,
  X,
  Layers,
  Plus,
  Minus,
  Trash2,
  FileText,
  Printer,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import GuillocheSecurityOverlay, { generateSecurityOverlayHTML } from '@/components/guilloche/GuillocheSecurityOverlay';

// Pattern categories
const PATTERN_CATEGORIES = [
  { id: 'geometric', name: 'هندسي', count: 200 },
  { id: 'floral', name: 'زهري', count: 150 },
  { id: 'waves', name: 'موجي', count: 150 },
  { id: 'circular', name: 'دائري', count: 150 },
  { id: 'linear', name: 'خطي', count: 150 },
  { id: 'classic', name: 'كلاسيكي', count: 100 },
  { id: 'modern', name: 'عصري', count: 100 },
];

// Color palettes
const COLOR_PALETTES = [
  { id: 'green', name: 'أخضر بيئي', primary: '#059669', secondary: '#34d399', bg: '#ecfdf5' },
  { id: 'blue', name: 'أزرق مائي', primary: '#0284c7', secondary: '#38bdf8', bg: '#f0f9ff' },
  { id: 'purple', name: 'بنفسجي ملكي', primary: '#7c3aed', secondary: '#a78bfa', bg: '#f5f3ff' },
  { id: 'gold', name: 'ذهبي فاخر', primary: '#b45309', secondary: '#fbbf24', bg: '#fffbeb' },
  { id: 'red', name: 'أحمر رسمي', primary: '#dc2626', secondary: '#f87171', bg: '#fef2f2' },
  { id: 'teal', name: 'أخضر مائي', primary: '#0d9488', secondary: '#2dd4bf', bg: '#f0fdfa' },
  { id: 'slate', name: 'رمادي احترافي', primary: '#475569', secondary: '#94a3b8', bg: '#f8fafc' },
  { id: 'emerald', name: 'زمردي', primary: '#047857', secondary: '#6ee7b7', bg: '#ecfdf5' },
];

// Generate unique pattern configurations
const generatePatterns = () => {
  const patterns: PatternConfig[] = [];
  let id = 1;

  const patternTypes = [
    'concentric-circles',
    'radial-lines',
    'wave-horizontal',
    'wave-vertical',
    'diamond-grid',
    'hexagon-grid',
    'spiral',
    'crosshatch',
    'chevron',
    'scales',
    'lattice',
    'starburst',
    'rosette',
    'guilloche-classic',
    'guilloche-wave',
    'meander',
    'interlocking-circles',
    'arabesque',
    'celtic-knot',
    'mandala',
  ];

  const complexities = ['simple', 'medium', 'complex', 'intricate', 'elaborate'];
  const densities = ['sparse', 'normal', 'dense', 'very-dense'];

  for (let i = 0; i < 1000; i++) {
    const categoryIndex = i % PATTERN_CATEGORIES.length;
    const category = PATTERN_CATEGORIES[categoryIndex];
    const patternType = patternTypes[i % patternTypes.length];
    const colorPalette = COLOR_PALETTES[i % COLOR_PALETTES.length];
    const complexity = complexities[Math.floor(i / 200) % complexities.length];
    const density = densities[Math.floor(i / 250) % densities.length];

    patterns.push({
      id: `pattern-${id}`,
      name: `نمط ${id}`,
      category: category.id,
      categoryName: category.name,
      patternType,
      colorPalette,
      complexity,
      density,
      rotation: (i * 7) % 360,
      scale: 0.5 + (i % 10) * 0.1,
      opacity: 0.05 + (i % 5) * 0.02,
      strokeWidth: 0.5 + (i % 4) * 0.25,
      seed: i * 17,
    });
    id++;
  }

  return patterns;
};

interface PatternConfig {
  id: string;
  name: string;
  category: string;
  categoryName: string;
  patternType: string;
  colorPalette: typeof COLOR_PALETTES[0];
  complexity: string;
  density: string;
  rotation: number;
  scale: number;
  opacity: number;
  strokeWidth: number;
  seed: number;
}

// SVG Pattern Generator Component
const GuillochePatternSVG = ({ pattern, size = 200 }: { pattern: PatternConfig; size?: number }) => {
  const { colorPalette, patternType, rotation, scale, opacity, strokeWidth, seed } = pattern;

  const generatePath = useCallback(() => {
    const paths: string[] = [];
    const centerX = size / 2;
    const centerY = size / 2;

    switch (patternType) {
      case 'concentric-circles':
        for (let i = 1; i <= 8; i++) {
          const r = (size / 2) * (i / 8) * scale;
          paths.push(`M ${centerX - r} ${centerY} A ${r} ${r} 0 1 1 ${centerX + r} ${centerY} A ${r} ${r} 0 1 1 ${centerX - r} ${centerY}`);
        }
        break;

      case 'radial-lines':
        for (let i = 0; i < 24; i++) {
          const angle = (i * 15 * Math.PI) / 180;
          const x1 = centerX + Math.cos(angle) * 10;
          const y1 = centerY + Math.sin(angle) * 10;
          const x2 = centerX + Math.cos(angle) * (size / 2 - 10);
          const y2 = centerY + Math.sin(angle) * (size / 2 - 10);
          paths.push(`M ${x1} ${y1} L ${x2} ${y2}`);
        }
        break;

      case 'wave-horizontal':
        for (let row = 0; row < 10; row++) {
          let d = `M 0 ${(row + 1) * (size / 11)}`;
          for (let x = 0; x <= size; x += 10) {
            const y = (row + 1) * (size / 11) + Math.sin((x / 20 + seed) * scale) * 8;
            d += ` L ${x} ${y}`;
          }
          paths.push(d);
        }
        break;

      case 'wave-vertical':
        for (let col = 0; col < 10; col++) {
          let d = `M ${(col + 1) * (size / 11)} 0`;
          for (let y = 0; y <= size; y += 10) {
            const x = (col + 1) * (size / 11) + Math.sin((y / 20 + seed) * scale) * 8;
            d += ` L ${x} ${y}`;
          }
          paths.push(d);
        }
        break;

      case 'diamond-grid':
        for (let i = 0; i < 12; i++) {
          const offset = i * (size / 12);
          paths.push(`M 0 ${offset} L ${size} ${offset}`);
          paths.push(`M ${offset} 0 L ${offset} ${size}`);
          paths.push(`M 0 ${offset} L ${offset} 0`);
          paths.push(`M ${size - offset} 0 L ${size} ${offset}`);
        }
        break;

      case 'spiral':
        let spiralPath = `M ${centerX} ${centerY}`;
        for (let t = 0; t < 10 * Math.PI; t += 0.1) {
          const r = t * 3 * scale;
          const x = centerX + r * Math.cos(t + seed);
          const y = centerY + r * Math.sin(t + seed);
          spiralPath += ` L ${x} ${y}`;
        }
        paths.push(spiralPath);
        break;

      case 'crosshatch':
        for (let i = 0; i < 15; i++) {
          const offset = i * (size / 15);
          paths.push(`M 0 ${offset} L ${size} ${offset}`);
          paths.push(`M ${offset} 0 L ${offset} ${size}`);
          paths.push(`M 0 ${offset} L ${offset} 0`);
          paths.push(`M ${offset} ${size} L ${size} ${offset}`);
        }
        break;

      case 'chevron':
        for (let row = 0; row < 8; row++) {
          const y = row * (size / 8);
          let d = '';
          for (let x = 0; x < size; x += 20) {
            d += `M ${x} ${y + 10} L ${x + 10} ${y} L ${x + 20} ${y + 10} `;
          }
          paths.push(d);
        }
        break;

      case 'guilloche-classic':
        for (let i = 0; i < 6; i++) {
          let d = `M 0 ${centerY}`;
          for (let x = 0; x <= size; x += 2) {
            const y = centerY + Math.sin(x / 10 + i) * (10 + i * 5) * scale;
            d += ` L ${x} ${y}`;
          }
          paths.push(d);
        }
        break;

      case 'guilloche-wave':
        for (let i = 0; i < 8; i++) {
          let d = `M 0 ${centerY}`;
          for (let x = 0; x <= size; x += 2) {
            const y = centerY + Math.sin(x / 15 + i * 0.5 + seed) * 15 + 
                     Math.cos(x / 8 + i) * 10 * scale;
            d += ` L ${x} ${y}`;
          }
          paths.push(d);
        }
        break;

      case 'rosette':
        for (let layer = 0; layer < 5; layer++) {
          const r = (size / 2 - 20) * ((layer + 1) / 5);
          for (let i = 0; i < 12; i++) {
            const angle1 = (i * 30 * Math.PI) / 180;
            const angle2 = ((i + 1) * 30 * Math.PI) / 180;
            const x1 = centerX + r * Math.cos(angle1);
            const y1 = centerY + r * Math.sin(angle1);
            const x2 = centerX + r * Math.cos(angle2);
            const y2 = centerY + r * Math.sin(angle2);
            const cx = centerX + r * 1.1 * Math.cos((angle1 + angle2) / 2);
            const cy = centerY + r * 1.1 * Math.sin((angle1 + angle2) / 2);
            paths.push(`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`);
          }
        }
        break;

      case 'starburst':
        for (let i = 0; i < 36; i++) {
          const angle = (i * 10 * Math.PI) / 180;
          const length = i % 2 === 0 ? size / 2 - 10 : size / 3;
          const x = centerX + Math.cos(angle) * length;
          const y = centerY + Math.sin(angle) * length;
          paths.push(`M ${centerX} ${centerY} L ${x} ${y}`);
        }
        break;

      case 'mandala':
        for (let ring = 1; ring <= 5; ring++) {
          const r = (size / 2 - 10) * (ring / 5);
          paths.push(`M ${centerX - r} ${centerY} A ${r} ${r} 0 1 1 ${centerX + r} ${centerY} A ${r} ${r} 0 1 1 ${centerX - r} ${centerY}`);
          for (let i = 0; i < 8 * ring; i++) {
            const angle = (i * (360 / (8 * ring)) * Math.PI) / 180;
            const x = centerX + r * Math.cos(angle);
            const y = centerY + r * Math.sin(angle);
            paths.push(`M ${centerX} ${centerY} L ${x} ${y}`);
          }
        }
        break;

      default:
        // Default geometric pattern
        for (let i = 1; i <= 6; i++) {
          const r = (size / 2) * (i / 6) * scale;
          paths.push(`M ${centerX - r} ${centerY} A ${r} ${r} 0 1 1 ${centerX + r} ${centerY} A ${r} ${r} 0 1 1 ${centerX - r} ${centerY}`);
        }
    }

    return paths;
  }, [patternType, size, scale, seed]);

  const paths = generatePath();

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="bg-white rounded-lg shadow-sm"
      style={{ backgroundColor: colorPalette.bg }}
    >
      <defs>
        <linearGradient id={`grad-${pattern.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colorPalette.primary} />
          <stop offset="100%" stopColor={colorPalette.secondary} />
        </linearGradient>
      </defs>
      <g transform={`rotate(${rotation} ${size / 2} ${size / 2})`} opacity={opacity * 10}>
        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={`url(#grad-${pattern.id})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </g>
    </svg>
  );
};

export default function GuillochePatterns() {
  const { roles, organization } = useAuth();
  const { getPref, setPref } = useUserPreferences();
  const isAdmin = roles.includes('admin');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [selectedPattern, setSelectedPattern] = useState<PatternConfig | null>(null);
  const [activePatterns, setActivePatterns] = useState<PatternConfig[]>([]);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [documentPreviewOpen, setDocumentPreviewOpen] = useState(false);
  const [gridSize, setGridSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [isApplying, setIsApplying] = useState(false);
  const [visibleCount, setVisibleCount] = useState(50);
  const [layerMode, setLayerMode] = useState(false);

  // Org name for watermark
  const orgName = organization?.name || 'اسم الجهة';

  // Saved/used patterns from preferences
  const savedPatternIds: string[] = getPref('guilloche_saved_patterns', []);

  const savePatternToHistory = useCallback((patternIds: string[]) => {
    const existing: string[] = getPref('guilloche_saved_patterns', []);
    const merged = [...new Set([...patternIds, ...existing])].slice(0, 50); // keep last 50
    setPref('guilloche_saved_patterns', merged);
  }, [getPref, setPref]);

  // Max layers allowed
  const MAX_LAYERS = 5;

  // Generate all patterns
  const allPatterns = useMemo(() => generatePatterns(), []);

  // Filter patterns
  const filteredPatterns = useMemo(() => {
    return allPatterns.filter(pattern => {
      if (selectedCategory !== 'all' && pattern.category !== selectedCategory) return false;
      if (selectedColor !== 'all' && pattern.colorPalette.id !== selectedColor) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return pattern.name.includes(query) || 
               pattern.categoryName.includes(query) ||
               pattern.patternType.includes(query);
      }
      return true;
    });
  }, [allPatterns, selectedCategory, selectedColor, searchQuery]);

  // Visible patterns (virtualized)
  const visiblePatterns = useMemo(() => {
    return filteredPatterns.slice(0, visibleCount);
  }, [filteredPatterns, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 50, filteredPatterns.length));
  };

  const handleApplyPattern = async (pattern: PatternConfig) => {
    setIsApplying(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      if (layerMode) {
        if (!activePatterns.find(p => p.id === pattern.id)) {
          if (activePatterns.length >= MAX_LAYERS) {
            toast.error(`الحد الأقصى للطبقات هو ${MAX_LAYERS}`);
            return;
          }
          const newPatterns = [...activePatterns, pattern];
          setActivePatterns(newPatterns);
          savePatternToHistory(newPatterns.map(p => p.id));
          toast.success(`تمت إضافة "${pattern.name}" كطبقة (${activePatterns.length + 1}/${MAX_LAYERS})`);
        } else {
          setActivePatterns(prev => prev.filter(p => p.id !== pattern.id));
          toast.info(`تمت إزالة "${pattern.name}" من الطبقات`);
        }
      } else {
        setActivePatterns([pattern]);
        savePatternToHistory([pattern.id]);
        toast.success(`تم تحديد "${pattern.name}" كخلفية للمستندات`);
      }
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveLayer = (patternId: string) => {
    setActivePatterns(prev => prev.filter(p => p.id !== patternId));
    toast.info('تمت إزالة الطبقة');
  };

  const handleClearAllLayers = () => {
    setActivePatterns([]);
    toast.success('تم إلغاء جميع الطبقات - ستتم طباعة المستندات بدون خلفية');
  };

  const isPatternActive = (patternId: string) => {
    return activePatterns.some(p => p.id === patternId);
  };

  const handlePreview = (pattern: PatternConfig) => {
    setSelectedPattern(pattern);
    setPreviewDialogOpen(true);
  };

  const gridCols = {
    small: 'grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10',
    medium: 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8',
    large: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  };

  const patternSize = {
    small: 100,
    medium: 150,
    large: 200,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BackButton />
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Fingerprint className="h-7 w-7 text-primary" />
              قوالب الرسم الغيوشي للمستندات
            </h1>
            <p className="text-muted-foreground mt-1">
              اختر نمطاً من 1000 قالب خلفية أو 1000 برواز صفحة A4
            </p>
          </div>
        </div>

        <Tabs defaultValue="patterns" dir="rtl">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="patterns" className="gap-1 text-xs">
              <Fingerprint className="h-3.5 w-3.5" />
              أنماط الخلفية
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-1 text-xs">
              <Star className="h-3.5 w-3.5" />
              المحفوظة ({savedPatternIds.length})
            </TabsTrigger>
            <TabsTrigger value="borders" className="gap-1 text-xs">
              <FileText className="h-3.5 w-3.5" />
              براويز الصفحة
            </TabsTrigger>
          </TabsList>

          <TabsContent value="patterns" className="space-y-6 mt-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Layer Mode Toggle */}
            <Button
              variant={layerMode ? "default" : "outline"}
              onClick={() => setLayerMode(!layerMode)}
              className="gap-2"
            >
              <Layers className="h-4 w-4" />
              {layerMode ? 'وضع التداخل مُفعَّل' : 'تفعيل التداخل'}
            </Button>

            {/* Default (No Pattern) Button */}
            <Button
              variant={activePatterns.length === 0 ? "default" : "outline"}
              onClick={handleClearAllLayers}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              الافتراضي (بدون رسم)
              {activePatterns.length === 0 && <Check className="h-4 w-4 mr-1" />}
            </Button>
          </div>

        {/* Active Patterns / Layers Display */}
        {activePatterns.length > 0 && (
          <Card className="border-primary bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">
                    {layerMode ? `الطبقات المحددة (${activePatterns.length}/${MAX_LAYERS})` : 'النمط المحدد'}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setDocumentPreviewOpen(true)} 
                    className="gap-1"
                  >
                    <FileText className="h-4 w-4" />
                    معاينة على مستند
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleClearAllLayers} className="gap-1 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                    مسح الكل
                  </Button>
                </div>
              </div>

              {/* Layered Preview */}
              <div className="flex gap-4 items-start">
                {/* Combined Preview */}
                <div 
                  className="relative w-32 h-32 rounded-lg border overflow-hidden flex-shrink-0"
                  style={{ backgroundColor: activePatterns[0]?.colorPalette.bg || '#fff' }}
                >
                  {activePatterns.map((pattern, idx) => (
                    <div 
                      key={pattern.id} 
                      className="absolute inset-0"
                      style={{ opacity: 0.3 - (idx * 0.05) }}
                    >
                      <GuillochePatternSVG pattern={pattern} size={128} />
                    </div>
                  ))}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                    <span className="text-xs font-bold text-white drop-shadow">معاينة</span>
                  </div>
                </div>

                {/* Layer List */}
                <div className="flex-1 space-y-2">
                  {activePatterns.map((pattern, idx) => (
                    <div 
                      key={pattern.id} 
                      className="flex items-center gap-2 p-2 bg-background rounded-lg border"
                    >
                      <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                        {idx + 1}
                      </Badge>
                      <GuillochePatternSVG pattern={pattern} size={40} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{pattern.name}</p>
                        <p className="text-xs text-muted-foreground">{pattern.categoryName}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveLayer(pattern.id)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث في القوالب..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل التصنيفات</SelectItem>
                  {PATTERN_CATEGORIES.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name} ({cat.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Color Filter */}
              <Select value={selectedColor} onValueChange={setSelectedColor}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="اللون" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الألوان</SelectItem>
                  {COLOR_PALETTES.map(palette => (
                    <SelectItem key={palette.id} value={palette.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})` }}
                        />
                        {palette.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Grid Size */}
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button
                  variant={gridSize === 'small' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setGridSize('small')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={gridSize === 'medium' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setGridSize('medium')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={gridSize === 'large' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setGridSize('large')}
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>

              {/* Results Count */}
              <Badge variant="outline" className="gap-1">
                <Filter className="h-3 w-3" />
                {filteredPatterns.length} قالب
              </Badge>

              {/* Clear Filters */}
              {(selectedCategory !== 'all' || selectedColor !== 'all' || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedColor('all');
                    setSearchQuery('');
                  }}
                  className="gap-1"
                >
                  <X className="h-4 w-4" />
                  مسح الفلاتر
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Patterns Grid */}
        <div className={cn('grid gap-4', gridCols[gridSize])}>
          <AnimatePresence mode="popLayout">
            {visiblePatterns.map((pattern, index) => (
              <motion.div
                key={pattern.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: Math.min(index * 0.02, 0.5) }}
              >
                <Card 
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-lg hover:scale-105 group overflow-hidden',
                    isPatternActive(pattern.id) && 'ring-2 ring-primary'
                  )}
                  onClick={() => handlePreview(pattern)}
                >
                  <CardContent className="p-2 relative">
                    <GuillochePatternSVG pattern={pattern} size={patternSize[gridSize]} />
                    
                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(pattern);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={isPatternActive(pattern.id) ? "destructive" : "default"}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApplyPattern(pattern);
                        }}
                        disabled={isApplying}
                      >
                        {isApplying ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isPatternActive(pattern.id) ? (
                          <Minus className="h-4 w-4" />
                        ) : layerMode ? (
                          <Plus className="h-4 w-4" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* Active Indicator */}
                    {isPatternActive(pattern.id) && (
                      <div className="absolute top-1 left-1">
                        <Badge className="gap-1 bg-primary">
                          {layerMode ? (
                            <>
                              <Layers className="h-3 w-3" />
                              {activePatterns.findIndex(p => p.id === pattern.id) + 1}
                            </>
                          ) : (
                            <>
                              <Star className="h-3 w-3" />
                              مُفعَّل
                            </>
                          )}
                        </Badge>
                      </div>
                    )}

                    {/* Pattern Info */}
                    <div className="mt-2 text-center">
                      <p className="text-xs font-medium truncate">{pattern.name}</p>
                      <p className="text-[10px] text-muted-foreground">{pattern.categoryName}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Load More */}
        {visibleCount < filteredPatterns.length && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="lg"
              onClick={handleLoadMore}
              className="gap-2"
            >
              تحميل المزيد ({filteredPatterns.length - visibleCount} متبقي)
            </Button>
          </div>
        )}

        {/* Preview Dialog */}
        <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                معاينة النمط: {selectedPattern?.name}
              </DialogTitle>
              <DialogDescription>
                معاينة كيف سيظهر هذا النمط على المستندات الرسمية
              </DialogDescription>
            </DialogHeader>

            {selectedPattern && (
              <div className="space-y-4">
                {/* Large Preview */}
                <div className="flex justify-center">
                  <GuillochePatternSVG pattern={selectedPattern} size={400} />
                </div>

                {/* Pattern Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">معلومات النمط:</p>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>التصنيف: {selectedPattern.categoryName}</p>
                      <p>النوع: {selectedPattern.patternType}</p>
                      <p>التعقيد: {selectedPattern.complexity}</p>
                      <p>الكثافة: {selectedPattern.density}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">لوحة الألوان:</p>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded-lg shadow-sm" 
                        style={{ backgroundColor: selectedPattern.colorPalette.primary }}
                      />
                      <div 
                        className="w-8 h-8 rounded-lg shadow-sm" 
                        style={{ backgroundColor: selectedPattern.colorPalette.secondary }}
                      />
                      <div 
                        className="w-8 h-8 rounded-lg shadow-sm border" 
                        style={{ backgroundColor: selectedPattern.colorPalette.bg }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedPattern.colorPalette.name}</p>
                  </div>
                </div>

                {/* Document Preview with Layers */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <p className="text-sm font-medium mb-2">معاينة على مستند {layerMode && activePatterns.length > 0 ? '(مع الطبقات المحددة)' : ''}:</p>
                  <div 
                    className="relative h-48 rounded-lg border overflow-hidden"
                    style={{ backgroundColor: selectedPattern.colorPalette.bg }}
                  >
                    {/* Show existing layers first */}
                    {layerMode && activePatterns.map((p, idx) => (
                      <div key={p.id} className="absolute inset-0" style={{ opacity: 0.1 - (idx * 0.02) }}>
                        <GuillochePatternSVG pattern={p} size={400} />
                      </div>
                    ))}
                    {/* Show selected pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <GuillochePatternSVG pattern={selectedPattern} size={400} />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="font-bold text-lg">شهادة رسمية</p>
                        <p className="text-sm text-muted-foreground">نموذج معاينة المستند</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
                إغلاق
              </Button>
              <Button
                variant={isPatternActive(selectedPattern?.id || '') ? "destructive" : "default"}
                onClick={() => {
                  if (selectedPattern) {
                    handleApplyPattern(selectedPattern);
                    if (!layerMode) setPreviewDialogOpen(false);
                  }
                }}
                disabled={isApplying}
                className="gap-2"
              >
                {isApplying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isPatternActive(selectedPattern?.id || '') ? (
                  <>
                    <Minus className="h-4 w-4" />
                    إزالة من الطبقات
                  </>
                ) : layerMode ? (
                  <>
                    <Plus className="h-4 w-4" />
                    إضافة كطبقة ({activePatterns.length}/{MAX_LAYERS})
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    تحديد كخلفية للمستندات
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Document Preview Dialog */}
        <Dialog open={documentPreviewOpen} onOpenChange={setDocumentPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                معاينة المستند مع الرسم الغيوشي
              </DialogTitle>
              <DialogDescription>
                معاينة كيف ستظهر الطبقات المحددة على المستندات الرسمية
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* A4 Document Preview */}
              <div 
                id="guilloche-document-preview"
                className="relative mx-auto border-2 shadow-xl rounded-lg overflow-hidden"
                style={{ 
                  width: '100%',
                  maxWidth: '595px',
                  aspectRatio: '1 / 1.414',
                  backgroundColor: activePatterns[0]?.colorPalette.bg || '#fff'
                }}
              >
                {/* Pattern Layers */}
                {activePatterns.map((pattern, idx) => (
                  <div 
                    key={pattern.id} 
                    className="absolute inset-0"
                    style={{ opacity: 0.08 - (idx * 0.015) }}
                  >
                    <svg 
                      width="100%" 
                      height="100%" 
                      viewBox="0 0 595 842"
                      preserveAspectRatio="xMidYMid slice"
                    >
                      <defs>
                        <pattern 
                          id={`doc-pattern-${pattern.id}`} 
                          patternUnits="userSpaceOnUse" 
                          width="200" 
                          height="200"
                        >
                          <g transform={`rotate(${pattern.rotation} 100 100)`}>
                            <GuillochePatternSVG pattern={pattern} size={200} />
                          </g>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill={`url(#doc-pattern-${pattern.id})`} />
                    </svg>
                  </div>
                ))}

                {/* Organization Name Watermark - repeated diagonal */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 595 842" preserveAspectRatio="xMidYMid slice">
                  <defs>
                    <pattern id="org-watermark-pattern" patternUnits="userSpaceOnUse" width="220" height="120" patternTransform="rotate(-35)">
                      <text x="10" y="60" fontSize="14" fontWeight="300" fill={activePatterns[0]?.colorPalette.primary || '#059669'} opacity="0.06" fontFamily="Cairo, sans-serif">{orgName}</text>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#org-watermark-pattern)" />
                </svg>

                {/* Document Content */}
                <div className="absolute inset-0 p-8 flex flex-col">
                  {/* Header */}
                  <div className="text-center border-b-2 border-current/20 pb-4 mb-6">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                      <Fingerprint className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold">شهادة إعادة التدوير</h2>
                    <p className="text-sm text-muted-foreground mt-1">Certificate of Recycling</p>
                  </div>

                  {/* Body */}
                  <div className="flex-1 space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-background/50 rounded border">
                        <p className="text-xs text-muted-foreground">رقم الشهادة</p>
                        <p className="font-mono font-bold">RC-2026-001234</p>
                      </div>
                      <div className="p-3 bg-background/50 rounded border">
                        <p className="text-xs text-muted-foreground">تاريخ الإصدار</p>
                        <p className="font-bold">06/02/2026</p>
                      </div>
                    </div>

                    <div className="p-4 bg-background/50 rounded border">
                      <p className="text-xs text-muted-foreground mb-1">اسم المنشأة</p>
                      <p className="font-bold text-base">شركة البيئة الخضراء للتدوير</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-background/50 rounded border">
                        <p className="text-xs text-muted-foreground">نوع المخلفات</p>
                        <p className="font-bold">مخلفات بلاستيكية</p>
                      </div>
                      <div className="p-3 bg-background/50 rounded border">
                        <p className="text-xs text-muted-foreground">الكمية</p>
                        <p className="font-bold">5,000 كجم</p>
                      </div>
                    </div>

                    <div className="p-3 bg-background/50 rounded border text-center">
                      <p className="text-xs text-muted-foreground">نسبة إعادة التدوير</p>
                      <p className="text-2xl font-bold text-primary">95%</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-6 pt-4 border-t-2 border-current/20 flex justify-between items-end">
                    <div>
                      <p className="text-xs text-muted-foreground">التوقيع والختم</p>
                      <div className="w-24 h-12 border-b-2 border-dashed border-current/30 mt-2"></div>
                    </div>
                    <div className="text-left">
                      <div className="w-16 h-16 border-2 border-dashed border-current/30 rounded flex items-center justify-center">
                        <span className="text-[8px] text-muted-foreground">QR</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Layer Info */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Layers className="h-4 w-4" />
                <span>عدد الطبقات المطبقة: {activePatterns.length}</span>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDocumentPreviewOpen(false)}>
                إغلاق
              </Button>
              {isAdmin && (
                <Button
                  className="gap-2"
                  onClick={() => {
                    const printContent = document.getElementById('guilloche-document-preview');
                    if (!printContent) return;
                    const printWindow = window.open('', '_blank');
                    if (!printWindow) return;
                    printWindow.document.write(`
                      <html dir="rtl">
                      <head>
                        <title>طباعة الرسم الغيوشي - ${orgName}</title>
                        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap" rel="stylesheet">
                        <style>
                          * { margin: 0; padding: 0; box-sizing: border-box; }
                          @page { size: A4; margin: 0; }
                          body { display: flex; justify-content: center; align-items: flex-start; font-family: 'Cairo', sans-serif; }
                          .print-container { width: 210mm; height: 297mm; position: relative; overflow: hidden; }
                          .org-watermark { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
                        </style>
                      </head>
                      <body>
                        <div class="print-container">
                          ${printContent.innerHTML}
                          <svg class="org-watermark" viewBox="0 0 595 842" preserveAspectRatio="xMidYMid slice">
                            <defs>
                              <pattern id="print-org-wm" patternUnits="userSpaceOnUse" width="200" height="100" patternTransform="rotate(-35)">
                                <text x="5" y="55" font-size="12" font-weight="300" fill="${activePatterns[0]?.colorPalette.primary || '#059669'}" opacity="0.05" font-family="Cairo, sans-serif">${orgName}</text>
                              </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#print-org-wm)" />
                          </svg>
                        </div>
                      </body>
                      </html>
                    `);
                    printWindow.document.close();
                    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
                  }}
                >
                  <Printer className="h-4 w-4" />
                  طباعة
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
          </TabsContent>

          {/* Saved/Previously Used Tab */}
          <TabsContent value="saved" className="space-y-6 mt-4">
            {savedPatternIds.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Star className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">لا توجد قوالب محفوظة</h3>
                  <p className="text-muted-foreground text-sm">عند تحديد أي نمط أو تداخل سيتم حفظه تلقائياً هنا</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    القوالب المحفوظة والمستخدمة سابقاً ({savedPatternIds.length})
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive gap-1"
                    onClick={() => {
                      setPref('guilloche_saved_patterns', []);
                      toast.success('تم مسح جميع القوالب المحفوظة');
                    }}
                  >
                    <X className="h-4 w-4" />
                    مسح الكل
                  </Button>
                </div>

                <div className={cn('grid gap-4', gridCols[gridSize])}>
                  {allPatterns
                    .filter(p => savedPatternIds.includes(p.id))
                    .map((pattern, index) => (
                      <motion.div
                        key={pattern.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: Math.min(index * 0.03, 0.5) }}
                      >
                        <Card
                          className={cn(
                            'cursor-pointer transition-all hover:shadow-lg hover:scale-105 group overflow-hidden',
                            isPatternActive(pattern.id) && 'ring-2 ring-primary'
                          )}
                          onClick={() => handlePreview(pattern)}
                        >
                          <CardContent className="p-2 relative">
                            <GuillochePatternSVG pattern={pattern} size={patternSize[gridSize]} />

                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); handlePreview(pattern); }}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={isPatternActive(pattern.id) ? "destructive" : "default"}
                                onClick={(e) => { e.stopPropagation(); handleApplyPattern(pattern); }}
                              >
                                {isPatternActive(pattern.id) ? <Minus className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                              </Button>
                            </div>

                            {isPatternActive(pattern.id) && (
                              <div className="absolute top-1 left-1">
                                <Badge className="gap-1 bg-primary"><Star className="h-3 w-3" />مُفعَّل</Badge>
                              </div>
                            )}

                            <div className="mt-2 text-center">
                              <p className="text-xs font-medium truncate">{pattern.name}</p>
                              <p className="text-[10px] text-muted-foreground">{pattern.categoryName}</p>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="borders" className="mt-4">
            <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
              <GuillocheA4BorderDesigner />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
