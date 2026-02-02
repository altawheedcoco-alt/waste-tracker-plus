import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Polyline, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Navigation, 
  Play, 
  Pause, 
  RotateCcw, 
  Clock, 
  Gauge, 
  Route,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  Volume2,
  VolumeX,
  Maximize2,
  Factory,
  Truck,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import BackButton from '@/components/ui/back-button';

// Fix leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Nestlé Water Factory, Banha (more precise coordinates)
const ORIGIN = { lat: 30.4628, lng: 31.1837, name: 'مصنع نستله للمياه - بنها' };
// PepsiCo Factory, 6th of October (more precise coordinates)
const DESTINATION = { lat: 29.9285, lng: 30.8365, name: 'مصنع بيبسي - السادس من أكتوبر' };

interface RouteStep {
  distance: number;
  duration: number;
  instruction: string;
  type: string;
  name: string;
  maneuver: {
    type: string;
    modifier?: string;
    location: [number, number];
  };
}

interface RouteData {
  coordinates: [number, number][];
  distance: number;
  duration: number;
  steps: RouteStep[];
}

// Custom truck icon
const createTruckIcon = (heading: number) => {
  return L.divIcon({
    className: 'truck-marker',
    html: `
      <div style="
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #22c55e, #16a34a);
        border-radius: 50%;
        box-shadow: 0 4px 15px rgba(34, 197, 94, 0.5);
        transform: rotate(${heading}deg);
        border: 3px solid white;
      ">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
          <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
      </div>
    `,
    iconSize: [50, 50],
    iconAnchor: [25, 25],
  });
};

