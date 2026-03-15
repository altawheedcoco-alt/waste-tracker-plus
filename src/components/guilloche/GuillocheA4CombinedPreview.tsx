/**
 * معاينة مجمعة A4 — تعرض الخلفية الغيلوشية + البرواز + طبقة الأمان + محتوى تجريبي
 * قابلة للطباعة والتصدير
 */
import { useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useGuillocheBackground } from '@/hooks/useGuillocheBackground';
import GuillocheSecurityOverlay, { generateSecurityOverlayHTML } from './GuillocheSecurityOverlay';
import { generatePatternPaths, GUILLOCHE_COLOR_PALETTES, type SavedPatternRef } from '@/lib/guillochePatternUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Printer, FileText, Layers, Frame, AlertCircle, Fingerprint } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useMyPermissions } from '@/hooks/useMyPermissions';
import { generatePrintWatermarkHTML, getSecurePrintCSS, logPrintAudit } from '@/lib/printSecurityUtils';
import { toast } from 'sonner';

// ─── Border Types (mirrored from GuillocheA4BorderDesigner) ───
const BORDER_COLORS = [
  { id: 'gold', name: 'ذهبي', primary: '#b8860b', secondary: '#ffd700', tertiary: '#8b6914' },
  { id: 'green', name: 'أخضر', primary: '#059669', secondary: '#34d399', tertiary: '#047857' },
  { id: 'blue', name: 'أزرق', primary: '#1e40af', secondary: '#3b82f6', tertiary: '#1e3a8a' },
  { id: 'red', name: 'أحمر', primary: '#991b1b', secondary: '#ef4444', tertiary: '#7f1d1d' },
  { id: 'purple', name: 'بنفسجي', primary: '#6b21a8', secondary: '#a855f7', tertiary: '#581c87' },
  { id: 'black', name: 'أسود', primary: '#1a1a1a', secondary: '#555', tertiary: '#000' },
  { id: 'teal', name: 'مائي', primary: '#0d9488', secondary: '#2dd4bf', tertiary: '#115e59' },
  { id: 'bronze', name: 'برونزي', primary: '#8B4513', secondary: '#CD853F', tertiary: '#654321' },
];

interface BorderConfig {
  id: string;
  name: string;
  category: string;
  categoryName: string;
  borderStyle: string;
  color: typeof BORDER_COLORS[0];
  thickness: number;
  cornerStyle: 'sharp' | 'rounded' | 'ornate' | 'chamfered';
  innerMargin: number;
  doubleBorder: boolean;
  cornerDecoration: boolean;
  symmetry: string;
  density: number;
  seed: number;
}

