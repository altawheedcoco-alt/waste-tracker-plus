import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

const SidebarSearchBar = ({ value, onChange }: SidebarSearchBarProps) => {
  const { language } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);

  // Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="relative px-2 pb-2">
      <div className="relative">
        <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={language === 'ar' ? 'بحث سريع... (Ctrl+K)' : 'Quick search... (Ctrl+K)'}
          className="h-8 pr-8 pl-7 text-xs bg-sidebar-accent/40 border-border/40 rounded-lg placeholder:text-muted-foreground/50"
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        />
        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => onChange('')}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SidebarSearchBar;