// Location markers
const originIcon = L.divIcon({
  className: 'origin-marker',
  html: `
    <div style="
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      border-radius: 50%;
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.5);
      border: 3px solid white;
    ">
      <span style="font-size: 20px;">🏭</span>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const destinationIcon = L.divIcon({
  className: 'destination-marker',
  html: `
    <div style="
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      border-radius: 50%;
      box-shadow: 0 4px 15px rgba(239, 68, 68, 0.5);
      border: 3px solid white;
    ">
      <span style="font-size: 20px;">🎯</span>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Map controller to follow truck
const MapController = ({ position, isPlaying }: { position: [number, number]; isPlaying: boolean }) => {
  const map = useMap();
  
  useEffect(() => {
    if (isPlaying && position) {
      map.flyTo(position, 14, { duration: 0.5 });
    }
  }, [position, isPlaying, map]);
  
  return null;
};

// Translate OSRM maneuver to Arabic
const translateManeuver = (step: any): string => {
  const maneuverType = step.maneuver?.type || '';
  const modifier = step.maneuver?.modifier || '';
  const streetName = step.name || 'الطريق';
  
  const translations: Record<string, Record<string, string>> = {
    'turn': {
      'left': `انعطف يساراً إلى ${streetName}`,
      'right': `انعطف يميناً إلى ${streetName}`,
      'slight left': `انحرف قليلاً يساراً نحو ${streetName}`,
      'slight right': `انحرف قليلاً يميناً نحو ${streetName}`,
      'sharp left': `انعطف بحدة يساراً إلى ${streetName}`,
      'sharp right': `انعطف بحدة يميناً إلى ${streetName}`,
      'uturn': `استدر للخلف في ${streetName}`,
      'straight': `استمر مباشرة على ${streetName}`,
    },
    'new name': {
      'default': `استمر على ${streetName}`,
    },
    'depart': {
      'default': `ابدأ الرحلة من ${ORIGIN.name}`,
    },
    'arrive': {
      'default': `لقد وصلت إلى ${DESTINATION.name}`,
    },
    'merge': {
      'left': `اندمج يساراً في ${streetName}`,
      'right': `اندمج يميناً في ${streetName}`,
      'default': `اندمج في ${streetName}`,
    },
    'on ramp': {
      'left': `ادخل المنحدر يساراً نحو ${streetName}`,
      'right': `ادخل المنحدر يميناً نحو ${streetName}`,
      'default': `ادخل ${streetName}`,
    },
    'off ramp': {
      'left': `اخرج يساراً من ${streetName}`,
      'right': `اخرج يميناً من ${streetName}`,
      'default': `اخرج من الطريق السريع`,
    },
    'fork': {
      'left': `اتجه يساراً عند المفترق نحو ${streetName}`,
      'right': `اتجه يميناً عند المفترق نحو ${streetName}`,
      'default': `تابع عند المفترق نحو ${streetName}`,
    },
    'end of road': {
      'left': `انعطف يساراً في نهاية الطريق إلى ${streetName}`,
      'right': `انعطف يميناً في نهاية الطريق إلى ${streetName}`,
      'default': `نهاية الطريق، تابع إلى ${streetName}`,
    },
    'continue': {
      'default': `استمر على ${streetName}`,
    },
    'roundabout': {
      'default': `ادخل الدوار واخرج نحو ${streetName}`,
    },
    'rotary': {
      'default': `ادخل الميدان واخرج نحو ${streetName}`,
    },
    'roundabout turn': {
      'left': `في الدوار، انعطف يساراً نحو ${streetName}`,
      'right': `في الدوار، انعطف يميناً نحو ${streetName}`,
      'default': `في الدوار، تابع نحو ${streetName}`,
    },
    'notification': {
      'default': `${streetName}`,
    },
    'exit roundabout': {
      'default': `اخرج من الدوار إلى ${streetName}`,
    },
  };
  
  const typeTranslations = translations[maneuverType];
  if (typeTranslations) {
    return typeTranslations[modifier] || typeTranslations['default'] || `تابع على ${streetName}`;
  }
  
  return `تابع على ${streetName}`;
};

const getManeuverType = (step: any): string => {
  const maneuverType = step.maneuver?.type || '';
  const modifier = step.maneuver?.modifier || '';
  
  if (maneuverType === 'arrive') return 'arrive';
  if (maneuverType === 'depart') return 'depart';
  if (modifier.includes('left')) return 'left';
  if (modifier.includes('right')) return 'right';
  if (maneuverType === 'roundabout' || maneuverType === 'rotary') return 'roundabout';
  return 'straight';
};

const NavigationDemo = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnnouncedStepRef = useRef<number>(-1);

  // Fetch real route from OSRM
  const fetchRoute = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${ORIGIN.lng},${ORIGIN.lat};${DESTINATION.lng},${DESTINATION.lat}?overview=full&geometries=geojson&steps=true&annotations=true`
      );
      
      if (!response.ok) {
        throw new Error('فشل في جلب المسار');
      }
      
      const data = await response.json();
      
      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error('لم يتم العثور على مسار');
      }
      
      const route = data.routes[0];
      const coordinates: [number, number][] = route.geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]] // Swap lng,lat to lat,lng for Leaflet
      );
      
      // Process steps
      const steps: RouteStep[] = route.legs[0].steps.map((step: any) => ({
        distance: step.distance / 1000, // Convert to km
        duration: step.duration / 60, // Convert to minutes
        instruction: translateManeuver(step),
        type: getManeuverType(step),
        name: step.name || 'طريق غير مسمى',
        maneuver: step.maneuver,
      }));
      
      setRouteData({
        coordinates,
        distance: route.distance / 1000, // km
        duration: route.duration / 60, // minutes
        steps,
      });
      
    } catch (err) {
      console.error('Error fetching route:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في جلب المسار');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoute();
  }, []);

  const totalDistance = routeData?.distance || 0;
  const estimatedDuration = Math.round(routeData?.duration || 0);
  const currentDistance = (progress / 100) * totalDistance;
  const remainingDistance = totalDistance - currentDistance;
  const remainingTime = Math.round((remainingDistance / totalDistance) * estimatedDuration) || 0;

  // Calculate heading based on current and next point
  const calculateHeading = (current: [number, number], next: [number, number]) => {
    const dLng = next[1] - current[1];
    const dLat = next[0] - current[0];
    const angle = Math.atan2(dLng, dLat) * (180 / Math.PI);
    return angle;
  };

  const coordinates = routeData?.coordinates || [[ORIGIN.lat, ORIGIN.lng]];
  const currentPosition = coordinates[currentPointIndex] || coordinates[0];
  const nextPosition = coordinates[Math.min(currentPointIndex + 1, coordinates.length - 1)];
  const heading = calculateHeading(currentPosition, nextPosition);

  // Speak navigation instruction
  const speakInstruction = (text: string) => {
    if (isMuted || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-EG';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // Find current step based on distance
  const findCurrentStep = (distance: number): number => {
    if (!routeData?.steps) return 0;
    
    let cumulativeDistance = 0;
    for (let i = 0; i < routeData.steps.length; i++) {
      cumulativeDistance += routeData.steps[i].distance;
      if (distance < cumulativeDistance) {
        return i;
      }
    }
    return routeData.steps.length - 1;
  };

  // Update current navigation step
  useEffect(() => {
    if (!routeData?.steps) return;
    
    const stepIndex = findCurrentStep(currentDistance);
    
    if (stepIndex !== currentStep) {
      setCurrentStep(stepIndex);
      if (stepIndex !== lastAnnouncedStepRef.current && isPlaying) {
        lastAnnouncedStepRef.current = stepIndex;
        speakInstruction(routeData.steps[stepIndex].instruction);
      }
    }
  }, [currentDistance, isPlaying, isMuted, routeData]);

  // Simulation loop
  useEffect(() => {
    if (isPlaying && routeData) {
      intervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            speakInstruction('لقد وصلت إلى وجهتك. مصنع بيبسي - السادس من أكتوبر');
            return 100;
          }
          return prev + 0.15; // Slower for smoother animation
        });
        
        setCurrentPointIndex(prev => {
          const newIndex = Math.min(
            Math.floor((progress / 100) * (coordinates.length - 1)),
            coordinates.length - 1
          );
          return newIndex;
        });
        
        // Simulate varying speed (60-100 km/h)
        setSpeed(60 + Math.random() * 40);
        
        setElapsedTime(prev => prev + 1);
      }, 150);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, progress, routeData, coordinates.length]);

  const handleRestart = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentPointIndex(0);
    setCurrentStep(0);
    setElapsedTime(0);
    setSpeed(0);
    lastAnnouncedStepRef.current = -1;
    window.speechSynthesis?.cancel();
  };

  const getDirectionIcon = (type: string) => {
    switch (type) {
      case 'left': return <ArrowLeft className="w-6 h-6" />;
      case 'right': return <ArrowRight className="w-6 h-6" />;
      case 'arrive': return <CheckCircle2 className="w-6 h-6" />;
      case 'depart': return <Truck className="w-6 h-6" />;
      case 'roundabout': return <RefreshCw className="w-6 h-6" />;
      default: return <ArrowUp className="w-6 h-6" />;
    }
  };

  const getSpeedColor = (speed: number) => {
    if (speed > 80) return 'text-red-500';
    if (speed > 60) return 'text-yellow-500';
    return 'text-green-500';
  };

  const completedRoute = coordinates.slice(0, currentPointIndex + 1);
  const remainingRoute = coordinates.slice(currentPointIndex);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <Card className="p-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-lg font-medium">جاري تحميل المسار الفعلي...</p>
            <p className="text-sm text-muted-foreground">من بنها إلى السادس من أكتوبر</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <Card className="p-8">
          <div className="flex flex-col items-center gap-4">
            <AlertTriangle className="w-12 h-12 text-destructive" />
            <p className="text-lg font-medium">{error}</p>
            <Button onClick={fetchRoute}>
              <RefreshCw className="w-4 h-4 ml-2" />
              إعادة المحاولة
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const steps = routeData?.steps || [];
  const currentStepData = steps[currentStep];

  return (
    <div className={`min-h-screen bg-background ${showFullscreen ? 'fixed inset-0 z-50' : ''}`} dir="rtl">
      {!showFullscreen && (
        <div className="p-4 border-b bg-card">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-2xl font-bold">عرض توضيحي للملاحة</h1>
              <p className="text-muted-foreground">
                محاكاة رحلة حقيقية ({totalDistance.toFixed(1)} كم عبر {steps.length} نقطة ملاحية)
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={`grid ${showFullscreen ? '' : 'lg:grid-cols-3'} gap-4 p-4`}>
        {/* Map Section */}
        <div className={`${showFullscreen ? 'h-screen' : 'lg:col-span-2 h-[600px]'} relative rounded-xl overflow-hidden shadow-xl`}>
          <MapContainer
            center={[30.2, 31.0]}
            zoom={9}
            className="h-full w-full"
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
            />
            
            <MapController position={currentPosition} isPlaying={isPlaying} />
            
            {/* Completed route (green) */}
            {completedRoute.length > 1 && (
              <Polyline 
                positions={completedRoute}
                color="#22c55e"
                weight={6}
                opacity={0.9}
              />
            )}
            
            {/* Remaining route (blue dashed) */}
            {remainingRoute.length > 1 && (
              <Polyline 
                positions={remainingRoute}
                color="#3b82f6"
                weight={5}
                opacity={0.7}
                dashArray="10, 10"
              />
            )}
            
            {/* Origin marker */}
            <Marker position={[ORIGIN.lat, ORIGIN.lng]} icon={originIcon}>
              <Popup>
                <div className="text-center p-2" dir="rtl">
                  <Factory className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  <strong>{ORIGIN.name}</strong>
                  <p className="text-sm text-muted-foreground">نقطة البداية</p>
                </div>
              </Popup>
            </Marker>
            
            {/* Destination marker */}
            <Marker position={[DESTINATION.lat, DESTINATION.lng]} icon={destinationIcon}>
              <Popup>
                <div className="text-center p-2" dir="rtl">
                  <Factory className="w-6 h-6 mx-auto mb-2 text-red-500" />
                  <strong>{DESTINATION.name}</strong>
                  <p className="text-sm text-muted-foreground">نقطة الوصول</p>
                </div>
              </Popup>
            </Marker>
            
            {/* Truck marker */}
            <Marker 
              position={currentPosition} 
              icon={createTruckIcon(heading)}
            />
          </MapContainer>

          {/* Overlay Controls */}
          <div className="absolute top-4 left-4 right-4 z-[1000]">
            <Card className="bg-black/80 backdrop-blur-md border-none text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  {/* Current instruction */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      {getDirectionIcon(currentStepData?.type || 'straight')}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-lg truncate">{currentStepData?.instruction || 'جاري التحميل...'}</p>
                      <p className="text-white/70 text-sm">
                        {currentStepData?.name || ''}
                      </p>
                    </div>
                  </div>
                  
                  {/* Speed */}
                  <div className="text-center flex-shrink-0 mr-4">
                    <p className={`text-4xl font-bold ${getSpeedColor(speed)}`}>
                      {Math.round(speed)}
                    </p>
                    <p className="text-white/70 text-sm">كم/ساعة</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Stats Bar */}
          <div className="absolute bottom-4 left-4 right-4 z-[1000]">
            <Card className="bg-black/80 backdrop-blur-md border-none text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Route className="w-5 h-5 text-green-400" />
                    <span>{remainingDistance.toFixed(1)} كم متبقي</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <span>{remainingTime} دقيقة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-yellow-400" />
                    <span>{currentDistance.toFixed(1)} كم مقطوعة</span>
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
              </CardContent>
            </Card>
          </div>

          {/* Fullscreen toggle */}
          <Button
            variant="outline"
            size="icon"
            className="absolute top-20 left-4 z-[1000] bg-white/90"
            onClick={() => setShowFullscreen(!showFullscreen)}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Control Panel */}
        {!showFullscreen && (
          <div className="space-y-4">
            {/* Trip Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  معلومات الرحلة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium">نقطة الانطلاق</span>
                  </div>
                  <p className="text-sm text-muted-foreground mr-5">{ORIGIN.name}</p>
                </div>
                
                <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm font-medium">نقطة الوصول</span>
                  </div>
                  <p className="text-sm text-muted-foreground mr-5">{DESTINATION.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{totalDistance.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">كم إجمالي</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{estimatedDuration}</p>
                    <p className="text-xs text-muted-foreground">دقيقة تقديرية</p>
                  </div>
                </div>

                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    ✓ مسار حقيقي من OSRM
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {coordinates.length} نقطة GPS | {steps.length} تعليمات ملاحية
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Controls */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">التحكم</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    variant={isPlaying ? "destructive" : "default"}
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-4 h-4 ml-2" />
                        إيقاف
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 ml-2" />
                        {progress > 0 ? 'استئناف' : 'بدء المحاكاة'}
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleRestart}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                </div>

                {/* Status */}
                <div className="flex items-center justify-center gap-2">
                  {progress >= 100 ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="w-4 h-4 ml-1" />
                      تم الوصول
                    </Badge>
                  ) : isPlaying ? (
                    <Badge variant="default" className="bg-blue-500 animate-pulse">
                      <Navigation className="w-4 h-4 ml-1" />
                      جاري التنقل...
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      في الانتظار
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Navigation Steps */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Route className="w-5 h-5" />
                  خطوات الملاحة ({steps.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {steps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(index * 0.02, 1) }}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                        index === currentStep 
                          ? 'bg-primary/10 border border-primary' 
                          : index < currentStep 
                            ? 'bg-green-50 dark:bg-green-950 opacity-60' 
                            : 'bg-muted/50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        index === currentStep 
                          ? 'bg-primary text-primary-foreground' 
                          : index < currentStep 
                            ? 'bg-green-500 text-white' 
                            : 'bg-muted'
                      }`}>
                        {index < currentStep ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          getDirectionIcon(step.type)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${index === currentStep ? 'font-bold' : ''}`}>
                          {step.instruction}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {step.distance.toFixed(1)} كم
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default NavigationDemo;
