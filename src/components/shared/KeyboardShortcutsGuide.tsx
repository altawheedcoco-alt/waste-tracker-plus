import { useKeyboardShortcutContext } from '@/contexts/KeyboardShortcutContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

interface ShortcutItem {
  keys: string[];
  label: string;
}

interface ShortcutGroup {
  title: string;
  items: ShortcutItem[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'تنقل عام',
    items: [
      { keys: ['Backspace'], label: 'الرجوع للصفحة السابقة' },
      { keys: ['Alt', '←'], label: 'الرجوع للصفحة السابقة' },
      { keys: ['Escape'], label: 'إغلاق النافذة / الحوار المفتوح' },
      { keys: ['Alt', '1-9'], label: 'التنقل السريع لأقسام القائمة' },
      { keys: ['↑', '↓'], label: 'التنقل بين الصفوف في الجداول' },
      { keys: ['←', '→'], label: 'التنقل بين التبويبات' },
      { keys: ['Enter'], label: 'فتح العنصر المحدد' },
    ],
  },
  {
    title: 'مستندات وطباعة',
    items: [
      { keys: ['Ctrl', 'P'], label: 'طباعة المستند المفتوح' },
      { keys: ['Ctrl', 'D'], label: 'تحميل PDF' },
      { keys: ['+'], label: 'تكبير المعاينة' },
      { keys: ['-'], label: 'تصغير المعاينة' },
    ],
  },
  {
    title: 'اختصارات سريعة',
    items: [
      { keys: ['Ctrl', 'K'], label: 'فتح البحث السريع' },
      { keys: ['Ctrl', '/'], label: 'عرض دليل الاختصارات' },
    ],
  },
  {
    title: 'الدردشة',
    items: [
      { keys: ['Ctrl', 'Enter'], label: 'إرسال الرسالة' },
      { keys: ['Escape'], label: 'إغلاق نافذة الدردشة' },
    ],
  },
];

const Kbd = ({ children }: { children: string }) => (
  <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 text-xs font-mono font-semibold bg-muted border border-border rounded-md shadow-sm text-foreground">
    {children}
  </kbd>
);

const KeyboardShortcutsGuide = () => {
  const { guideOpen, setGuideOpen } = useKeyboardShortcutContext();

  return (
    <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <Keyboard className="h-5 w-5 text-primary" />
            اختصارات لوحة المفاتيح
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-primary mb-3">{group.title}</h3>
              <div className="space-y-2">
                {group.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                    <span className="text-sm text-foreground">{item.label}</span>
                    <div className="flex items-center gap-1 shrink-0 mr-4">
                      {item.keys.map((k, j) => (
                        <span key={j} className="flex items-center gap-0.5">
                          {j > 0 && <span className="text-xs text-muted-foreground mx-0.5">+</span>}
                          <Kbd>{k}</Kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t text-center">
          <p className="text-xs text-muted-foreground">
            اضغط <Kbd>Ctrl</Kbd> <span className="text-muted-foreground">+</span> <Kbd>/</Kbd> في أي وقت لعرض هذا الدليل
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsGuide;
