import { 
  Reply, 
  Forward, 
  Copy, 
  Trash2, 
  Star,
  Pin,
  Timer,
  MoreHorizontal 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MessageActionsProps {
  messageContent: string;
  messageId: string;
  isOwn: boolean;
  isPinned?: boolean;
  onReply?: () => void;
  onForward?: () => void;
  onDelete?: () => void;
  onStar?: () => void;
  onPin?: () => void;
}

const MessageActions = ({
  messageContent,
  messageId,
  isOwn,
  isPinned,
  onReply,
  onForward,
  onDelete,
  onStar,
  onPin,
}: MessageActionsProps) => {
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      let textToCopy = messageContent;
      try {
        const parsed = JSON.parse(messageContent);
        textToCopy = parsed.text || messageContent;
      } catch { /* Use original */ }
      await navigator.clipboard.writeText(textToCopy);
      toast({ title: 'تم النسخ', description: 'تم نسخ الرسالة إلى الحافظة' });
    } catch {
      toast({ title: 'خطأ', description: 'فشل نسخ الرسالة', variant: 'destructive' });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            "h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity",
            "absolute top-1/2 -translate-y-1/2",
            isOwn ? "-left-8" : "-right-8"
          )}
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isOwn ? "start" : "end"} className="min-w-[140px]">
        {onReply && (
          <DropdownMenuItem onClick={onReply}>
            <Reply className="w-4 h-4 ml-2" />
            رد
          </DropdownMenuItem>
        )}
        {onForward && (
          <DropdownMenuItem onClick={onForward}>
            <Forward className="w-4 h-4 ml-2" />
            إعادة توجيه
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleCopy}>
          <Copy className="w-4 h-4 ml-2" />
          نسخ
        </DropdownMenuItem>
        {onPin && (
          <DropdownMenuItem onClick={onPin}>
            <Pin className="w-4 h-4 ml-2" />
            {isPinned ? 'إلغاء التثبيت' : 'تثبيت الرسالة'}
          </DropdownMenuItem>
        )}
        {onStar && (
          <DropdownMenuItem onClick={onStar}>
            <Star className="w-4 h-4 ml-2" />
            تمييز بنجمة
          </DropdownMenuItem>
        )}
        {isOwn && onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="w-4 h-4 ml-2" />
              حذف
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MessageActions;
