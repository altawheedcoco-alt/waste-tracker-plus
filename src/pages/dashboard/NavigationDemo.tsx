import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleMap, useJsApiLoader, Marker, Polyline, Circle, InfoWindow } from '@react-google-maps/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  Minimize2,
  Factory,
  Truck,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Timer,
  TrendingUp,
  Navigation2,
  Compass,
  Milestone,
  Zap,
  Eye,
  Map,
  List,
  Info,
  SkipForward,
  ChevronLeft,
  ExternalLink
} from 'lucide-react';
import BackButton from '@/components/ui/back-button';

// Real Egyptian industrial locations
const ORIGIN = { lat: 30.4628, lng: 31.1837, name: 'مصنع نستله للمياه - بنها', city: 'بنها - القليوبية' };
const DESTINATION = { lat: 29.9285, lng: 30.8365, name: 'مصنع بيبسي - السادس من أكتوبر', city: '6 أكتوبر - الجيزة' };

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
    'new name': { 'default': `استمر على ${streetName}` },
    'depart': { 'default': `ابدأ الرحلة من ${ORIGIN.name}` },
    'arrive': { 'default': `لقد وصلت إلى ${DESTINATION.name}` },
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
    'continue': { 'default': `استمر على ${streetName}` },
    'roundabout': { 'default': `ادخل الدوار واخرج نحو ${streetName}` },
    'rotary': { 'default': `ادخل الميدان واخرج نحو ${streetName}` },
    'roundabout turn': {
      'left': `في الدوار، انعطف يساراً نحو ${streetName}`,
      'right': `في الدوار، انعطف يميناً نحو ${streetName}`,
      'default': `في الدوار، تابع نحو ${streetName}`,
    },
    'notification': { 'default': `${streetName}` },
    'exit roundabout': { 'default': `اخرج من الدوار إلى ${streetName}` },
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

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = { lat: 30.2, lng: 31.0 };

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: true,
  streetViewControl: false,
  fullscreenControl: false,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
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
  const [activeTab, setActiveTab] = useState('map');
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [showWaypoints, setShowWaypoints] = useState(true);
  const [selectedWaypoint, setSelectedWaypoint] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnnouncedStepRef = useRef<number>(-1);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    language: 'ar',
  });

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Fetch real route from OSRM
  const fetchRoute = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${ORIGIN.lng},${ORIGIN.lat};${DESTINATION.lng},${DESTINATION.lat}?overview=full&geometries=geojson&steps=true&annotations=true`
      );
      
      if (!response.ok) throw new Error('فشل في جلب المسار');
      
      const data = await response.json();
      
      if (data.code !== 'Ok' || !data.routes?.[0]) throw new Error('لم يتم العثور على مسار');
      
      const route = data.routes[0];
      const coordinates: [number, number][] = route.geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]]
      );
      
      const steps: RouteStep[] = route.legs[0].steps.map((step: any) => ({
        distance: step.distance / 1000,
        duration: step.duration / 60,
        instruction: translateManeuver(step),
        type: getManeuverType(step),
        name: step.name || 'طريق غير مسمى',
        maneuver: step.maneuver,
      }));
      
      setRouteData({
        coordinates,
        distance: route.distance / 1000,
        duration: route.duration / 60,
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

  // Center map on truck when playing
  useEffect(() => {
    if (isPlaying && mapRef.current && routeData) {
      const currentPos = routeData.coordinates[currentPointIndex];
      if (currentPos) {
        mapRef.current.panTo({ lat: currentPos[0], lng: currentPos[1] });
      }
    }
  }, [currentPointIndex, isPlaying, routeData]);

  const totalDistance = routeData?.distance || 0;
  const estimatedDuration = Math.round(routeData?.duration || 0);
  const currentDistance = (progress / 100) * totalDistance;
  const remainingDistance = totalDistance - currentDistance;
  const remainingTime = Math.round((remainingDistance / totalDistance) * estimatedDuration) || 0;

  const calculateHeading = (current: [number, number], next: [number, number]) => {
    const dLng = next[1] - current[1];
    const dLat = next[0] - current[0];
    return Math.atan2(dLng, dLat) * (180 / Math.PI);
  };

  const coordinates = routeData?.coordinates || [[ORIGIN.lat, ORIGIN.lng]];
  const currentPosition = coordinates[currentPointIndex] || coordinates[0];
  const nextPosition = coordinates[Math.min(currentPointIndex + 1, coordinates.length - 1)];
  const heading = calculateHeading(currentPosition, nextPosition);

  const speakInstruction = (text: string) => {
    if (isMuted || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-EG';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const findCurrentStep = (distance: number): number => {
    if (!routeData?.steps) return 0;
    let cumulativeDistance = 0;
    for (let i = 0; i < routeData.steps.length; i++) {
      cumulativeDistance += routeData.steps[i].distance;
      if (distance < cumulativeDistance) return i;
    }
    return routeData.steps.length - 1;
  };

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

  useEffect(() => {
    if (isPlaying && routeData) {
      intervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            speakInstruction('لقد وصلت إلى وجهتك. مصنع بيبسي - السادس من أكتوبر');
            return 100;
          }
          return prev + (0.15 * simulationSpeed);
        });
        
        setCurrentPointIndex(prev => 
          Math.min(Math.floor((progress / 100) * (coordinates.length - 1)), coordinates.length - 1)
        );
        
        setSpeed(60 + Math.random() * 40);
        setElapsedTime(prev => prev + 1);
      }, 150);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, progress, routeData, coordinates.length, simulationSpeed]);

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

  const getDirectionIcon = (type: string, size = 'w-6 h-6') => {
    const iconClass = size;
    switch (type) {
      case 'left': return <ArrowLeft className={iconClass} />;
      case 'right': return <ArrowRight className={iconClass} />;
      case 'arrive': return <CheckCircle2 className={iconClass} />;
      case 'depart': return <Navigation2 className={iconClass} />;
      case 'roundabout': return <RefreshCw className={iconClass} />;
      default: return <ArrowUp className={iconClass} />;
    }
  };

  const getSpeedColor = (speed: number) => {
    if (speed > 90) return 'text-red-500';
    if (speed > 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const completedRoute = coordinates.slice(0, currentPointIndex + 1);
  const remainingRoute = coordinates.slice(currentPointIndex);
  const steps = routeData?.steps || [];
  const currentStepData = steps[currentStep];
  const nextStepData = steps[currentStep + 1];

  // Calculate average speed
  const avgSpeed = elapsedTime > 0 ? (currentDistance / (elapsedTime / 3600)).toFixed(0) : '0';

  // Convert coordinates for Google Maps
  const completedPath = completedRoute.map(coord => ({ lat: coord[0], lng: coord[1] }));
  const remainingPath = remainingRoute.map(coord => ({ lat: coord[0], lng: coord[1] }));

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted" dir="rtl">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-8 shadow-xl">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <Loader2 className="w-16 h-16 animate-spin text-primary" />
                <Map className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold mb-2">جاري تحميل خرائط جوجل والمسار</p>
                <p className="text-muted-foreground">من بنها إلى السادس من أكتوبر</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Factory className="w-4 h-4" /> {ORIGIN.city}</span>
                <ChevronLeft className="w-4 h-4" />
                <span className="flex items-center gap-1"><Factory className="w-4 h-4" /> {DESTINATION.city}</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted" dir="rtl">
        <Card className="p-8 shadow-xl">
          <div className="flex flex-col items-center gap-4">
            <AlertTriangle className="w-16 h-16 text-destructive" />
            <p className="text-xl font-bold">{error}</p>
            <Button onClick={fetchRoute} size="lg">
              <RefreshCw className="w-5 h-5 ml-2" />
              إعادة المحاولة
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-background to-muted ${showFullscreen ? 'fixed inset-0 z-50' : ''}`} dir="rtl">
      {/* Header */}
      {!showFullscreen && (
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="p-4 border-b bg-card/95 backdrop-blur-sm sticky top-0 z-40"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BackButton />
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <img 
                    src="https://www.google.com/images/branding/product/1x/maps_64dp.png" 
                    alt="Google Maps" 
                    className="w-7 h-7"
                  />
                  العرض التوضيحي للملاحة
                </h1>
                <p className="text-muted-foreground text-sm">
                  محاكاة رحلة حقيقية بخرائط جوجل • {totalDistance.toFixed(1)} كم • {steps.length} نقطة ملاحية
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-4">
              <Badge variant="outline" className="px-3 py-1.5">
                <Route className="w-4 h-4 ml-1 text-blue-500" />
                {totalDistance.toFixed(1)} كم
              </Badge>
              <Badge variant="outline" className="px-3 py-1.5">
                <Clock className="w-4 h-4 ml-1 text-green-500" />
                {estimatedDuration} دقيقة
              </Badge>
              <Badge variant="outline" className="px-3 py-1.5">
                <Milestone className="w-4 h-4 ml-1 text-purple-500" />
                {coordinates.length} نقطة GPS
              </Badge>
            </div>
          </div>
        </motion.div>
      )}

      <div className={`grid ${showFullscreen ? '' : 'lg:grid-cols-3'} gap-4 p-4`}>
        {/* Map Section */}
        <div className={`${showFullscreen ? 'h-screen' : 'lg:col-span-2 h-[650px]'} relative rounded-2xl overflow-hidden shadow-2xl border`}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={defaultCenter}
            zoom={9}
            options={mapOptions}
            onLoad={onMapLoad}
          >
            {/* Completed route (green) */}
            {completedPath.length > 1 && (
              <Polyline
                path={completedPath}
                options={{
                  strokeColor: '#22c55e',
                  strokeWeight: 6,
                  strokeOpacity: 1,
                }}
              />
            )}

            {/* Remaining route (blue dashed) */}
            {remainingPath.length > 1 && (
              <Polyline
                path={remainingPath}
                options={{
                  strokeColor: '#3b82f6',
                  strokeWeight: 5,
                  strokeOpacity: 0.7,
                  icons: [{
                    icon: {
                      path: 'M 0,-1 0,1',
                      strokeOpacity: 1,
                      scale: 4,
                    },
                    offset: '0',
                    repeat: '20px',
                  }],
                }}
              />
            )}

            {/* Accuracy circle around truck */}
            {isPlaying && (
              <Circle
                center={{ lat: currentPosition[0], lng: currentPosition[1] }}
                radius={200}
                options={{
                  strokeColor: '#22c55e',
                  strokeWeight: 2,
                  fillColor: '#22c55e',
                  fillOpacity: 0.15,
                }}
              />
            )}

            {/* Waypoint markers */}
            {showWaypoints && steps.map((step, index) => {
              if (!step.maneuver?.location) return null;
              const pos = { lat: step.maneuver.location[1], lng: step.maneuver.location[0] };
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              
              return (
                <Marker
                  key={index}
                  position={pos}
                  onClick={() => setSelectedWaypoint(index)}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: isCurrent ? '#f59e0b' : isCompleted ? '#22c55e' : '#6b7280',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 2,
                  }}
                  label={{
                    text: `${index + 1}`,
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 'bold',
                  }}
                />
              );
            })}

            {/* InfoWindow for selected waypoint */}
            {selectedWaypoint !== null && steps[selectedWaypoint]?.maneuver?.location && (
              <InfoWindow
                position={{
                  lat: steps[selectedWaypoint].maneuver.location[1],
                  lng: steps[selectedWaypoint].maneuver.location[0],
                }}
                onCloseClick={() => setSelectedWaypoint(null)}
              >
                <div className="text-center p-2 min-w-[200px]" dir="rtl">
                  <p className="font-bold text-sm">{steps[selectedWaypoint].instruction}</p>
                  <p className="text-xs text-gray-500 mt-1">{steps[selectedWaypoint].distance.toFixed(1)} كم</p>
                </div>
              </InfoWindow>
            )}

            {/* Origin marker */}
            <Marker
              position={{ lat: ORIGIN.lat, lng: ORIGIN.lng }}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                scaledSize: new google.maps.Size(48, 48),
              }}
              title={ORIGIN.name}
            />

            {/* Destination marker */}
            <Marker
              position={{ lat: DESTINATION.lat, lng: DESTINATION.lng }}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                scaledSize: new google.maps.Size(48, 48),
              }}
              title={DESTINATION.name}
            />

            {/* Truck marker with custom icon */}
            <Marker
              position={{ lat: currentPosition[0], lng: currentPosition[1] }}
              icon={{
                url: `data:image/svg+xml,${encodeURIComponent(`
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60">
                    <defs>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <g transform="rotate(${heading}, 30, 30)" filter="url(#glow)">
                      <circle cx="30" cy="30" r="25" fill="#22c55e" stroke="white" stroke-width="3"/>
                      <path d="M20 35h20v-10h-3v-5h-14c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4h-3v-3h-10v7h-3v7z" fill="white" transform="translate(6, 16) scale(0.8)"/>
                    </g>
                  </svg>
                `)}`,
                scaledSize: new google.maps.Size(60, 60),
                anchor: new google.maps.Point(30, 30),
              }}
            />
          </GoogleMap>

          {/* Navigation Overlay - Current Instruction */}
          <motion.div 
            className="absolute top-4 left-4 right-4 z-[1000]"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <Card className="bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-md border-none text-white shadow-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Current instruction */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <motion.div 
                      className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-green-600 flex items-center justify-center flex-shrink-0 shadow-lg"
                      animate={isPlaying ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      {getDirectionIcon(currentStepData?.type || 'straight', 'w-7 h-7')}
                    </motion.div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-lg leading-tight line-clamp-2">
                        {currentStepData?.instruction || 'جاري التحميل...'}
                      </p>
                      {nextStepData && (
                        <p className="text-white/60 text-sm mt-1 flex items-center gap-1">
                          <SkipForward className="w-3 h-3" />
                          ثم: {nextStepData.instruction.substring(0, 40)}...
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Speed Display */}
                  <div className="text-center flex-shrink-0 bg-black/30 rounded-xl px-4 py-2">
                    <motion.p 
                      className={`text-4xl font-bold ${getSpeedColor(speed)}`}
                      key={Math.round(speed)}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                    >
                      {Math.round(speed)}
                    </motion.p>
                    <p className="text-white/60 text-xs">كم/ساعة</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Bottom Stats Bar */}
          <motion.div 
            className="absolute bottom-4 left-4 right-4 z-[1000]"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <Card className="bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-md border-none text-white shadow-2xl">
              <CardContent className="p-4">
                <div className="grid grid-cols-4 gap-4 mb-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
                      <Route className="w-4 h-4" />
                    </div>
                    <p className="text-lg font-bold">{remainingDistance.toFixed(1)}</p>
                    <p className="text-xs text-white/60">كم متبقي</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                      <Clock className="w-4 h-4" />
                    </div>
                    <p className="text-lg font-bold">{remainingTime}</p>
                    <p className="text-xs text-white/60">دقيقة</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                      <Timer className="w-4 h-4" />
                    </div>
                    <p className="text-lg font-bold">{formatTime(elapsedTime)}</p>
                    <p className="text-xs text-white/60">الوقت المنقضي</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <p className="text-lg font-bold">{avgSpeed}</p>
                    <p className="text-xs text-white/60">متوسط السرعة</p>
                  </div>
                </div>
                
                <div className="relative">
                  <Progress value={progress} className="h-3 bg-white/20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold">{progress.toFixed(0)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Map Controls */}
          <div className="absolute top-24 left-4 z-[1000] flex flex-col gap-2">
            <Button
              variant="outline"
              size="icon"
              className="bg-white/95 shadow-lg hover:bg-white"
              onClick={() => setShowFullscreen(!showFullscreen)}
            >
              {showFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={`bg-white/95 shadow-lg hover:bg-white ${showWaypoints ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setShowWaypoints(!showWaypoints)}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Control Panel */}
        {!showFullscreen && (
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="map" className="flex items-center gap-1">
                  <Info className="w-4 h-4" />
                  الرحلة
                </TabsTrigger>
                <TabsTrigger value="steps" className="flex items-center gap-1">
                  <List className="w-4 h-4" />
                  الخطوات
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  الإحصائيات
                </TabsTrigger>
              </TabsList>

              <TabsContent value="map" className="space-y-4 mt-4">
                {/* Trip Info */}
                <Card className="shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Truck className="w-5 h-5 text-primary" />
                      معلومات الرحلة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950 dark:to-blue-900/50 rounded-xl border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                          <Factory className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">نقطة الانطلاق</span>
                          <p className="font-bold">{ORIGIN.name}</p>
                          <p className="text-sm text-muted-foreground">{ORIGIN.city}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-0.5 h-4 bg-gradient-to-b from-blue-500 to-transparent" />
                        <Truck className="w-5 h-5 text-primary animate-bounce" />
                        <div className="w-0.5 h-4 bg-gradient-to-b from-transparent to-red-500" />
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-950 dark:to-red-900/50 rounded-xl border border-red-200 dark:border-red-800">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <span className="text-xs text-red-600 dark:text-red-400 font-medium">نقطة الوصول</span>
                          <p className="font-bold">{DESTINATION.name}</p>
                          <p className="text-sm text-muted-foreground">{DESTINATION.city}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border">
                        <Route className="w-6 h-6 mx-auto mb-2 text-primary" />
                        <p className="text-2xl font-bold">{totalDistance.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">كم إجمالي</p>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border">
                        <Clock className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                        <p className="text-2xl font-bold">{estimatedDuration}</p>
                        <p className="text-xs text-muted-foreground">دقيقة تقديرية</p>
                      </div>
                    </div>

                    <div className="p-3 bg-green-50 dark:bg-green-950 rounded-xl border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                        <img 
                          src="https://www.google.com/images/branding/product/1x/maps_64dp.png" 
                          alt="Google Maps" 
                          className="w-5 h-5"
                        />
                        <span className="font-medium">خرائط جوجل + بيانات OSRM</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 mr-7">
                        {coordinates.length} نقطة GPS • {steps.length} تعليمات ملاحية
                      </p>
                    </div>

                    {/* External Navigation Buttons */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">فتح المسار في تطبيق خارجي</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          className="h-12 gap-2"
                          onClick={() => {
                            const url = `https://www.google.com/maps/dir/${ORIGIN.lat},${ORIGIN.lng}/${DESTINATION.lat},${DESTINATION.lng}`;
                            window.open(url, '_blank');
                          }}
                        >
                          <img 
                            src="https://www.google.com/images/branding/product/1x/maps_64dp.png" 
                            alt="Google Maps" 
                            className="w-5 h-5"
                          />
                          <span>Google Maps</span>
                          <ExternalLink className="w-3 h-3 opacity-50" />
                        </Button>
                        <Button
                          variant="outline"
                          className="h-12 gap-2"
                          onClick={() => {
                            const url = `https://waze.com/ul?ll=${DESTINATION.lat},${DESTINATION.lng}&navigate=yes&from=${ORIGIN.lat},${ORIGIN.lng}`;
                            window.open(url, '_blank');
                          }}
                        >
                          <img 
                            src="https://www.waze.com/favicon.ico" 
                            alt="Waze" 
                            className="w-5 h-5"
                          />
                          <span>Waze</span>
                          <ExternalLink className="w-3 h-3 opacity-50" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Controls */}
                <Card className="shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-500" />
                      التحكم في المحاكاة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 h-12" 
                        variant={isPlaying ? "destructive" : "default"}
                        onClick={() => setIsPlaying(!isPlaying)}
                        size="lg"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="w-5 h-5 ml-2" />
                            إيقاف
                          </>
                        ) : (
                          <>
                            <Play className="w-5 h-5 ml-2" />
                            {progress > 0 ? 'استئناف' : 'بدء المحاكاة'}
                          </>
                        )}
                      </Button>
                      <Button variant="outline" size="lg" className="h-12" onClick={handleRestart}>
                        <RotateCcw className="w-5 h-5" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="lg"
                        className="h-12"
                        onClick={() => setIsMuted(!isMuted)}
                      >
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </Button>
                    </div>

                    {/* Speed Control */}
                    <div className="p-3 bg-muted rounded-xl">
                      <p className="text-sm font-medium mb-2">سرعة المحاكاة</p>
                      <div className="flex gap-2">
                        {[1, 2, 4].map(s => (
                          <Button
                            key={s}
                            variant={simulationSpeed === s ? "default" : "outline"}
                            size="sm"
                            className="flex-1"
                            onClick={() => setSimulationSpeed(s)}
                          >
                            {s}x
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-center">
                      <AnimatePresence mode="wait">
                        {progress >= 100 ? (
                          <motion.div
                            key="arrived"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                          >
                            <Badge className="bg-green-500 text-white px-4 py-2 text-sm">
                              <CheckCircle2 className="w-4 h-4 ml-2" />
                              تم الوصول بنجاح
                            </Badge>
                          </motion.div>
                        ) : isPlaying ? (
                          <motion.div
                            key="navigating"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                          >
                            <Badge className="bg-blue-500 text-white px-4 py-2 text-sm animate-pulse">
                              <Navigation className="w-4 h-4 ml-2" />
                              جاري التنقل...
                            </Badge>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="waiting"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                          >
                            <Badge variant="secondary" className="px-4 py-2 text-sm">
                              في الانتظار
                            </Badge>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="steps" className="mt-4">
                <Card className="shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Compass className="w-5 h-5 text-primary" />
                        خطوات الملاحة
                      </span>
                      <Badge variant="outline">{currentStep + 1}/{steps.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[450px] pr-4">
                      <div className="space-y-2">
                        {steps.map((step, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: Math.min(index * 0.03, 0.5) }}
                            className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer hover:scale-[1.02] ${
                              index === currentStep 
                                ? 'bg-gradient-to-r from-primary/20 to-primary/10 border-2 border-primary shadow-lg' 
                                : index < currentStep 
                                  ? 'bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800' 
                                  : 'bg-muted/50 border border-transparent hover:border-muted-foreground/20'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              index === currentStep 
                                ? 'bg-primary text-primary-foreground shadow-lg' 
                                : index < currentStep 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-muted text-muted-foreground'
                            }`}>
                              {index < currentStep ? (
                                <CheckCircle2 className="w-5 h-5" />
                              ) : (
                                getDirectionIcon(step.type, 'w-5 h-5')
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm leading-tight ${index === currentStep ? 'font-bold' : ''}`}>
                                {step.instruction}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Route className="w-3 h-3" />
                                  {step.distance.toFixed(1)} كم
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {Math.round(step.duration)} د
                                </span>
                              </div>
                            </div>
                            {index === currentStep && (
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                              >
                                <Navigation2 className="w-5 h-5 text-primary" />
                              </motion.div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="stats" className="mt-4">
                <Card className="shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      إحصائيات الرحلة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl border text-center">
                        <Gauge className="w-8 h-8 mx-auto mb-2 text-green-500" />
                        <p className="text-3xl font-bold">{Math.round(speed)}</p>
                        <p className="text-xs text-muted-foreground">السرعة الحالية (كم/س)</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border text-center">
                        <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                        <p className="text-3xl font-bold">{avgSpeed}</p>
                        <p className="text-xs text-muted-foreground">متوسط السرعة (كم/س)</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="flex items-center gap-2 text-sm">
                          <Route className="w-4 h-4 text-primary" />
                          المسافة المقطوعة
                        </span>
                        <span className="font-bold">{currentDistance.toFixed(2)} كم</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="flex items-center gap-2 text-sm">
                          <Navigation2 className="w-4 h-4 text-amber-500" />
                          المسافة المتبقية
                        </span>
                        <span className="font-bold">{remainingDistance.toFixed(2)} كم</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="flex items-center gap-2 text-sm">
                          <Timer className="w-4 h-4 text-purple-500" />
                          الوقت المنقضي
                        </span>
                        <span className="font-bold">{formatTime(elapsedTime)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-blue-500" />
                          الوقت المتبقي
                        </span>
                        <span className="font-bold">{remainingTime} دقيقة</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">نسبة الإنجاز</span>
                        <span className="text-2xl font-bold text-primary">{progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={progress} className="h-3" />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">نقاط GPS</p>
                        <p className="font-bold">{coordinates.length}</p>
                      </div>
                      <div className="p-2 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">خطوات ملاحية</p>
                        <p className="font-bold">{steps.length}</p>
                      </div>
                      <div className="p-2 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">سرعة المحاكاة</p>
                        <p className="font-bold">{simulationSpeed}x</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default NavigationDemo;
