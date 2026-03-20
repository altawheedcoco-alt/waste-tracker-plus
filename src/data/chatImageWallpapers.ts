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

// Batch 1 - New wallpapers
import abstractGreenGeo from '@/assets/wallpapers/abstract-green-geo.jpg';
import pyramidSunset from '@/assets/wallpapers/pyramid-sunset.jpg';
import cosmicNebula from '@/assets/wallpapers/cosmic-nebula.jpg';
import tropicalForest from '@/assets/wallpapers/tropical-forest.jpg';
import futureCityNight from '@/assets/wallpapers/future-city-night.jpg';
import darkGoldMarble from '@/assets/wallpapers/dark-gold-marble.jpg';
import coralReef from '@/assets/wallpapers/coral-reef.jpg';
import islamicGoldPattern from '@/assets/wallpapers/islamic-gold-pattern.jpg';
import zenGarden from '@/assets/wallpapers/zen-garden.jpg';
import solarEnergy from '@/assets/wallpapers/solar-energy.jpg';
import auroraBorealis from '@/assets/wallpapers/aurora-borealis.jpg';
import circuitBoard from '@/assets/wallpapers/circuit-board.jpg';
import mistyMountains from '@/assets/wallpapers/misty-mountains.jpg';
import whiteMarble from '@/assets/wallpapers/white-marble.jpg';
import nileGoldenHour from '@/assets/wallpapers/nile-golden-hour.jpg';

// Batch 2 - More wallpapers
import jungleWaterfall from '@/assets/wallpapers/jungle-waterfall.jpg';
import fluidTeal from '@/assets/wallpapers/fluid-teal.jpg';
import cherryBlossom from '@/assets/wallpapers/cherry-blossom.jpg';
import egyptTemple from '@/assets/wallpapers/egypt-temple.jpg';
import holoDataViz from '@/assets/wallpapers/holo-data-viz.jpg';
import windEnergy from '@/assets/wallpapers/wind-energy.jpg';
import recycledArt from '@/assets/wallpapers/recycled-art.jpg';
import starryLake from '@/assets/wallpapers/starry-lake.jpg';
import lavenderField from '@/assets/wallpapers/lavender-field.jpg';
import forestLight from '@/assets/wallpapers/forest-light.jpg';
import turquoiseBeach from '@/assets/wallpapers/turquoise-beach.jpg';
import smartRecyclingFacility from '@/assets/wallpapers/smart-recycling-facility.jpg';
import navyGoldTessellation from '@/assets/wallpapers/navy-gold-tessellation.jpg';
import redSeaDiving from '@/assets/wallpapers/red-sea-diving.jpg';

// Batch 3 - Final wallpapers
import autumnForest from '@/assets/wallpapers/autumn-forest.jpg';
import bokehLights from '@/assets/wallpapers/bokeh-lights.jpg';
import sphinxNight from '@/assets/wallpapers/sphinx-night.jpg';
import greenWaves from '@/assets/wallpapers/green-waves.jpg';
import modernSkyline from '@/assets/wallpapers/modern-skyline.jpg';
import blueVelvet from '@/assets/wallpapers/blue-velvet.jpg';
import riceTerraces from '@/assets/wallpapers/rice-terraces.jpg';
import hotAirBalloons from '@/assets/wallpapers/hot-air-balloons.jpg';
import digitalRain from '@/assets/wallpapers/digital-rain.jpg';
import iceCrystal from '@/assets/wallpapers/ice-crystal.jpg';
import lavaVolcanic from '@/assets/wallpapers/lava-volcanic.jpg';
import sunflowerField from '@/assets/wallpapers/sunflower-field.jpg';
import urbanNature from '@/assets/wallpapers/urban-nature.jpg';

