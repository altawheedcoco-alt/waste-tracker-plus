import { useState, useRef, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MentionableUser } from '@/hooks/useMentionableUsers';
import { ShipmentMention } from '@/hooks/useShipmentMentions';
import { Building2, User, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const findTrigger = useCallback((text: string, pos: number, char: '@' | '#') => {
    const before = text.slice(0, pos);
    const idx = before.lastIndexOf(char);
    if (idx === -1) return null;
    const afterChar = before.slice(idx + 1);
    if (afterChar.includes(']') || afterChar.includes('(')) return null;
    if (idx > 0 && !/[\s\n]/.test(before[idx - 1])) return null;
    return { start: idx, query: afterChar };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const pos = e.target.selectionStart || 0;
    setCursorPos(pos);
    onChange(newValue);

    const atTrigger = findTrigger(newValue, pos, '@');
    if (atTrigger) {
      setSearch(atTrigger.query);
      setShowDropdown(true);
      setShowShipmentDropdown(false);
      setSelectedIndex(0);
      return;
    }

    const hashTrigger = findTrigger(newValue, pos, '#');
    if (hashTrigger && onShipmentSearch) {
      setSearch(hashTrigger.query);
      setShowShipmentDropdown(true);
      setShowDropdown(false);
      setSelectedIndex(0);
      onShipmentSearch(hashTrigger.query);
      return;
    }

    setShowDropdown(false);
    setShowShipmentDropdown(false);
  };

  const insertMention = (user: MentionableUser) => {
    const trigger = findTrigger(value, cursorPos, '@');
    if (!trigger) return;
    const before = value.slice(0, trigger.start);
    const after = value.slice(cursorPos);
    const mention = `@[${user.full_name}](${user.id}) `;
    onChange(before + mention + after);
    setShowDropdown(false);
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = before.length + mention.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
        setCursorPos(newPos);
      }
    }, 0);
  };

  const insertShipmentMention = (shipment: ShipmentMention) => {
    const trigger = findTrigger(value, cursorPos, '#');
    if (!trigger) return;
    const before = value.slice(0, trigger.start);
    const after = value.slice(cursorPos);
    const mention = `#[${shipment.shipment_number}](${shipment.id}) `;
    onChange(before + mention + after);
    setShowShipmentDropdown(false);
    onShipmentSelect?.(shipment);
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = before.length + mention.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
        setCursorPos(newPos);
      }
    }, 0);
  };

  const activeDropdown = showDropdown ? 'user' : showShipmentDropdown ? 'shipment' : null;
  const activeList = activeDropdown === 'user' ? filtered : shipments;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!activeDropdown || activeList.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => (i + 1) % activeList.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => (i - 1 + activeList.length) % activeList.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (activeDropdown === 'user') insertMention(filtered[selectedIndex]);
      else insertShipmentMention(shipments[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setShowShipmentDropdown(false);
    }
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setShowShipmentDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        dir={dir}
        className={cn('resize-none', className)}
        disabled={disabled}
      />

      {/* User mention dropdown */}
      {showDropdown && filtered.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full max-w-sm bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
        >
          <ScrollArea className="max-h-48">
            {filtered.map((user, index) => (
              <button
                key={user.id}
                type="button"
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 text-right text-sm transition-colors',
                  index === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
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

      {/* Shipment mention dropdown */}
      {showShipmentDropdown && shipments.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full max-w-sm bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
        >
          <ScrollArea className="max-h-48">
            {shipments.map((s, index) => (
              <button
                key={s.id}
                type="button"
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 text-right text-sm transition-colors',
                  index === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                )}
                onClick={() => insertShipmentMention(s)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Package className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0 text-right">
                  <p className="font-medium text-xs" dir="ltr">#{s.shipment_number}</p>
                  <div className="flex items-center gap-1 justify-end">
                    <Badge variant="outline" className="text-[8px] py-0 h-3.5">{s.status}</Badge>
                    <span className="text-[10px] text-muted-foreground">{s.waste_type}</span>
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
