import { memo, useState, useMemo } from 'react';
import {
  LucideIcon, Sun, Cloud, CloudRain, CloudLightning, Wind, Snowflake,
  CloudSun, CloudFog, AlertTriangle, MapPin, Droplets, ThermometerSun,
  Clock, LocateFixed,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { WeatherData } from '../DashboardV2Header';

const WEATHER_ICONS: Record<string, LucideIcon> = {
  sunny: Sun, cloudy: Cloud, rainy: CloudRain, stormy: CloudLightning, windy: Wind, snowy: Snowflake,
  partly_cloudy: CloudSun, foggy: CloudFog,
};

const FORECAST_CONDITION_COLORS: Record<string, string> = {
  sunny: 'text-amber-400', cloudy: 'text-muted-foreground', rainy: 'text-blue-400',
  stormy: 'text-purple-400', windy: 'text-cyan-400', snowy: 'text-blue-200',
  partly_cloudy: 'text-amber-300', foggy: 'text-muted-foreground',
};

const WeatherWidget = memo(({ weather }: { weather: WeatherData }) => {
  const [showForecast, setShowForecast] = useState(false);
  const WIcon = WEATHER_ICONS[weather.condition] || CloudSun;
  const hasRoadWarning = !!weather.roadWarning;
  const hasForecast = weather.hourlyForecast && weather.hourlyForecast.length > 0;

  if (weather.isLoading) {
    return (
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border bg-muted/30 border-border/30 text-[10px]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}><Sun className="w-4 h-4 text-muted-foreground" /></motion.div>
        <span className="text-muted-foreground font-mono">جاري تحميل الطقس...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <motion.button onClick={(e) => { e.stopPropagation(); weather.refreshFromGPS?.(); }} disabled={weather.isLocating}
          className={cn("flex items-center justify-center w-8 h-8 rounded-lg border transition-all shrink-0",
            weather.isLocating ? "bg-primary/10 border-primary/30 cursor-wait" : "bg-muted/30 border-border/30 hover:bg-primary/10 hover:border-primary/30 active:scale-95")}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }} title="تحديد الموقع وتحديث الطقس">
          {weather.isLocating ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><LocateFixed className="w-4 h-4 text-primary" /></motion.div> : <LocateFixed className="w-4 h-4 text-primary" />}
        </motion.button>

        <motion.div
          className={cn("flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[10px] cursor-pointer transition-all flex-1",
            hasRoadWarning ? "bg-amber-500/5 border-amber-500/20" : "bg-muted/30 border-border/30", hasForecast && "hover:border-primary/30")}
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}
          onClick={() => hasForecast && setShowForecast(p => !p)}>
          <motion.div animate={weather.condition === 'stormy' ? { rotate: [0, -10, 10, 0] } : weather.condition === 'windy' ? { x: [-1, 1, -1] } : {}} transition={{ duration: 2, repeat: Infinity }}>
            <WIcon className={cn("w-4 h-4", hasRoadWarning ? "text-amber-500" : "text-primary")} />
          </motion.div>
          <div className="flex items-center gap-1.5 font-mono flex-wrap" dir="ltr">
            {weather.locationName && (<><span className="flex items-center gap-0.5 text-primary font-bold"><MapPin className="w-2.5 h-2.5" />{weather.locationName}</span><span className="text-border/50">|</span></>)}
            <span className="font-black text-foreground">{weather.temp}°C</span>
            {weather.feelsLike !== undefined && weather.feelsLike !== weather.temp && <span className="text-muted-foreground text-[8px]">(يحس {weather.feelsLike}°)</span>}
            <span className="text-border/50">|</span>
            <span className="text-muted-foreground font-medium">{weather.conditionLabel || weather.condition}</span>
            <span className="text-border/50">|</span>
            <span className="flex items-center gap-0.5 text-muted-foreground"><Droplets className="w-2.5 h-2.5" />{weather.humidity}%</span>
            <span className="text-border/50">|</span>
            <span className="flex items-center gap-0.5 text-muted-foreground"><Wind className="w-2.5 h-2.5" />{weather.windSpeed}km/h</span>
            {weather.precipProb !== undefined && weather.precipProb > 0 && (<><span className="text-border/50">|</span><span className="flex items-center gap-0.5 text-blue-400"><CloudRain className="w-2.5 h-2.5" />{weather.precipProb}%</span></>)}
            {weather.uvIndex !== undefined && weather.uvIndex > 5 && (<><span className="text-border/50">|</span><span className="flex items-center gap-0.5 text-orange-400"><ThermometerSun className="w-2.5 h-2.5" />UV:{weather.uvIndex}</span></>)}
          </div>
          {hasRoadWarning && <motion.span className="text-amber-500 font-bold truncate flex items-center gap-0.5 shrink-0" animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }}><AlertTriangle className="w-3 h-3 shrink-0" />{weather.roadWarning}</motion.span>}
          {hasForecast && <motion.div className="flex items-center gap-0.5 shrink-0 mr-auto" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}><Clock className="w-2.5 h-2.5 text-primary/60" /><span className="text-[7px] font-mono text-primary/60">{showForecast ? 'إخفاء' : 'التنبؤ'}</span></motion.div>}
        </motion.div>
      </div>

      <AnimatePresence>
        {showForecast && hasForecast && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide py-1 px-0.5 rounded-lg bg-muted/20 border border-border/20">
              {weather.hourlyForecast!.map((h, i) => {
                const HIcon = WEATHER_ICONS[h.condition] || CloudSun;
                const isNow = i === 0;
                return (
                  <motion.div key={h.time} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className={cn("flex flex-col items-center gap-0.5 min-w-[42px] px-1.5 py-1 rounded-md text-[8px] font-mono shrink-0 transition-colors", isNow ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/40")}>
                    <span className={cn("font-bold", isNow ? "text-primary" : "text-muted-foreground")}>{isNow ? 'الآن' : `${String(h.hour).padStart(2, '0')}:00`}</span>
                    <HIcon className={cn("w-3.5 h-3.5", FORECAST_CONDITION_COLORS[h.condition] || 'text-muted-foreground')} />
                    <span className="font-black text-foreground text-[10px]" dir="ltr">{h.temp}°</span>
                    {h.precipProb > 20 && <span className="flex items-center gap-0.5 text-blue-400"><Droplets className="w-2 h-2" />{h.precipProb}%</span>}
                    <span className="flex items-center gap-0.5 text-muted-foreground"><Wind className="w-2 h-2" />{h.windSpeed}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
WeatherWidget.displayName = 'WeatherWidget';

export default WeatherWidget;
