import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  MapPin,
  Search,
  Plus,
  MoreVertical,
  Trash2,
  Edit,
  Copy,
  Navigation,
  Bookmark,
  Building2,
  Warehouse,
  Truck,
  Factory,
  Loader2,
} from 'lucide-react';
import { useSavedLocations, SavedLocation } from '@/hooks/useSavedLocations';
import AddLocationForm from './AddLocationForm';
import { useToast } from '@/hooks/use-toast';

const LOCATION_TYPE_ICONS: Record<string, any> = {
  pickup: Truck,
  delivery: MapPin,
  factory: Factory,
  warehouse: Warehouse,
  office: Building2,
  custom: MapPin,
};

const LOCATION_TYPE_LABELS: Record<string, string> = {
  pickup: 'استلام',
  delivery: 'تسليم',
  factory: 'مصنع',
  warehouse: 'مستودع',
  office: 'مكتب',
  custom: 'أخرى',
};

const SOURCE_LABELS: Record<string, string> = {
  manual: 'إضافة يدوية',
  shipment: 'من شحنة',
  import: 'مستورد',
};

interface SavedLocationsManagerProps {
  onSelectLocation?: (location: SavedLocation) => void;
  selectionMode?: boolean;
}

export default function SavedLocationsManager({
  onSelectLocation,
  selectionMode = false,
}: SavedLocationsManagerProps) {
  const { locations, loading, deleteLocation, refetch } = useSavedLocations();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredLocations = locations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyCoords = (lat: number, lng: number) => {
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    toast({
      title: 'تم النسخ',
      description: 'تم نسخ الإحداثيات',
    });
  };

  const handleNavigate = (lat: number, lng: number) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      '_blank'
    );
  };

  const handleDelete = async (id: string) => {
    await deleteLocation(id);
    setDeleteConfirmId(null);
  };

  const handleLocationAdded = () => {
    setIsAddDialogOpen(false);
    refetch();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bookmark className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">المواقع المحفوظة</h2>
            <p className="text-sm text-muted-foreground">
              {locations.length} موقع محفوظ
            </p>
          </div>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة موقع جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                إضافة موقع جديد
              </DialogTitle>
            </DialogHeader>
            <AddLocationForm onSuccess={handleLocationAdded} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="البحث في المواقع..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Locations Grid */}
      {filteredLocations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>
              {searchQuery
                ? 'لا توجد نتائج للبحث'
                : 'لا توجد مواقع محفوظة بعد'}
            </p>
            {!searchQuery && (
              <p className="text-sm mt-2">
                ابدأ بإضافة مواقعك المفضلة لتسهيل الوصول إليها
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLocations.map((location) => {
            const TypeIcon = LOCATION_TYPE_ICONS[location.location_type] || MapPin;

            return (
              <Card
                key={location.id}
                className={`group hover:border-primary/50 transition-colors ${
                  selectionMode ? 'cursor-pointer' : ''
                }`}
                onClick={selectionMode ? () => onSelectLocation?.(location) : undefined}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <TypeIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium truncate">{location.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {location.address}
                        </p>
                        {location.city && (
                          <p className="text-xs text-muted-foreground">
                            {location.city}
                          </p>
                        )}
                      </div>
                    </div>

                    {!selectionMode && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              handleCopyCoords(location.latitude, location.longitude)
                            }
                          >
                            <Copy className="h-4 w-4 ml-2" />
                            نسخ الإحداثيات
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleNavigate(location.latitude, location.longitude)
                            }
                          >
                            <Navigation className="h-4 w-4 ml-2" />
                            الملاحة
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteConfirmId(location.id)}
                          >
                            <Trash2 className="h-4 w-4 ml-2" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {LOCATION_TYPE_LABELS[location.location_type] || location.location_type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {SOURCE_LABELS[location.source] || location.source}
                    </Badge>
                    {location.usage_count > 0 && (
                      <span className="text-xs text-muted-foreground">
                        استخدم {location.usage_count} مرة
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الموقع؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
