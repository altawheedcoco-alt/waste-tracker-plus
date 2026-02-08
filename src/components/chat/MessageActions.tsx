import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Reply, 
  Forward, 
  Copy, 
  Trash2, 
  Star,
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
  onReply?: (messageId: string) => void;
  onForward?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onStar?: (messageId: string) => void;
}

const MessageActions = ({
  messageContent,
  messageId,
  isOwn,
  onReply,
  onForward,
  onDelete,
  onStar
}: MessageActionsProps) => {
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      // Try to parse JSON content
      let textToCopy = messageContent;
      try {
        const parsed = JSON.parse(messageContent);
        textToCopy = parsed.text || messageContent;
      } catch {
        // Use original content
      }

      await navigator.clipboard.writeText(textToCopy);
      toast({
        title: 'تم النسخ',
        description: 'تم نسخ الرسالة إلى الحافظة',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل نسخ الرسالة',
        variant: 'destructive',
      });
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
      <DropdownMenuContent align={isOwn ? "start" : "end"}>
        {onReply && (
          <DropdownMenuItem onClick={() => onReply(messageId)}>
            <Reply className="w-4 h-4 ml-2" />
            رد
          </DropdownMenuItem>
        )}
        {onForward && (
          <DropdownMenuItem onClick={() => onForward(messageId)}>
            <Forward className="w-4 h-4 ml-2" />
            إعادة توجيه
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleCopy}>
          <Copy className="w-4 h-4 ml-2" />
          نسخ
        </DropdownMenuItem>
        {onStar && (
          <DropdownMenuItem onClick={() => onStar(messageId)}>
            <Star className="w-4 h-4 ml-2" />
            تمييز بنجمة
          </DropdownMenuItem>
        )}
        {isOwn && onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(messageId)}
              className="text-destructive"
            >
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