// ─── Interwoven Border SVG (standalone, no React hooks) ───
function generateBorderPaths(border: BorderConfig, width: number, height: number) {
  const { color, thickness, innerMargin, doubleBorder, cornerDecoration, density, seed } = border;
  const scale = width / 595;
  const m = innerMargin * scale;
  const sw = Math.max(0.3, thickness * 0.35 * scale);
  const bandWidth = (8 + thickness * 3) * scale;
  const numWaves = 3 + density;
  const step = Math.max(0.8, 2 / scale);

  const paths: { d: string; color: string; opacity: number; sw: number }[] = [];
  const w = width;
  const h = height;
  const inset = m;

  const perimeter = 2 * (w - 2 * inset) + 2 * (h - 2 * inset);
  const topLen = w - 2 * inset;
  const rightLen = h - 2 * inset;
  const bottomLen = topLen;

  const getPointOnRect = (t: number) => {
    const dist = ((t % 1) + 1) % 1 * perimeter;
    if (dist <= topLen) return { x: inset + dist, y: inset, nx: 0, ny: -1 };
    else if (dist <= topLen + rightLen) return { x: w - inset, y: inset + dist - topLen, nx: 1, ny: 0 };
    else if (dist <= topLen + rightLen + bottomLen) return { x: w - inset - (dist - topLen - rightLen), y: h - inset, nx: 0, ny: 1 };
    else return { x: inset, y: h - inset - (dist - topLen - rightLen - bottomLen), nx: -1, ny: 0 };
  };

  const totalPoints = Math.floor(perimeter / step);
  const seedMul = (seed % 100) * 0.01 + 0.5;

  for (let wave = 0; wave < numWaves; wave++) {
    const freq1 = (0.03 + wave * 0.007 + seed * 0.0001) * (2 + density * 0.3);
    const freq2 = freq1 * (1.3 + wave * 0.15 * seedMul);
    const freq3 = freq1 * (0.7 + wave * 0.11);
    const amp1 = bandWidth * (0.35 + (wave % 3) * 0.12);
    const amp2 = bandWidth * (0.25 + ((wave + 1) % 3) * 0.1);
    const phase = (wave * Math.PI * 2) / numWaves + seed * 0.1;

    let pathD = '';
    for (let i = 0; i <= totalPoints; i++) {
      const t = i / totalPoints;
      const dist = t * perimeter;
      const pt = getPointOnRect(t);
      const offset = Math.sin(dist * freq1 + phase) * amp1
        + Math.sin(dist * freq2 + phase * 1.7) * amp2 * 0.6
        + Math.sin(dist * freq3 + phase * 2.3) * amp1 * 0.3;
      pathD += (i === 0 ? 'M' : 'L') + ` ${(pt.x + pt.nx * offset).toFixed(2)} ${(pt.y + pt.ny * offset).toFixed(2)}`;
    }
    paths.push({ d: pathD, color: color.primary, opacity: 0.7 + (wave % 2) * 0.15, sw });

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
        pathD2 += (i === 0 ? 'M' : 'L') + ` ${(pt.x + pt.nx * offset).toFixed(2)} ${(pt.y + pt.ny * offset).toFixed(2)}`;
      }
      paths.push({ d: pathD2, color: color.secondary, opacity: 0.5 + (wave % 3) * 0.1, sw });
    }
  }

  // Corner rosettes
  if (cornerDecoration) {
    const corners = [
      { cx: inset, cy: inset },
      { cx: w - inset, cy: inset },
      { cx: w - inset, cy: h - inset },
      { cx: inset, cy: h - inset },
    ];
    const roseSize = bandWidth * 1.2;
    corners.forEach((corner, ci) => {
      for (let ring = 0; ring < 3; ring++) {
        let d = '';
        const pts = 60;
        for (let i = 0; i <= pts; i++) {
          const angle = (i / pts) * Math.PI / 2 + ci * Math.PI / 2;
          const r = roseSize * (0.3 + ring * 0.25) + Math.sin(angle * (4 + ring * 2) + seed) * roseSize * 0.15;
          const qx = corner.cx + Math.cos(angle) * r;
          const qy = corner.cy + Math.sin(angle) * r;
          d += (i === 0 ? 'M' : 'L') + ` ${qx.toFixed(2)} ${qy.toFixed(2)}`;
        }
        paths.push({ d, color: [color.primary, color.secondary, color.tertiary][ring], opacity: 0.6, sw });
      }
    });
  }

  return paths;
}

// ─── Pattern Background Layer (SVG) ───
function PatternLayer({ patterns, width, height }: { patterns: SavedPatternRef[]; width: number; height: number }) {
  const tileSize = 200;
  return (
    <>
      {patterns.map((ref, idx) => {
        const palette = GUILLOCHE_COLOR_PALETTES.find(c => c.id === ref.colorPaletteId);
        if (!palette) return null;
        const paths = generatePatternPaths(ref.patternType, tileSize, ref.scale, ref.seed);
        const opacity = 0.08 - idx * 0.015;
        const gradId = `cp-grad-${ref.id}-${idx}`;
        const patId = `cp-pat-${ref.id}-${idx}`;
        return (
          <div key={ref.id} style={{ position: 'absolute', inset: 0, opacity }}>
            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice">
              <defs>
                <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={palette.primary} />
                  <stop offset="100%" stopColor={palette.secondary} />
                </linearGradient>
                <pattern id={patId} patternUnits="userSpaceOnUse" width={tileSize} height={tileSize}>
                  <g transform={`rotate(${ref.rotation} ${tileSize / 2} ${tileSize / 2})`} opacity={ref.opacity * 10}>
                    {paths.map((d, i) => (
                      <path key={i} d={d} fill="none" stroke={`url(#${gradId})`} strokeWidth={ref.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
                    ))}
                  </g>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#${patId})`} />
            </svg>
          </div>
        );
      })}
    </>
  );
}

// ─── Border Layer (SVG) ───
function BorderLayer({ border, width, height }: { border: BorderConfig; width: number; height: number }) {
  const paths = useMemo(() => generateBorderPaths(border, width, height), [border, width, height]);
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
        {paths.map((p, i) => (
          <path key={i} d={p.d} fill="none" stroke={p.color} strokeWidth={p.sw} strokeLinecap="round" strokeLinejoin="round" opacity={p.opacity} />
        ))}
      </svg>
    </div>
  );
}

