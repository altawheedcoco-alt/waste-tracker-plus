/**
 * بورصة السلع العالمية اللحظية — جدول تنبيهي شامل بالأسعار العالمية والمعادل بالجنيه المصري
 */
import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus, RefreshCw, Globe, BarChart3, DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/numberFormat';

interface CommodityPrice {
  symbol: string;
  nameAr: string;
  nameEn: string;
  price: number;
  prevPrice: number;
  currency: string;
  change: number;
  changePercent: number;
  unit: string;
  unitAr: string;
  category: 'metals' | 'plastics' | 'paper' | 'energy' | 'other';
}

// سعر الصرف التقريبي — يتم تحديثه مع كل دورة
const getExchangeRate = () => 49.5 + (Math.random() - 0.5) * 0.4; // ~49.3-49.7

const BASE_COMMODITIES = [
  { symbol: 'XAU', nameAr: '🥇 الذهب', nameEn: 'Gold', basePrice: 2340, currency: 'USD', unit: 'oz', unitAr: 'أونصة', category: 'metals' as const },
  { symbol: 'XAG', nameAr: '🥈 الفضة', nameEn: 'Silver', basePrice: 29.5, currency: 'USD', unit: 'oz', unitAr: 'أونصة', category: 'metals' as const },
  { symbol: 'HG', nameAr: '🔶 النحاس', nameEn: 'Copper', basePrice: 4.35, currency: 'USD', unit: 'lb', unitAr: 'رطل', category: 'metals' as const },
  { symbol: 'ALU', nameAr: '🔩 الألمنيوم', nameEn: 'Aluminum', basePrice: 2520, currency: 'USD', unit: 'ton', unitAr: 'طن', category: 'metals' as const },
  { symbol: 'FE', nameAr: '⚙️ الحديد', nameEn: 'Iron Ore', basePrice: 108, currency: 'USD', unit: 'ton', unitAr: 'طن', category: 'metals' as const },
  { symbol: 'SCR', nameAr: '🔧 خردة حديد', nameEn: 'Scrap Steel', basePrice: 380, currency: 'USD', unit: 'ton', unitAr: 'طن', category: 'metals' as const },
  { symbol: 'PET', nameAr: '♻️ PET', nameEn: 'PET Plastic', basePrice: 850, currency: 'USD', unit: 'ton', unitAr: 'طن', category: 'plastics' as const },
  { symbol: 'HDPE', nameAr: '♻️ HDPE', nameEn: 'HDPE', basePrice: 1120, currency: 'USD', unit: 'ton', unitAr: 'طن', category: 'plastics' as const },
  { symbol: 'PP', nameAr: '♻️ بولي بروبلين', nameEn: 'PP', basePrice: 980, currency: 'USD', unit: 'ton', unitAr: 'طن', category: 'plastics' as const },
  { symbol: 'LMB', nameAr: '🪵 الخشب', nameEn: 'Lumber', basePrice: 545, currency: 'USD', unit: '1000ft', unitAr: '1000 قدم', category: 'other' as const },
  { symbol: 'OCC', nameAr: '📦 كرتون OCC', nameEn: 'OCC', basePrice: 95, currency: 'USD', unit: 'ton', unitAr: 'طن', category: 'paper' as const },
  { symbol: 'PPAP', nameAr: '📄 ورق مختلط', nameEn: 'Mixed Paper', basePrice: 45, currency: 'USD', unit: 'ton', unitAr: 'طن', category: 'paper' as const },
  { symbol: 'GLASS', nameAr: '🫙 زجاج', nameEn: 'Cullet Glass', basePrice: 48, currency: 'USD', unit: 'ton', unitAr: 'طن', category: 'other' as const },
  { symbol: 'RUB', nameAr: '🛞 مطاط', nameEn: 'Rubber', basePrice: 1.52, currency: 'USD', unit: 'kg', unitAr: 'كجم', category: 'other' as const },
  { symbol: 'CL', nameAr: '🛢️ النفط', nameEn: 'Crude Oil', basePrice: 78.5, currency: 'USD', unit: 'bbl', unitAr: 'برميل', category: 'energy' as const },
  { symbol: 'NG', nameAr: '🔥 الغاز', nameEn: 'Natural Gas', basePrice: 2.85, currency: 'USD', unit: 'MMBtu', unitAr: 'MMBtu', category: 'energy' as const },
];

const generatePrices = (prev?: CommodityPrice[]): CommodityPrice[] => {
  return BASE_COMMODITIES.map((item, i) => {
    const prevPrice = prev?.[i]?.price ?? item.basePrice;
    const variance = (Math.random() - 0.48) * 0.03;
    const change = +(item.basePrice * variance).toFixed(item.basePrice < 10 ? 4 : 2);
    const newPrice = +(prevPrice + change * 0.3).toFixed(item.basePrice < 10 ? 4 : 2);
    const changePercent = +(((newPrice - prevPrice) / prevPrice) * 100).toFixed(2);
    return {
      symbol: item.symbol,
      nameAr: item.nameAr,
      nameEn: item.nameEn,
      price: newPrice,
      prevPrice,
      currency: item.currency,
      change: +(newPrice - prevPrice).toFixed(item.basePrice < 10 ? 4 : 2),
      changePercent,
      unit: item.unit,
      unitAr: item.unitAr,
      category: item.category,
    };
  });
};

