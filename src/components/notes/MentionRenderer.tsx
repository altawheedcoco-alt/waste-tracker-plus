import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { User, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Parses text containing @[Name](id) and #[SHP-001](id) markup
 * and renders them as interactive badges.
 */

const MENTION_REGEX = /@\[([^\]]+)\]\(([^)]+)\)/g;
const SHIPMENT_REGEX = /#\[([^\]]+)\]\(([^)]+)\)/g;

interface MentionRendererProps {
  content: string;
  className?: string;
}

const MentionRenderer = memo(({ content, className }: MentionRendererProps) => {
  const navigate = useNavigate();

  // Split text into parts: plain text, @mentions, #shipments
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  // Combined regex for both types
  const combined = /(@\[([^\]]+)\]\(([^)]+)\))|(#\[([^\]]+)\]\(([^)]+)\))/g;
  let match: RegExpExecArray | null;

  while ((match = combined.exec(content)) !== null) {
    // Add plain text before this match
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // @mention
      const name = match[2];
      const id = match[3];
      parts.push(
        <Badge
          key={`mention-${match.index}`}
          variant="outline"
          className="inline-flex items-center gap-0.5 text-[11px] py-0 px-1.5 mx-0.5 cursor-pointer
            text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100
            dark:text-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-800"
        >
          <User className="w-2.5 h-2.5" />
          {name}
        </Badge>
      );
    } else if (match[4]) {
      // #shipment
      const label = match[5];
      const id = match[6];
      parts.push(
        <Badge
          key={`shipment-${match.index}`}
          variant="outline"
          className="inline-flex items-center gap-0.5 text-[11px] py-0 px-1.5 mx-0.5 cursor-pointer
            text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100
            dark:text-blue-300 dark:bg-blue-900/20 dark:border-blue-800"
          onClick={() => navigate(`/dashboard/shipments/${id}`)}
        >
          <Truck className="w-2.5 h-2.5" />
          {label}
        </Badge>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  // If no mentions found, return plain text
  if (parts.length === 0) {
    return <span className={className}>{content}</span>;
  }

  return <span className={cn('whitespace-pre-wrap', className)}>{parts}</span>;
});

MentionRenderer.displayName = 'MentionRenderer';
export default MentionRenderer;
