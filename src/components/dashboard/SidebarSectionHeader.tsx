import { LucideIcon, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarSectionHeaderProps {
  label: string;
  icon: LucideIcon;
  isCollapsed: boolean;
  /** Whether the section content is folded */
  isSectionFolded?: boolean;
  /** Toggle fold state */
  onToggleFold?: () => void;
}

const SidebarSectionHeader = ({ label, icon: Icon, isCollapsed, isSectionFolded, onToggleFold }: SidebarSectionHeaderProps) => {
  if (isCollapsed) {
    return (
      <div className="flex justify-center py-2 mt-3 first:mt-0">
        <div className="w-6 h-px bg-border/60" />
      </div>
    );
  }

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onToggleFold}
      className="w-full flex items-center gap-2 pt-5 pb-1.5 px-2 first:pt-0 cursor-pointer group hover:opacity-80 transition-opacity"
    >
      <Icon className="w-3.5 h-3.5 text-primary/70 shrink-0" />
      <span className="text-[10px] font-bold text-primary/70 uppercase tracking-wider whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-primary/15" />
      {onToggleFold && (
        <motion.div
          animate={{ rotate: isSectionFolded ? -90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-3 h-3 text-primary/40 group-hover:text-primary/70 transition-colors" />
        </motion.div>
      )}
    </motion.button>
  );
};

export default SidebarSectionHeader;
