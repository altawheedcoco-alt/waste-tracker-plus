/**
 * UnifiedDocumentPreview — معاينة شاملة للمستند النهائي (Enhanced v2)
 * 
 * تبويبات مع حركات انتقالية + تصميم متجاوب مع الموبايل:
 *   1. معاينة حية (Live A4 Preview with 3 layers)
 *   2. أنماط الطباعة (Print Themes)
 *   3. تخطيط المستند (Layout Templates)
 *   4. طبقات الأمان (Security Layers)
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette, Layout, Shield, Eye, Check, Printer, FileDown,
  Layers, Sparkles, RotateCcw, ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  Lock, Fingerprint, QrCode
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PRINT_THEMES, getThemesByEntity, type PrintThemeId, type PrintTheme } from '@/lib/printThemes';
import { LAYOUT_TEMPLATES, type LayoutTemplateId, type LayoutTemplate } from '@/lib/layoutTemplates';
import { useGuillocheBackground } from '@/hooks/useGuillocheBackground';
import { generatePrintWatermarkHTML } from '@/lib/printSecurityUtils';
import { useAuth } from '@/contexts/AuthContext';

interface UnifiedDocumentPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrint: (config: DocumentOutputConfig) => void;
  onExportPDF: (config: DocumentOutputConfig) => void;
  documentTitle?: string;
  entityType?: 'generator' | 'transporter' | 'recycler' | 'disposal';
  previewContent?: string;
}

export interface DocumentOutputConfig {
  themeId: PrintThemeId;
  layoutId: LayoutTemplateId;
  hasGuillocheBackground: boolean;
  hasWatermark: boolean;
}

// ─── Animated Theme Card ─────────────────────────────────
const MiniThemeCard = ({ theme, selected, onClick, index }: { theme: PrintTheme; selected: boolean; onClick: () => void; index: number }) => (
  <motion.button
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.03, duration: 0.25 }}
    whileHover={{ scale: 1.04, y: -3 }}
    whileTap={{ scale: 0.96 }}
    onClick={onClick}
    className={`relative text-right rounded-xl border-2 overflow-hidden transition-all w-full group ${
      selected
        ? 'border-primary shadow-lg ring-2 ring-primary/25 scale-[1.02]'
        : 'border-border hover:border-primary/40 hover:shadow-md'
    }`}
  >
    <AnimatePresence>
      {selected && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="absolute top-1.5 left-1.5 z-10 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md"
        >
          <Check className="w-3 h-3 text-primary-foreground" />
        </motion.div>
      )}
    </AnimatePresence>

    {/* Theme header strip */}
    <div
      className="px-3 py-2.5 transition-all duration-200"
      style={{ background: theme.colors.headerBg }}
    >
      <p
        className="text-[10px] font-bold truncate"
        style={{ color: theme.colors.headerText, fontFamily: theme.fonts.heading }}
      >
        {theme.preview} {theme.name}
      </p>
    </div>

    {/* Mini table preview */}
    <div className="px-2 py-1.5" style={{ background: theme.colors.pageBg }}>
      <div className="rounded overflow-hidden" style={{ border: `1px solid ${theme.colors.borderColor}` }}>
        <div className="flex" style={{ background: theme.colors.tableHeaderBg }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-1 px-1 py-[3px]">
              <div className="h-[2px] rounded mx-auto" style={{ background: theme.colors.tableHeaderText, opacity: 0.6, width: `${10 + i * 3}px` }} />
            </div>
          ))}
        </div>
        {[1, 2].map(row => (
          <div key={row} className="flex" style={{ background: row % 2 === 0 ? theme.colors.tableStripeBg : 'transparent' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-1 px-1 py-[2px]">
                <div className="h-[2px] rounded mx-auto" style={{ background: theme.colors.bodyText, opacity: 0.15, width: `${8 + i * 2}px` }} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>

    {/* Label */}
    <div className="px-3 py-1.5 border-t border-border bg-background">
      <p className="text-[9px] text-muted-foreground truncate group-hover:text-foreground transition-colors">{theme.description}</p>
    </div>
  </motion.button>
);

// ─── Animated Layout Card ────────────────────────────────
const MiniLayoutCard = ({ template, selected, onClick, index }: { template: LayoutTemplate; selected: boolean; onClick: () => void; index: number }) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.04, duration: 0.25 }}
    whileHover={{ scale: 1.04, y: -3 }}
    whileTap={{ scale: 0.96 }}
    onClick={onClick}
    className={`relative text-right rounded-xl border-2 overflow-hidden transition-all w-full group ${
      selected
        ? 'border-primary shadow-lg ring-2 ring-primary/25'
        : 'border-border hover:border-primary/40 hover:shadow-md'
    }`}
  >
    <AnimatePresence>
      {selected && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="absolute top-1.5 left-1.5 z-10 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md"
        >
          <Check className="w-3 h-3 text-primary-foreground" />
        </motion.div>
      )}
    </AnimatePresence>

    <div className="p-2.5 bg-muted/30">
      <div className="bg-background rounded-lg border p-2 space-y-1.5" style={{ minHeight: '48px' }}>
        {/* Header wireframe */}
        <div className={`flex items-center gap-1 p-1 rounded bg-primary/10 ${
          template.headerLayout === 'centered' ? 'justify-center' : 'justify-between'
        }`}>
          <div className="h-[3px] w-8 rounded bg-primary/40" />
          {template.headerLayout === 'left-right' && <div className="h-[3px] w-5 rounded bg-primary/25" />}
        </div>

        {/* Body wireframe */}
        <div className={`flex gap-1 ${template.bodyLayout === 'two-column' || template.bodyLayout === 'grid' ? '' : 'flex-col'}`}>
          {template.bodyLayout === 'two-column' ? (
            <>
              <div className="flex-1 space-y-[2px]">
                <div className="h-[2px] w-full rounded bg-muted-foreground/20" />
                <div className="h-[2px] w-3/4 rounded bg-muted-foreground/12" />
              </div>
              <div className="flex-1 space-y-[2px]">
                <div className="h-[2px] w-full rounded bg-muted-foreground/20" />
                <div className="h-[2px] w-2/3 rounded bg-muted-foreground/12" />
              </div>
            </>
          ) : template.bodyLayout === 'grid' ? (
            <div className="grid grid-cols-3 gap-[2px] w-full">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-3 rounded bg-muted-foreground/8" />
              ))}
            </div>
          ) : (
            <>
              <div className="h-[2px] w-full rounded bg-muted-foreground/20" />
              <div className="h-[2px] w-5/6 rounded bg-muted-foreground/12" />
            </>
          )}
        </div>
      </div>
    </div>

    <div className="px-3 py-2 border-t bg-background">
      <div className="flex items-center gap-1.5">
        <span className="text-sm">{template.preview}</span>
        <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{template.name}</p>
      </div>
      <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">{template.description}</p>
    </div>
  </motion.button>
);

