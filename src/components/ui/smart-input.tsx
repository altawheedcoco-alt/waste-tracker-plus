import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useSmartInput } from '@/hooks/useSmartInput';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SmartInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  /** Unique context key for this field, e.g. 'sender_name', 'receiver_phone' */
  fieldContext: string;
  value: string;
  onChange: (value: string) => void;
  /** Save on blur (default: true) */
  saveOnBlur?: boolean;
}

const SmartInput = React.forwardRef<HTMLInputElement, SmartInputProps>(
  ({ fieldContext, value, onChange, saveOnBlur = true, className, ...props }, ref) => {
    const { suggestions, search, saveInput, clearSuggestions } = useSmartInput(fieldContext);
    const [showDropdown, setShowDropdown] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Search on value change
    useEffect(() => {
      if (value && value.length >= 2) {
        search(value);
        setShowDropdown(true);
      } else {
        clearSuggestions();
        setShowDropdown(false);
      }
    }, [value, search, clearSuggestions]);

    // Close dropdown on outside click
    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
          setShowDropdown(false);
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSelect = (selectedValue: string) => {
      onChange(selectedValue);
      setShowDropdown(false);
      clearSuggestions();
    };

    const handleBlur = () => {
      // Delay to allow click on suggestion
      setTimeout(() => {
        if (saveOnBlur && value && value.trim().length >= 2) {
          saveInput(value.trim());
        }
        setShowDropdown(false);
      }, 200);
    };

    return (
      <div ref={wrapperRef} className="relative">
        <Input
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (value && value.length >= 2 && suggestions.length > 0) {
              setShowDropdown(true);
            }
          }}
          onBlur={handleBlur}
          className={cn(className)}
          {...props}
        />

        {showDropdown && suggestions.length > 0 && (
          <div className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                className="w-full text-right px-3 py-2 hover:bg-accent transition-colors flex items-center gap-2 text-sm border-b border-border/50 last:border-b-0"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(s.input_value);
                }}
              >
                <Sparkles className="w-3 h-3 text-primary shrink-0" />
                <span className="truncate flex-1">{s.input_value}</span>
                {s.usage_count > 1 && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {s.usage_count}×
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

SmartInput.displayName = 'SmartInput';
export { SmartInput };
