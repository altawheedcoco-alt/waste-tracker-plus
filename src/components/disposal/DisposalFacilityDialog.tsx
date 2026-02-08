import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  User,
  Clock,
  Scale,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  ExternalLink,
  Mountain,
  Flame,
  Factory,
  Star,
  Calendar,
  DollarSign,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DisposalFacility {
  id: string;
  name: string;
  name_en?: string;
  facility_type: string;
  license_number?: string;
  license_authority?: string;
  license_expiry?: string;
  address?: string;
  city?: string;
  governorate?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  phone_secondary?: string;
  email?: string;
  website?: string;
  contact_person?: string;
  contact_position?: string;
  total_capacity_tons?: number;
  current_fill_percentage?: number;
  daily_capacity_tons?: number;
  operating_hours?: any;
  price_per_ton?: number;
  currency?: string;
  pricing_notes?: string;
  accepted_waste_types?: string[];
  accepted_hazard_levels?: string[];
  rejected_waste_types?: string[];
  environmental_license_url?: string;
  iso_certification?: string;
  eeaa_rating?: string;
  last_inspection_date?: string;
  inspection_result?: string;
  status: string;
  is_verified: boolean;
  notes?: string;
}

interface DisposalFacilityDialogProps {
  facility?: DisposalFacility | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
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

const wasteTypeLabels: Record<string, string> = {
  hazardous_waste: 'مخلفات خطرة',
  industrial_waste: 'مخلفات صناعية',
  chemical_waste: 'مخلفات كيميائية',
  medical_waste: 'مخلفات طبية',
  municipal_waste: 'مخلفات بلدية',
  construction_waste: 'مخلفات بناء',
  organic_waste: 'مخلفات عضوية',
  recyclable_waste: 'مخلفات قابلة للتدوير',
  food_waste: 'مخلفات غذائية',
  pharmaceutical_waste: 'مخلفات صيدلانية',
};

const hazardLabels: Record<string, string> = {
  non_hazardous: 'غير خطرة',
  low_hazard: 'خطورة منخفضة',
  hazardous: 'خطرة',
  highly_hazardous: 'شديدة الخطورة',
  infectious: 'معدية',
};

export default function DisposalFacilityDialog({
  facility,
  isOpen,
  onClose,
  onUpdate,
}: DisposalFacilityDialogProps) {
  if (!facility) return null;

  const typeInfo = facilityTypeLabels[facility.facility_type] || facilityTypeLabels.landfill;
  const statusInfo = statusLabels[facility.status] || statusLabels.active;
  const TypeIcon = typeInfo.icon;

  const openInGoogleMaps = () => {
    if (facility.latitude && facility.longitude) {
      window.open(`https://www.google.com/maps?q=${facility.latitude},${facility.longitude}`, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn('p-3 rounded-xl', typeInfo.color)}>
                <TypeIcon className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-xl">{facility.name}</DialogTitle>
                {facility.name_en && (
                  <DialogDescription>{facility.name_en}</DialogDescription>
                )}
              </div>
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
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] mt-4">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="info" className="flex-1">المعلومات</TabsTrigger>
              <TabsTrigger value="capacity" className="flex-1">السعة والأسعار</TabsTrigger>
              <TabsTrigger value="waste" className="flex-1">أنواع المخلفات</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
              {/* Location */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  الموقع
                </h4>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm">{facility.address}</p>
                  <p className="text-sm text-muted-foreground">
                    {facility.city}، {facility.governorate}
                  </p>
                  {facility.latitude && facility.longitude && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openInGoogleMaps}
                      className="gap-2 mt-2"
                    >
                      <Navigation className="w-4 h-4" />
                      فتح في خرائط جوجل
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>

              <Separator />

              {/* Contact */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  التواصل
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {facility.contact_person && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{facility.contact_person}</span>
                      {facility.contact_position && (
                        <span className="text-muted-foreground">({facility.contact_position})</span>
                      )}
                    </div>
                  )}
                  {facility.phone && (
                    <a href={`tel:${facility.phone}`} className="flex items-center gap-2 text-sm hover:text-primary">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span dir="ltr">{facility.phone}</span>
                    </a>
                  )}
                  {facility.phone_secondary && (
                    <a href={`tel:${facility.phone_secondary}`} className="flex items-center gap-2 text-sm hover:text-primary">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span dir="ltr">{facility.phone_secondary}</span>
                    </a>
                  )}
                  {facility.email && (
                    <a href={`mailto:${facility.email}`} className="flex items-center gap-2 text-sm hover:text-primary">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{facility.email}</span>
                    </a>
                  )}
                  {facility.website && (
                    <a href={facility.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span>الموقع الإلكتروني</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              <Separator />

              {/* License Info */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <FileCheck className="w-4 h-4" />
                  التراخيص والاعتماد
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {facility.license_number && (
                    <div>
                      <span className="text-muted-foreground">رقم الترخيص:</span>
                      <span className="font-mono mr-2">{facility.license_number}</span>
                    </div>
                  )}
                  {facility.license_authority && (
                    <div>
                      <span className="text-muted-foreground">جهة الترخيص:</span>
                      <span className="mr-2">{facility.license_authority}</span>
                    </div>
                  )}
                  {facility.iso_certification && (
                    <div>
                      <span className="text-muted-foreground">شهادة ISO:</span>
                      <span className="mr-2">{facility.iso_certification}</span>
                    </div>
                  )}
                  {facility.eeaa_rating && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">تقييم جهاز البيئة:</span>
                      <Badge variant="outline">{facility.eeaa_rating}</Badge>
                    </div>
                  )}
                </div>
              </div>

              {facility.notes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-semibold">ملاحظات</h4>
                    <p className="text-sm text-muted-foreground">{facility.notes}</p>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="capacity" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                {facility.total_capacity_tons && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Scale className="w-4 h-4" />
                      السعة الإجمالية
                    </div>
                    <p className="text-2xl font-bold">{facility.total_capacity_tons.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">طن</p>
                  </div>
                )}
                {facility.daily_capacity_tons && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Calendar className="w-4 h-4" />
                      السعة اليومية
                    </div>
                    <p className="text-2xl font-bold">{facility.daily_capacity_tons.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">طن/يوم</p>
                  </div>
                )}
                {facility.current_fill_percentage !== undefined && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Trash2 className="w-4 h-4" />
                      نسبة الامتلاء
                    </div>
                    <p className="text-2xl font-bold">{facility.current_fill_percentage}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className={cn(
                          'h-2 rounded-full',
                          facility.current_fill_percentage > 80 ? 'bg-red-500' :
                          facility.current_fill_percentage > 50 ? 'bg-amber-500' : 'bg-green-500'
                        )}
                        style={{ width: `${facility.current_fill_percentage}%` }}
                      />
                    </div>
                  </div>
                )}
                {facility.price_per_ton && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <DollarSign className="w-4 h-4" />
                      السعر
                    </div>
                    <p className="text-2xl font-bold">{facility.price_per_ton}</p>
                    <p className="text-sm text-muted-foreground">{facility.currency || 'ج.م'}/طن</p>
                  </div>
                )}
              </div>
              {facility.pricing_notes && (
                <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4">
                  <p className="text-sm">{facility.pricing_notes}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="waste" className="space-y-4 mt-4">
              {facility.accepted_waste_types && facility.accepted_waste_types.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    أنواع المخلفات المقبولة
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {facility.accepted_waste_types.map((type) => (
                      <Badge key={type} className="bg-green-100 text-green-700">
                        {wasteTypeLabels[type] || type.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {facility.accepted_hazard_levels && facility.accepted_hazard_levels.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-amber-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    مستويات الخطورة المقبولة
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {facility.accepted_hazard_levels.map((level) => (
                      <Badge key={level} variant="outline" className="border-amber-300 text-amber-700">
                        {hazardLabels[level] || level}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {facility.rejected_waste_types && facility.rejected_waste_types.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-red-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    أنواع المخلفات المرفوضة
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {facility.rejected_waste_types.map((type) => (
                      <Badge key={type} className="bg-red-100 text-red-700">
                        {wasteTypeLabels[type] || type.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
