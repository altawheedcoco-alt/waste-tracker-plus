import { cn } from '@/lib/utils';

interface MessageTailProps {
  isOwn: boolean;
}

/**
 * WhatsApp-style message bubble tail/arrow
 */
const MessageTail = ({ isOwn }: MessageTailProps) => (
  <div
    className={cn(
      "absolute top-0 w-3 h-3 overflow-hidden",
      isOwn ? "-right-1.5" : "-left-1.5"
    )}
  >
    <div
      className={cn(
        "w-3 h-3 transform rotate-45 origin-top-left",
        isOwn
          ? "bg-primary translate-x-[6px]"
          : "bg-card translate-x-[6px]"
      )}
    />
  </div>
);

export default MessageTail;
