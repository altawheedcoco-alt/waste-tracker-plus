import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Building2, User, AtSign } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MentionableEntity {
  id: string;
  type: 'user' | 'organization';
  name: string;
  subtitle?: string;
  avatar_url?: string | null;
  is_external?: boolean;
}

interface MentionableFieldProps {
  value: string;
  onChange: (value: string) => void;
  onEntitySelect?: (entity: MentionableEntity) => void;
  entities: MentionableEntity[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  dir?: string;
  /** Allow free text input alongside mentions */
  allowFreeText?: boolean;
  /** Show @ icon hint inside input */
  showAtHint?: boolean;
}

/**
 * A single-line input that supports @mention for users and organizations.
 * When user types @ it shows a dropdown of matching entities.
 * Selecting an entity fills the input with the entity name and triggers onEntitySelect.
 */
const MentionableField = ({
  value,
  onChange,
  onEntitySelect,
  entities,
  placeholder = 'اكتب @ للإشارة...',
  className,
  disabled,
  dir = 'rtl',
  allowFreeText = true,
  showAtHint = true,
}: MentionableFieldProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = entities.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.subtitle?.toLowerCase().includes(search.toLowerCase()) ?? false)
  ).slice(0, 10);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Check for @ trigger
    const pos = e.target.selectionStart || 0;
    const before = newValue.slice(0, pos);
    const atIndex = before.lastIndexOf('@');

    if (atIndex !== -1) {
      const query = before.slice(atIndex + 1);
      // Only trigger if @ is at start or preceded by space
      if (atIndex === 0 || /[\s]/.test(before[atIndex - 1])) {
        setSearch(query);
        setShowDropdown(true);
        setSelectedIndex(0);
        return;
      }
    }

    // Also search without @ if there's text
    if (newValue.length >= 2 && entities.length > 0) {
      setSearch(newValue);
      setShowDropdown(true);
      setSelectedIndex(0);
    } else {
      setShowDropdown(false);
    }
  };

  const selectEntity = useCallback((entity: MentionableEntity) => {
    onChange(entity.name);
    onEntitySelect?.(entity);
    setShowDropdown(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [onChange, onEntitySelect]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filtered.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => (i + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (showDropdown && filtered.length > 0) {
        e.preventDefault();
        selectEntity(filtered[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const handleFocus = () => {
    if (value.length >= 2) {
      setSearch(value);
      setShowDropdown(true);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={cn(showAtHint && 'pl-8 rtl:pr-8 rtl:pl-3', className)}
          disabled={disabled}
          dir={dir}
        />
        {showAtHint && (
          <AtSign className="absolute top-1/2 -translate-y-1/2 ltr:left-2.5 rtl:right-2.5 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
        )}
      </div>

      {showDropdown && filtered.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
        >
          <ScrollArea className="max-h-52">
            {filtered.map((entity, index) => (
              <button
                key={`${entity.type}-${entity.id}`}
                type="button"
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 text-right text-sm transition-colors',
                  index === selectedIndex
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-muted'
                )}
                onClick={() => selectEntity(entity)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={entity.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {entity.type === 'organization' ? (
                      <Building2 className="h-3.5 w-3.5" />
                    ) : (
                      entity.name.slice(0, 2)
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-right">
                  <p className="font-medium text-xs truncate">{entity.name}</p>
                  {entity.subtitle && (
                    <div className="flex items-center gap-1 justify-end">
                      {entity.type === 'organization' ? (
                        <Building2 className="w-2.5 h-2.5 text-muted-foreground" />
                      ) : (
                        <User className="w-2.5 h-2.5 text-muted-foreground" />
                      )}
                      <span className="text-[10px] text-muted-foreground truncate">
                        {entity.subtitle}
                      </span>
                    </div>
                  )}
                </div>
                {entity.type === 'organization' && (
                  <Badge variant="outline" className="text-[8px] py-0 h-3.5 shrink-0">جهة</Badge>
                )}
                {entity.is_external && entity.type === 'user' && (
                  <Badge variant="outline" className="text-[8px] py-0 h-3.5 shrink-0">خارجي</Badge>
                )}
              </button>
            ))}
          </ScrollArea>
          {allowFreeText && (
            <div className="px-3 py-1.5 border-t text-[10px] text-muted-foreground text-center">
              يمكنك أيضاً كتابة الاسم يدوياً
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { MentionableField };
