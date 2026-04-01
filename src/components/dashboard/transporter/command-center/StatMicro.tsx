import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface StatMicroProps {
  icon: any;
  label: string;
  value: string | number;
  color: string;
  alert?: boolean;
  onClick?: () => void;
  sub?: string;
  details?: { items: { label: string; value: string | number }[]; actionLabel?: string };
}

const StatMicro = ({ icon: Icon, label, value, color, alert, onClick, sub, details }: StatMicroProps) => {
  const content = (
    <motion.div
      whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
      onClick={details ? undefined : onClick}
      className={`flex items-center gap-2 rounded-xl py-2 px-2.5 border relative overflow-hidden transition-all ${onClick || details ? 'cursor-pointer hover:shadow-md' : ''} ${
        alert ? 'bg-destructive/8 border-destructive/15' : 'bg-muted/20 border-border/30'
      }`}
    >
      {alert && <motion.div className="absolute inset-0 bg-destructive/5" animate={{ opacity: [0, 0.4, 0] }} transition={{ duration: 2, repeat: Infinity }} />}
      <Icon className={`w-4 h-4 ${color} shrink-0`} />
      <div className="flex-1 min-w-0 text-right">
        <p className={`text-sm font-bold ${color} tabular-nums`}>{value}</p>
        <p className="text-[9px] text-muted-foreground truncate">{label}</p>
        {sub && <p className="text-[8px] text-muted-foreground/60 truncate">{sub}</p>}
      </div>
    </motion.div>
  );

  if (!details) return content;

  return (
    <Popover>
      <PopoverTrigger asChild>{content}</PopoverTrigger>
      <PopoverContent className="w-56 p-0 rounded-xl overflow-hidden" align="center" dir="rtl"
        onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="p-2.5 border-b border-border/30 bg-muted/20 flex items-center justify-between">
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Icon className={`w-3.5 h-3.5 ${color}`} />
            {label}
          </span>
          <Badge variant="outline" className="text-[9px] h-4">{value}</Badge>
        </div>
        <div className="p-2 space-y-1">
          {details.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1 px-1.5 text-[11px] rounded hover:bg-muted/30">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-bold text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
        {onClick && (
          <button
            onClick={onClick}
            className="w-full text-center py-2 text-[10px] font-bold text-primary hover:bg-primary/5 border-t border-border/30 transition-colors"
          >
            {details.actionLabel || 'عرض التفاصيل الكاملة'} →
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default StatMicro;
