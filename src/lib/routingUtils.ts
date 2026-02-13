// Advanced routing utilities using Mapbox Directions API
// Provides alternative routes, turn-by-turn navigation, and ETA calculations

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';
const MAPBOX_DIRECTIONS_API = 'https://api.mapbox.com/directions/v5/mapbox/driving';

export interface RouteStep {
  instruction: string;
  distance: number; // meters
  duration: number; // seconds
  name: string; // road name
  maneuver: {
    type: string;
    modifier?: string;
    bearing_before?: number;
    bearing_after?: number;
    location: [number, number]; // [lng, lat]
  };
}

export interface RouteAlternative {
  id: string;
  name: string;
  coordinates: [number, number][]; // [lat, lng][]
  distance: number; // meters
  duration: number; // seconds
  steps: RouteStep[];
  color: string;
  isRecommended: boolean;
}

export interface EnhancedRouteResult {
  alternatives: RouteAlternative[];
  success: boolean;
  error?: string;
}

// Translate Mapbox maneuver types to Arabic
const translateManeuver = (type: string, modifier?: string, roadName?: string): string => {
  const modifierTranslations: Record<string, string> = {
    'left': 'يساراً',
    'right': 'يميناً',
    'slight left': 'يساراً قليلاً',
    'slight right': 'يميناً قليلاً',
    'sharp left': 'يساراً بشكل حاد',
    'sharp right': 'يميناً بشكل حاد',
    'straight': 'مباشرة',
    'uturn': 'انعطف للخلف',
  };

  const typeTranslations: Record<string, string> = {
    'depart': 'ابدأ الرحلة',
    'arrive': 'لقد وصلت إلى وجهتك',
    'turn': modifier ? `انعطف ${modifierTranslations[modifier] || modifier}` : 'انعطف',
    'continue': 'استمر في السير',
    'merge': 'اندمج في الطريق',
    'on ramp': 'ادخل إلى الطريق السريع',
    'off ramp': 'اخرج من الطريق السريع',
    'fork': modifier ? `عند التفرع اتجه ${modifierTranslations[modifier] || ''}` : 'عند التفرع',
    'end of road': modifier ? `في نهاية الطريق انعطف ${modifierTranslations[modifier] || ''}` : 'نهاية الطريق',
    'roundabout': 'ادخل الدوار',
    'rotary': 'ادخل الدوار',
    'roundabout turn': modifier ? `في الدوار انعطف ${modifierTranslations[modifier] || ''}` : 'في الدوار',
    'notification': 'تنبيه',
    'exit roundabout': 'اخرج من الدوار',
    'exit rotary': 'اخرج من الدوار',
    'new name': roadName ? `استمر على ${roadName}` : 'استمر',
  };

  let instruction = typeTranslations[type] || type;
  
  if (roadName && type !== 'new name' && type !== 'arrive') {
    instruction += ` على ${roadName}`;
  }

  return instruction;
};

// Format distance for display
export const formatDistanceArabic = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} كم`;
  }
  return `${Math.round(meters)} م`;
};

// Format duration for display
export const formatDurationArabic = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return minutes > 0 ? `${hours} ساعة و ${minutes} دقيقة` : `${hours} ساعة`;
  }
  return `${minutes} دقيقة`;
};

// Calculate ETA based on current time
export const calculateETA = (durationSeconds: number): string => {
  const now = new Date();
  const eta = new Date(now.getTime() + durationSeconds * 1000);
  return eta.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Fetch multiple route alternatives using Mapbox Directions API
 */
export const fetchRouteAlternatives = async (
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): Promise<EnhancedRouteResult> => {
  try {
    // Mapbox expects lng,lat format
    const url = `${MAPBOX_DIRECTIONS_API}/${start.lng},${start.lat};${end.lng},${end.lat}?access_token=${MAPBOX_TOKEN}&geometries=geojson&overview=full&steps=true&alternatives=true&annotations=duration,distance`;
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`Mapbox Directions error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const alternatives: RouteAlternative[] = data.routes.map((route: any, index: number) => {
        // Convert GeoJSON coordinates [lng, lat] to [lat, lng] format
        const coordinates: [number, number][] = route.geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]]
        );
        
        // Parse steps for navigation instructions
        const steps: RouteStep[] = [];
        if (route.legs && route.legs.length > 0) {
          route.legs.forEach((leg: any) => {
            if (leg.steps) {
              leg.steps.forEach((step: any) => {
                steps.push({
                  instruction: translateManeuver(
                    step.maneuver?.type,
                    step.maneuver?.modifier,
                    step.name
                  ),
                  distance: step.distance,
                  duration: step.duration,
                  name: step.name || '',
                  maneuver: {
                    type: step.maneuver?.type || '',
                    modifier: step.maneuver?.modifier,
                    bearing_before: step.maneuver?.bearing_before,
                    bearing_after: step.maneuver?.bearing_after,
                    location: step.maneuver?.location || [0, 0],
                  },
                });
              });
            }
          });
        }
        
        // Determine route name and color
        const colors = ['#6366f1', '#22c55e', '#f59e0b'];
        
        return {
          id: `route-${index}`,
          name: index === 0 ? 'أسرع مسار' : `مسار بديل ${index}`,
          coordinates,
          distance: route.distance,
          duration: route.duration,
          steps,
          color: colors[index % colors.length],
          isRecommended: index === 0,
        };
      });
      
      return { alternatives, success: true };
    }
    
    throw new Error('No routes found');
  } catch (error) {
    console.error('Mapbox Directions error:', error);
    return {
      alternatives: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Get navigation icon based on maneuver type
 */
export const getManeuverIcon = (type: string, modifier?: string): string => {
  const icons: Record<string, string> = {
    'depart': '🚗',
    'arrive': '🏁',
    'turn-left': '↰',
    'turn-right': '↱',
    'turn-slight left': '↖',
    'turn-slight right': '↗',
    'turn-sharp left': '⬅',
    'turn-sharp right': '➡',
    'continue': '⬆',
    'merge': '↘',
    'on ramp': '⤴',
    'off ramp': '⤵',
    'fork-left': '↙',
    'fork-right': '↘',
    'roundabout': '🔄',
    'rotary': '🔄',
    'uturn': '↩',
  };
  
  const key = modifier ? `${type}-${modifier}` : type;
  return icons[key] || icons[type] || '➡';
};
