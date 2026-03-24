/**
 * شريط بورصة السلع العالمية — يعرض أسعار الذهب والفضة والنحاس والبلاستيك والخشب وغيرها
 * يظهر أعلى التنبيهات التشغيلية في لوحات المدوّر والناقل
 */
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus, RefreshCw, Globe, BarChart3,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CommodityPrice {
  symbol: string;
  nameAr: string;
  nameEn: string;
  price: number;
  currency: string;
  change: number;
  changePercent: number;
  unit: string;
}

// Simulated live prices — في الإنتاج يتم ربطها بـ API حقيقي
const generatePrices = (): CommodityPrice[] => {
  const base = [
    { symbol: 'XAU', nameAr: '🥇 الذهب', nameEn: 'Gold', basePrice: 2340, currency: 'USD', unit: 'أونصة' },
    { symbol: 'XAG', nameAr: '🥈 الفضة', nameEn: 'Silver', basePrice: 29.5, currency: 'USD', unit: 'أونصة' },
    { symbol: 'HG', nameAr: '🔶 النحاس', nameEn: 'Copper', basePrice: 4.35, currency: 'USD', unit: 'رطل' },
    { symbol: 'ALU', nameAr: '🔩 الألمنيوم', nameEn: 'Aluminum', basePrice: 2520, currency: 'USD', unit: 'طن' },
    { symbol: 'FE', nameAr: '⚙️ الحديد', nameEn: 'Iron Ore', basePrice: 108, currency: 'USD', unit: 'طن' },
    { symbol: 'PET', nameAr: '♻️ بلاستيك PET', nameEn: 'PET Plastic', basePrice: 850, currency: 'USD', unit: 'طن' },
    { symbol: 'HDPE', nameAr: '♻️ بلاستيك HDPE', nameEn: 'HDPE', basePrice: 1120, currency: 'USD', unit: 'طن' },
    { symbol: 'PP', nameAr: '♻️ بولي بروبلين', nameEn: 'Polypropylene', basePrice: 980, currency: 'USD', unit: 'طن' },
    { symbol: 'LMB', nameAr: '🪵 الخشب', nameEn: 'Lumber', basePrice: 545, currency: 'USD', unit: '1000 قدم' },
    { symbol: 'OCC', nameAr: '📦 كرتون OCC', nameEn: 'OCC Cardboard', basePrice: 95, currency: 'USD', unit: 'طن' },
    { symbol: 'PPAP', nameAr: '📄 ورق مختلط', nameEn: 'Mixed Paper', basePrice: 45, currency: 'USD', unit: 'طن' },
    { symbol: 'SCR', nameAr: '🔧 خردة حديد', nameEn: 'Scrap Steel', basePrice: 380, currency: 'USD', unit: 'طن' },
    { symbol: 'GLASS', nameAr: '🫙 زجاج مكسور', nameEn: 'Cullet Glass', basePrice: 48, currency: 'USD', unit: 'طن' },
    { symbol: 'RUB', nameAr: '🛞 مطاط', nameEn: 'Rubber', basePrice: 1.52, currency: 'USD', unit: 'كجم' },
    { symbol: 'CL', nameAr: '🛢️ النفط', nameEn: 'Crude Oil', basePrice: 78.5, currency: 'USD', unit: 'برميل' },
    { symbol: 'NG', nameAr: '🔥 الغاز', nameEn: 'Natural Gas', basePrice: 2.85, currency: 'USD', unit: 'MMBtu' },
  ];

  return base.map(item => {
    const variance = (Math.random() - 0.48) * 0.04; // slight upward bias
    const change = +(item.basePrice * variance).toFixed(item.basePrice < 10 ? 4 : 2);
    const changePercent = +((change / item.basePrice) * 100).toFixed(2);
    return {
      symbol: item.symbol,
      nameAr: item.nameAr,
      nameEn: item.nameEn,
      price: +(item.basePrice + change).toFixed(item.basePrice < 10 ? 4 : 2),
      currency: item.currency,
      change,
      changePercent,
      unit: item.unit,
    };
  });
};

const GlobalCommodityTicker = () => {
  const [prices, setPrices] = useState<CommodityPrice[]>(generatePrices);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(generatePrices());
      setLastUpdate(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let animId: number;
    let scrollPos = 0;
    const speed = 0.5;
    const tick = () => {
      scrollPos += speed;
      if (scrollPos >= el.scrollWidth / 2) scrollPos = 0;
      el.scrollLeft = scrollPos;
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    const pause = () => cancelAnimationFrame(animId);
    const resume = () => { animId = requestAnimationFrame(tick); };
    el.addEventListener('mouseenter', pause);
    el.addEventListener('mouseleave', resume);
    el.addEventListener('touchstart', pause);
    el.addEventListener('touchend', resume);
    return () => {
      cancelAnimationFrame(animId);
      el.removeEventListener('mouseenter', pause);
      el.removeEventListener('mouseleave', resume);
      el.removeEventListener('touchstart', pause);
      el.removeEventListener('touchend', resume);
    };
  }, [prices]);

  const handleRefresh = () => {
    setPrices(generatePrices());
    setLastUpdate(new Date());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/50 bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-b border-border/30">
        <button onClick={handleRefresh} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="w-3 h-3" />
          {lastUpdate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
        </button>
        <div className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-xs font-bold text-foreground">بورصة السلع العالمية</span>
          <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
        </div>
      </div>

      {/* Scrolling ticker */}
      <div
        ref={scrollRef}
        className="flex overflow-x-hidden whitespace-nowrap py-2 px-1"
        style={{ scrollBehavior: 'auto' }}
      >
        {/* Duplicate for seamless loop */}
        {[...prices, ...prices].map((item, i) => {
          const isUp = item.change > 0;
          const isDown = item.change < 0;
          return (
            <div
              key={`${item.symbol}-${i}`}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 mx-1 rounded-lg border transition-colors flex-shrink-0',
                isUp && 'bg-emerald-500/5 border-emerald-500/20',
                isDown && 'bg-destructive/5 border-destructive/20',
                !isUp && !isDown && 'bg-muted/30 border-border/30',
              )}
            >
              <span className="text-xs font-bold text-foreground">{item.nameAr}</span>
              <span className="text-xs font-mono font-bold text-foreground">
                ${item.price.toLocaleString()}
              </span>
              <div className={cn(
                'flex items-center gap-0.5 text-[10px] font-bold',
                isUp && 'text-emerald-500',
                isDown && 'text-destructive',
                !isUp && !isDown && 'text-muted-foreground',
              )}>
                {isUp ? <TrendingUp className="w-3 h-3" /> : isDown ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                <span>{isUp ? '+' : ''}{item.changePercent}%</span>
              </div>
              <span className="text-[9px] text-muted-foreground">/{item.unit}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default GlobalCommodityTicker;
