import { memo } from 'react';
import { ChevronDown, ChevronRight, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface OrgGroup {
  orgId: string;
  orgName: string;
  conversations: any[];
  totalUnread: number;
}

const OrgGroupHeader = memo(({ group, isExpanded, onToggle }: {
  group: OrgGroup;
  isExpanded: boolean;
  onToggle: () => void;
}) => (
  <button
    onClick={onToggle}
    className="w-full flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted/80 transition-colors text-start"
  >
    {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
    <Building2 className="w-4 h-4 text-primary/70" />
    <span className="text-xs font-semibold flex-1 truncate">{group.orgName}</span>
    <span className="text-[10px] text-muted-foreground">{group.conversations.length}</span>
    {group.totalUnread > 0 && (
      <Badge className="h-4 min-w-4 rounded-full text-[9px] px-1 bg-primary text-primary-foreground">
        {group.totalUnread}
      </Badge>
    )}
  </button>
));
OrgGroupHeader.displayName = 'OrgGroupHeader';

export default OrgGroupHeader;
