import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  MapPin, 
  Clock, 
  Gauge, 
  Route,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  Volume2,
  VolumeX,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Factory,
  Truck,
  CheckCircle2,
  AlertTriangle
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

// Nestlé Water Factory, Banha
const ORIGIN = { lat: 30.4667, lng: 31.1833, name: 'مصنع نستله للمياه - بنها' };
// PepsiCo Factory, 6th of October
const DESTINATION = { lat: 29.9667, lng: 30.9167, name: 'مصنع بيبسي - السادس من أكتوبر' };

// Simulated route points (realistic path from Banha to 6th October)
const ROUTE_POINTS: [number, number][] = [
  [30.4667, 31.1833], // Start - Nestlé Banha
  [30.4550, 31.1750],
  [30.4400, 31.1600],
  [30.4200, 31.1400],
  [30.3900, 31.1200],
  [30.3600, 31.1000],
  [30.3300, 31.0800],
  [30.3000, 31.0600],
  [30.2700, 31.0400],
  [30.2400, 31.0200],
  [30.2100, 31.0000],
  [30.1800, 30.9800],
  [30.1500, 30.9600],
  [30.1200, 30.9500],
  [30.0900, 30.9400],
  [30.0600, 30.9300],
  [30.0300, 30.9200],
  [30.0000, 30.9167],
  [29.9667, 30.9167], // End - PepsiCo 6th October
];

// Navigation instructions
const NAVIGATION_STEPS = [
  { distance: 0, instruction: 'ابدأ الرحلة من مصنع نستله للمياه - بنها', type: 'depart' },
  { distance: 5, instruction: 'استمر في الطريق الرئيسي نحو القاهرة', type: 'straight' },
  { distance: 12, instruction: 'انعطف يميناً نحو الطريق الدائري', type: 'right' },
  { distance: 25, instruction: 'استمر على الطريق الدائري', type: 'straight' },
  { distance: 40, instruction: 'انعطف يساراً نحو طريق الواحات', type: 'left' },
  { distance: 55, instruction: 'استمر على طريق الواحات', type: 'straight' },
  { distance: 70, instruction: 'اقترب من المدينة الصناعية - السادس من أكتوبر', type: 'straight' },
  { distance: 82, instruction: 'انعطف يميناً نحو مصنع بيبسي', type: 'right' },
  { distance: 85, instruction: 'لقد وصلت إلى الوجهة - مصنع بيبسي', type: 'arrive' },
];

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
      map.flyTo(position, 12, { duration: 0.5 });
    }
  }, [position, isPlaying, map]);
  
  return null;
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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnnouncedStepRef = useRef<number>(-1);

  const totalDistance = 85; // km
  const estimatedDuration = 75; // minutes
  const currentDistance = (progress / 100) * totalDistance;
  const remainingDistance = totalDistance - currentDistance;
  const remainingTime = Math.round((remainingDistance / totalDistance) * estimatedDuration);

  // Calculate heading based on current and next point
  const calculateHeading = (current: [number, number], next: [number, number]) => {
    const dLng = next[1] - current[1];
    const dLat = next[0] - current[0];
    const angle = Math.atan2(dLng, dLat) * (180 / Math.PI);
    return angle;
  };

  const currentPosition = ROUTE_POINTS[currentPointIndex];
  const nextPosition = ROUTE_POINTS[Math.min(currentPointIndex + 1, ROUTE_POINTS.length - 1)];
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

  // Update current navigation step
  useEffect(() => {
    const stepIndex = NAVIGATION_STEPS.findIndex((step, index) => {
      const nextStep = NAVIGATION_STEPS[index + 1];
      if (!nextStep) return true;
      return currentDistance >= step.distance && currentDistance < nextStep.distance;
    });
    
    if (stepIndex !== -1 && stepIndex !== currentStep) {
      setCurrentStep(stepIndex);
      if (stepIndex !== lastAnnouncedStepRef.current && isPlaying) {
        lastAnnouncedStepRef.current = stepIndex;
        speakInstruction(NAVIGATION_STEPS[stepIndex].instruction);
      }
    }
  }, [currentDistance, isPlaying, isMuted]);

  // Simulation loop
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            speakInstruction('لقد وصلت إلى وجهتك. مصنع بيبسي - السادس من أكتوبر');
            return 100;
          }
          return prev + 0.5;
        });
        
        setCurrentPointIndex(prev => {
          const newIndex = Math.min(
            Math.floor((progress / 100) * (ROUTE_POINTS.length - 1)),
            ROUTE_POINTS.length - 1
          );
          return newIndex;
        });
        
        // Simulate varying speed (60-100 km/h)
        setSpeed(60 + Math.random() * 40);
        
        setElapsedTime(prev => prev + 1);
      }, 200);
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
  }, [isPlaying, progress]);

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
      default: return <ArrowUp className="w-6 h-6" />;
    }
  };

  const getSpeedColor = (speed: number) => {
    if (speed > 80) return 'text-red-500';
    if (speed > 60) return 'text-yellow-500';
    return 'text-green-500';
  };

  const completedRoute = ROUTE_POINTS.slice(0, currentPointIndex + 1);
  const remainingRoute = ROUTE_POINTS.slice(currentPointIndex);

  return (
    <div className={`min-h-screen bg-background ${showFullscreen ? 'fixed inset-0 z-50' : ''}`} dir="rtl">
      {!showFullscreen && (
        <div className="p-4 border-b bg-card">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-2xl font-bold">عرض توضيحي للملاحة</h1>
              <p className="text-muted-foreground">محاكاة رحلة من مصنع نستله ببنها إلى مصنع بيبسي بالسادس من أكتوبر</p>
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
            <Polyline 
              positions={completedRoute}
              color="#22c55e"
              weight={6}
              opacity={0.9}
            />
            
            {/* Remaining route (gray) */}
            <Polyline 
              positions={remainingRoute}
              color="#9ca3af"
              weight={4}
              opacity={0.6}
              dashArray="10, 10"
            />
            
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
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                      {getDirectionIcon(NAVIGATION_STEPS[currentStep]?.type || 'straight')}
                    </div>
                    <div>
                      <p className="font-bold text-lg">{NAVIGATION_STEPS[currentStep]?.instruction}</p>
                      <p className="text-white/70 text-sm">
                        {currentStep < NAVIGATION_STEPS.length - 1 
                          ? `${Math.round(NAVIGATION_STEPS[currentStep + 1]?.distance - currentDistance)} كم للتعليمات القادمة`
                          : 'الوجهة النهائية'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Speed */}
                  <div className="text-center">
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
                    <p className="text-2xl font-bold">{totalDistance}</p>
                    <p className="text-xs text-muted-foreground">كم إجمالي</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{estimatedDuration}</p>
                    <p className="text-xs text-muted-foreground">دقيقة تقديرية</p>
                  </div>
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
                  خطوات الملاحة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {NAVIGATION_STEPS.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                        index === currentStep 
                          ? 'bg-primary/10 border border-primary' 
                          : index < currentStep 
                            ? 'bg-green-50 dark:bg-green-950 opacity-60' 
                            : 'bg-muted/50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
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
                      <div className="flex-1">
                        <p className={`text-sm ${index === currentStep ? 'font-bold' : ''}`}>
                          {step.instruction}
                        </p>
                        <p className="text-xs text-muted-foreground">{step.distance} كم</p>
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
