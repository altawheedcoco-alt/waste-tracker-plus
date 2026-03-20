import { memo } from 'react';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { type SlashCommand } from '@/config/chatSlashCommands';

interface SlashCommandMenuProps {
  commands: SlashCommand[];
  selectedIndex: number;
  onSelect: (command: SlashCommand) => void;
  onHover: (index: number) => void;
}

const SlashCommandMenu = memo(({ commands, selectedIndex, onSelect, onHover }: SlashCommandMenuProps) => {
  if (commands.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15 }}
      className="absolute bottom-full mb-1 right-0 left-0 z-50 bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
    >
      <div className="px-3 py-1.5 border-b border-border/50 bg-muted/30">
        <span className="text-[10px] font-semibold text-muted-foreground">⚡ أوامر سريعة</span>
      </div>
      <ScrollArea className="max-h-52">
        {commands.map((cmd, index) => {
          const Icon = cmd.icon;
          return (
            <button
              key={cmd.command}
              type="button"
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 text-right text-sm transition-colors',
                index === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
              )}
              onClick={() => onSelect(cmd)}
              onMouseEnter={() => onHover(index)}
            >
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', cmd.color)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 text-right">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{cmd.command}</span>
                  <span className="font-medium text-xs">{cmd.label}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{cmd.description}</p>
              </div>
            </button>
          );
        })}
      </ScrollArea>
    </motion.div>
  );
});

SlashCommandMenu.displayName = 'SlashCommandMenu';
export default SlashCommandMenu;
