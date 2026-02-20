import * as React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface SmartInputInternalProps {
  /** When provided, enables smart autocomplete for this field context */
  fieldContext?: string;
  /** Save value on blur (default: true) */
  saveOnBlur?: boolean;
}

export type InputProps = React.ComponentProps<"input"> & SmartInputInternalProps;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, fieldContext, saveOnBlur = true, onChange, onBlur, onFocus, value, ...props }, ref) => {
    // If no fieldContext, render plain input
    if (!fieldContext) {
      return (
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className,
          )}
          ref={ref}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          {...props}
        />
      );
    }

    // Smart input mode
    return (
      <SmartInputWrapper
        ref={ref}
        type={type}
        className={className}
        fieldContext={fieldContext}
        saveOnBlur={saveOnBlur}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        {...props}
      />
    );
  },
);

// Lazy-loaded smart wrapper to avoid importing supabase for plain inputs
const SmartInputWrapper = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, fieldContext, saveOnBlur = true, onChange, onBlur, onFocus, value, ...props }, ref) => {
    const [suggestions, setSuggestions] = useState<Array<{ id: string; input_value: string; usage_count: number }>>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();
    const supabaseRef = useRef<any>(null);
    const profileRef = useRef<any>(null);

    // Lazy load supabase and auth
    useEffect(() => {
      import('@/integrations/supabase/client').then(mod => { supabaseRef.current = mod.supabase; });
      import('@/contexts/AuthContext').then(mod => {
        // We can't use hooks here, so we'll get profile from supabase directly
      });
    }, []);

    const getOrgId = useCallback(async () => {
      if (!supabaseRef.current) return null;
      const { data: { user } } = await supabaseRef.current.auth.getUser();
      if (!user) return null;
      const { data } = await supabaseRef.current.from('profiles').select('organization_id').eq('id', user.id).single();
      return data?.organization_id || null;
    }, []);

    const fetchSuggestions = useCallback(async (query: string) => {
      if (!query || query.length < 2 || !supabaseRef.current) {
        setSuggestions([]);
        return;
      }
      const orgId = await getOrgId();
      if (!orgId) return;
      try {
        const { data } = await supabaseRef.current
          .from('smart_inputs')
          .select('id, input_value, usage_count')
          .eq('organization_id', orgId)
          .eq('field_context', fieldContext)
          .ilike('input_value', `%${query}%`)
          .order('usage_count', { ascending: false })
          .limit(8);
        const filtered = (data || []).filter(
          (s: any) => s.input_value.toLowerCase() !== query.toString().toLowerCase()
        );
        setSuggestions(filtered);
      } catch { setSuggestions([]); }
    }, [fieldContext, getOrgId]);

    const saveInput = useCallback(async (val: string) => {
      if (!val || val.trim().length < 2 || !supabaseRef.current) return;
      const orgId = await getOrgId();
      if (!orgId) return;
      const { data: { user } } = await supabaseRef.current.auth.getUser();
      if (!user) return;
      try {
        await supabaseRef.current.rpc('upsert_smart_input', {
          p_organization_id: orgId,
          p_created_by: user.id,
          p_field_context: fieldContext,
          p_input_value: val.trim(),
        });
      } catch {}
    }, [fieldContext, getOrgId]);

    const search = useCallback((query: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchSuggestions(query), 300);
    }, [fetchSuggestions]);

    // Search on value change
    useEffect(() => {
      const v = value?.toString() || '';
      if (v.length >= 2) {
        search(v);
        setShowDropdown(true);
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, [value, search]);

    // Close on outside click
    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
          setShowDropdown(false);
        }
      };
      document.addEventListener('mousedown', handler);
      return () => {
        document.removeEventListener('mousedown', handler);
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }, []);

    const handleSelect = (selectedValue: string) => {
      // Simulate input change event
      const nativeEvent = new Event('input', { bubbles: true });
      const syntheticEvent = {
        target: { value: selectedValue },
        currentTarget: { value: selectedValue },
        nativeEvent,
        preventDefault: () => {},
        stopPropagation: () => {},
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      onChange?.(syntheticEvent);
      setShowDropdown(false);
      setSuggestions([]);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setTimeout(() => {
        const v = value?.toString()?.trim() || '';
        if (saveOnBlur && v.length >= 2) {
          saveInput(v);
        }
        setShowDropdown(false);
      }, 200);
      onBlur?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      const v = value?.toString() || '';
      if (v.length >= 2 && suggestions.length > 0) {
        setShowDropdown(true);
      }
      onFocus?.(e);
    };

    return (
      <div ref={wrapperRef} className="relative">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className,
          )}
          ref={ref}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
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
                  <span className="text-xs text-muted-foreground shrink-0">{s.usage_count}×</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  },
);

SmartInputWrapper.displayName = "SmartInputWrapper";
Input.displayName = "Input";

export { Input };
