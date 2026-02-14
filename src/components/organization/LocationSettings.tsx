import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { MapPin, Clock, Eye, EyeOff, Save, Loader2, Navigation, ExternalLink } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface WorkingHours {
  sunday?: { open: string; close: string; closed?: boolean };
  monday?: { open: string; close: string; closed?: boolean };
  tuesday?: { open: string; close: string; closed?: boolean };
  wednesday?: { open: string; close: string; closed?: boolean };
  thursday?: { open: string; close: string; closed?: boolean };
  friday?: { open: string; close: string; closed?: boolean };
  saturday?: { open: string; close: string; closed?: boolean };
}

interface LocationSettingsProps {
  organizationId: string;
  data: {
    location_url?: string;
    address_details?: string;
    location_description?: string;
    working_hours?: WorkingHours;
    is_location_public?: boolean;
    location_lat?: number;
    location_lng?: number;
    address?: string;
    city?: string;
    region?: string;
  };
  isEditable: boolean;
  onUpdate: () => void;
}

const DAYS = [
  { key: 'sunday', label: 'الأحد' },
  { key: 'monday', label: 'الاثنين' },
  { key: 'tuesday', label: 'الثلاثاء' },
  { key: 'wednesday', label: 'الأربعاء' },
  { key: 'thursday', label: 'الخميس' },
  { key: 'friday', label: 'الجمعة' },
  { key: 'saturday', label: 'السبت' },
];

const LocationSettings = ({ organizationId, data, isEditable, onUpdate }: LocationSettingsProps) => {
  const [saving, setSaving] = useState(false);
  const [locationUrl, setLocationUrl] = useState(data.location_url || '');
  const [addressDetails, setAddressDetails] = useState(data.address_details || '');
  const [locationDescription, setLocationDescription] = useState(data.location_description || '');
  const [isPublic, setIsPublic] = useState(data.is_location_public !== false);
  const [workingHours, setWorkingHours] = useState<WorkingHours>(
    (data.working_hours as WorkingHours) || {}
  );

  const extractCoordsFromUrl = (url: string) => {
    // Try to extract lat/lng from Google Maps URL
    const patterns = [
      /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      /ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      /q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }
    return null;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const coords = extractCoordsFromUrl(locationUrl);
      const updateData: Record<string, any> = {
        location_url: locationUrl || null,
        address_details: addressDetails || null,
        location_description: locationDescription || null,
        working_hours: workingHours,
        is_location_public: isPublic,
      };
      if (coords) {
        updateData.location_lat = coords.lat;
        updateData.location_lng = coords.lng;
      }

      const { error } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', organizationId);

      if (error) throw error;
      toast.success('تم حفظ بيانات الموقع بنجاح');
      onUpdate();
    } catch (error) {
      console.error('Error saving location:', error);
      toast.error('حدث خطأ في حفظ بيانات الموقع');
    } finally {
      setSaving(false);
    }
  };

  const updateDayHours = (day: string, field: string, value: string | boolean) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: { ...((prev as any)[day] || { open: '08:00', close: '17:00' }), [field]: value },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Privacy Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isPublic ? <Eye className="w-5 h-5 text-primary" /> : <EyeOff className="w-5 h-5 text-muted-foreground" />}
            خصوصية الموقع
          </CardTitle>
          <CardDescription>
            تحكم في ظهور بيانات الموقع للآخرين
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{isPublic ? 'عام - يظهر للجميع' : 'خاص - للمصرح لهم فقط'}</p>
              <p className="text-sm text-muted-foreground">
                {isPublic
                  ? 'سيتمكن السائقون والعملاء من رؤية موقعك على الخريطة'
                  : 'العنوان متاح فقط للمصرح لهم (مثل السائق الذي معه تصريح تحميل)'}
              </p>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
              disabled={!isEditable}
            />
          </div>
        </CardContent>
      </Card>

      {/* Location Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            تفاصيل الموقع
          </CardTitle>
          <CardDescription>أدخل رابط خرائط جوجل والعنوان التفصيلي</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              رابط خرائط جوجل
            </Label>
            <div className="flex gap-2">
              <Input
                value={locationUrl}
                onChange={(e) => setLocationUrl(e.target.value)}
                placeholder="https://maps.google.com/..."
                disabled={!isEditable}
                dir="ltr"
                className="flex-1"
              />
              {locationUrl && (
                <Button variant="outline" size="icon" asChild>
                  <a href={locationUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              انسخ الرابط من تطبيق خرائط جوجل والصقه هنا
            </p>
          </div>

          <div className="space-y-2">
            <Label>العنوان التفصيلي</Label>
            <Textarea
              value={addressDetails}
              onChange={(e) => setAddressDetails(e.target.value)}
              placeholder="مثال: المنطقة الصناعية السادسة - قطعة 53 - بوابة الشحن رقم 1"
              disabled={!isEditable}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>وصف الموقع (توجيهات للسائق)</Label>
            <Textarea
              value={locationDescription}
              onChange={(e) => setLocationDescription(e.target.value)}
              placeholder="مثال: بوابة الشحن رقم 1 خلف مخازن كذا - اسأل عن المشرف أحمد"
              disabled={!isEditable}
              rows={2}
            />
          </div>

          {/* Embedded Map Preview */}
          {locationUrl && extractCoordsFromUrl(locationUrl) && (
            <div className="rounded-lg overflow-hidden border">
              <iframe
                src={`https://maps.google.com/maps?q=${extractCoordsFromUrl(locationUrl)!.lat},${extractCoordsFromUrl(locationUrl)!.lng}&z=15&output=embed`}
                width="100%"
                height="250"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="موقع المنشأة"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Working Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            ساعات العمل
          </CardTitle>
          <CardDescription>حدد مواعيد فتح وغلق الموقع</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DAYS.map(({ key, label }) => {
              const day = (workingHours as any)[key] || { open: '08:00', close: '17:00', closed: false };
              return (
                <div key={key} className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                  <span className="w-20 font-medium text-sm">{label}</span>
                  <Switch
                    checked={!day.closed}
                    onCheckedChange={(checked) => updateDayHours(key, 'closed', !checked)}
                    disabled={!isEditable}
                  />
                  {!day.closed ? (
                    <div className="flex items-center gap-2" dir="ltr">
                      <Input
                        type="time"
                        value={day.open || '08:00'}
                        onChange={(e) => updateDayHours(key, 'open', e.target.value)}
                        disabled={!isEditable}
                        className="w-32"
                      />
                      <span className="text-muted-foreground">→</span>
                      <Input
                        type="time"
                        value={day.close || '17:00'}
                        onChange={(e) => updateDayHours(key, 'close', e.target.value)}
                        disabled={!isEditable}
                        className="w-32"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">مغلق</span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {isEditable && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
            حفظ بيانات الموقع
          </Button>
        </div>
      )}
    </div>
  );
};

export default LocationSettings;
