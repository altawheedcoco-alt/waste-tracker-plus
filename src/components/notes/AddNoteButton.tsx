import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StickyNote } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useNotes } from '@/hooks/useNotes';
import AddNoteDialog from './AddNoteDialog';
import { cn } from '@/lib/utils';

interface AddNoteButtonProps {
  resourceType: string;
  resourceId: string;
  variant?: 'default' | 'ghost' | 'outline' | 'secondary';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  showCount?: boolean;
  className?: string;
  label?: string;
}

const AddNoteButton = ({
  resourceType,
  resourceId,
  variant = 'outline',
  size = 'sm',
  showCount = true,
  className,
  label = 'ملاحظة',
}: AddNoteButtonProps) => {
  const [open, setOpen] = useState(false);
  const { notesCount } = useNotes(resourceType, resourceId);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={cn("gap-1 relative", className)}
            onClick={() => setOpen(true)}
          >
            <StickyNote className="h-4 w-4" />
            {size !== 'icon' && label}
            {showCount && notesCount > 0 && (
              <Badge
                variant="secondary"
                className="h-5 min-w-[20px] px-1 text-xs absolute -top-2 -left-2"
              >
                {notesCount}
              </Badge>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>إضافة ملاحظة</TooltipContent>
      </Tooltip>

      <AddNoteDialog
        open={open}
        onOpenChange={setOpen}
        resourceType={resourceType}
        resourceId={resourceId}
      />
    </>
  );
};

export default AddNoteButton;
