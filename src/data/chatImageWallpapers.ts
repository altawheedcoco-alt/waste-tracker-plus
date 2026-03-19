import type { ImageWallpaper } from '@/hooks/useChatWallpaper';

import smartTracking from '@/assets/wallpapers/smart-tracking.jpg';
import pharaohsRecycling from '@/assets/wallpapers/pharaohs-recycling.jpg';
import digitalAnalytics from '@/assets/wallpapers/digital-analytics.jpg';
import recyclingCycle from '@/assets/wallpapers/recycling-cycle.jpg';
import smartCityWaste from '@/assets/wallpapers/smart-city-waste.jpg';
import egyptDigitalRecycle from '@/assets/wallpapers/egypt-digital-recycle.jpg';
import wasteNetwork from '@/assets/wallpapers/waste-network.jpg';
import minimalRecyclePattern from '@/assets/wallpapers/minimal-recycle-pattern.jpg';
import nileSustainability from '@/assets/wallpapers/nile-sustainability.jpg';
import holoDashboard from '@/assets/wallpapers/holo-dashboard.jpg';
import greenEarthSpace from '@/assets/wallpapers/green-earth-space.jpg';
import islamicEcoArt from '@/assets/wallpapers/islamic-eco-art.jpg';
import oceanCleanup from '@/assets/wallpapers/ocean-cleanup.jpg';
import transformation from '@/assets/wallpapers/transformation.jpg';
import emeraldMarble from '@/assets/wallpapers/emerald-marble.jpg';

export const IMAGE_WALLPAPERS: ImageWallpaper[] = [
  // Tracking
  { id: 'smart-tracking', label: 'التتبع الذكي', category: 'tracking', src: smartTracking },
  { id: 'waste-network', label: 'شبكة إدارة النفايات', category: 'tracking', src: wasteNetwork },
  { id: 'holo-dashboard', label: 'لوحة بيانات هولوجرام', category: 'tracking', src: holoDashboard },

  // Egypt
  { id: 'pharaohs-recycling', label: 'الأهرامات والتدوير', category: 'egypt', src: pharaohsRecycling },
  { id: 'egypt-digital-recycle', label: 'أنوبيس الرقمي', category: 'egypt', src: egyptDigitalRecycle },
  { id: 'nile-sustainability', label: 'النيل والاستدامة', category: 'egypt', src: nileSustainability },

  // Digital
  { id: 'digital-analytics', label: 'تحليلات البيانات', category: 'digital', src: digitalAnalytics },

  // Eco
  { id: 'recycling-cycle', label: 'دورة التدوير', category: 'eco', src: recyclingCycle },
  { id: 'minimal-recycle-pattern', label: 'نمط التدوير', category: 'eco', src: minimalRecyclePattern },
  { id: 'transformation', label: 'التحول الأخضر', category: 'eco', src: transformation },
  { id: 'islamic-eco-art', label: 'فن إسلامي بيئي', category: 'eco', src: islamicEcoArt },

  // City
  { id: 'smart-city-waste', label: 'المدينة الذكية', category: 'city', src: smartCityWaste },

  // Ocean
  { id: 'ocean-cleanup', label: 'تنظيف المحيطات', category: 'ocean', src: oceanCleanup },
  { id: 'green-earth-space', label: 'الأرض الخضراء', category: 'ocean', src: greenEarthSpace },

  // Premium
  { id: 'emerald-marble', label: 'رخام زمردي', category: 'premium', src: emeraldMarble },
];
