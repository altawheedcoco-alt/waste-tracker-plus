import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  StickyNote, Plus, X, Loader2, Trash2, Pin, Clock,
  ChevronDown, ChevronUp, Edit3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

/**
 * QuickNotesWidget — ملاحظات سريعة شخصية للمستخدم
 * تُحفظ في quick_notes (أو localStorage كـ fallback)
 */

interface QuickNote {
  id: string;
  content: string;
  pinned: boolean;
  color: string;
  created_at: string;
}

const NOTE_COLORS = [
  { value: 'default', label: 'عادي', class: 'bg-card' },
  { value: 'yellow', label: 'أصفر', class: 'bg-amber-500/10' },
  { value: 'green', label: 'أخضر', class: 'bg-emerald-500/10' },
  { value: 'blue', label: 'أزرق', class: 'bg-blue-500/10' },
  { value: 'pink', label: 'وردي', class: 'bg-pink-500/10' },
];

const STORAGE_KEY = 'irecycle_quick_notes';

// Local storage fallback
const loadLocalNotes = (): QuickNote[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
};

const saveLocalNotes = (notes: QuickNote[]) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); } catch {}
};

const QuickNotesWidget = memo(() => {
  const { user } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [selectedColor, setSelectedColor] = useState('default');
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  // Use localStorage as the primary storage (no DB table needed)
  const { data: notes = [] } = useQuery({
    queryKey: ['quick-notes', user?.id],
    queryFn: () => loadLocalNotes(),
    enabled: !!user?.id,
    staleTime: Infinity,
  });

  const sortedNotes = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const visibleNotes = expanded ? sortedNotes : sortedNotes.slice(0, 3);

  const addNote = useCallback(() => {
    if (!newContent.trim()) return;

    const note: QuickNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      content: newContent.trim(),
      pinned: false,
      color: selectedColor,
      created_at: new Date().toISOString(),
    };

    const updated = [note, ...notes];
    saveLocalNotes(updated);
    queryClient.setQueryData(['quick-notes', user?.id], updated);
    setNewContent('');
    setSelectedColor('default');
    setIsAdding(false);
    toast.success('تمت إضافة الملاحظة');
  }, [newContent, selectedColor, notes, user?.id, queryClient]);

  const deleteNote = useCallback((id: string) => {
    const updated = notes.filter(n => n.id !== id);
    saveLocalNotes(updated);
    queryClient.setQueryData(['quick-notes', user?.id], updated);
    toast.success('تم حذف الملاحظة');
  }, [notes, user?.id, queryClient]);

  const togglePin = useCallback((id: string) => {
    const updated = notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n);
    saveLocalNotes(updated);
    queryClient.setQueryData(['quick-notes', user?.id], updated);
  }, [notes, user?.id, queryClient]);

  if (!user?.id) return null;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
          className="h-7 px-2"
        >
          {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] h-5">{notes.length}</Badge>
          <h3 className="font-bold text-sm flex items-center gap-1.5">
            <StickyNote className="w-4 h-4 text-amber-500" />
            ملاحظاتي
          </h3>
        </div>
      </div>

      {/* Add note form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 border-b border-border space-y-2">
              <Textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="اكتب ملاحظتك هنا..."
                className="text-sm min-h-[60px] resize-none"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addNote();
                }}
              />
              <div className="flex items-center justify-between">
                <Button size="sm" onClick={addNote} disabled={!newContent.trim()} className="h-7 text-xs">
                  حفظ
                </Button>
                <div className="flex gap-1">
                  {NOTE_COLORS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setSelectedColor(c.value)}
                      className={cn(
                        'w-5 h-5 rounded-full border-2 transition-all',
                        c.class,
                        selectedColor === c.value ? 'border-primary scale-110' : 'border-transparent'
                      )}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes list */}
      <div className="divide-y divide-border">
        {sortedNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Edit3 className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">لا توجد ملاحظات</p>
            <p className="text-xs mt-1">اضغط + لإضافة ملاحظة سريعة</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {visibleNotes.map((note, i) => {
              const colorClass = NOTE_COLORS.find(c => c.value === note.color)?.class || 'bg-card';

              return (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={cn('px-4 py-3 group', colorClass)}
                >
                  <div className="flex items-start gap-2">
                    {/* Content */}
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                        {note.content}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {note.pinned && (
                          <Pin className="w-3 h-3 text-primary fill-primary" />
                        )}
                        <span className="text-[10px] text-muted-foreground/60">
                          {formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale: ar })}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => togglePin(note.id)}
                        className="p-1 rounded hover:bg-muted/80"
                        title={note.pinned ? 'إلغاء التثبيت' : 'تثبيت'}
                      >
                        <Pin className={cn('w-3 h-3', note.pinned ? 'text-primary fill-primary' : 'text-muted-foreground')} />
                      </button>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="p-1 rounded hover:bg-destructive/10"
                        title="حذف"
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Expand/Collapse */}
      {sortedNotes.length > 3 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full h-8 rounded-none border-t border-border text-xs"
        >
          {expanded ? (
            <><ChevronUp className="w-3.5 h-3.5 ml-1" /> عرض أقل</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5 ml-1" /> عرض {sortedNotes.length - 3} ملاحظات أخرى</>
          )}
        </Button>
      )}
    </div>
  );
});

QuickNotesWidget.displayName = 'QuickNotesWidget';
export default QuickNotesWidget;
