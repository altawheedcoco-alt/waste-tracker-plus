import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import BackButton from '@/components/ui/back-button';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Search,
  Filter,
  Mountain,
  Flame,
  Factory,
  AlertTriangle,
  CheckCircle2,
  Star,
  ExternalLink,
  Navigation,
  Clock,
  Scale,
  FileCheck,
  Plus,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import DisposalFacilityDialog from '@/components/disposal/DisposalFacilityDialog';

interface DisposalFacility {
  id: string;
  name: string;
  name_en?: string;
  facility_type: string;
  license_number?: string;
  license_authority?: string;
  address?: string;
  city?: string;
  governorate?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  contact_person?: string;
  total_capacity_tons?: number;
  current_fill_percentage?: number;
  daily_capacity_tons?: number;
  price_per_ton?: number;
  accepted_waste_types?: string[];
  accepted_hazard_levels?: string[];
  status: string;
  is_verified: boolean;
  notes?: string;
  // التراخيص
  wmra_license_number?: string;
  wmra_license_expiry?: string;
  eia_permit_number?: string;
  eia_permit_expiry?: string;
  operation_license_number?: string;
  operation_license_expiry?: string;
  hazardous_license_number?: string;
  hazardous_license_expiry?: string;
  commercial_register_number?: string;
  tax_card_number?: string;
  activity_specific_license_number?: string;
  activity_specific_license_type?: string;
  activity_specific_license_expiry?: string;
}

const facilityTypeLabels: Record<string, { label: string; icon: any; color: string }> = {
  landfill: { label: 'مدفن صحي', icon: Mountain, color: 'bg-amber-100 text-amber-700' },
  incinerator: { label: 'محرقة', icon: Flame, color: 'bg-red-100 text-red-700' },
  treatment_plant: { label: 'محطة معالجة', icon: Factory, color: 'bg-blue-100 text-blue-700' },
  hazardous_disposal: { label: 'تخلص آمن للخطرة', icon: AlertTriangle, color: 'bg-purple-100 text-purple-700' },
  industrial_waste: { label: 'مخلفات صناعية', icon: Building2, color: 'bg-gray-100 text-gray-700' },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: 'نشط', color: 'bg-green-100 text-green-700' },
  inactive: { label: 'غير نشط', color: 'bg-gray-100 text-gray-600' },
  under_maintenance: { label: 'صيانة', color: 'bg-amber-100 text-amber-700' },
  full: { label: 'ممتلئ', color: 'bg-red-100 text-red-700' },
  closed: { label: 'مغلق', color: 'bg-red-200 text-red-800' },
};

const governorates = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'القليوبية', 'الشرقية', 'المنوفية',
  'البحيرة', 'الدقهلية', 'الغربية', 'كفر الشيخ', 'دمياط', 'بورسعيد',
  'الإسماعيلية', 'السويس', 'شمال سيناء', 'جنوب سيناء', 'البحر الأحمر',
  'الفيوم', 'بني سويف', 'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان',
  'الوادي الجديد', 'مطروح',
];

export default function DisposalFacilities() {
  const [facilities, setFacilities] = useState<DisposalFacility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('all');
  const [selectedFacility, setSelectedFacility] = useState<DisposalFacility | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const fetchFacilities = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('disposal_facilities')
        .select('*')
        .order('name');

      if (selectedType !== 'all') {
        query = query.eq('facility_type', selectedType);
      }
      if (selectedGovernorate !== 'all') {
        query = query.eq('governorate', selectedGovernorate);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFacilities((data || []) as DisposalFacility[]);
    } catch (error) {
      console.error('Error fetching facilities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, [selectedType, selectedGovernorate]);

  const filteredFacilities = facilities.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.name_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openInGoogleMaps = (lat?: number, lng?: number) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    }
  };

  return (
    <DashboardLayout>
    <div className="space-y-6">
      <BackButton />
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="text-right">
          <h1 className="text-2xl font-bold">دليل جهات التخلص النهائي</h1>
          <p className="text-muted-foreground">
            المدافن الصحية ومحطات المعالجة والمحارق المرخصة في مصر
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة جهة جديدة
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="البحث عن مدفن أو محطة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="نوع الجهة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                {Object.entries(facilityTypeLabels).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedGovernorate} onValueChange={setSelectedGovernorate}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="المحافظة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المحافظات</SelectItem>
                {governorates.map((gov) => (
                  <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(facilityTypeLabels).map(([key, { label, icon: Icon, color }]) => {
          const count = facilities.filter((f) => f.facility_type === key).length;
          return (
            <Card
              key={key}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                selectedType === key && 'ring-2 ring-primary'
              )}
              onClick={() => setSelectedType(selectedType === key ? 'all' : key)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Facilities List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : filteredFacilities.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Mountain className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">لا توجد جهات تخلص مطابقة للبحث</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFacilities.map((facility, index) => {
            const typeInfo = facilityTypeLabels[facility.facility_type] || facilityTypeLabels.landfill;
            const statusInfo = statusLabels[facility.status] || statusLabels.active;
            const TypeIcon = typeInfo.icon;

            return (
              <motion.div
                key={facility.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-lg transition-all h-full"
                  onClick={() => setSelectedFacility(facility)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className={cn('p-2 rounded-lg', typeInfo.color)}>
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-2">
                        {facility.is_verified && (
                          <Badge className="bg-green-100 text-green-700 gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            موثق
                          </Badge>
                        )}
                        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                      </div>
                    </div>
                    <CardTitle className="text-lg mt-2 text-right">{facility.name}</CardTitle>
                    {facility.name_en && (
                      <CardDescription className="text-right">{facility.name_en}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-right justify-end">
                      <span className="text-muted-foreground">{facility.city}، {facility.governorate}</span>
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                    </div>

                    {facility.address && (
                      <p className="text-xs text-muted-foreground text-right truncate">{facility.address}</p>
                    )}

                    {facility.accepted_waste_types && facility.accepted_waste_types.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-end">
                        {facility.accepted_waste_types.slice(0, 3).map((type) => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {type.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                        {facility.accepted_waste_types.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{facility.accepted_waste_types.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                      {facility.price_per_ton ? (
                        <div className="text-sm">
                          <span className="font-semibold">{facility.price_per_ton}</span>
                          <span className="text-muted-foreground"> ج.م/طن</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">السعر غير محدد</span>
                      )}
                      <div className="flex gap-1">
                        {facility.phone && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`tel:${facility.phone}`);
                            }}
                          >
                            <Phone className="w-4 h-4" />
                          </Button>
                        )}
                        {facility.latitude && facility.longitude && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              openInGoogleMaps(facility.latitude, facility.longitude);
                            }}
                          >
                            <Navigation className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Facility Details Dialog */}
      {selectedFacility && (
        <DisposalFacilityDialog
          facility={selectedFacility}
          isOpen={!!selectedFacility}
          onClose={() => setSelectedFacility(null)}
          onUpdate={fetchFacilities}
        />
      )}

      {/* Add Facility Dialog */}
      {showAddDialog && (
        <DisposalFacilityDialog
          isOpen={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          onUpdate={fetchFacilities}
        />
      )}
    </div>
    </DashboardLayout>
  );
}
