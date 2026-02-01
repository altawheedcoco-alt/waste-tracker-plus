import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Route, 
  Clock, 
  Gauge, 
  Navigation, 
  MapPin,
  TrendingUp,
  Activity
} from 'lucide-react';

interface TrackingStatsCardProps {
  distance: number; // km
  duration: number; // seconds
  speed?: number; // km/h
  locations: number;
  isActive?: boolean;
}

const TrackingStatsCard = ({ 
  distance, 
  duration, 
  speed, 
  locations,
  isActive = false 
}: TrackingStatsCardProps) => {
  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const stats = [
    {
      icon: Route,
      label: 'المسافة',
      value: `${distance.toFixed(2)} كم`,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Clock,
      label: 'المدة',
      value: formatDuration(duration),
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      icon: Gauge,
      label: 'السرعة',
      value: speed ? `${Math.round(speed)} كم/س` : '-',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: MapPin,
      label: 'النقاط',
      value: locations.toString(),
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <Card className={`border-primary/20 ${isActive ? 'bg-gradient-to-br from-primary/5 to-transparent' : ''}`}>
      <CardContent className="p-4">
        <div className="grid grid-cols-4 gap-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center mx-auto mb-2`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
              <p className="font-semibold text-sm">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 pt-4 border-t flex items-center justify-center gap-2 text-primary"
          >
            <Activity className="h-4 w-4 animate-pulse" />
            <span className="text-sm font-medium">جاري التتبع...</span>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrackingStatsCard;
