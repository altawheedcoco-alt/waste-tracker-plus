/**
 * UnifiedDocumentPreview — معاينة شاملة للمستند النهائي
 * 
 * تبويبات:
 *   1. أنماط الطباعة (Print Themes)
 *   2. خلفيات الجيلوشي (Guilloche Backgrounds)
 *   3. تخطيط المستند (Layout Templates)
 *   4. معاينة حية (Live A4 Preview with 3 layers)
 */

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette, Layout, Shield, Eye, Check, Printer, FileDown,
  Layers, Sparkles, X
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
  previewContent?: string; // HTML snippet for live preview
}

export interface DocumentOutputConfig {
  themeId: PrintThemeId;
  layoutId: LayoutTemplateId;
  hasGuillocheBackground: boolean;
  hasWatermark: boolean;
}

// ─── Mini Theme Card ─────────────────────────────────────
const MiniThemeCard = ({ theme, selected, onClick }: { theme: PrintTheme; selected: boolean; onClick: () => void }) => (
  <motion.button
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={`relative text-right rounded-lg border-2 overflow-hidden transition-all w-full ${
      selected ? 'border-primary shadow-md ring-2 ring-primary/20' : 'border-border hover:border-primary/30'
    }`}
  >
    {selected && (
      <div className="absolute top-1.5 left-1.5 z-10 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
        <Check className="w-3 h-3 text-primary-foreground" />
      </div>
    )}
    <div className="px-2.5 py-2" style={{ background: theme.colors.headerBg }}>
      <p className="text-[9px] font-bold truncate" style={{ color: theme.colors.headerText, fontFamily: theme.fonts.heading }}>
        {theme.preview} {theme.name}
      </p>
    </div>
    <div className="px-2.5 py-1.5 bg-background">
      <p className="text-[9px] text-muted-foreground truncate">{theme.description}</p>
    </div>
  </motion.button>
);

// ─── Mini Layout Card ────────────────────────────────────
const MiniLayoutCard = ({ template, selected, onClick }: { template: LayoutTemplate; selected: boolean; onClick: () => void }) => (
  <motion.button
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={`relative text-right rounded-lg border-2 overflow-hidden transition-all w-full ${
      selected ? 'border-primary shadow-md ring-2 ring-primary/20' : 'border-border hover:border-primary/30'
    }`}
  >
    {selected && (
      <div className="absolute top-1.5 left-1.5 z-10 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
        <Check className="w-3 h-3 text-primary-foreground" />
      </div>
    )}
    <div className="p-2 bg-muted/30">
      <div className="bg-background rounded border p-1.5 space-y-1" style={{ minHeight: '40px' }}>
        <div className="h-1.5 w-8 rounded bg-primary/30 mx-auto" />
        <div className="h-1 w-full rounded bg-muted-foreground/15" />
        <div className="h-1 w-3/4 rounded bg-muted-foreground/10" />
      </div>
    </div>
    <div className="px-2.5 py-1.5 border-t bg-background">
      <p className="text-[9px] font-bold text-foreground">{template.preview} {template.name}</p>
    </div>
  </motion.button>
);

