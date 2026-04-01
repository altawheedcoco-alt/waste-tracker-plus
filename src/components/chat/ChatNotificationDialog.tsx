/**
 * ChatNotificationDialog — Per-conversation notification settings dialog
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, Moon, Clock, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useChatNotificationSettings, type NotificationLevel } from '@/hooks/useChatNotificationSettings';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string | null;
  partnerName?: string;
}

const NOTIFICATION_LEVELS: { value: NotificationLevel; label: string; icon: typeof Bell; desc: string }[] = [
  { value: 'all', label: 'الكل', icon: Bell, desc: 'إشعار لكل رسالة' },
  { value: 'mentions', label: 'الإشارات فقط', icon: Volume2, desc: 'عند الإشارة إليك @' },
  { value: 'none', label: 'كتم', icon: BellOff, desc: 'بدون إشعارات' },
];

const MUTE_DURATIONS = [
  { label: '١ ساعة', minutes: 60 },
  { label: '٨ ساعات', minutes: 480 },
  { label: '١ أسبوع', minutes: 10080 },
];

export default function ChatNotificationDialog({ open, onOpenChange, conversationId, partnerName }: Props) {
  const { settings, updateSettings, muteFor, isMuted } = useChatNotificationSettings(conversationId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Bell className="w-4 h-4 text-primary" />
            إعدادات إشعارات {partnerName || 'المحادثة'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Notification Level */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">مستوى الإشعارات</Label>
            <div className="grid grid-cols-3 gap-2">
              {NOTIFICATION_LEVELS.map(level => (
                <button
                  key={level.value}
                  onClick={() => updateSettings({ level: level.value })}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all text-center",
                    settings.level === level.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  <level.icon className="w-4 h-4" />
                  <span className="text-[10px] font-medium">{level.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Mute */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              كتم مؤقت
              {isMuted() && <Badge className="h-4 text-[9px] px-1.5 bg-amber-500/20 text-amber-600">مكتوم</Badge>}
            </Label>
            <div className="flex gap-2">
              {MUTE_DURATIONS.map(d => (
                <Button key={d.minutes} variant="outline" size="sm" className="flex-1 text-xs h-8"
                  onClick={() => { muteFor(d.minutes); onOpenChange(false); }}>
                  {d.label}
                </Button>
              ))}
            </div>
          </div>

          {/* DND Schedule */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Moon className="w-3 h-3" />
                وضع عدم الإزعاج
              </Label>
              <Switch
                checked={settings.dndEnabled}
                onCheckedChange={(checked) => updateSettings({ dndEnabled: checked })}
              />
            </div>
            <AnimatePresence>
              {settings.dndEnabled && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1">
                      <Label className="text-[10px] text-muted-foreground">من</Label>
                      <Input
                        type="time"
                        value={settings.dndStart}
                        onChange={(e) => updateSettings({ dndStart: e.target.value })}
                        className="h-8 text-xs"
                        dir="ltr"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-[10px] text-muted-foreground">إلى</Label>
                      <Input
                        type="time"
                        value={settings.dndEnd}
                        onChange={(e) => updateSettings({ dndEnd: e.target.value })}
                        className="h-8 text-xs"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