export const IMAGE_WALLPAPERS: ImageWallpaper[] = [
  // Tracking
  { id: 'smart-tracking', label: 'التتبع الذكي', category: 'tracking', src: smartTracking },
  { id: 'waste-network', label: 'شبكة إدارة النفايات', category: 'tracking', src: wasteNetwork },
  { id: 'holo-dashboard', label: 'لوحة بيانات هولوجرام', category: 'tracking', src: holoDashboard },
  { id: 'circuit-board', label: 'لوحة إلكترونية', category: 'tracking', src: circuitBoard },
  { id: 'digital-rain', label: 'المطر الرقمي', category: 'tracking', src: digitalRain },

  // Egypt
  { id: 'pharaohs-recycling', label: 'الأهرامات والتدوير', category: 'egypt', src: pharaohsRecycling },
  { id: 'egypt-digital-recycle', label: 'أنوبيس الرقمي', category: 'egypt', src: egyptDigitalRecycle },
  { id: 'nile-sustainability', label: 'النيل والاستدامة', category: 'egypt', src: nileSustainability },
  { id: 'pyramid-sunset', label: 'غروب الأهرامات', category: 'egypt', src: pyramidSunset },
  { id: 'nile-golden-hour', label: 'النيل الذهبي', category: 'egypt', src: nileGoldenHour },
  { id: 'egypt-temple', label: 'معبد فرعوني', category: 'egypt', src: egyptTemple },
  { id: 'sphinx-night', label: 'أبو الهول ليلاً', category: 'egypt', src: sphinxNight },

  // Digital
  { id: 'digital-analytics', label: 'تحليلات البيانات', category: 'digital', src: digitalAnalytics },
  { id: 'holo-data-viz', label: 'بيانات هولوجرامية', category: 'digital', src: holoDataViz },

  // Eco
  { id: 'recycling-cycle', label: 'دورة التدوير', category: 'eco', src: recyclingCycle },
  { id: 'minimal-recycle-pattern', label: 'نمط التدوير', category: 'eco', src: minimalRecyclePattern },
  { id: 'transformation', label: 'التحول الأخضر', category: 'eco', src: transformation },
  { id: 'islamic-eco-art', label: 'فن إسلامي بيئي', category: 'eco', src: islamicEcoArt },
  { id: 'abstract-green-geo', label: 'هندسة خضراء', category: 'eco', src: abstractGreenGeo },
  { id: 'recycled-art', label: 'فن التدوير', category: 'eco', src: recycledArt },
  { id: 'smart-recycling-facility', label: 'مصنع تدوير ذكي', category: 'eco', src: smartRecyclingFacility },
  { id: 'urban-nature', label: 'طبيعة حضرية', category: 'eco', src: urbanNature },

  // City
  { id: 'smart-city-waste', label: 'المدينة الذكية', category: 'city', src: smartCityWaste },
  { id: 'future-city-night', label: 'مدينة المستقبل', category: 'city', src: futureCityNight },
  { id: 'modern-skyline', label: 'أفق المدينة', category: 'city', src: modernSkyline },

  // Ocean
  { id: 'ocean-cleanup', label: 'تنظيف المحيطات', category: 'ocean', src: oceanCleanup },
  { id: 'green-earth-space', label: 'الأرض الخضراء', category: 'ocean', src: greenEarthSpace },
  { id: 'coral-reef', label: 'الشعاب المرجانية', category: 'ocean', src: coralReef },
  { id: 'turquoise-beach', label: 'شاطئ فيروزي', category: 'ocean', src: turquoiseBeach },
  { id: 'red-sea-diving', label: 'غوص البحر الأحمر', category: 'ocean', src: redSeaDiving },

  // Premium
  { id: 'emerald-marble', label: 'رخام زمردي', category: 'premium', src: emeraldMarble },
  { id: 'dark-gold-marble', label: 'رخام ذهبي داكن', category: 'premium', src: darkGoldMarble },
  { id: 'white-marble', label: 'رخام أبيض', category: 'premium', src: whiteMarble },
  { id: 'islamic-gold-pattern', label: 'زخرفة ذهبية إسلامية', category: 'premium', src: islamicGoldPattern },
  { id: 'navy-gold-tessellation', label: 'فسيفساء ذهبية', category: 'premium', src: navyGoldTessellation },
  { id: 'blue-velvet', label: 'مخمل أزرق', category: 'premium', src: blueVelvet },
  { id: 'bokeh-lights', label: 'أضواء بوكيه', category: 'premium', src: bokehLights },

  // Nature (new)
  { id: 'tropical-forest', label: 'غابة استوائية', category: 'nature', src: tropicalForest },
  { id: 'misty-mountains', label: 'جبال ضبابية', category: 'nature', src: mistyMountains },
  { id: 'jungle-waterfall', label: 'شلال الغابة', category: 'nature', src: jungleWaterfall },
  { id: 'cherry-blossom', label: 'أزهار الكرز', category: 'nature', src: cherryBlossom },
  { id: 'lavender-field', label: 'حقل اللافندر', category: 'nature', src: lavenderField },
  { id: 'forest-light', label: 'نور الغابة', category: 'nature', src: forestLight },
  { id: 'autumn-forest', label: 'غابة الخريف', category: 'nature', src: autumnForest },
  { id: 'rice-terraces', label: 'مدرجات الأرز', category: 'nature', src: riceTerraces },
  { id: 'zen-garden', label: 'حديقة زن', category: 'nature', src: zenGarden },
  { id: 'sunflower-field', label: 'حقل دوار الشمس', category: 'nature', src: sunflowerField },
  { id: 'hot-air-balloons', label: 'مناطيد هوائية', category: 'nature', src: hotAirBalloons },

  // Space (new)
  { id: 'cosmic-nebula', label: 'سديم كوني', category: 'space', src: cosmicNebula },
  { id: 'aurora-borealis', label: 'الشفق القطبي', category: 'space', src: auroraBorealis },
  { id: 'starry-lake', label: 'بحيرة النجوم', category: 'space', src: starryLake },

  // Abstract (new)
  { id: 'fluid-teal', label: 'سائل زمردي', category: 'abstract', src: fluidTeal },
  { id: 'green-waves', label: 'موجات خضراء', category: 'abstract', src: greenWaves },
  { id: 'ice-crystal', label: 'بلورة ثلجية', category: 'abstract', src: iceCrystal },
  { id: 'lava-volcanic', label: 'حمم بركانية', category: 'abstract', src: lavaVolcanic },

  // Energy (new)
  { id: 'solar-energy', label: 'طاقة شمسية', category: 'energy', src: solarEnergy },
  { id: 'wind-energy', label: 'طاقة الرياح', category: 'energy', src: windEnergy },
];