// ─── Live A4 Preview ─────────────────────────────────────
const LiveA4Preview = ({
  theme,
  layout,
  guillocheHTML,
  guillocheBg,
  hasGuillocheBackground,
  watermarkHTML,
  documentTitle,
}: {
  theme: PrintTheme;
  layout: LayoutTemplate;
  guillocheHTML: string | null;
  guillocheBg: string | undefined;
  hasGuillocheBackground: boolean;
  watermarkHTML: string;
  documentTitle: string;
}) => {
  const previewScale = 0.32;

  return (
    <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
      <div
        className="relative overflow-hidden shadow-xl"
        style={{
          width: `${210 * previewScale}mm`,
          height: `${297 * previewScale}mm`,
          borderRadius: '2px',
          border: '1px solid hsl(var(--border))',
        }}
      >
        {/* Scaled inner page */}
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

          {/* Layer 3: Content preview */}
          <div style={{ position: 'relative', zIndex: 2, padding: '10mm 12mm' }}>
            {/* Header */}
            <div
              style={{
                background: theme.colors.headerBg,
                color: theme.colors.headerText,
                padding: theme.spacing.headerPadding,
                borderRadius: theme.borders.radius,
                marginBottom: '12px',
                textAlign: 'center',
              }}
            >
              <h1 style={{ fontSize: '18pt', fontFamily: theme.fonts.heading, margin: 0, fontWeight: 700 }}>
                ♻ {documentTitle}
              </h1>
              <p style={{ fontSize: '10pt', opacity: 0.8, margin: '4px 0 0' }}>نموذج معاينة المستند</p>
            </div>

            {/* Info boxes */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {['بيانات الجهة', 'بيانات الشحنة'].map((label, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: theme.colors.tableStripeBg,
                    borderRight: `3px solid ${theme.colors.accent}`,
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ fontSize: '8pt', color: theme.colors.mutedText, marginBottom: '2px' }}>{label}</div>
                  <div style={{ fontSize: '10pt', color: theme.colors.bodyText, fontWeight: 600 }}>بيانات تجريبية</div>
                </div>
              ))}
            </div>

            {/* Table preview */}
            <div style={{ borderRadius: theme.borders.radius, overflow: 'hidden', border: theme.borders.tableBorder }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
                <thead>
                  <tr style={{ background: theme.colors.tableHeaderBg, color: theme.colors.tableHeaderText }}>
                    {['#', 'الصنف', 'الكمية', 'الوزن', 'الحالة'].map((h, i) => (
                      <th key={i} style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3].map(row => (
                    <tr key={row} style={{ background: row % 2 === 0 ? theme.colors.tableStripeBg : 'transparent', borderTop: theme.borders.tableBorder }}>
                      <td style={{ padding: '5px 8px', color: theme.colors.bodyText }}>{row}</td>
                      <td style={{ padding: '5px 8px', color: theme.colors.bodyText }}>نوع المخلفات</td>
                      <td style={{ padding: '5px 8px', color: theme.colors.bodyText }}>٥٠٠</td>
                      <td style={{ padding: '5px 8px', color: theme.colors.bodyText }}>١٢٠ كجم</td>
                      <td style={{ padding: '5px 8px' }}>
                        <span style={{ background: '#dcfce7', color: '#166534', padding: '1px 6px', borderRadius: '10px', fontSize: '8pt' }}>مكتمل</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer preview */}
            <div style={{ marginTop: '16px', paddingTop: '8px', borderTop: `2px solid ${theme.colors.accent}`, textAlign: 'center' }}>
              <p style={{ fontSize: '7pt', color: theme.colors.mutedText }}>
                مستند صادر آلياً من نظام iRecycle | هوية التحقق الرقمي
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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

  const { backgroundHTML, bgColor, hasBackground } = useGuillocheBackground();
  const { organization, profile, user } = useAuth();

  const orgName = organization?.name || 'اسم الجهة';
  const userName = profile?.full_name || user?.email || 'المستخدم';

  const filteredThemes = entityType ? getThemesByEntity(entityType) : PRINT_THEMES;
  const currentTheme = PRINT_THEMES.find(t => t.id === selectedTheme) || PRINT_THEMES[0];
  const currentLayout = LAYOUT_TEMPLATES.find(l => l.id === selectedLayout) || LAYOUT_TEMPLATES[0];

  const watermarkHTML = useMemo(() => generatePrintWatermarkHTML(orgName, userName), [orgName, userName]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] p-0 overflow-hidden" dir="rtl">
        <DialogHeader className="px-5 pt-5 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Layers className="w-5 h-5 text-primary" />
            معاينة وتنسيق المستند الشامل
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            اختر نمط الطباعة والتخطيط وخلفية الجيلوشي ثم راجع المعاينة الحية قبل الطباعة أو التصدير
          </p>
        </DialogHeader>

        <div className="flex flex-col md:flex-row h-full" style={{ maxHeight: 'calc(92vh - 140px)' }}>
          {/* ─── Left: Tabs for selections ─── */}
          <div className="md:w-[55%] border-l">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="w-full rounded-none border-b bg-muted/30 px-2 pt-1 h-auto flex-wrap gap-0.5">
                <TabsTrigger value="preview" className="gap-1 text-xs px-2.5 py-1.5">
                  <Eye className="w-3.5 h-3.5" /> معاينة حية
                </TabsTrigger>
                <TabsTrigger value="themes" className="gap-1 text-xs px-2.5 py-1.5">
                  <Palette className="w-3.5 h-3.5" /> الأنماط
                  <Badge variant="secondary" className="text-[8px] px-1 py-0 mr-0.5">{filteredThemes.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="layouts" className="gap-1 text-xs px-2.5 py-1.5">
                  <Layout className="w-3.5 h-3.5" /> التخطيط
                  <Badge variant="secondary" className="text-[8px] px-1 py-0 mr-0.5">{LAYOUT_TEMPLATES.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-1 text-xs px-2.5 py-1.5">
                  <Shield className="w-3.5 h-3.5" /> الأمان
                </TabsTrigger>
              </TabsList>

              {/* Tab: Live Preview */}
              <TabsContent value="preview" className="flex-1 m-0 p-3">
                <LiveA4Preview
                  theme={currentTheme}
                  layout={currentLayout}
                  guillocheHTML={backgroundHTML}
                  guillocheBg={bgColor}
                  hasGuillocheBackground={hasBackground}
                  watermarkHTML={watermarkHTML}
                  documentTitle={documentTitle}
                />
              </TabsContent>

              {/* Tab: Themes */}
              <TabsContent value="themes" className="flex-1 m-0">
                <ScrollArea className="h-[400px] md:h-full">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3">
                    {filteredThemes.map(theme => (
                      <MiniThemeCard
                        key={theme.id}
                        theme={theme}
                        selected={selectedTheme === theme.id}
                        onClick={() => setSelectedTheme(theme.id)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Tab: Layouts */}
              <TabsContent value="layouts" className="flex-1 m-0">
                <ScrollArea className="h-[400px] md:h-full">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3">
                    {LAYOUT_TEMPLATES.map(tmpl => (
                      <MiniLayoutCard
                        key={tmpl.id}
                        template={tmpl}
                        selected={selectedLayout === tmpl.id}
                        onClick={() => setSelectedLayout(tmpl.id)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Tab: Security Layers */}
              <TabsContent value="security" className="flex-1 m-0 p-4 space-y-4">
                <div className="space-y-3">
                  {/* Guilloche Status */}
                  <div className={`flex items-center gap-3 p-3 rounded-lg border ${hasBackground ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' : 'bg-muted/30 border-border'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${hasBackground ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-muted'}`}>
                      <Sparkles className={`w-4 h-4 ${hasBackground ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">خلفية الجيلوشي الأمنية</p>
                      <p className="text-xs text-muted-foreground">
                        {hasBackground ? 'مفعّلة — إطار وزخارف أمنية محفوظة' : 'غير مفعّلة — يمكنك تفعيلها من إعدادات الجيلوشي'}
                      </p>
                    </div>
                    <Badge variant={hasBackground ? 'default' : 'outline'} className="text-[10px]">
                      {hasBackground ? '✓ مفعّل' : 'غير مفعّل'}
                    </Badge>
                  </div>

                  {/* Watermark Status */}
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900">
                      <Shield className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">العلامة المائية الديناميكية</p>
                      <p className="text-xs text-muted-foreground">
                        اسم الجهة + المستخدم + التاريخ والوقت (عربي + إنجليزي)
                      </p>
                    </div>
                    <Badge variant="default" className="text-[10px]">✓ تلقائي</Badge>
                  </div>

                  {/* 3-Layer Architecture Info */}
                  <div className="mt-4 p-3 rounded-lg bg-muted/30 border">
                    <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-primary" />
                      بنية المستند ثلاثية الطبقات
                    </p>
                    <div className="space-y-1.5">
                      {[
                        { z: 0, label: 'الطبقة 1: إطار وزخرفة الجيلوشي', color: 'text-blue-600' },
                        { z: 1, label: 'الطبقة 2: العلامة المائية (الجهة + المستخدم + الوقت)', color: 'text-amber-600' },
                        { z: 2, label: 'الطبقة 3: محتوى المستند (النصوص والجداول)', color: 'text-emerald-600' },
                      ].map(layer => (
                        <div key={layer.z} className="flex items-center gap-2 text-xs">
                          <span className={`font-mono font-bold ${layer.color}`}>z:{layer.z}</span>
                          <span className="text-muted-foreground">{layer.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* ─── Right: Persistent Live Preview (desktop) ─── */}
          <div className="hidden md:flex md:w-[45%] flex-col bg-muted/20 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-foreground">المعاينة الحية</span>
              <Badge variant="outline" className="text-[8px] mr-auto">
                {currentTheme.preview} {currentTheme.name} + {currentLayout.preview} {currentLayout.name}
              </Badge>
            </div>
            <div className="flex-1 flex items-start justify-center">
              <LiveA4Preview
                theme={currentTheme}
                layout={currentLayout}
                guillocheHTML={backgroundHTML}
                guillocheBg={bgColor}
                hasGuillocheBackground={hasBackground}
                watermarkHTML={watermarkHTML}
                documentTitle={documentTitle}
              />
            </div>
          </div>
        </div>

        {/* ─── Footer Actions ─── */}
        <div className="flex items-center justify-between px-5 py-3 border-t bg-background">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px]">
              {currentTheme.preview} {currentTheme.name}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {currentLayout.preview} {currentLayout.name}
            </Badge>
            {hasBackground && (
              <Badge variant="secondary" className="text-[10px]">
                <Sparkles className="w-3 h-3 ml-0.5" /> جيلوشي
              </Badge>
            )}
            <Badge variant="secondary" className="text-[10px]">
              <Shield className="w-3 h-3 ml-0.5" /> علامة مائية
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-1">
              <FileDown className="w-3.5 h-3.5" />
              تصدير PDF
            </Button>
            <Button size="sm" onClick={handlePrint} className="gap-1">
              <Printer className="w-3.5 h-3.5" />
              طباعة
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedDocumentPreview;
