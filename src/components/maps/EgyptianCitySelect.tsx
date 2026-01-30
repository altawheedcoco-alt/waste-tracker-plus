import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, MapPin, Building2, Factory, Warehouse, Globe, Cpu, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { 
  egyptianGovernorates, 
  getAllCities, 
  industrialZones,
  searchAllLocations,
  type EgyptianCity,
  type IndustrialZone 
} from '@/lib/egyptianCities';

interface EgyptianCitySelectProps {
  value?: string;
  onValueChange: (value: string, city?: EgyptianCity, zone?: IndustrialZone) => void;
  placeholder?: string;
  includeIndustrialZones?: boolean;
  className?: string;
}

const getZoneIcon = (type: IndustrialZone['type']) => {
  switch (type) {
    case 'industrial':
      return Factory;
    case 'economic':
      return Globe;
    case 'free_zone':
      return Warehouse;
    case 'tech_park':
      return Cpu;
    case 'logistics':
      return Truck;
    default:
      return Factory;
  }
};

const getZoneTypeLabel = (type: IndustrialZone['type']) => {
  switch (type) {
    case 'industrial':
      return 'صناعية';
    case 'economic':
      return 'اقتصادية';
    case 'free_zone':
      return 'حرة';
    case 'tech_park':
      return 'تكنولوجيا';
    case 'logistics':
      return 'لوجستية';
    default:
      return 'صناعية';
  }
};

const EgyptianCitySelect = ({
  value,
  onValueChange,
  placeholder = 'اختر المدينة أو المنطقة الصناعية...',
  includeIndustrialZones = true,
  className,
}: EgyptianCitySelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const allCities = useMemo(() => getAllCities(), []);

  // Group industrial zones by type for better organization
  const groupedIndustrialZones = useMemo(() => {
    if (!includeIndustrialZones) return {};
    
    const groups: Record<string, IndustrialZone[]> = {
      industrial: [],
      economic: [],
      free_zone: [],
      tech_park: [],
      logistics: [],
    };
    
    industrialZones.forEach(zone => {
      if (groups[zone.type]) {
        groups[zone.type].push(zone);
      }
    });
    
    return groups;
  }, [includeIndustrialZones]);

  const filteredGovernorates = useMemo(() => {
    if (!search) return egyptianGovernorates;
    
    const lowercaseSearch = search.toLowerCase();
    return egyptianGovernorates
      .map(gov => ({
        ...gov,
        cities: gov.cities.filter(city =>
          city.name.includes(search) ||
          city.nameEn.toLowerCase().includes(lowercaseSearch) ||
          gov.name.includes(search) ||
          gov.nameEn.toLowerCase().includes(lowercaseSearch)
        )
      }))
      .filter(gov => gov.cities.length > 0 || gov.name.includes(search) || gov.nameEn.toLowerCase().includes(lowercaseSearch));
  }, [search]);

  const filteredIndustrialZones = useMemo(() => {
    if (!includeIndustrialZones) return {};
    if (!search) return groupedIndustrialZones;
    
    const lowercaseSearch = search.toLowerCase();
    const filtered: Record<string, IndustrialZone[]> = {};
    
    Object.entries(groupedIndustrialZones).forEach(([type, zones]) => {
      const matchingZones = zones.filter(zone =>
        zone.name.includes(search) ||
        zone.nameEn.toLowerCase().includes(lowercaseSearch) ||
        zone.governorate.includes(search) ||
        (zone.description && zone.description.includes(search))
      );
      if (matchingZones.length > 0) {
        filtered[type] = matchingZones;
      }
    });
    
    return filtered;
  }, [search, includeIndustrialZones, groupedIndustrialZones]);

  const selectedItem = useMemo(() => {
    if (!value) return null;
    
    const city = allCities.find(c => c.id === value);
    if (city) return { type: 'city' as const, data: city };
    
    const zone = industrialZones.find(z => z.id === value);
    if (zone) return { type: 'zone' as const, data: zone };
    
    return null;
  }, [value, allCities]);

  const handleCitySelect = (cityId: string) => {
    const city = allCities.find(c => c.id === cityId);
    onValueChange(cityId, city, undefined);
    setOpen(false);
    setSearch('');
  };

  const handleZoneSelect = (zoneId: string) => {
    const zone = industrialZones.find(z => z.id === zoneId);
    onValueChange(zoneId, undefined, zone);
    setOpen(false);
    setSearch('');
  };

  const getZoneGroupLabel = (type: string) => {
    switch (type) {
      case 'industrial':
        return '🏭 المدن والمناطق الصناعية';
      case 'economic':
        return '🌐 المناطق الاقتصادية الخاصة';
      case 'free_zone':
        return '📦 المناطق الحرة';
      case 'tech_park':
        return '💻 مجمعات التكنولوجيا';
      case 'logistics':
        return '🚛 المناطق اللوجستية';
      default:
        return 'مناطق أخرى';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedItem ? (
            <span className="flex items-center gap-2 truncate">
              {selectedItem.type === 'zone' ? (
                <>
                  {(() => {
                    const Icon = getZoneIcon((selectedItem.data as IndustrialZone).type);
                    return <Icon className="h-4 w-4 text-orange-500 flex-shrink-0" />;
                  })()}
                  <span className="truncate">{selectedItem.data.name}</span>
                  <Badge variant="secondary" className="text-xs hidden sm:inline-flex bg-orange-100 text-orange-700">
                    {getZoneTypeLabel((selectedItem.data as IndustrialZone).type)}
                  </Badge>
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{(selectedItem.data as EgyptianCity).name}</span>
                  <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                    {(selectedItem.data as EgyptianCity).governorate}
                  </Badge>
                </>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="ابحث عن مدينة أو منطقة صناعية..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[400px]">
            <CommandEmpty>لم يتم العثور على نتائج</CommandEmpty>
            
            {/* Industrial Zones by Type */}
            {Object.entries(filteredIndustrialZones).map(([type, zones]) => (
              zones.length > 0 && (
                <CommandGroup key={type} heading={getZoneGroupLabel(type)}>
                  {zones.map((zone) => {
                    const Icon = getZoneIcon(zone.type);
                    return (
                      <CommandItem
                        key={zone.id}
                        value={zone.id}
                        onSelect={() => handleZoneSelect(zone.id)}
                        className="text-right"
                      >
                        <Check
                          className={cn(
                            "ml-2 h-4 w-4",
                            value === zone.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <Icon className="ml-2 h-4 w-4 text-orange-500" />
                        <div className="flex flex-col items-start flex-1 min-w-0">
                          <span className="truncate text-sm">{zone.name}</span>
                          <span className="text-xs text-muted-foreground truncate">{zone.governorate}</span>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )
            ))}

            {/* Governorates and Cities */}
            {filteredGovernorates.map((gov) => (
              <CommandGroup key={gov.id} heading={`🏙️ ${gov.name}`}>
                {gov.cities.map((city) => (
                  <CommandItem
                    key={city.id}
                    value={city.id}
                    onSelect={() => handleCitySelect(city.id)}
                    className="text-right"
                  >
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4",
                        value === city.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {city.isCapital ? (
                      <Building2 className="ml-2 h-4 w-4 text-primary" />
                    ) : (
                      <MapPin className="ml-2 h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="truncate">{city.name}</span>
                    {city.isCapital && (
                      <Badge variant="outline" className="mr-auto text-xs">
                        عاصمة
                      </Badge>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default EgyptianCitySelect;
