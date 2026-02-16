import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Coffee, AlertTriangle, Play, Pause, Timer,
  Moon, Sun, Activity, Shield, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface DriverFatigueMonitorProps {
  driverId: string;
}

const MAX_DRIVE_MINUTES = 240; // 4 hours max before mandatory break
const WARN_MINUTES = 210; // Warning at 3.5 hours
const MIN_BREAK_MINUTES = 30; // Minimum 30min break
const MAX_DAILY_HOURS = 10; // Max 10 hours daily

const DriverFatigueMonitor = ({ driverId }: DriverFatigueMonitorProps) => {
  const { toast } = useToast();
  const [isDriving, setIsDriving] = useState(false);
  const [driveSeconds, setDriveSeconds] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [dailyDriveSeconds, setDailyDriveSeconds] = useState(0);
  const [sessionsToday, setSessionsToday] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved state
  useEffect(() => {
    const todayKey = `fatigue_${driverId}_${new Date().toISOString().split('T')[0]}`;
    const saved = localStorage.getItem(todayKey);
    if (saved) {
      const data = JSON.parse(saved);
      setDailyDriveSeconds(data.dailyDriveSeconds || 0);
      setSessionsToday(data.sessionsToday || 0);
    }
  }, [driverId]);

  // Timer logic
  useEffect(() => {
    if (isDriving || isOnBreak) {
      intervalRef.current = setInterval(() => {
        if (isDriving) {
          setDriveSeconds(prev => prev + 1);
          setDailyDriveSeconds(prev => prev + 1);
        }
        if (isOnBreak) {
          setBreakSeconds(prev => prev + 1);
        }
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isDriving, isOnBreak]);

  // Warnings
  useEffect(() => {
    const driveMinutes = driveSeconds / 60;
    if (driveMinutes >= MAX_DRIVE_MINUTES && isDriving) {
      setIsDriving(false);
      setIsOnBreak(true);
      toast({
        title: '⛔ استراحة إلزامية!',
        description: `قدت لمدة ${MAX_DRIVE_MINUTES / 60} ساعات متواصلة. خذ استراحة ${MIN_BREAK_MINUTES} دقيقة على الأقل.`,
        variant: 'destructive',
      });
    } else if (driveMinutes >= WARN_MINUTES && driveMinutes < WARN_MINUTES + 0.02) {
      toast({
        title: '⚠️ تنبيه إرهاق',
        description: 'بقي 30 دقيقة على الحد الأقصى للقيادة المتواصلة',
      });
    }
  }, [driveSeconds, isDriving, toast]);

  const saveState = useCallback(() => {
    const todayKey = `fatigue_${driverId}_${new Date().toISOString().split('T')[0]}`;
    localStorage.setItem(todayKey, JSON.stringify({
      dailyDriveSeconds,
      sessionsToday,
    }));
  }, [driverId, dailyDriveSeconds, sessionsToday]);

  useEffect(() => { saveState(); }, [dailyDriveSeconds, saveState]);

  const startDriving = () => {
    if (dailyDriveSeconds / 3600 >= MAX_DAILY_HOURS) {
      toast({ title: '⛔ تم بلوغ الحد اليومي', description: `${MAX_DAILY_HOURS} ساعات كحد أقصى`, variant: 'destructive' });
      return;
    }
    setIsDriving(true);
    setIsOnBreak(false);
    setBreakSeconds(0);
    setSessionsToday(prev => prev + 1);
  };

  const takeBreak = () => {
    setIsDriving(false);
    setIsOnBreak(true);
    setBreakSeconds(0);
  };

  const endBreak = () => {
    if (breakSeconds / 60 < MIN_BREAK_MINUTES) {
      toast({
        title: '⏱️ استراحة قصيرة',
        description: `يُنصح بالاستراحة ${MIN_BREAK_MINUTES} دقيقة على الأقل. بقي ${MIN_BREAK_MINUTES - Math.floor(breakSeconds / 60)} دقيقة`,
      });
    }
    setIsOnBreak(false);
    setDriveSeconds(0); // Reset session timer after break
  };

  const resetDay = () => {
    setDriveSeconds(0);
    setBreakSeconds(0);
    setIsDriving(false);
    setIsOnBreak(false);
    setDailyDriveSeconds(0);
    setSessionsToday(0);
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;
  };

  const driveMinutes = driveSeconds / 60;
  const driveProgress = Math.min(100, (driveMinutes / MAX_DRIVE_MINUTES) * 100);
  const dailyProgress = Math.min(100, (dailyDriveSeconds / 3600 / MAX_DAILY_HOURS) * 100);

  const severity = driveMinutes >= MAX_DRIVE_MINUTES ? 'critical' : driveMinutes >= WARN_MINUTES ? 'warning' : 'safe';
  const severityConfig = {
    safe: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'آمن' },
    warning: { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'تنبيه' },
    critical: { color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20', label: 'حرج' },
  };
  const sv = severityConfig[severity];

  return (
    <div className="space-y-4">
      {/* Main Monitor */}
      <Card className={`${sv.border} ${sv.bg.replace('/10', '/5')}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="w-5 h-5 text-primary" />
            مراقبة الإرهاق والقيادة
            <Badge variant="outline" className={`text-[10px] mr-auto ${sv.color}`}>
              <Shield className="w-3 h-3 ml-1" />
              {sv.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Session Timer */}
          <div className="text-center py-4">
            <AnimatePresence mode="wait">
              {isOnBreak ? (
                <motion.div key="break" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                  <Coffee className="w-12 h-12 mx-auto mb-2 text-amber-500" />
                  <p className="text-3xl font-mono font-bold text-amber-500">{formatTime(breakSeconds)}</p>
                  <p className="text-sm text-muted-foreground mt-1">وقت الاستراحة</p>
                  {breakSeconds / 60 < MIN_BREAK_MINUTES && (
                    <p className="text-xs text-amber-500 mt-1">
                      الحد الأدنى: {MIN_BREAK_MINUTES - Math.floor(breakSeconds / 60)} دقيقة متبقية
                    </p>
                  )}
                </motion.div>
              ) : isDriving ? (
                <motion.div key="driving" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                  <Timer className={`w-12 h-12 mx-auto mb-2 ${sv.color}`} />
                  <p className={`text-3xl font-mono font-bold ${sv.color}`}>{formatTime(driveSeconds)}</p>
                  <p className="text-sm text-muted-foreground mt-1">قيادة متواصلة</p>
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                  <Sun className="w-12 h-12 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-lg text-muted-foreground">جاهز للانطلاق</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Session Progress */}
          {isDriving && (
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>الجلسة الحالية</span>
                <span>{Math.round(driveMinutes)}/{MAX_DRIVE_MINUTES} دقيقة</span>
              </div>
              <Progress value={driveProgress} className={`h-2 ${severity !== 'safe' ? '[&>div]:bg-amber-500' : ''}`} />
            </div>
          )}

          {/* Daily Progress */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>الحد اليومي</span>
              <span>{(dailyDriveSeconds / 3600).toFixed(1)}/{MAX_DAILY_HOURS} ساعة</span>
            </div>
            <Progress value={dailyProgress} className="h-2" />
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            {!isDriving && !isOnBreak && (
              <Button className="flex-1 gap-2 h-11" onClick={startDriving}>
                <Play className="w-4 h-4" />
                بدء القيادة
              </Button>
            )}
            {isDriving && (
              <Button className="flex-1 gap-2 h-11" variant="outline" onClick={takeBreak}>
                <Coffee className="w-4 h-4" />
                أخذ استراحة
              </Button>
            )}
            {isOnBreak && (
              <Button className="flex-1 gap-2 h-11" onClick={endBreak}>
                <Play className="w-4 h-4" />
                استئناف القيادة
              </Button>
            )}
            {(isDriving || isOnBreak) && (
              <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => { setIsDriving(false); setIsOnBreak(false); setDriveSeconds(0); }}>
                <Pause className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="text-center p-2 rounded-lg bg-background/50">
              <p className="text-lg font-bold">{sessionsToday}</p>
              <p className="text-[10px] text-muted-foreground">جلسات اليوم</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/50">
              <p className="text-lg font-bold">{(dailyDriveSeconds / 3600).toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground">ساعات القيادة</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/50">
              <p className="text-lg font-bold">{MAX_DAILY_HOURS - Math.round(dailyDriveSeconds / 3600)}</p>
              <p className="text-[10px] text-muted-foreground">ساعات متبقية</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Safety Tips */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Moon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold mb-1">نصائح السلامة</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• خذ استراحة 30 دقيقة كل 4 ساعات قيادة</li>
                <li>• لا تتجاوز 10 ساعات قيادة يومياً</li>
                <li>• اشرب الماء بانتظام وتجنب الوجبات الثقيلة</li>
                <li>• إذا شعرت بالنعاس، توقف فوراً في مكان آمن</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverFatigueMonitor;
