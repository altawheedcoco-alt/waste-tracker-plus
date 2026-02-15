import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StickyNote, Plus, Loader2, Filter } from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import NoteItem from './NoteItem';
import AddNoteDialog from './AddNoteDialog';

interface NotesPanelProps {
  resourceType: string;
  resourceId: string;
  title?: string;
  showCard?: boolean;
  maxHeight?: number;
  compact?: boolean;
}

const NotesPanel = ({
  resourceType,
  resourceId,
  title = 'الملاحظات',
  showCard = true,
  maxHeight = 500,
  compact = false,
}: NotesPanelProps) => {
  const { notes, notesCount, isLoading } = useNotes(resourceType, resourceId);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pinned' | 'unresolved'>('all');

  const filteredNotes = notes.filter((n) => {
    if (filter === 'pinned') return n.is_pinned;
    if (filter === 'unresolved') return !n.is_resolved;
    return true;
  });

  const content = (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant={filter === 'all' ? 'default' : 'ghost'}
            className="text-xs h-7"
            onClick={() => setFilter('all')}
          >
            الكل ({notesCount})
          </Button>
          <Button
            size="sm"
            variant={filter === 'pinned' ? 'default' : 'ghost'}
            className="text-xs h-7"
            onClick={() => setFilter('pinned')}
          >
            المثبتة
          </Button>
          <Button
            size="sm"
            variant={filter === 'unresolved' ? 'default' : 'ghost'}
            className="text-xs h-7"
            onClick={() => setFilter('unresolved')}
          >
            غير محلولة
          </Button>
        </div>
        <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-1">
          <Plus className="h-4 w-4" />
          {!compact && 'إضافة ملاحظة'}
        </Button>
      </div>

      {/* Notes List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <StickyNote className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">لا توجد ملاحظات بعد</p>
          <Button size="sm" variant="link" onClick={() => setShowAddDialog(true)}>
            أضف أول ملاحظة
          </Button>
        </div>
      ) : (
        <ScrollArea style={{ maxHeight }}>
          <div className="space-y-3 pl-1">
            {filteredNotes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                resourceType={resourceType}
                resourceId={resourceId}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      <AddNoteDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        resourceType={resourceType}
        resourceId={resourceId}
      />
    </div>
  );

  if (!showCard) return content;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 justify-end text-base">
          {notesCount > 0 && (
            <Badge variant="secondary" className="text-xs">{notesCount}</Badge>
          )}
          <span>{title}</span>
          <StickyNote className="h-5 w-5 text-primary" />
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
};

export default NotesPanel;
