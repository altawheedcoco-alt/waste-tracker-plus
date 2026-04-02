import { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Clock, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface RecentPage {
  path: string;
  label: string;
  timestamp: number;
}

interface SidebarRecentPagesProps {
  pages: RecentPage[];
  onClear: () => void;
}

const SidebarRecentPages = memo(({ pages, onClear }: SidebarRecentPagesProps) => {
  const { t } = useLanguage();
  const location = useLocation();

  if (pages.length === 0) return null;

  return (
    <div className="pt-2 pb-1">
      <div className="flex items-center gap-2 px-2 mb-1.5">
        <Clock className="w-3.5 h-3.5 text-muted-foreground/60" />
        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
          {t('sidebar.recentPages') || 'آخر الزيارات'}
        </span>
        <div className="flex-1 h-px bg-border/30" />
        <button
          onClick={onClear}
          className="p-0.5 rounded hover:bg-muted transition-colors"
          title={t('common.clear', 'مسح')}
        >
          <X className="w-3 h-3 text-muted-foreground/40 hover:text-muted-foreground" />
        </button>
      </div>
      <div className="space-y-0.5">
        {pages.map((page, i) => {
          const isActive = location.pathname === page.path;
          return (
            <motion.div
              key={page.path}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link
                to={page.path}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                }`}
              >
                <span className="w-1 h-1 rounded-full bg-current opacity-40 shrink-0" />
                <span className="truncate">{page.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});

SidebarRecentPages.displayName = 'SidebarRecentPages';

export default SidebarRecentPages;
