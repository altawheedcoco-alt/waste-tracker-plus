import { useState, useRef, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MentionableUser } from '@/hooks/useMentionableUsers';
import { ShipmentMention } from '@/hooks/useShipmentMentions';
import { Building2, User, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStatusConfig, mapLegacyStatus, wasteTypeLabels } from '@/lib/shipmentStatusConfig';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  users: MentionableUser[];
  shipments?: ShipmentMention[];
  onShipmentSearch?: (query: string) => void;
  onShipmentSelect?: (shipment: ShipmentMention) => void;
  placeholder?: string;
  rows?: number;
  dir?: string;
  className?: string;
  disabled?: boolean;
}

const MentionInput = ({
  value,
  onChange,
  users,
  shipments = [],
  onShipmentSearch,
  onShipmentSelect,
  placeholder = 'اكتب @ للإشارة لشخص أو # لشحنة...',
  rows = 3,
  dir = 'rtl',
  className,
  disabled,
}: MentionInputProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showShipmentDropdown, setShowShipmentDropdown] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPos, setCursorPos] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.organization_name.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 8);

  const findMentionTrigger = useCallback((text: string, pos: number) => {
    // Look backwards from cursor for @ that isn't inside a completed mention
    const before = text.slice(0, pos);
    const atIndex = before.lastIndexOf('@');
    if (atIndex === -1) return null;
    
    // Check if it's a new @mention (not part of @[name](id) pattern)
    const afterAt = before.slice(atIndex + 1);
    if (afterAt.includes(']') || afterAt.includes('(')) return null;
    
    // Make sure @ is at start or preceded by space/newline
    if (atIndex > 0 && !/[\s\n]/.test(before[atIndex - 1])) return null;
    
    return { start: atIndex, query: afterAt };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const pos = e.target.selectionStart || 0;
    setCursorPos(pos);
    onChange(newValue);

    const trigger = findMentionTrigger(newValue, pos);
    if (trigger) {
      setSearch(trigger.query);
      setShowDropdown(true);
      setSelectedIndex(0);
    } else {
      setShowDropdown(false);
    }
  };

  const insertMention = (user: MentionableUser) => {
    const trigger = findMentionTrigger(value, cursorPos);
    if (!trigger) return;

    const before = value.slice(0, trigger.start);
    const after = value.slice(cursorPos);
    const mention = `@[${user.full_name}](${user.id}) `;
    const newValue = before + mention + after;
    onChange(newValue);
    setShowDropdown(false);

    // Focus back and set cursor
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = before.length + mention.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
        setCursorPos(newPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filtered.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => (i + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      insertMention(filtered[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Render display text with highlighted mentions
  const displayValue = value.replace(
    /@\[([^\]]+)\]\(([^)]+)\)/g,
    '@$1'
  );

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={displayValue !== value ? value : value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        dir={dir}
        className={cn('resize-none', className)}
        disabled={disabled}
      />

      {showDropdown && filtered.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full max-w-sm bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
          style={{ bottom: 'auto' }}
        >
          <ScrollArea className="max-h-48">
            {filtered.map((user, index) => (
              <button
                key={user.id}
                type="button"
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 text-right text-sm transition-colors',
                  index === selectedIndex
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-muted'
                )}
                onClick={() => insertMention(user)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {user.full_name.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-right">
                  <p className="font-medium text-xs truncate">{user.full_name}</p>
                  <div className="flex items-center gap-1 justify-end">
                    {user.is_external ? (
                      <Building2 className="w-2.5 h-2.5 text-muted-foreground" />
                    ) : (
                      <User className="w-2.5 h-2.5 text-muted-foreground" />
                    )}
                    <span className="text-[10px] text-muted-foreground truncate">
                      {user.organization_name}
                    </span>
                    {user.is_external && (
                      <Badge variant="outline" className="text-[8px] py-0 h-3.5">خارجي</Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export { MentionInput };
