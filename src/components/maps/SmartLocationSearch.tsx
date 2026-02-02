import { useState, useEffect, useRef } from 'react';
import { useEnhancedLocationSearch, SearchResult, AISearchSuggestion } from '@/hooks/useEnhancedLocationSearch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Loader2, 
  MapPin, 
  Building2, 
  Globe, 
  Navigation,
  X,
  Locate,
  Sparkles,
  Wand2,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SmartLocationSearchProps {
  value?: string;
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder?: string;
  className?: string;
  showCurrentLocation?: boolean;
  includeAllOrganizations?: boolean;
  enableAI?: boolean;
}

const SmartLocationSearch = ({
  value,
  onChange,
  placeholder = 'ابحث عن موقع (مثال: نستلة بنها، المنطقة الصناعية...)',
  className,
  showCurrentLocation = true,
  includeAllOrganizations = true,
  enableAI = true,
}: SmartLocationSearchProps) => {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [referencePoint, setReferencePoint] = useState<{ lat: number; lng: number } | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AISearchSuggestion[]>([]);
  const [alternativeQueries, setAlternativeQueries] = useState<string[]>([]);
  const [correctedQuery, setCorrectedQuery] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { results, loading, search, searchWithAI, clearResults } = useEnhancedLocationSearch({
    referencePoint,
    includeAllOrganizations,
  });

  // Get user's current location for proximity sorting
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setReferencePoint({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Default to Cairo if location not available
          setReferencePoint({ lat: 30.0444, lng: 31.2357 });
        }
      );
    }
  }, []);

  // Debounced search - 500ms delay to reduce API calls
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 1) {
        search(query);
        setShowResults(true);
        
        // Trigger AI search for expanded results
        if (enableAI && query.length >= 3) {
          setLoadingAI(true);
          const aiResult = await searchWithAI(query);
          setAiSuggestions(aiResult.suggestedLocations);
          setAlternativeQueries(aiResult.alternativeQueries.slice(0, 3));
          setCorrectedQuery(aiResult.correctedQuery);
          setLoadingAI(false);
        }
      } else {
        clearResults();
        setAiSuggestions([]);
        setAlternativeQueries([]);
        setCorrectedQuery(null);
        setShowResults(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, search, searchWithAI, clearResults, enableAI]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result: SearchResult) => {
    onChange(result.address, result.latitude && result.longitude 
      ? { lat: result.latitude, lng: result.longitude }
      : undefined
    );
    setQuery('');
    setShowResults(false);
    clearResults();
    setAiSuggestions([]);
    setAlternativeQueries([]);
    toast.success('تم اختيار الموقع');
  };

  const handleAISuggestionClick = async (suggestion: AISearchSuggestion) => {
    // Search for the AI suggestion using Nominatim
    const searchQuery = `${suggestion.name} ${suggestion.city}`;
    setQuery(searchQuery);
    search(searchQuery);
  };

  const handleAlternativeQueryClick = (altQuery: string) => {
    setQuery(altQuery);
    search(altQuery);
  };

  const handleCorrectedQueryClick = () => {
    if (correctedQuery) {
      setQuery(correctedQuery);
      search(correctedQuery);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('المتصفح لا يدعم تحديد الموقع');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`
          );
          const data = await response.json();
          
          if (data.display_name) {
            onChange(data.display_name, { lat: latitude, lng: longitude });
            toast.success('تم تحديد موقعك الحالي');
          }
        } catch {
          onChange(`${latitude}, ${longitude}`, { lat: latitude, lng: longitude });
        }
        
        setGettingLocation(false);
      },
      () => {
        toast.error('فشل في تحديد الموقع');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="pr-10 pl-10"
            onFocus={() => query.length >= 1 && setShowResults(true)}
          />
          {loading || loadingAI ? (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              {loadingAI && <Sparkles className="w-3 h-3 text-primary animate-pulse" />}
            </div>
          ) : query && (
            <button
              type="button"
              className="absolute left-3 top-1/2 -translate-y-1/2"
              onClick={() => {
                setQuery('');
                clearResults();
                setAiSuggestions([]);
                setAlternativeQueries([]);
                setCorrectedQuery(null);
                setShowResults(false);
              }}
            >
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        
        {showCurrentLocation && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={getCurrentLocation}
            disabled={gettingLocation}
            title="موقعي الحالي"
          >
            {gettingLocation ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Locate className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      {/* AI Badge */}
      {enableAI && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <Badge variant="secondary" className="text-[10px] gap-1 py-0 h-5 bg-gradient-to-r from-primary/10 to-purple-500/10 text-primary border-0">
            <Wand2 className="w-3 h-3" />
            بحث ذكي بالذكاء الاصطناعي
          </Badge>
        </div>
      )}

      {/* Search Results Dropdown - Google Style */}
      {showResults && (results.length > 0 || loading || loadingAI || aiSuggestions.length > 0 || alternativeQueries.length > 0) && (
        <Card className="absolute z-50 top-full mt-2 w-full shadow-xl border-0 rounded-xl overflow-hidden bg-background">
          <ScrollArea className="max-h-[450px]">
            {/* Corrected Query Suggestion */}
            {correctedQuery && correctedQuery !== query && (
              <button
                type="button"
                className="w-full px-4 py-2 text-right bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors flex items-center gap-2 border-b"
                onClick={handleCorrectedQueryClick}
              >
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-amber-700 dark:text-amber-400">
                  هل تقصد: <strong>{correctedQuery}</strong>؟
                </span>
              </button>
            )}

            {/* Alternative Queries from AI */}
            {alternativeQueries.length > 0 && (
              <div className="px-4 py-2 border-b bg-muted/20">
                <p className="text-[11px] text-muted-foreground mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary" />
                  اقتراحات الذكاء الاصطناعي:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {alternativeQueries.map((altQuery, index) => (
                    <button
                      key={index}
                      type="button"
                      className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      onClick={() => handleAlternativeQueryClick(altQuery)}
                    >
                      {altQuery}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* AI Suggested Locations */}
            {aiSuggestions.length > 0 && (
              <div className="border-b">
                <div className="px-4 py-2 bg-gradient-to-r from-primary/5 to-purple-500/5">
                  <p className="text-[11px] font-medium text-primary flex items-center gap-1">
                    <Wand2 className="w-3 h-3" />
                    مواقع مقترحة بالذكاء الاصطناعي
                  </p>
                </div>
                {aiSuggestions.slice(0, 5).map((suggestion, index) => (
                  <button
                    key={`ai-${index}`}
                    type="button"
                    className="w-full px-4 py-2.5 text-right hover:bg-primary/5 transition-all duration-150 flex items-start gap-3 group"
                    onClick={() => handleAISuggestionClick(suggestion)}
                  >
                    <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-sm text-foreground">{suggestion.name}</span>
                        {suggestion.city && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {suggestion.city}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{suggestion.type}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {loading && results.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="mr-3 text-sm text-muted-foreground">جاري البحث...</span>
              </div>
            ) : results.length === 0 && aiSuggestions.length === 0 ? (
              <div className="p-8 text-center">
                <Globe className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">لا توجد نتائج لـ "{query}"</p>
                <p className="text-xs text-muted-foreground/70 mt-1">جرب البحث بكلمات مختلفة</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {results.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    className="w-full px-4 py-3 text-right hover:bg-muted/30 transition-all duration-150 flex items-start gap-3 group"
                    onClick={() => handleSelect(result)}
                  >
                    {/* Icon Container - Google Style */}
                    <div className={cn(
                      "mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                      result.type === 'saved' && "bg-primary/10 text-primary",
                      result.type === 'organization' && "bg-blue-500/10 text-blue-600",
                      result.type === 'nominatim' && "bg-muted text-muted-foreground",
                      result.type === 'ai' && "bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary"
                    )}>
                      {result.type === 'saved' && <MapPin className="w-4 h-4" />}
                      {result.type === 'organization' && <Building2 className="w-4 h-4" />}
                      {result.type === 'nominatim' && <Globe className="w-4 h-4" />}
                      {result.type === 'ai' && <Sparkles className="w-4 h-4" />}
                    </div>
                    
                    {/* Content - Talabat Style */}
                    <div className="flex-1 min-w-0">
                      {/* Title Row with City Badge */}
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {result.name}
                        </span>
                        {result.city && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium">
                            {result.city}
                          </span>
                        )}
                        {result.isAISuggestion && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 gap-0.5 border-primary/30 text-primary">
                            <Sparkles className="w-2.5 h-2.5" />
                            AI
                          </Badge>
                        )}
                      </div>
                      
                      {/* Organization/Category Line */}
                      {result.organizationName && (
                        <p className="text-xs text-primary/80 mb-0.5 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {result.organizationName}
                        </p>
                      )}
                      
                      {/* Address - Like Google Description */}
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {result.address}
                      </p>
                      
                      {/* Distance Badge - Bottom Right, Talabat Style */}
                      {result.distance !== undefined && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <div className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                            <Navigation className="w-3 h-3" />
                            <span>
                              {result.distance < 1 
                                ? `${Math.round(result.distance * 1000)} متر`
                                : result.distance > 100
                                  ? `<100km`
                                  : `${result.distance.toFixed(1)} كم`
                              }
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Arrow indicator on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center">
                      <svg className="w-4 h-4 text-muted-foreground rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
                
                {/* Footer hint */}
                <div className="px-4 py-2 bg-muted/20 text-center">
                  <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary" />
                    مدعوم بالذكاء الاصطناعي للبحث الموسع
                  </p>
                </div>
              </div>
            )}
          </ScrollArea>
        </Card>
      )}

      {/* Current Value Display */}
      {value && !showResults && (
        <div className="mt-2 p-2.5 bg-muted/50 rounded-lg border text-sm flex items-start gap-2">
          <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
          <p className="leading-relaxed text-sm">{value}</p>
        </div>
      )}
    </div>
  );
};

export default SmartLocationSearch;
