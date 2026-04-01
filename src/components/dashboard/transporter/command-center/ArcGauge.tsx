import { motion } from 'framer-motion';

interface ArcGaugeProps {
  value: number;
  max?: number;
  size?: number;
  label: string;
  color: string;
  icon: any;
}

const ArcGauge = ({ value, max = 100, size = 100, label, color, icon: Icon }: ArcGaugeProps) => {
  const pct = Math.min(value / max, 1) * 100;
  const radius = (size - 12) / 2;
  const circumference = radius * Math.PI;
  const offset = circumference - (pct / 100) * circumference;
  const statusColor = pct >= 80 ? 'text-emerald-500' : pct >= 50 ? 'text-amber-500' : 'text-destructive';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size / 2 + 10} className="overflow-visible">
        <path d={`M ${6} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 6} ${size / 2}`}
          fill="none" stroke="hsl(var(--muted))" strokeWidth="8" strokeLinecap="round" />
        <motion.path d={`M ${6} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 6} ${size / 2}`}
          fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.8, ease: 'easeOut', delay: 0.4 }} />
        <text x={size / 2} y={size / 2 - 8} textAnchor="middle" className="fill-foreground text-xl font-black">{Math.round(pct)}%</text>
      </svg>
      <div className="flex items-center gap-1 -mt-1">
        <Icon className={`w-3 h-3 ${statusColor}`} />
        <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
      </div>
    </div>
  );
};

export default ArcGauge;
