import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bookmark, Loader2, MapPin } from 'lucide-react';
import { useSavedLocations, NewLocationData } from '@/hooks/useSavedLocations';

interface SaveLocationButtonProps {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  suggestedName?: string;
  onSaved?: (location: any) => void;
  variant?: 'default' | 'icon' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

const LOCATION_TYPES = [
  { value: 'pickup', label: 'نقطة استلام' },
  { value: 'delivery', label: 'نقطة تسليم' },
  { value: 'factory', label: 'مصنع' },
  { value: 'warehouse', label: 'مستودع' },
  { value: 'office', label: 'مكتب' },
  { value: 'custom', label: 'أخرى' },
];

const CATEGORIES = [
  { value: 'generator', label: 'مولد نفايات' },
  { value: 'recycler', label: 'جهة تدوير' },
  { value: 'transporter', label: 'جهة نقل' },
  { value: 'industrial', label: 'منطقة صناعية' },
  { value: 'other', label: 'أخرى' },
];

export default function SaveLocationButton({
  latitude,
  longitude,
  address = '',
  city = '',
  suggestedName = '',
  onSaved,
  variant = 'outline',
  size = 'sm',
  className = '',
}: SaveLocationButtonProps) {
  const { saveLocation, saving } = useSavedLocations();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<NewLocationData>({
    name: suggestedName || address.slice(0, 50) || 'موقع جديد',
    address: address,
    city: city,
    latitude,
    longitude,
    location_type: 'custom',
    category: 'other',
  });

  const handleSave = async () => {
    const result = await saveLocation({
      ...formData,
      latitude,
      longitude,
    });
    
    if (result) {
      setIsOpen(false);
      onSaved?.(result);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setFormData({
        name: suggestedName || address.slice(0, 50) || 'موقع جديد',
        address: address,
        city: city,
        latitude,
        longitude,
        location_type: 'custom',
        category: 'other',
      });
    }
    setIsOpen(open);
  };

  if (variant === 'icon') {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleOpenChange(true)}
          className={className}
          title="حفظ الموقع"
        >
          <Bookmark className="h-4 w-4" />
        </Button>
        <SaveLocationDialog
          isOpen={isOpen}
          onOpenChange={handleOpenChange}
          formData={formData}
          setFormData={setFormData}
          onSave={handleSave}
          saving={saving}
          latitude={latitude}
          longitude={longitude}
        />
      </>
    );
  }

  return (
    <>
      <Button
        variant={variant === 'default' ? 'default' : 'outline'}
        size={size}
        onClick={() => handleOpenChange(true)}
        className={`gap-2 ${className}`}
      >
        <Bookmark className="h-4 w-4" />
        حفظ الموقع
      </Button>
      <SaveLocationDialog
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        saving={saving}
        latitude={latitude}
        longitude={longitude}
      />
    </>
  );
}

interface SaveLocationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: NewLocationData;
  setFormData: (data: NewLocationData) => void;
  onSave: () => void;
  saving: boolean;
  latitude: number;
  longitude: number;
}

function SaveLocationDialog({
  isOpen,
  onOpenChange,
  formData,
  setFormData,
  onSave,
  saving,
  latitude,
  longitude,
}: SaveLocationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" />
            حفظ الموقع
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Coordinates preview */}
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </span>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">اسم الموقع *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثال: مصنع التوحيد للأخشاب"
            />
          </div>

          {/* English Name */}
          <div className="space-y-2">
            <Label htmlFor="name_en">الاسم بالإنجليزية (اختياري)</Label>
            <Input
              id="name_en"
              value={formData.name_en || ''}
              onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
              placeholder="e.g., Al-Tawheed Wood Factory"
              dir="ltr"
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">العنوان *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="العنوان التفصيلي"
            />
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label htmlFor="city">المدينة</Label>
            <Input
              id="city"
              value={formData.city || ''}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="مثال: 6 أكتوبر"
            />
          </div>

          {/* Type & Category Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>نوع الموقع</Label>
              <Select
                value={formData.location_type}
                onValueChange={(value) => setFormData({ ...formData, location_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>التصنيف</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف (اختياري)</Label>
            <Input
              id="phone"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="01xxxxxxxxx"
              dir="ltr"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="ملاحظات إضافية عن الموقع..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            onClick={onSave}
            disabled={saving || !formData.name.trim() || !formData.address.trim()}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Bookmark className="h-4 w-4 ml-2" />
                حفظ
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
