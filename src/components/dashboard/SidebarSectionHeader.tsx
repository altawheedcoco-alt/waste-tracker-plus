import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarSectionHeaderProps {
  label: string;
  icon: LucideIcon;
  isCollapsed: boolean;
}

const SidebarSectionHeader = ({ label, icon: Icon, isCollapsed }: SidebarSectionHeaderProps) => {
  if (isCollapsed) {
    return (
      <div className="flex justify-center py-2 mt-3 first:mt-0">
        <div className="w-6 h-px bg-border/60" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2 pt-5 pb-1.5 px-2 first:pt-0"
    >
      <Icon className="w-3.5 h-3.5 text-primary/70 shrink-0" />
      <span className="text-[10px] font-bold text-primary/70 uppercase tracking-wider whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-primary/15" />
    </motion.div>
  );
};

export default SidebarSectionHeader;
