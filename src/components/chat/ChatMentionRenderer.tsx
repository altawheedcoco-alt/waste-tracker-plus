import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { User, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

/**
 * Renders chat message text with @[Name](id) → green badge, #[SHP](id) → blue badge, and URLs → links
 */

const URL_REGEX = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]}"'])/g;
const MENTION_COMBINED = /(@\[([^\]]+)\]\(([^)]+)\))|(#\[([^\]]+)\]\(([^)]+)\))/g;

interface ChatMentionRendererProps {
  text: string;
  isOwn: boolean;
}

const ChatMentionRenderer = memo(({ text, isOwn }: ChatMentionRendererProps) => {
  const navigate = useNavigate();

  // First pass: split by mentions
  const segments: { type: 'text' | 'user' | 'shipment'; value: string; id?: string }[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  MENTION_COMBINED.lastIndex = 0;

  while ((match = MENTION_COMBINED.exec(text)) !== null) {
    if (match.index > lastIdx) {
      segments.push({ type: 'text', value: text.slice(lastIdx, match.index) });
    }
    if (match[1]) {
      segments.push({ type: 'user', value: match[2], id: match[3] });
    } else if (match[4]) {
      segments.push({ type: 'shipment', value: match[5], id: match[6] });
    }
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIdx) });
  }

  // Render each segment
  return (
    <span className="whitespace-pre-wrap">
      {segments.map((seg, i) => {
        if (seg.type === 'user') {
          return (
            <Badge
              key={i}
              variant="outline"
              className={cn(
                'inline-flex items-center gap-0.5 text-[11px] py-0 px-1.5 mx-0.5 font-medium',
                isOwn
                  ? 'text-primary-foreground bg-primary-foreground/20 border-primary-foreground/30'
                  : 'text-primary bg-primary/10 border-primary/20'
              )}
            >
              <User className="w-2.5 h-2.5" />
              {seg.value}
            </Badge>
          );
        }
        if (seg.type === 'shipment') {
          return (
            <Badge
              key={i}
              variant="outline"
              className={cn(
                'inline-flex items-center gap-0.5 text-[11px] py-0 px-1.5 mx-0.5 cursor-pointer',
                isOwn
                  ? 'text-white bg-white/20 border-white/30 hover:bg-white/30'
                  : 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 dark:text-blue-300 dark:bg-blue-900/20 dark:border-blue-800'
              )}
              onClick={() => navigate(`/dashboard/shipments/${seg.id}`)}
            >
              <Truck className="w-2.5 h-2.5" />
              {seg.value}
            </Badge>
          );
        }
        // Text segment - render URLs as links
        return <TextWithLinks key={i} text={seg.value} isOwn={isOwn} />;
      })}
    </span>
  );
});

/** Renders plain text with URL detection */
const TextWithLinks = memo(({ text, isOwn }: { text: string; isOwn: boolean }) => {
  URL_REGEX.lastIndex = 0;
  const parts = text.split(URL_REGEX);
  if (parts.length === 1) return <>{text}</>;

  return (
    <>
      {parts.map((part, i) => {
        URL_REGEX.lastIndex = 0;
        if (URL_REGEX.test(part)) {
          URL_REGEX.lastIndex = 0;
          let display = part.replace(/^https?:\/\/(www\.)?/, '');
          if (display.length > 40) display = display.substring(0, 37) + '...';
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'underline underline-offset-2 break-all',
                isOwn ? 'text-white/90 hover:text-white' : 'text-primary hover:text-primary/80'
              )}
              onClick={e => e.stopPropagation()}
            >
              {display}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
});

ChatMentionRenderer.displayName = 'ChatMentionRenderer';
TextWithLinks.displayName = 'TextWithLinks';
export default ChatMentionRenderer;
