import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { ChevronUp, ChevronDown, RotateCcw, Settings2, Eye, EyeOff } from 'lucide-react';
import { useSidebarPreferences } from '@/hooks/useSidebarPreferences';
import { useLanguage } from '@/contexts/LanguageContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

interface SidebarCustomizerProps {
  trigger?: React.ReactNode;
}

const SidebarCustomizer = ({ trigger }: SidebarCustomizerProps) => {
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();
  const {
    allGroups,
    effectivePrefs,
    saving,
    moveGroup,
    toggleGroupVisibility,
    resetToDefaults,
    hasCustomization,
  } = useSidebarPreferences();

  const order = effectivePrefs.group_order;
  const hidden = new Set(effectivePrefs.hidden_groups);

  // Sort all groups by current order
  const sortedGroups = [...allGroups].sort((a, b) => {
    const aIdx = order.indexOf(a.id);
    const bIdx = order.indexOf(b.id);
    if (aIdx === -1 && bIdx === -1) return 0;
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Settings2 className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            {language === 'ar' ? 'تخصيص القائمة الجانبية' : 'Customize Sidebar'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ar'
              ? 'رتّب الأقسام وأظهر أو أخفِ ما تحتاجه'
              : 'Reorder sections and show/hide as needed'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-1">
          <div className="space-y-1">
            <AnimatePresence>
              {sortedGroups.map((group, idx) => {
                const Icon = group.icon;
                const isHidden = hidden.has(group.id);
                const label = language === 'ar' ? group.labelAr : group.labelEn;

                return (
                  <motion.div
                    key={group.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: isHidden ? 0.5 : 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border transition-colors ${
                      isHidden
                        ? 'border-border/30 bg-muted/30'
                        : 'border-border/60 bg-card hover:bg-muted/40'
                    }`}
                  >
                    {/* Icon */}
                    <div className={`p-1.5 rounded-md shrink-0 ${
                      isHidden ? 'bg-muted' : 'bg-primary/10'
                    }`}>
                      <Icon className={`w-4 h-4 ${isHidden ? 'text-muted-foreground' : 'text-primary'}`} />
                    </div>

                    {/* Label + count */}
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium truncate block ${
                        isHidden ? 'text-muted-foreground line-through' : 'text-foreground'
                      }`}>
                        {label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {group.items.length} {language === 'ar' ? 'عنصر' : 'items'}
                      </span>
                    </div>

                    {/* Move buttons */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={idx === 0 || saving}
                        onClick={() => moveGroup(group.id, 'up')}
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={idx === sortedGroups.length - 1 || saving}
                        onClick={() => moveGroup(group.id, 'down')}
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {/* Visibility toggle */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => toggleGroupVisibility(group.id)}
                      disabled={saving}
                    >
                      {isHidden ? (
                        <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                      ) : (
                        <Eye className="w-3.5 h-3.5 text-primary" />
                      )}
                    </Button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefaults}
            disabled={saving || !hasCustomization}
            className="gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {language === 'ar' ? 'استعادة الافتراضي' : 'Reset'}
          </Button>
          <Badge variant="secondary" className="text-[10px]">
            {allGroups.length - hidden.size} / {allGroups.length} {language === 'ar' ? 'ظاهر' : 'visible'}
          </Badge>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SidebarCustomizer;