// ─── Main Combined Preview ───
export default function GuillocheA4CombinedPreview() {
  const { organization, profile, user } = useAuth();
  const { getPref } = useUserPreferences();
  const { savedPatterns, bgColor, hasBackground } = useGuillocheBackground();
  const { hasPermission, isAdmin, isCompanyAdmin } = useMyPermissions();
  const canPrint = isAdmin || isCompanyAdmin || hasPermission('print_documents');
  const orgName = organization?.name || 'اسم الجهة';
  const userName = profile?.full_name || 'المستخدم';
  const previewRef = useRef<HTMLDivElement>(null);

  const activeBorder: BorderConfig | null = getPref('guilloche_document_border', null);
  const hasAny = hasBackground || !!activeBorder;
  const dateStr = format(new Date(), 'PP', { locale: ar });

  const previewWidth = 595;
  const previewHeight = 842;

  const secColor = savedPatterns[0]
    ? GUILLOCHE_COLOR_PALETTES.find(c => c.id === savedPatterns[0].colorPaletteId)?.primary || '#059669'
    : activeBorder?.color.primary || '#059669';

  // ─── Generate print HTML ───
  const generatePrintHTML = useCallback(() => {
    const el = previewRef.current;
    if (!el) return '';
    return `
      <html dir="rtl">
      <head>
        <title>معاينة مجمعة - ${orgName}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
          ${getSecurePrintCSS()}
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { size: A4; margin: 0; }
          body { display: flex; justify-content: center; font-family: 'Cairo', sans-serif; }
          .page { width: 210mm; height: 297mm; position: relative; overflow: hidden; }
        </style>
      </head>
      <body>
        <div class="page">
          ${el.innerHTML}
          ${generateSecurityOverlayHTML(orgName, secColor)}
        </div>
        ${generatePrintWatermarkHTML(orgName, userName)}
      </body>
      </html>
    `;
  }, [orgName, secColor, userName]);

  const handlePrint = () => {
    if (!canPrint) {
      toast.error('ليس لديك صلاحية طباعة المستندات');
      return;
    }
    const html = generatePrintHTML();
    if (!html) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.print(); w.close(); }, 500);
    if (user?.id && organization?.id) {
      logPrintAudit({ userId: user.id, orgId: organization.id, action: 'print_guilloche_combined' });
    }
  };

  const handlePreviewWindow = () => {
    const html = generatePrintHTML();
    if (!html) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
  };

  if (!hasAny) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="font-semibold text-lg mb-2">لا يوجد نمط أو برواز محدد</h3>
          <p className="text-muted-foreground text-sm">
            اختر نمط خلفية من تبويب "أنماط الخلفية" أو برواز من تبويب "براويز الصفحة" لمعاينتهما معاً
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="gap-1">
            <Layers className="h-3 w-3" />
            خلفية: {hasBackground ? `${savedPatterns.length} طبقة` : 'غير محدد'}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Frame className="h-3 w-3" />
            برواز: {activeBorder ? activeBorder.name : 'غير محدد'}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handlePreviewWindow}>
            <Eye className="h-4 w-4" />
            معاينة كاملة
          </Button>
          <Button size="sm" className="gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            طباعة A4
          </Button>
        </div>
      </div>

      {/* A4 Preview */}
      <div className="flex justify-center">
        <div
          ref={previewRef}
          className="relative border-2 shadow-2xl rounded-lg overflow-hidden"
          style={{
            width: '100%',
            maxWidth: `${previewWidth}px`,
            aspectRatio: '1 / 1.414',
            backgroundColor: bgColor || '#ffffff',
          }}
        >
          {/* Pattern Background */}
          {hasBackground && (
            <PatternLayer patterns={savedPatterns} width={previewWidth} height={previewHeight} />
          )}

          {/* Border */}
          {activeBorder && (
            <BorderLayer border={activeBorder} width={previewWidth} height={previewHeight} />
          )}

          {/* Security Overlay */}
          <GuillocheSecurityOverlay orgName={orgName} color={secColor} />

          {/* Sample Document Content */}
          <div className="absolute inset-0 p-8 flex flex-col" style={{ zIndex: 5, pointerEvents: 'none' }}>
            {/* Header */}
            <div className="text-center border-b-2 border-current/20 pb-4 mb-4">
              <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                <Fingerprint className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">شهادة إعادة التدوير</h2>
              <p className="text-xs text-gray-500 mt-1">Certificate of Recycling</p>
              <p className="text-[10px] text-gray-400 mt-1">{orgName} | {dateStr}</p>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/70 rounded border backdrop-blur-sm">
                  <p className="text-[10px] text-gray-500">رقم الشهادة</p>
                  <p className="font-mono font-bold text-sm">RC-2026-001234</p>
                </div>
                <div className="p-3 bg-white/70 rounded border backdrop-blur-sm">
                  <p className="text-[10px] text-gray-500">تاريخ الإصدار</p>
                  <p className="font-bold text-sm">{dateStr}</p>
                </div>
              </div>

              <div className="p-3 bg-white/70 rounded border backdrop-blur-sm">
                <p className="text-[10px] text-gray-500 mb-1">اسم المنشأة</p>
                <p className="font-bold text-base">{orgName}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/70 rounded border backdrop-blur-sm">
                  <p className="text-[10px] text-gray-500">نوع المخلفات</p>
                  <p className="font-bold">مخلفات بلاستيكية</p>
                </div>
                <div className="p-3 bg-white/70 rounded border backdrop-blur-sm">
                  <p className="text-[10px] text-gray-500">الكمية</p>
                  <p className="font-bold">5,000 كجم</p>
                </div>
              </div>

              <div className="p-3 bg-white/70 rounded border backdrop-blur-sm text-center">
                <p className="text-[10px] text-gray-500">نسبة إعادة التدوير</p>
                <p className="text-2xl font-bold" style={{ color: secColor }}>95%</p>
              </div>

              <div className="p-3 bg-white/70 rounded border backdrop-blur-sm">
                <p className="text-[10px] text-gray-500 mb-1">الملاحظات</p>
                <p className="text-xs text-gray-600">
                  تم التحقق من عملية إعادة التدوير وفقاً للمعايير البيئية المصرية. المواد المعاد تدويرها مطابقة للمواصفات.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t-2 border-current/20 flex justify-between items-end">
              <div className="text-right">
                <p className="text-[10px] text-gray-500">التوقيع والختم</p>
                <div className="w-24 h-10 border-b-2 border-dashed border-gray-300 mt-2"></div>
              </div>
              <div className="text-center">
                <p className="text-[8px] text-gray-400">
                  هذا المستند صادر آلياً ولا يتطلب توقيعاً خطياً
                </p>
              </div>
              <div className="text-left">
                <div className="w-14 h-14 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                  <span className="text-[8px] text-gray-400">QR</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="text-center text-xs text-muted-foreground space-y-1">
        <p>هذه معاينة مجمعة لخلفية الغيلوش والبرواز كما سيظهران في المستندات المطبوعة</p>
        <p>لتغيير الخلفية أو البرواز، استخدم التبويبات الأخرى</p>
      </div>
    </div>
  );
}
