import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Printer } from 'lucide-react';
import { PRINT_THEMES, getThemesByEntity, type PrintThemeId, type PrintTheme } from '@/lib/printThemes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PrintThemeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (themeId: PrintThemeId) => void;
  selectedTheme?: PrintThemeId;
  documentTitle?: string;
  entityType?: 'generator' | 'transporter' | 'recycler' | 'disposal';
}

const ThemePreviewCard = ({ theme, isSelected, onClick, documentTitle }: { theme: PrintTheme; isSelected: boolean; onClick: () => void; documentTitle: string }) => {
  const isGradient = theme.colors.headerBg.includes('gradient');

  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative text-right rounded-xl border-2 overflow-hidden transition-all ${
        isSelected
          ? 'border-primary shadow-lg ring-2 ring-primary/20'
          : 'border-border hover:border-primary/40 hover:shadow-md'
      }`}
    >
      {isSelected && (
        <div className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
      )}

      {/* Mini preview */}
      <div className="p-0">
        {/* Header preview */}
        <div
          className="px-3 py-2.5 text-center"
          style={{
            background: isGradient ? theme.colors.headerBg : theme.colors.headerBg,
            color: theme.decorations.headerStyle === 'boxed' ? theme.colors.primary : theme.colors.headerText,
            borderBottom: theme.decorations.headerStyle === 'boxed' ? `2px double ${theme.colors.primary}` : 'none',
            ...(theme.decorations.headerStyle === 'boxed' ? { background: 'transparent' } : {}),
          }}
        >
          <p className="text-[10px] font-bold truncate" style={{ fontFamily: theme.fonts.heading }}>
            {theme.preview} {documentTitle}
          </p>
        </div>

        {/* Body preview */}
        <div className="px-3 py-2" style={{ background: theme.colors.pageBg }}>
          {/* Mini info boxes */}
          <div className="flex gap-1 mb-1.5">
            <div className="flex-1 rounded px-1.5 py-1" style={{ background: theme.colors.tableStripeBg, borderRight: `2px solid ${theme.colors.accent}` }}>
              <div className="h-1 rounded w-8 mb-0.5" style={{ background: theme.colors.mutedText, opacity: 0.3 }} />
              <div className="h-1.5 rounded w-12" style={{ background: theme.colors.bodyText, opacity: 0.5 }} />
            </div>
            <div className="flex-1 rounded px-1.5 py-1" style={{ background: theme.colors.tableStripeBg, borderRight: `2px solid ${theme.colors.accent}` }}>
              <div className="h-1 rounded w-6 mb-0.5" style={{ background: theme.colors.mutedText, opacity: 0.3 }} />
              <div className="h-1.5 rounded w-10" style={{ background: theme.colors.bodyText, opacity: 0.5 }} />
            </div>
          </div>

          {/* Mini table */}
          <div className="rounded overflow-hidden" style={{ border: theme.borders.tableBorder }}>
            <div className="flex" style={{ background: theme.colors.tableHeaderBg }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="flex-1 px-1 py-0.5">
                  <div className="h-1 rounded mx-auto" style={{ background: theme.colors.tableHeaderText, opacity: 0.7, width: `${14 + i * 4}px` }} />
                </div>
              ))}
            </div>
            {[1, 2].map(row => (
              <div key={row} className="flex" style={{ background: row % 2 === 0 ? theme.colors.tableStripeBg : 'transparent', borderTop: theme.borders.tableBorder }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex-1 px-1 py-0.5">
                    <div className="h-1 rounded mx-auto" style={{ background: theme.colors.bodyText, opacity: 0.2, width: `${10 + i * 3}px` }} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Label */}
        <div className="px-3 py-2 border-t border-border bg-background">
          <p className="text-xs font-bold text-foreground">{theme.name}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">{theme.description}</p>
        </div>
      </div>
    </motion.button>
  );
};

const PrintThemeSelector = ({ open, onOpenChange, onSelect, selectedTheme = 'corporate', documentTitle = 'مستند رسمي', entityType }: PrintThemeSelectorProps) => {
  const filteredThemes = entityType ? getThemesByEntity(entityType) : PRINT_THEMES;
  const [selected, setSelected] = useState<PrintThemeId>(selectedTheme);

  const handleConfirm = () => {
    onSelect(selected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Printer className="w-5 h-5 text-primary" />
            اختر تنسيق الطباعة
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            اختر أحد الأنماط ({filteredThemes.length} تصميم) لتطبيقه على المستند قبل الطباعة أو التصدير
          </p>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
          {filteredThemes.map((theme) => (
            <ThemePreviewCard
              key={theme.id}
              theme={theme}
              isSelected={selected === theme.id}
              onClick={() => setSelected(theme.id)}
              documentTitle={documentTitle}
            />
          ))}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <Badge variant="outline" className="text-xs">
            {PRINT_THEMES.find(t => t.id === selected)?.preview} {PRINT_THEMES.find(t => t.id === selected)?.name}
          </Badge>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button onClick={handleConfirm}>
              <Printer className="w-4 h-4 ml-1" />
              تطبيق والطباعة
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrintThemeSelector;