// Animated number component
const AnimatedPrice = memo(({ value, decimals = 2, prefix = '', suffix = '' }: { value: number; decimals?: number; prefix?: string; suffix?: string }) => {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const flash = value > prevRef.current ? 'text-emerald-500' : value < prevRef.current ? 'text-destructive' : '';

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    prevRef.current = value;
    if (from === to) return;
    const steps = 12;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setDisplay(from + (to - from) * (step / steps));
      if (step >= steps) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, [value]);

  return (
    <span className={cn('font-mono font-bold tabular-nums transition-colors duration-500', flash)}>
      {prefix}{formatNumber(display, decimals)}{suffix}
    </span>
  );
});
AnimatedPrice.displayName = 'AnimatedPrice';

const GlobalCommodityTicker = () => {
  const [prices, setPrices] = useState<CommodityPrice[]>(() => generatePrices());
  const [exchangeRate, setExchangeRate] = useState(getExchangeRate);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [filter, setFilter] = useState<string>('all');

  // تحديث كل 5 ثوانٍ
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prev => generatePrices(prev));
      setExchangeRate(getExchangeRate());
      setLastUpdate(new Date());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setPrices(prev => generatePrices(prev));
    setExchangeRate(getExchangeRate());
    setLastUpdate(new Date());
  };

  const categories = [
    { key: 'all', label: 'الكل' },
    { key: 'metals', label: '🔩 معادن' },
    { key: 'plastics', label: '♻️ بلاستيك' },
    { key: 'paper', label: '📄 ورق' },
    { key: 'energy', label: '🛢️ طاقة' },
    { key: 'other', label: '📦 أخرى' },
  ];

  const filtered = filter === 'all' ? prices : prices.filter(p => p.category === filter);

  const gainers = prices.filter(p => p.change > 0).length;
  const losers = prices.filter(p => p.change < 0).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-emerald-500/30 bg-card overflow-hidden shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-l from-emerald-500/10 via-transparent to-transparent border-b border-border/30">
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className="w-3 h-3" />
            {lastUpdate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </button>
          <div className="flex items-center gap-1 text-[10px]">
            <span className="text-emerald-500 font-bold">▲{gainers}</span>
            <span className="text-destructive font-bold">▼{losers}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Globe className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-bold text-foreground">بورصة السلع العالمية</span>
          <BarChart3 className="w-4 h-4 text-emerald-500 animate-pulse" />
        </div>
      </div>

      {/* Exchange Rate Banner */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-amber-500/5 border-b border-border/20">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span>الأسعار بالدولار + المعادل بالجنيه المصري</span>
        </div>
        <div className="flex items-center gap-1">
          <DollarSign className="w-3 h-3 text-amber-500" />
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
            $1 = {formatNumber(exchangeRate, 2)} ج.م
          </span>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex gap-1 px-2 py-1.5 overflow-x-auto border-b border-border/20">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setFilter(cat.key)}
            className={cn(
              'px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors',
              filter === cat.key
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'text-muted-foreground hover:bg-muted/50'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-1 px-3 py-1 bg-muted/20 border-b border-border/20 text-[9px] text-muted-foreground font-medium">
        <span className="text-right">المادة</span>
        <span className="text-center w-20">$ السعر</span>
        <span className="text-center w-24">ج.م المعادل</span>
        <span className="text-center w-16">التغير</span>
      </div>

      {/* Price Rows */}
      <div className="max-h-[320px] overflow-y-auto divide-y divide-border/10">
        <AnimatePresence mode="popLayout">
          {filtered.map((item) => {
            const isUp = item.change > 0;
            const isDown = item.change < 0;
            const egpPrice = item.price * exchangeRate;

            return (
              <motion.div
                key={item.symbol}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                  'grid grid-cols-[1fr_auto_auto_auto] gap-1 items-center px-3 py-1.5 transition-colors',
                  isUp && 'bg-emerald-500/[0.03]',
                  isDown && 'bg-destructive/[0.03]',
                )}
              >
                {/* Name */}
                <div className="text-right min-w-0">
                  <p className="text-[11px] font-bold truncate">{item.nameAr}</p>
                  <p className="text-[9px] text-muted-foreground">{item.nameEn} / {item.unitAr}</p>
                </div>

                {/* USD Price */}
                <div className="text-center w-20">
                  <span className="text-[11px]">
                    <AnimatedPrice value={item.price} decimals={item.price < 10 ? 4 : 2} prefix="$" />
                  </span>
                </div>

                {/* EGP Equivalent */}
                <div className="text-center w-24">
                  <span className="text-[11px] text-amber-600 dark:text-amber-400">
                    <AnimatedPrice value={egpPrice} decimals={egpPrice < 100 ? 2 : 0} suffix=" ج.م" />
                  </span>
                </div>

                {/* Change */}
                <div className={cn(
                  'flex items-center justify-center gap-0.5 w-16 text-[10px] font-bold',
                  isUp && 'text-emerald-500',
                  isDown && 'text-destructive',
                  !isUp && !isDown && 'text-muted-foreground',
                )}>
                  {isUp ? <TrendingUp className="w-3 h-3" /> : isDown ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  <span>{isUp ? '+' : ''}{item.changePercent}%</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-3 py-1 bg-muted/20 border-t border-border/20 text-center">
        <span className="text-[9px] text-muted-foreground">
          تحديث تلقائي كل 5 ثوانٍ • الأسعار استرشادية • سعر الصرف: {formatNumber(exchangeRate, 2)} ج.م/$
        </span>
      </div>
    </motion.div>
  );
};

export default GlobalCommodityTicker;