// ─── Live A4 Preview with Zoom ───────────────────────────
const LiveA4Preview = ({
  theme,
  guillocheHTML,
  guillocheBg,
  hasGuillocheBackground,
  watermarkHTML,
  documentTitle,
  zoom,
}: {
  theme: PrintTheme;
  guillocheHTML: string | null;
  guillocheBg: string | undefined;
  hasGuillocheBackground: boolean;
  watermarkHTML: string;
  documentTitle: string;
  zoom: number;
}) => {
  const previewScale = 0.28 * zoom;

  return (
    <motion.div
      key={theme.id}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex items-center justify-center"
    >
      <div
        className="relative overflow-hidden transition-shadow duration-300"
        style={{
          width: `${210 * previewScale}mm`,
          height: `${297 * previewScale}mm`,
          borderRadius: '4px',
          border: '1px solid hsl(var(--border))',
          boxShadow: '0 8px 32px -8px rgba(0,0,0,0.18), 0 2px 8px -2px rgba(0,0,0,0.08)',
        }}
      >
        <div
          style={{
            width: '210mm',
            height: '297mm',
            transform: `scale(${previewScale})`,
            transformOrigin: 'top left',
            position: 'relative',
            backgroundColor: hasGuillocheBackground && guillocheBg ? guillocheBg : theme.colors.pageBg,
            fontFamily: theme.fonts.body,
            direction: 'rtl',
            overflow: 'hidden',
          }}
        >
          {/* Layer 1: Guilloche */}
          {hasGuillocheBackground && guillocheHTML && (
            <div
              style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}
              dangerouslySetInnerHTML={{ __html: guillocheHTML }}
            />
          )}

          {/* Layer 2: Watermark */}
          <div
            style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden', mixBlendMode: 'multiply' }}
            dangerouslySetInnerHTML={{ __html: watermarkHTML }}
          />

          {/* Layer 3: Content */}
          <div style={{ position: 'relative', zIndex: 2, padding: '10mm 12mm' }}>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              style={{
                background: theme.colors.headerBg,
                color: theme.colors.headerText,
                padding: theme.spacing.headerPadding,
                borderRadius: theme.borders.radius,
                marginBottom: '14px',
                textAlign: 'center',
              }}
            >
              <h1 style={{ fontSize: '18pt', fontFamily: theme.fonts.heading, margin: 0, fontWeight: 700 }}>
                ♻ {documentTitle}
              </h1>
              <p style={{ fontSize: '10pt', opacity: 0.8, margin: '4px 0 0' }}>نموذج معاينة المستند</p>
            </motion.div>

            {/* Stats cards */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              {[
                { label: 'إجمالي الشحنات', value: '٢٤', icon: '🚛' },
                { label: 'الوزن الكلي', value: '١,٢٠٠ كجم', icon: '⚖️' },
                { label: 'الإيرادات', value: '٤٥,٠٠٠ ج.م', icon: '💰' },
              ].map((stat, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    padding: '10px 8px',
                    background: theme.colors.tableStripeBg,
                    borderRight: `3px solid ${theme.colors.accent}`,
                    borderRadius: '6px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '14pt', marginBottom: '2px' }}>{stat.icon}</div>
                  <div style={{ fontSize: '12pt', color: theme.colors.primary, fontWeight: 700 }}>{stat.value}</div>
                  <div style={{ fontSize: '7pt', color: theme.colors.mutedText }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div style={{ borderRadius: theme.borders.radius, overflow: 'hidden', border: theme.borders.tableBorder }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
                <thead>
                  <tr style={{ background: theme.colors.tableHeaderBg, color: theme.colors.tableHeaderText }}>
                    {['#', 'الصنف', 'الكمية', 'الوزن', 'الحالة'].map((h, i) => (
                      <th key={i} style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { type: 'بلاستيك PET', qty: '٥٠٠', weight: '١٢٠ كجم', status: 'مكتمل', statusBg: '#dcfce7', statusColor: '#166534' },
                    { type: 'ورق مقوى', qty: '٣٠٠', weight: '٨٠ كجم', status: 'قيد النقل', statusBg: '#dbeafe', statusColor: '#1e40af' },
                    { type: 'زجاج', qty: '٢٠٠', weight: '١٥٠ كجم', status: 'معلّق', statusBg: '#fef3c7', statusColor: '#92400e' },
                    { type: 'معادن', qty: '١٠٠', weight: '٩٠ كجم', status: 'مكتمل', statusBg: '#dcfce7', statusColor: '#166534' },
                  ].map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : theme.colors.tableStripeBg, borderTop: theme.borders.tableBorder }}>
                      <td style={{ padding: '5px 8px', color: theme.colors.bodyText }}>{i + 1}</td>
                      <td style={{ padding: '5px 8px', color: theme.colors.bodyText, fontWeight: 500 }}>{row.type}</td>
                      <td style={{ padding: '5px 8px', color: theme.colors.bodyText }}>{row.qty}</td>
                      <td style={{ padding: '5px 8px', color: theme.colors.bodyText }}>{row.weight}</td>
                      <td style={{ padding: '5px 8px' }}>
                        <span style={{ background: row.statusBg, color: row.statusColor, padding: '1px 8px', borderRadius: '10px', fontSize: '8pt', fontWeight: 600 }}>{row.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '18px', paddingTop: '10px', borderTop: `2px solid ${theme.colors.accent}`, textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ width: '40px', height: '40px', border: `1px solid ${theme.colors.borderColor}`, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7pt', color: theme.colors.mutedText }}>QR</div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <p style={{ fontSize: '8pt', color: theme.colors.accent, fontWeight: 700 }}>هوية التحقق الرقمي</p>
                  <p style={{ fontSize: '7pt', color: theme.colors.mutedText }}>مستند صادر آلياً من نظام iRecycle</p>
                </div>
                <div style={{ width: '60px', height: '24px', border: `1px solid ${theme.colors.borderColor}`, borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6pt', color: theme.colors.mutedText }}>BARCODE</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Security Layer Card ─────────────────────────────────
const SecurityLayerCard = ({
  icon: Icon,
  title,
  description,
  active,
  index,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  active: boolean;
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1, duration: 0.3 }}
    className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
      active
        ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800 shadow-sm'
        : 'bg-muted/30 border-border'
    }`}
  >
    <motion.div
      animate={active ? { scale: [1, 1.15, 1] } : {}}
      transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
        active ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-muted'
      }`}
    >
      <Icon className={`w-4.5 h-4.5 ${active ? 'text-emerald-600' : 'text-muted-foreground'}`} />
    </motion.div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold truncate">{title}</p>
      <p className="text-[11px] text-muted-foreground leading-snug">{description}</p>
    </div>
    <Badge
      variant={active ? 'default' : 'outline'}
      className={`text-[10px] shrink-0 ${active ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
    >
      {active ? '✓ مفعّل' : 'غير مفعّل'}
    </Badge>
  </motion.div>
);

// ─── Main Component ──────────────────────────────────────
const UnifiedDocumentPreview = ({
  open,
  onOpenChange,
  onPrint,
  onExportPDF,
  documentTitle = 'مستند رسمي',
  entityType,
}: UnifiedDocumentPreviewProps) => {
  const [activeTab, setActiveTab] = useState('preview');
  const [selectedTheme, setSelectedTheme] = useState<PrintThemeId>('corporate');
  const [selectedLayout, setSelectedLayout] = useState<LayoutTemplateId>('standard');
  const [zoom, setZoom] = useState(1);

  const { backgroundHTML, bgColor, hasBackground } = useGuillocheBackground();
  const { organization, profile, user } = useAuth();

  const orgName = organization?.name || 'اسم الجهة';
  const userName = profile?.full_name || user?.email || 'المستخدم';
  const orgClientCode = (organization as any)?.client_code || null;
  const orgVerificationCode = (organization as any)?.verification_code || null;

  const filteredThemes = entityType ? getThemesByEntity(entityType) : PRINT_THEMES;
  const currentTheme = PRINT_THEMES.find(t => t.id === selectedTheme) || PRINT_THEMES[0];
  const currentLayout = LAYOUT_TEMPLATES.find(l => l.id === selectedLayout) || LAYOUT_TEMPLATES[0];

  const watermarkHTML = useMemo(() => generatePrintWatermarkHTML(orgName, userName, orgClientCode, orgVerificationCode), [orgName, userName, orgClientCode, orgVerificationCode]);

  const outputConfig: DocumentOutputConfig = {
    themeId: selectedTheme,
    layoutId: selectedLayout,
    hasGuillocheBackground: hasBackground,
    hasWatermark: true,
  };

  const handlePrint = () => {
    onPrint(outputConfig);
    onOpenChange(false);
  };

  const handleExportPDF = () => {
    onExportPDF(outputConfig);
    onOpenChange(false);
  };

  // Theme navigation
  const themeIndex = filteredThemes.findIndex(t => t.id === selectedTheme);
  const prevTheme = () => {
    const i = themeIndex > 0 ? themeIndex - 1 : filteredThemes.length - 1;
    setSelectedTheme(filteredThemes[i].id);
  };
  const nextTheme = () => {
    const i = themeIndex < filteredThemes.length - 1 ? themeIndex + 1 : 0;
    setSelectedTheme(filteredThemes[i].id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] p-0 overflow-hidden gap-0" dir="rtl">
        {/* ─── Header ─── */}
        <DialogHeader className="px-4 sm:px-5 pt-4 pb-3 border-b bg-gradient-to-l from-primary/5 to-transparent">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
            >
              <Layers className="w-5 h-5 text-primary" />
            </motion.div>
            معاينة وتنسيق المستند
          </DialogTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">
            اختر النمط والتخطيط ثم راجع المعاينة الحية قبل الطباعة
          </p>
        </DialogHeader>

        <div className="flex flex-col md:flex-row" style={{ maxHeight: 'calc(92vh - 150px)', minHeight: '400px' }}>
          {/* ─── Left Panel: Tabs ─── */}
          <div className="md:w-[55%] flex flex-col border-l overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              {/* Tab triggers - scrollable on mobile */}
              <div className="overflow-x-auto scrollbar-none border-b">
                <TabsList className="w-max min-w-full rounded-none bg-muted/20 px-2 h-11 gap-0.5">
                  <TabsTrigger value="preview" className="gap-1.5 text-xs px-3 py-2 data-[state=active]:shadow-sm touch-manipulation">
                    <Eye className="w-3.5 h-3.5" /> المعاينة
                  </TabsTrigger>
                  <TabsTrigger value="themes" className="gap-1.5 text-xs px-3 py-2 data-[state=active]:shadow-sm touch-manipulation">
                    <Palette className="w-3.5 h-3.5" /> الأنماط
                    <Badge variant="secondary" className="text-[8px] px-1 py-0 mr-0.5 tabular-nums">{filteredThemes.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="layouts" className="gap-1.5 text-xs px-3 py-2 data-[state=active]:shadow-sm touch-manipulation">
                    <Layout className="w-3.5 h-3.5" /> التخطيط
                    <Badge variant="secondary" className="text-[8px] px-1 py-0 mr-0.5 tabular-nums">{LAYOUT_TEMPLATES.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="security" className="gap-1.5 text-xs px-3 py-2 data-[state=active]:shadow-sm touch-manipulation">
                    <Shield className="w-3.5 h-3.5" /> الأمان
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* ── Tab: Live Preview ── */}
              <TabsContent value="preview" className="flex-1 m-0 overflow-auto">
                <div className="p-3 space-y-3">
                  {/* Zoom controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.max(0.6, z - 0.15))}>
                        <ZoomOut className="w-3.5 h-3.5" />
                      </Button>
                      <span className="text-[10px] font-mono text-muted-foreground w-8 text-center tabular-nums">
                        {Math.round(zoom * 100)}%
                      </span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.min(1.6, z + 0.15))}>
                        <ZoomIn className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(1)}>
                        <RotateCcw className="w-3 h-3" />
                      </Button>
                    </div>
                    {/* Theme nav */}
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevTheme}>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                      <Badge variant="outline" className="text-[9px] px-2">
                        {currentTheme.preview} {currentTheme.name}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextTheme}>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* A4 Preview */}
                  <div className="bg-muted/40 rounded-xl p-4 flex items-center justify-center min-h-[280px]">
                    <LiveA4Preview
                      theme={currentTheme}
                      guillocheHTML={backgroundHTML}
                      guillocheBg={bgColor}
                      hasGuillocheBackground={hasBackground}
                      watermarkHTML={watermarkHTML}
                      documentTitle={documentTitle}
                      zoom={zoom}
                    />
                  </div>

                  {/* Active config summary */}
                  <motion.div
                    layout
                    className="flex items-center gap-1.5 flex-wrap px-1"
                  >
                    <Badge variant="outline" className="text-[9px] gap-1">
                      <Palette className="w-2.5 h-2.5" /> {currentTheme.name}
                    </Badge>
                    <Badge variant="outline" className="text-[9px] gap-1">
                      <Layout className="w-2.5 h-2.5" /> {currentLayout.name}
                    </Badge>
                    {hasBackground && (
                      <Badge className="text-[9px] gap-1 bg-emerald-600">
                        <Sparkles className="w-2.5 h-2.5" /> جيلوشي
                      </Badge>
                    )}
                    <Badge className="text-[9px] gap-1 bg-amber-600">
                      <Shield className="w-2.5 h-2.5" /> علامة مائية
                    </Badge>
                  </motion.div>
                </div>
              </TabsContent>

              {/* ── Tab: Themes ── */}
              <TabsContent value="themes" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-3">
                    <p className="text-xs text-muted-foreground mb-3">
                      اختر نمط لون وخطوط المستند — النمط المختار يطبق فوراً على المعاينة
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {filteredThemes.map((theme, i) => (
                        <MiniThemeCard
                          key={theme.id}
                          theme={theme}
                          selected={selectedTheme === theme.id}
                          onClick={() => setSelectedTheme(theme.id)}
                          index={i}
                        />
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* ── Tab: Layouts ── */}
              <TabsContent value="layouts" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-3">
                    <p className="text-xs text-muted-foreground mb-3">
                      اختر تخطيط ترتيب العناصر والجداول داخل المستند
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {LAYOUT_TEMPLATES.map((tmpl, i) => (
                        <MiniLayoutCard
                          key={tmpl.id}
                          template={tmpl}
                          selected={selectedLayout === tmpl.id}
                          onClick={() => setSelectedLayout(tmpl.id)}
                          index={i}
                        />
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* ── Tab: Security ── */}
              <TabsContent value="security" className="flex-1 m-0 overflow-auto">
                <div className="p-3 sm:p-4 space-y-3">
                  <SecurityLayerCard
                    icon={Sparkles}
                    title="خلفية الجيلوشي الأمنية"
                    description={hasBackground ? 'مفعّلة — إطار وزخارف أمنية غير قابلة للتزوير' : 'غير مفعّلة — فعّلها من إعدادات الجيلوشي'}
                    active={hasBackground}
                    index={0}
                  />
                  <SecurityLayerCard
                    icon={Shield}
                    title="العلامة المائية الديناميكية"
                    description="اسم الجهة + المستخدم + التوقيع الزمني (عربي + إنجليزي)"
                    active={true}
                    index={1}
                  />
                  <SecurityLayerCard
                    icon={QrCode}
                    title="رمز التحقق الرقمي QR"
                    description="رمز QR + باركود مرفق بكل مستند تلقائياً"
                    active={true}
                    index={2}
                  />
                  <SecurityLayerCard
                    icon={Fingerprint}
                    title="ختم التحقق الرقمي"
                    description="بصمة رقمية فريدة لكل مستند مع رقم مرجعي"
                    active={true}
                    index={3}
                  />
                  <SecurityLayerCard
                    icon={Lock}
                    title="تسجيل النشاط والمساءلة"
                    description="كل عملية طباعة أو تصدير مسجلة بالتفصيل"
                    active={true}
                    index={4}
                  />

                  <Separator className="my-3" />

                  {/* 3-Layer Visual */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="p-3 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border"
                  >
                    <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-primary" />
                      بنية المستند ثلاثية الطبقات
                    </p>
                    <div className="space-y-2">
                      {[
                        { z: 0, label: 'إطار وزخرفة الجيلوشي', color: 'bg-blue-500', textColor: 'text-blue-700 dark:text-blue-400' },
                        { z: 1, label: 'العلامة المائية الديناميكية', color: 'bg-amber-500', textColor: 'text-amber-700 dark:text-amber-400' },
                        { z: 2, label: 'محتوى المستند (النصوص + الجداول)', color: 'bg-emerald-500', textColor: 'text-emerald-700 dark:text-emerald-400' },
                      ].map((layer, i) => (
                        <motion.div
                          key={layer.z}
                          initial={{ x: 30, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.6 + i * 0.12 }}
                          className="flex items-center gap-2.5"
                        >
                          <div className={`w-6 h-6 rounded-md ${layer.color} flex items-center justify-center`}>
                            <span className="text-[9px] font-mono font-bold text-white">{layer.z}</span>
                          </div>
                          <span className={`text-xs font-medium ${layer.textColor}`}>{layer.label}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* ─── Right Panel: Persistent Preview (desktop) ─── */}
          <div className="hidden md:flex md:w-[45%] flex-col bg-gradient-to-b from-muted/30 to-muted/10 p-4 overflow-auto">
            <div className="flex items-center gap-2 mb-3">
              <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
                <Eye className="w-4 h-4 text-primary" />
              </motion.div>
              <span className="text-xs font-bold text-foreground">المعاينة الحية</span>
            </div>

            <div className="flex-1 flex items-start justify-center pt-2">
              <LiveA4Preview
                theme={currentTheme}
                guillocheHTML={backgroundHTML}
                guillocheBg={bgColor}
                hasGuillocheBackground={hasBackground}
                watermarkHTML={watermarkHTML}
                documentTitle={documentTitle}
                zoom={zoom}
              />
            </div>

            {/* Quick theme nav */}
            <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevTheme}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Badge variant="outline" className="text-[10px] px-3">
                {currentTheme.preview} {currentTheme.name}
              </Badge>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextTheme}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* ─── Footer ─── */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between px-4 sm:px-5 py-3 border-t bg-background/80 backdrop-blur-sm"
        >
          {/* Config badges - hidden on very small screens */}
          <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
            <Badge variant="outline" className="text-[9px]">
              {currentTheme.preview} {currentTheme.name}
            </Badge>
            <Badge variant="outline" className="text-[9px]">
              {currentLayout.preview} {currentLayout.name}
            </Badge>
          </div>

          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="touch-manipulation">
              إلغاء
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              className="gap-1.5 touch-manipulation"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">تصدير</span> PDF
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 touch-manipulation bg-primary hover:bg-primary/90"
            >
              <Printer className="w-3.5 h-3.5" />
              طباعة
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedDocumentPreview;
