import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ShieldBan, ShieldCheck, Truck, FileText, MessageSquareOff, FolderLock,
  EyeOff, Pause, Skull, Lock, CalendarClock, AlertTriangle, Undo2,
} from 'lucide-react';
import {
  usePartnerRestrictions, RestrictionType, RESTRICTION_TYPES,
} from '@/hooks/usePartnerRestrictions';

interface PartnerRestrictionManagerProps {
  targetOrgId: string;
  targetOrgName?: string;
  trigger?: React.ReactNode;
}

const ICON_MAP: Record<RestrictionType, React.ReactNode> = {
  block_shipments: <Truck className="h-4 w-4" />,
  block_invoices: <FileText className="h-4 w-4" />,
  block_messaging: <MessageSquareOff className="h-4 w-4" />,
  block_documents: <FolderLock className="h-4 w-4" />,
  block_visibility: <EyeOff className="h-4 w-4" />,
  suspend_partnership: <Pause className="h-4 w-4" />,
  blacklist: <Skull className="h-4 w-4" />,
  block_all: <Lock className="h-4 w-4" />,
};

const PartnerRestrictionManager = memo(({ targetOrgId, targetOrgName, trigger }: PartnerRestrictionManagerProps) => {
  const [open, setOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<RestrictionType[]>([]);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [confirmRemoveAll, setConfirmRemoveAll] = useState(false);

  const {
    isRestricted, getActiveRestrictions, addRestriction, removeRestriction,
    isAdding, isRemoving,
  } = usePartnerRestrictions(targetOrgId);

  const activeRestrictions = getActiveRestrictions(targetOrgId);
  const hasAnyRestriction = activeRestrictions.length > 0;

  const toggleType = (type: RestrictionType) => {
    if (type === 'block_all') {
      if (selectedTypes.includes('block_all')) {
        setSelectedTypes([]);
      } else {
        setSelectedTypes(RESTRICTION_TYPES.map(r => r.type));
      }
      return;
    }
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleApply = () => {
    if (selectedTypes.length === 0) return;
    addRestriction({
      restrictedOrgId: targetOrgId,
      types: selectedTypes,
      reason: reason.trim() || undefined,
      notes: notes.trim() || undefined,
      expiresAt: expiresAt || undefined,
    });
    setSelectedTypes([]);
    setReason('');
    setNotes('');
    setExpiresAt('');
  };

  const handleRemoveRestriction = (type: RestrictionType) => {
    removeRestriction({ restrictedOrgId: targetOrgId, types: [type] });
  };

  const handleRemoveAll = () => {
    removeRestriction({ restrictedOrgId: targetOrgId });
    setConfirmRemoveAll(false);
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button
          variant={hasAnyRestriction ? 'outline' : 'ghost'}
          size="sm"
          onClick={() => setOpen(true)}
          className={hasAnyRestriction
            ? 'gap-2 rounded-full border-destructive/30 text-destructive hover:bg-destructive/5'
            : 'gap-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/5'
          }
        >
          <ShieldBan className="h-4 w-4" />
          <span className="text-xs font-medium">
            {hasAnyRestriction ? `تقييدات نشطة (${activeRestrictions.length})` : 'تقييد الجهة'}
          </span>
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh]" dir="rtl">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-destructive/10">
                <ShieldBan className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <DialogTitle className="text-lg">تقييد {targetOrgName || 'الجهة'}</DialogTitle>
                <DialogDescription className="text-xs">
                  حدد أنواع التقييد المطلوبة لهذه الجهة
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-1">
            {/* Active Restrictions */}
            {activeRestrictions.length > 0 && (
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-destructive flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    تقييدات نشطة
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmRemoveAll(true)}
                    className="text-xs text-emerald-600 hover:text-emerald-700 gap-1 h-7"
                  >
                    <Undo2 className="h-3 w-3" />
                    إزالة الكل
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeRestrictions.map(type => {
                    const config = RESTRICTION_TYPES.find(r => r.type === type);
                    return (
                      <motion.div key={type} layout initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <Badge
                          variant="destructive"
                          className="gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleRemoveRestriction(type)}
                        >
                          {ICON_MAP[type]}
                          {config?.label}
                          <span className="text-[9px] opacity-70">✕</span>
                        </Badge>
                      </motion.div>
                    );
                  })}
                </div>
                <Separator className="my-3" />
              </div>
            )}

            {/* Add new restrictions */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">إضافة تقييد جديد</Label>
              <div className="grid gap-2">
                {RESTRICTION_TYPES.map(({ type, label, description }) => {
                  const isActive = activeRestrictions.includes(type);
                  const isSelected = selectedTypes.includes(type);

                  return (
                    <motion.div
                      key={type}
                      whileHover={{ scale: 1.01 }}
                      className={`
                        flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors
                        ${isActive ? 'bg-destructive/5 border-destructive/20 opacity-50 pointer-events-none' : ''}
                        ${isSelected && !isActive ? 'bg-destructive/10 border-destructive/30' : 'hover:bg-muted/50'}
                      `}
                      onClick={() => !isActive && toggleType(type)}
                    >
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                        {ICON_MAP[type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{label}</span>
                          {isActive && <Badge variant="outline" className="text-[9px] h-4">مُفعّل</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        checked={isSelected || isActive}
                        disabled={isActive}
                        onCheckedChange={() => !isActive && toggleType(type)}
                      />
                    </motion.div>
                  );
                })}
              </div>

              <AnimatePresence>
                {selectedTypes.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <Separator />
                    <div>
                      <Label className="text-xs">سبب التقييد</Label>
                      <Textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="أدخل سبب التقييد..."
                        rows={2}
                        className="mt-1 rounded-xl resize-none"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">ملاحظات إضافية</Label>
                      <Textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="ملاحظات داخلية (اختياري)..."
                        rows={2}
                        className="mt-1 rounded-xl resize-none"
                      />
                    </div>
                    <div>
                      <Label className="text-xs flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" />
                        تاريخ انتهاء التقييد (اختياري)
                      </Label>
                      <Input
                        type="datetime-local"
                        value={expiresAt}
                        onChange={e => setExpiresAt(e.target.value)}
                        className="mt-1 rounded-xl"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
              إغلاق
            </Button>
            {selectedTypes.length > 0 && (
              <Button
                onClick={handleApply}
                disabled={isAdding}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl gap-2"
              >
                <ShieldBan className="h-4 w-4" />
                تطبيق ({selectedTypes.filter(t => !activeRestrictions.includes(t)).length})
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Remove All */}
      <AlertDialog open={confirmRemoveAll} onOpenChange={setConfirmRemoveAll}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <div className="mx-auto p-3 rounded-2xl bg-emerald-500/10 w-fit">
              <ShieldCheck className="h-8 w-8 text-emerald-600" />
            </div>
            <AlertDialogTitle className="text-center">إزالة جميع التقييدات؟</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              سيتم إزالة جميع التقييدات المفروضة على {targetOrgName || 'هذه الجهة'} وإعادة العلاقة لوضعها الطبيعي.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveAll}
              disabled={isRemoving}
              className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl gap-2"
            >
              <ShieldCheck className="h-4 w-4" />
              تأكيد الإزالة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

PartnerRestrictionManager.displayName = 'PartnerRestrictionManager';
export default PartnerRestrictionManager;
